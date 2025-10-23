"""Export Firestore sensor_data and processed_data to NDJSON for training.

Usage:
  python tools/export_dataset.py --out export_sample.ndjson --limit 10

This script connects to the Firestore client used by the app and writes
one JSON document per line with fields: user_id, doc_id, raw, processed.
"""
import argparse
import json
import os
from typing import Optional

from app.comms.firestore_client import get_firestore_db


def export_dataset(out_path: str, user_id: Optional[str] = None, limit: int = 100):
    db = get_firestore_db()
    if not db:
        raise RuntimeError("Firestore not initialized")

    users = []
    base_users_coll = db.collection("artifacts").document("stancesense").collection("users")
    if user_id:
        users = [user_id]
    else:
        # enumerate user ids
        users = [d.id for d in base_users_coll.stream()]

    written = 0
    with open(out_path, "w", encoding="utf-8") as f:
        for uid in users:
            sensor_coll = base_users_coll.document(uid).collection("sensor_data")
            docs = sensor_coll.order_by("timestamp").limit(limit).stream()
            for d in docs:
                try:
                    raw = d.to_dict()
                    doc_id = d.id
                    proc_ref = base_users_coll.document(uid).collection("processed_data").document(doc_id)
                    proc_snap = proc_ref.get()
                    processed = proc_snap.to_dict() if proc_snap.exists else None

                    out = {
                        "user_id": uid,
                        "doc_id": doc_id,
                        "raw": raw,
                        "processed": processed,
                    }
                    f.write(json.dumps(out, default=str) + "\n")
                    written += 1
                    if written >= limit:
                        return written
                except Exception as e:
                    # skip problematic docs but continue
                    print(f"Warning: failed to export doc {d.id} for user {uid}: {e}")
    return written


def main():
    parser = argparse.ArgumentParser(description="Export Firestore dataset to NDJSON")
    parser.add_argument("--out", required=True, help="Output NDJSON file path")
    parser.add_argument("--user", required=False, help="Specific user id to export")
    parser.add_argument("--limit", required=False, type=int, default=100, help="Maximum number of documents to export")

    args = parser.parse_args()

    out_path = args.out
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    count = export_dataset(out_path, user_id=args.user, limit=args.limit)
    print(f"Exported {count} records to {out_path}")


if __name__ == "__main__":
    main()
