"""Train a simple rigidity classifier from CSV and save a model artifact."""
import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import classification_report, accuracy_score


def train(csv_path="synthetic_rigidity.csv", out_model_dir="models", model_name="rigidity_model_v0.joblib"):
    df = pd.read_csv(csv_path)
    features = ["emg_wrist_rms", "emg_arm_rms", "emg_ratio", "emg_burst_count", "accel_mag_mean", "accel_mag_std"]
    X = df[features]
    y = df["rigid"]

    # simple train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    print("Test Accuracy:", accuracy_score(y_test, preds))
    print(classification_report(y_test, preds))

    os.makedirs(out_model_dir, exist_ok=True)
    out_path = os.path.join(out_model_dir, model_name)
    joblib.dump({"model": model, "features": features, "version": "v0.1"}, out_path)
    print(f"Saved model to {out_path}")


if __name__ == "__main__":
    train()
