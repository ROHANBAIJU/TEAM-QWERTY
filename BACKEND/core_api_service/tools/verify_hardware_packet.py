"""Verify hardware JSON packets for fall, tremor, and rigidity using simple heuristics
and (when available) the trained models in `models/`.

Usage: run as script to test a sample packet, or import `verify_packet` to use from other code.
"""

import os
import math
import json
import joblib
import numpy as np
from typing import Dict, Any

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_DIR = os.path.join(ROOT, "models")


def heuristic_fall_check(safety: Dict[str, Any]) -> Dict[str, Any]:
    ax = float(safety.get('accel_x_g', 0.0))
    ay = float(safety.get('accel_y_g', 0.0))
    az = float(safety.get('accel_z_g', 0.0))
    mag = math.sqrt(ax*ax + ay*ay + az*az)
    # Heuristic: free-fall often shows magnitude much lower than gravity (<0.5g)
    # Impact may show magnitude > 2.5g. With single-sample telemetry this is noisy.
    fall_by_mag = (mag < 0.5) or (mag > 2.5)
    return {"magnitude_g": mag, "heuristic_fall": bool(fall_by_mag)}


def heuristic_tremor_check(tremor: Dict[str, Any]) -> Dict[str, Any]:
    # Expect tremor info with frequency_hz and amplitude_g
    freq = tremor.get('frequency_hz')
    amp = tremor.get('amplitude_g')
    res = {"frequency_hz": freq, "amplitude_g": amp}
    try:
        f = float(freq) if freq is not None else None
        a = float(amp) if amp is not None else None
        # Parkinsonian resting tremor commonly around 4-6 Hz. Use a permissive band 3-7 Hz.
        tremor_by_rule = (f is not None and 3.0 <= f <= 7.0) and (a is not None and abs(a) > 0.5)
        res['heuristic_tremor'] = bool(tremor_by_rule)
    except Exception:
        res['heuristic_tremor'] = None
    return res


def heuristic_rigidity_check(rigidity: Dict[str, Any]) -> Dict[str, Any]:
    # If EMG channels present, use simple thresholding as a heuristic fallback.
    wrist = rigidity.get('emg_wrist')
    arm = rigidity.get('emg_arm')
    res = {"emg_wrist": wrist, "emg_arm": arm}
    try:
        w = float(wrist) if wrist is not None else None
        a = float(arm) if arm is not None else None
        # Heuristic: elevated sustained EMG may indicate rigidity; threshold is dataset dependent.
        res['heuristic_rigidity'] = bool((a is not None and abs(a) > 5.0) or (w is not None and abs(w) > 2.0))
    except Exception:
        res['heuristic_rigidity'] = None
    return res


def load_model_if_exists(name: str):
    path = os.path.join(MODEL_DIR, name)
    if os.path.exists(path):
        try:
            return joblib.load(path)
        except Exception:
            return None
    return None


def map_packet_to_model_features(packet: Dict[str, Any], expected_features):
    """Create a one-row feature dict from the packet, filling missing features with zeros.
    Mapping rules:
    - If packet contains 'timeseries' (list of rows), compute same features used in training (mean/std/rms/dominant freq).
    - Else, map single accel values to acc_*_mean and emg values to emg_*_rms where possible.
    """
    feats = {}
    # if timeseries present we reuse extraction used during training (approximate)
    if 'timeseries' in packet:
        try:
            import numpy as np
            rows = np.asarray(packet['timeseries'], dtype=float)
            if rows.ndim == 1:
                rows = rows.reshape(1, -1)
            names = ["acc_x","acc_y","acc_z","gyr_x","gyr_y","gyr_z"]
            for i, name in enumerate(names):
                col = rows[:, i+1] if rows.shape[1] > i+1 else rows[:, -1]
                feats[f"{name}_mean"] = float(col.mean())
                feats[f"{name}_std"] = float(col.std())
                feats[f"{name}_rms"] = float((col**2).mean()**0.5)
                # dominant freq approximated as zero in this fallback because fs unknown
                feats[f"{name}_domfreq"] = float(0.0)
        except Exception:
            pass
    else:
        # map accel single-sample readings if present
        safety = packet.get('safety', {})
        ax = safety.get('accel_x_g')
        ay = safety.get('accel_y_g')
        az = safety.get('accel_z_g')
        names = ["acc_x","acc_y","acc_z","gyr_x","gyr_y","gyr_z"]
        # set means from single values if available
        for name in names:
            if name.startswith('acc'):
                mapping = {'acc_x': ax, 'acc_y': ay, 'acc_z': az}
                v = mapping.get(name)
                feats[f"{name}_mean"] = float(v) if v is not None else 0.0
                feats[f"{name}_std"] = 0.0
                feats[f"{name}_rms"] = abs(float(v)) if v is not None else 0.0
                feats[f"{name}_domfreq"] = 0.0
            else:
                feats[f"{name}_mean"] = 0.0
                feats[f"{name}_std"] = 0.0
                feats[f"{name}_rms"] = 0.0
                feats[f"{name}_domfreq"] = 0.0
        # map EMG
        rig = packet.get('rigidity', {})
        wrist = rig.get('emg_wrist')
        arm = rig.get('emg_arm')
        feats['emg_ch1_rms'] = abs(float(wrist)) if wrist is not None else 0.0
        feats['emg_ch1_mean'] = float(wrist) if wrist is not None else 0.0
        feats['emg_ch1_std'] = 0.0
        feats['emg_ch2_rms'] = abs(float(arm)) if arm is not None else 0.0
        feats['emg_ch2_mean'] = float(arm) if arm is not None else 0.0
        feats['emg_ch2_std'] = 0.0

    # Align to expected features
    row = {f: float(feats.get(f, 0.0)) for f in expected_features}
    return row


def verify_packet(packet: Dict[str, Any]) -> Dict[str, Any]:
    out = {}
    safety = packet.get('safety', {})
    tremor = packet.get('tremor', {})
    rigidity = packet.get('rigidity', {})

    out['safety'] = heuristic_fall_check(safety)
    out['tremor'] = heuristic_tremor_check(tremor)
    out['rigidity_heuristic'] = heuristic_rigidity_check(rigidity)

    # Try to verify rigidity with model if available
    rig_model = load_model_if_exists('rigidity_model_v0.joblib')
    if rig_model is not None:
        try:
            # try to use provided features or raw EMG mapping
            features = rig_model.get('features', None) if isinstance(rig_model, dict) else None
            if features:
                X = np.array([map_packet_to_model_features(packet, features)[f] for f in features]).reshape(1, -1)
                clf = rig_model.get('model', rig_model)
                pred = clf.predict(X)[0]
            else:
                clf = rig_model.get('model', rig_model) if isinstance(rig_model, dict) else rig_model
                X = np.array([[rigidity.get('emg_wrist', 0.0), rigidity.get('emg_arm', 0.0)]], dtype=float)
                pred = clf.predict(X)[0]
            out['rigidity_model_pred'] = int(pred)
        except Exception as e:
            out['rigidity_model_error'] = str(e)

    # Try PD / PADS model prediction from available features
    pads_model = load_model_if_exists('pads_model_tuned.joblib') or load_model_if_exists('pads_model_baseline.joblib')
    if pads_model is not None:
        try:
            features = pads_model.get('features', None) if isinstance(pads_model, dict) else None
            if features is None:
                out['pads_model_error'] = 'no features list in model'
            else:
                row = map_packet_to_model_features(packet, features)
                X = np.array([row[f] for f in features], dtype=float).reshape(1, -1)
                clf = pads_model.get('model', pads_model) if isinstance(pads_model, dict) else pads_model
                pred = clf.predict(X)[0]
                out['pads_model_pred'] = int(pred)
                if hasattr(clf, 'predict_proba'):
                    out['pads_model_proba'] = clf.predict_proba(X).tolist()[0]
        except Exception as e:
            out['pads_model_error'] = str(e)

    # Try acoustic model if audio features present
    acoustic_model = load_model_if_exists('acoustic_model.joblib')
    if acoustic_model is not None and 'audio_features' in packet:
        try:
            features = acoustic_model.get('features', None) if isinstance(acoustic_model, dict) else None
            if features is None:
                out['acoustic_model_error'] = 'no features list in acoustic model'
            else:
                # packet['audio_features'] is expected to be a dict of numeric features
                af = packet.get('audio_features', {})
                Xrow = [float(af.get(f, 0.0)) for f in features]
                clf = acoustic_model.get('model', acoustic_model) if isinstance(acoustic_model, dict) else acoustic_model
                pred = clf.predict([Xrow])[0]
                out['acoustic_model_pred'] = int(pred)
        except Exception as e:
            out['acoustic_model_error'] = str(e)

    return out


if __name__ == '__main__':
    # Quick test with the example JSON from the user
    sample = {
        "timestamp": "19:37",
        "safety": {
            "fall_detected": False,
            "accel_x_g": 0.02,
            "accel_y_g": -0.01,
            "accel_z_g": 0.98
        },
        "tremor": {
            "frequency_hz": 5,
            "amplitude_g": 14.3000021,
            "tremor_detected": "yes"
        },
        "rigidity": {
            "emg_wrist": -0.88,
            "emg_arm": 9,
            "rigid": "yes"
        }
    }
    res = verify_packet(sample)
    print(json.dumps(res, indent=2))
