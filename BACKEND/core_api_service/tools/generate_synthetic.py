"""Generate synthetic sensor windows for training.

Produces a CSV with engineered features per-window and a target 'rigid' (0/1).
"""
import csv
import math
import random
from datetime import datetime, timedelta

FIELDNAMES = [
    "timestamp",
    "user_id",
    "doc_id",
    "emg_wrist_rms",
    "emg_arm_rms",
    "emg_ratio",
    "emg_burst_count",
    "accel_mag_mean",
    "accel_mag_std",
    "rigid",
]


def generate_row(i):
    # Randomly decide rigid vs normal
    is_rigid = random.random() < 0.35  # 35% positive

    # EMG: rigid cases have higher RMS and burst counts
    if is_rigid:
        emg_wrist_rms = random.uniform(0.8, 3.5)
        emg_arm_rms = random.uniform(1.0, 4.0)
        emg_burst_count = random.randint(2, 10)
    else:
        emg_wrist_rms = random.uniform(0.01, 0.8)
        emg_arm_rms = random.uniform(0.01, 1.2)
        emg_burst_count = random.randint(0, 3)

    emg_ratio = emg_wrist_rms / max(0.0001, emg_arm_rms)

    # Accelerometer magnitude features (rigid may have smaller movement)
    if is_rigid:
        accel_mag_mean = random.uniform(0.0, 0.5)
        accel_mag_std = random.uniform(0.0, 0.3)
    else:
        accel_mag_mean = random.uniform(0.2, 1.5)
        accel_mag_std = random.uniform(0.05, 0.7)

    ts = (datetime.utcnow() - timedelta(seconds=random.randint(0, 86400))).isoformat() + "Z"
    user_id = f"synthetic_user_{random.randint(1,50)}"
    doc_id = f"synthetic_doc_{i:06d}"

    return {
        "timestamp": ts,
        "user_id": user_id,
        "doc_id": doc_id,
        "emg_wrist_rms": round(emg_wrist_rms, 4),
        "emg_arm_rms": round(emg_arm_rms, 4),
        "emg_ratio": round(emg_ratio, 4),
        "emg_burst_count": emg_burst_count,
        "accel_mag_mean": round(accel_mag_mean, 4),
        "accel_mag_std": round(accel_mag_std, 4),
        "rigid": int(is_rigid),
    }


def main(out_path="synthetic_rigidity.csv", n=200):
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        for i in range(n):
            writer.writerow(generate_row(i))
    print(f"Wrote {n} synthetic rows to {out_path}")


if __name__ == "__main__":
    main()
