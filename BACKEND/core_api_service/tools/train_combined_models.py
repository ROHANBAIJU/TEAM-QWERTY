"""
Train combined PADS model using PADS smartwatch timeseries and sEMG dataset,
and train an acoustic model from `Parkinsson disease.csv`.

Behavior:
- For PADS: parse `datasets/pads-parkinsons-disease-smartwatch-dataset-1.0.0/movement/` observation JSON files and timeseries text files. Extract simple features per recording: mean/std/RMS of accelerometer and gyroscope channels, dominant frequency via FFT.
- For sEMG: load .mat files from `datasets/semg+for+basic+hand+movements dataset/Database */` and extract RMS/std/dominant frequency per channel.
- Align features by subject id where possible; otherwise treat each recording as a sample and use available labels from PADS preprocessed `file_list.csv` (label column: 0 healthy, 1 PD, 2 other).
- Train RandomForestClassifier for a 3-class label (0/1/2) and save `models/pads_model.joblib`.
- Train an acoustic model from `datasets/Parkinsson disease.csv` using numeric features and a target column `status`/`label` if present and save `models/acoustic_model.joblib`.

This is intentionally a straightforward baseline implementation to be improved later.
"""

import os
import json
import glob
import joblib
import numpy as np
import pandas as pd
from scipy import fftpack
from scipy.io import loadmat
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GroupShuffleSplit, GroupKFold, RandomizedSearchCV
from sklearn.metrics import accuracy_score
from scipy.stats import randint

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(ROOT, "datasets")
PADS_DIR = os.path.join(DATA_DIR, "pads-parkinsons-disease-smartwatch-dataset-1.0.0")
SEMG_DIR = os.path.join(DATA_DIR, "semg+for+basic+hand+movements dataset")
MODEL_DIR = os.path.join(ROOT, "models")
os.makedirs(MODEL_DIR, exist_ok=True)


def time_domain_features(signal):
    signal = np.asarray(signal, dtype=float)
    return {
        "mean": float(np.mean(signal)),
        "std": float(np.std(signal)),
        "rms": float(np.sqrt(np.mean(signal ** 2)))
    }


def dominant_freq(signal, fs=100.0):
    # simple dominant frequency estimator
    signal = np.asarray(signal, dtype=float)
    if len(signal) < 2:
        return 0.0
    N = len(signal)
    freqs = np.fft.rfftfreq(N, d=1.0/fs)
    fftvals = np.abs(np.fft.rfft(signal))
    idx = np.argmax(fftvals)
    return float(freqs[idx])


def extract_features_from_timeseries_file(path):
    # columns: Time, AccX, AccY, AccZ, GyrX, GyrY, GyrZ
    arr = np.loadtxt(path, delimiter=",")
    if arr.ndim == 1:
        arr = arr.reshape(1, -1)
    features = {}
    # accelerometer X/Y/Z -> cols 1..3
    for i, name in enumerate(["acc_x", "acc_y", "acc_z", "gyr_x", "gyr_y", "gyr_z"]):
        col = arr[:, i+1]
        td = time_domain_features(col)
        features.update({f"{name}_{k}": v for k, v in td.items()})
        features[f"{name}_domfreq"] = dominant_freq(col, fs=100.0)
    return features


def build_pads_feature_table(max_subjects=None):
    obs_files = glob.glob(os.path.join(PADS_DIR, "movement", "observation_*.json"))
    # try to load preprocessed file_list for labels (preferred)
    filelist = None
    try:
        flp = os.path.join(PADS_DIR, "preprocessed", "file_list.csv")
        if os.path.exists(flp):
            filelist = pd.read_csv(flp, dtype=str)
    except Exception:
        filelist = None
    rows = []
    for obs in obs_files:
        with open(obs, "r", encoding="utf-8") as f:
            doc = json.load(f)
        subj = doc.get("subject_id")
        sessions = doc.get("session", [])
        for sess in sessions:
            for rec in sess.get("records", []):
                fname = rec.get("file_name")
                if not fname:
                    continue
                ts_path = os.path.join(PADS_DIR, "movement", fname.replace("/", os.sep))
                if not os.path.exists(ts_path):
                    continue
                feats = extract_features_from_timeseries_file(ts_path)
                sample = {"subject_id": subj, "record_name": sess.get("record_name"), "device_location": rec.get("device_location"), "file": fname}
                sample.update(feats)
                # attach label (preferred: preprocessed/file_list.csv; fallback: patients metadata)
                try:
                    pid = int(subj)
                    label_assigned = False
                    if filelist is not None:
                        # try exact 0-padded id match if 'id' column present
                        if 'id' in filelist.columns:
                            s1 = f"{pid:03d}"
                            meta = filelist[filelist['id'].astype(str).str.strip() == s1]
                            if meta.empty:
                                # try contains or direct int match
                                meta = filelist[filelist['id'].astype(str).str.contains(str(pid))]
                            if not meta.empty and 'label' in meta.columns:
                                try:
                                    sample['label'] = int(int(meta.iloc[0]['label']))
                                    label_assigned = True
                                except Exception:
                                    pass
                    if not label_assigned:
                        patient_file = os.path.join(PADS_DIR, 'patients', f'patient_{pid:03d}.json')
                        if os.path.exists(patient_file):
                            with open(patient_file, 'r', encoding='utf-8') as pf:
                                pdata = json.load(pf)
                            cond = str(pdata.get('condition', '')).lower()
                            if 'healthy' in cond:
                                sample['label'] = 0
                            elif 'parkinson' in cond:
                                sample['label'] = 1
                            else:
                                sample['label'] = 2
                except Exception:
                    pass
                rows.append(sample)
        if max_subjects and len(rows) >= max_subjects:
            break
    df = pd.DataFrame(rows)
    return df


def extract_semg_features_from_mat(path):
    # load mat; heuristics: search for variables with 'emg' or channel arrays
    try:
        m = loadmat(path)
    except Exception as e:
        print("Failed to load .mat", path, e)
        return None
    # find arrays
    keys = [k for k in m.keys() if not k.startswith("__")]
    if not keys:
        return None
    # heuristically pick the first numeric array
    arr = None
    for k in keys:
        v = m[k]
        if hasattr(v, 'ndim') and v.ndim in (1, 2):
            arr = v
            break
    if arr is None:
        return None
    arr = np.asarray(arr).squeeze()
    if arr.ndim == 1:
        channels = [arr]
    else:
        # if 2D, assume rows are channels
        if arr.shape[0] < arr.shape[1]:
            channels = [arr[i, :] for i in range(arr.shape[0])]
        else:
            channels = [arr[:, i] for i in range(arr.shape[1])]
    feats = {}
    for i, ch in enumerate(channels[:4]):
        td = time_domain_features(ch)
        feats.update({f"emg_ch{i+1}_{k}": v for k, v in td.items()})
        feats[f"emg_ch{i+1}_domfreq"] = dominant_freq(ch, fs=1000.0)
    return feats


def build_semg_feature_table():
    rows = []
    for db in ["Database 1", "Database 2"]:
        p = os.path.join(SEMG_DIR, db)
        mats = glob.glob(os.path.join(p, "*.mat"))
        for m in mats:
            feats = extract_semg_features_from_mat(m)
            if feats is None:
                continue
            sample = {"file": os.path.basename(m)}
            sample.update(feats)
            rows.append(sample)
    return pd.DataFrame(rows)


def train_pads_model(pads_df, semg_df=None):
    # Combine by columns: if semg_df is provided, just concat features horizontally (na filled)
    df = pads_df.copy()
    # drop rows without label
    df = df[df['label'].notna()]
    labels = df['label'].astype(int)
    X = df.drop(columns=['subject_id', 'record_name', 'device_location', 'file', 'label'], errors='ignore')
    groups = df['subject_id'].astype(str).values
    if semg_df is not None and not semg_df.empty:
        # simple: merge on index by adding semg cols repeated
        semg_cols = [c for c in semg_df.columns if c != 'file']
        for c in semg_cols:
            X[c] = semg_df[c].fillna(0).reset_index(drop=True).reindex(X.index, fill_value=0)
    X = X.fillna(0).astype(float)
    if X.shape[0] < 10:
        raise RuntimeError("Not enough PADS samples to train")

    # subject-level split to avoid leakage
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, labels, groups=groups))
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = labels.iloc[train_idx], labels.iloc[test_idx]

    # baseline model
    baseline_clf = RandomForestClassifier(n_estimators=200, random_state=42)
    baseline_clf.fit(X_train, y_train)
    base_preds = baseline_clf.predict(X_test)
    base_acc = accuracy_score(y_test, base_preds)
    base_out = os.path.join(MODEL_DIR, "pads_model_baseline.joblib")
    joblib.dump({"model": baseline_clf, "features": list(X.columns), "version": "v1.0"}, base_out)
    print(f"Trained baseline PADS model. Test accuracy: {base_acc:.4f}. Saved to {base_out}")

    # hyperparameter tuning (RandomizedSearchCV) with GroupKFold
    param_dist = {
        'n_estimators': randint(50, 400),
        'max_depth': randint(3, 30),
        'min_samples_split': randint(2, 10),
        'min_samples_leaf': randint(1, 8)
    }
    base = RandomForestClassifier(random_state=42)
    gkf = GroupKFold(n_splits=4)
    rs = RandomizedSearchCV(base, param_distributions=param_dist, n_iter=30, cv=gkf, scoring='accuracy', random_state=42, n_jobs=-1)
    # use groups during split by passing group arrays (subjects) for the training subset
    group_train = groups[train_idx]
    rs.fit(X_train, y_train, groups=group_train)
    best = rs.best_estimator_
    tuned_preds = best.predict(X_test)
    tuned_acc = accuracy_score(y_test, tuned_preds)
    tuned_out = os.path.join(MODEL_DIR, "pads_model_tuned.joblib")
    joblib.dump({"model": best, "features": list(X.columns), "version": "v1.0", "best_params": rs.best_params_}, tuned_out)
    print(f"Trained tuned PADS model. Test accuracy: {tuned_acc:.4f}. Saved to {tuned_out}")

    return best, tuned_acc


def train_acoustic_model(acoustic_csv):
    df = pd.read_csv(acoustic_csv)
    numeric = df.select_dtypes(include=["number"]).columns.tolist()
    # try common targets
    for t in ['status', 'label', 'target']:
        if t in df.columns:
            target = t
            break
    else:
        # fall back to last column
        target = df.columns[-1]
    features = [c for c in numeric if c != target]
    if not features:
        raise RuntimeError("No numeric features for acoustic model")
    X = df[features].fillna(0).astype(float)
    y = df[target]
    clf = RandomForestClassifier(n_estimators=200, random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y if len(set(y))>1 else None)
    clf.fit(X_train, y_train)
    preds = clf.predict(X_test)
    acc = accuracy_score(y_test, preds)
    out_path = os.path.join(MODEL_DIR, "acoustic_model.joblib")
    joblib.dump({"model": clf, "features": features, "version": "v1.0"}, out_path)
    print(f"Trained acoustic model. Test accuracy: {acc:.4f}. Saved to {out_path}")
    return clf, acc


if __name__ == "__main__":
    print("Building PADS feature table (this may take a while)...")
    pads_df = build_pads_feature_table()
    print("PADS samples:", len(pads_df))
    print("Building sEMG feature table...")
    semg_df = build_semg_feature_table()
    print("sEMG samples:", len(semg_df))
    try:
        clf, acc = train_pads_model(pads_df, semg_df)
    except Exception as e:
        print("PADS training failed:", e)
    # acoustic CSV
    acoustic_csv = os.path.join(DATA_DIR, "Parkinsson disease.csv")
    if os.path.exists(acoustic_csv):
        try:
            train_acoustic_model(acoustic_csv)
        except Exception as e:
            print("Acoustic training failed:", e)
    else:
        print("Acoustic CSV not found at", acoustic_csv)

    print("Training run complete.")
