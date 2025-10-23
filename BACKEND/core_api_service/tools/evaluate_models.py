"""Evaluate saved models and produce human-readable reports.

Loads the same datasets and feature extraction logic used by the trainer, recreates
the same train/test split (same random_state/stratify logic), and writes:
 - models/report_pads.txt
 - models/report_acoustic.txt
 - models/preds_pads.csv
 - models/preds_acoustic.csv

This is a lightweight reproducible evaluation step to validate artifacts.
"""

import os
import json
import glob
import joblib
import numpy as np
import pandas as pd
from scipy.io import loadmat
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

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
    signal = np.asarray(signal, dtype=float)
    if len(signal) < 2:
        return 0.0
    N = len(signal)
    freqs = np.fft.rfftfreq(N, d=1.0/fs)
    fftvals = np.abs(np.fft.rfft(signal))
    idx = np.argmax(fftvals)
    return float(freqs[idx])


def extract_features_from_timeseries_file(path):
    arr = np.loadtxt(path, delimiter=",")
    if arr.ndim == 1:
        arr = arr.reshape(1, -1)
    features = {}
    for i, name in enumerate(["acc_x", "acc_y", "acc_z", "gyr_x", "gyr_y", "gyr_z"]):
        col = arr[:, i+1]
        td = time_domain_features(col)
        features.update({f"{name}_{k}": v for k, v in td.items()})
        features[f"{name}_domfreq"] = dominant_freq(col, fs=100.0)
    return features


def build_pads_feature_table():
    obs_files = glob.glob(os.path.join(PADS_DIR, "movement", "observation_*.json"))
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
                try:
                    pid = int(subj)
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
    df = pd.DataFrame(rows)
    return df


def build_semg_feature_table():
    rows = []
    for db in ["Database 1", "Database 2"]:
        p = os.path.join(SEMG_DIR, db)
        mats = glob.glob(os.path.join(p, "*.mat"))
        for m in mats:
            try:
                mobj = loadmat(m)
            except Exception:
                continue
            keys = [k for k in mobj.keys() if not k.startswith("__")]
            arr = None
            for k in keys:
                v = mobj[k]
                if hasattr(v, 'ndim') and v.ndim in (1, 2):
                    arr = v
                    break
            if arr is None:
                continue
            arr = np.asarray(arr).squeeze()
            if arr.ndim == 1:
                channels = [arr]
            else:
                if arr.shape[0] < arr.shape[1]:
                    channels = [arr[i, :] for i in range(arr.shape[0])]
                else:
                    channels = [arr[:, i] for i in range(arr.shape[1])]
            feats = {}
            for i, ch in enumerate(channels[:4]):
                td = time_domain_features(ch)
                feats.update({f"emg_ch{i+1}_{k}": v for k, v in td.items()})
                feats[f"emg_ch{i+1}_domfreq"] = dominant_freq(ch, fs=1000.0)
            sample = {"file": os.path.basename(m)}
            sample.update(feats)
            rows.append(sample)
    return pd.DataFrame(rows)


def evaluate_pads():
    pads_df = build_pads_feature_table()
    semg_df = build_semg_feature_table()
    df = pads_df.copy()
    df = df[df['label'].notna()].copy()
    y = df['label'].astype(int)
    X = df.drop(columns=['subject_id', 'record_name', 'device_location', 'file', 'label'], errors='ignore')
    # merge semg naive
    if not semg_df.empty:
        semg_cols = [c for c in semg_df.columns if c != 'file']
        for c in semg_cols:
            X[c] = semg_df[c].fillna(0).reset_index(drop=True).reindex(X.index, fill_value=0)
    X = X.fillna(0).astype(float)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model_path = os.path.join(MODEL_DIR, 'pads_model.joblib')
    if not os.path.exists(model_path):
        print('PADS model not found at', model_path)
        return
    mdl = joblib.load(model_path)
    clf = mdl.get('model', mdl)
    features = mdl.get('features', list(X.columns))
    # align columns
    X_test_aligned = X_test.copy()
    for f in features:
        if f not in X_test_aligned.columns:
            X_test_aligned[f] = 0.0
    X_test_aligned = X_test_aligned[features].fillna(0).astype(float)

    preds = clf.predict(X_test_aligned)
    proba = None
    if hasattr(clf, 'predict_proba'):
        proba = clf.predict_proba(X_test_aligned)

    report = classification_report(y_test, preds)
    cm = confusion_matrix(y_test, preds)

    with open(os.path.join(MODEL_DIR, 'report_pads.txt'), 'w', encoding='utf-8') as f:
        f.write('PADS model evaluation\n')
        f.write('\nClassification report:\n')
        f.write(report)
        f.write('\nConfusion matrix:\n')
        f.write(str(cm))

    sample_out = X_test_aligned.reset_index(drop=True).copy()
    sample_out['y_true'] = list(y_test.reset_index(drop=True))
    sample_out['y_pred'] = list(preds)
    if proba is not None:
        # store the predicted probability for the predicted class
        sample_out['y_prob'] = [float(p.max()) for p in proba]
    sample_out.head(500).to_csv(os.path.join(MODEL_DIR, 'preds_pads.csv'), index=False)
    print('Wrote PADS report and sample predictions')


def evaluate_acoustic():
    acoustic_csv = os.path.join(DATA_DIR, "Parkinsson disease.csv")
    if not os.path.exists(acoustic_csv):
        print('Acoustic CSV missing at', acoustic_csv)
        return
    df = pd.read_csv(acoustic_csv)
    numeric = df.select_dtypes(include=["number"]).columns.tolist()
    for t in ['status', 'label', 'target']:
        if t in df.columns:
            target = t
            break
    else:
        target = df.columns[-1]
    features = [c for c in numeric if c != target]
    X = df[features].fillna(0).astype(float)
    y = df[target]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y if len(set(y))>1 else None)

    model_path = os.path.join(MODEL_DIR, 'acoustic_model.joblib')
    if not os.path.exists(model_path):
        print('Acoustic model not found at', model_path)
        return
    mdl = joblib.load(model_path)
    clf = mdl.get('model', mdl)
    saved_features = mdl.get('features', features)

    X_test_aligned = X_test.copy()
    for f in saved_features:
        if f not in X_test_aligned.columns:
            X_test_aligned[f] = 0.0
    X_test_aligned = X_test_aligned[saved_features].fillna(0).astype(float)

    preds = clf.predict(X_test_aligned)
    proba = clf.predict_proba(X_test_aligned) if hasattr(clf, 'predict_proba') else None

    report = classification_report(y_test, preds)
    cm = confusion_matrix(y_test, preds)

    with open(os.path.join(MODEL_DIR, 'report_acoustic.txt'), 'w', encoding='utf-8') as f:
        f.write('Acoustic model evaluation\n')
        f.write('\nClassification report:\n')
        f.write(report)
        f.write('\nConfusion matrix:\n')
        f.write(str(cm))

    sample_out = X_test_aligned.reset_index(drop=True).copy()
    sample_out['y_true'] = list(y_test.reset_index(drop=True))
    sample_out['y_pred'] = list(preds)
    if proba is not None:
        sample_out['y_prob'] = [float(p.max()) for p in proba]
    sample_out.head(500).to_csv(os.path.join(MODEL_DIR, 'preds_acoustic.csv'), index=False)
    print('Wrote acoustic report and sample predictions')


if __name__ == '__main__':
    print('Evaluating PADS model...')
    try:
        evaluate_pads()
    except Exception as e:
        print('PADS evaluation failed:', e)
    print('Evaluating acoustic model...')
    try:
        evaluate_acoustic()
    except Exception as e:
        print('Acoustic evaluation failed:', e)
    print('Evaluation complete.')
