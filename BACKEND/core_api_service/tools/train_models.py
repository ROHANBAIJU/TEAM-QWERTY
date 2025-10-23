"""
Train models for PADS and sEMG datasets and save artifacts for runtime use.

Usage:
    python tools/train_models.py --pads path/to/pads.csv --semg path/to/semg.csv

This script trains simple RandomForest models and saves them to models/ as joblib
with a small metadata dict { model, features, version } to match ai_processor expectations.
"""
import argparse
import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, accuracy_score

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
os.makedirs(MODEL_DIR, exist_ok=True)


def train_pads(pads_csv, out_name="pads_model.joblib"):
    df = pd.read_csv(pads_csv)
    # Auto-detect numeric features and a target column
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    # Prefer common targets
    if "gait_score" in df.columns:
        target_col = "gait_score"
    elif "label" in df.columns:
        target_col = "label"
    elif "status" in df.columns:
        # Many PADS variants use 'status' (1=PD, 0=healthy)
        target_col = "status"
    else:
        raise RuntimeError("PADS CSV missing target column (gait_score,label,status)")

    features = [c for c in numeric_cols if c != target_col]
    if not features:
        raise RuntimeError("No numeric features found in PADS CSV")

    X = df[features]
    y = df[target_col]
    # Choose regressor if continuous target, else classifier
    if pd.api.types.is_float_dtype(y) or pd.api.types.is_integer_dtype(y) and y.max() > 1:
        model = RandomForestRegressor(n_estimators=100, random_state=42)
    else:
        model = RandomForestClassifier(n_estimators=100, random_state=42)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    try:
        print("PADS RMSE:", mean_squared_error(y_test, preds, squared=False))
    except Exception:
        print("PADS Accuracy:", accuracy_score(y_test, preds))

    out_path = os.path.join(MODEL_DIR, out_name)
    joblib.dump({"model": model, "features": features, "version": "v0.1"}, out_path)
    print(f"Saved PADS model to {out_path}")


def train_semg(semg_csv, out_name="semg_model.joblib"):
    df = pd.read_csv(semg_csv)
    features = [c for c in ["emg_wrist", "emg_arm"] if c in df.columns]
    if not features:
        raise RuntimeError("sEMG CSV does not contain expected features (emg_wrist, emg_arm)")
    if "rigidity_score" in df.columns:
        y = df["rigidity_score"]
        model = RandomForestRegressor(n_estimators=100, random_state=42)
    elif "rigid" in df.columns:
        y = df["rigid"]
        model = RandomForestClassifier(n_estimators=100, random_state=42)
    else:
        raise RuntimeError("sEMG CSV missing target (rigidity_score or rigid)")

    X = df[features]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    try:
        print("sEMG RMSE:", mean_squared_error(y_test, preds, squared=False))
    except Exception:
        print("sEMG Accuracy:", accuracy_score(y_test, preds))

    out_path = os.path.join(MODEL_DIR, out_name)
    joblib.dump({"model": model, "features": features, "version": "v0.1"}, out_path)
    print(f"Saved sEMG model to {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pads", help="Path to PADS CSV")
    parser.add_argument("--semg", help="Path to sEMG CSV")
    args = parser.parse_args()

    if args.pads:
        train_pads(args.pads)
    if args.semg:
        train_semg(args.semg)

    print("Training complete.")
