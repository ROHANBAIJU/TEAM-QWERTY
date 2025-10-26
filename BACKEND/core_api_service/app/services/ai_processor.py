# File: BACKEND/core_api_service/app/services/ai_processor.py

from ..models.schemas import DeviceData, ProcessedData, AIAnalysis
import logging
import math
from typing import Optional
import os
import joblib

logger = logging.getLogger(__name__)

# Model artifacts (optional). If these exist, we'll use them; otherwise fall back to heuristics.
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))
RIGIDITY_MODEL_PATH = os.path.join(MODEL_DIR, "rigidity_model_v0.joblib")
PADS_MODEL_PATH = os.path.join(MODEL_DIR, "pads_model.joblib")
SEMG_MODEL_PATH = os.path.join(MODEL_DIR, "semg_model.joblib")

_rigidity_model = None
_pads_model = None
_semg_model = None

def _load_models():
    global _rigidity_model, _pads_model, _semg_model
    try:
        if os.path.exists(RIGIDITY_MODEL_PATH):
            _rigidity_model = joblib.load(RIGIDITY_MODEL_PATH)
            logger.info("Loaded rigidity model from %s", RIGIDITY_MODEL_PATH)
    except Exception as e:
        logger.warning("Could not load rigidity model: %s", e)

    try:
        if os.path.exists(PADS_MODEL_PATH):
            _pads_model = joblib.load(PADS_MODEL_PATH)
            logger.info("Loaded PADS model from %s", PADS_MODEL_PATH)
    except Exception as e:
        logger.warning("Could not load PADS model: %s", e)

    try:
        if os.path.exists(SEMG_MODEL_PATH):
            _semg_model = joblib.load(SEMG_MODEL_PATH)
            logger.info("Loaded sEMG model from %s", SEMG_MODEL_PATH)
    except Exception as e:
        logger.warning("Could not load sEMG model: %s", e)


# Load at import time (best-effort)
_load_models()


def _predict_with_feature_names(model, X):
    """Predict while preserving feature names when the model was trained with them.

    model: an sklearn-like estimator
    X: a single-row list of feature values (or a 1D/2D list)
    """
    try:
        fn = getattr(model, "feature_names_in_", None)
        # If model exposes feature names, build a DataFrame with those column names
        if fn is not None:
            try:
                import pandas as pd
                import numpy as np
            except Exception:
                # pandas/numpy not available; fallback to raw predict
                raise

            # Normalize X into a 2D array-like
            if len(X) > 0 and not isinstance(X[0], (list, tuple, np.ndarray)):
                arr = np.atleast_2d(np.array(X, dtype=float))
            else:
                arr = np.array(X, dtype=float)

            # Truncate or pad columns to match arr shape if necessary
            ncols = arr.shape[1]
            cols = list(fn)[:ncols]
            df = pd.DataFrame(arr, columns=cols)
            pred = model.predict(df)
            return pred[0] if hasattr(pred, '__len__') else pred
    except Exception:
        # Let caller fall back to generic predict
        raise

    # Generic fallback
    if len(X) > 0 and isinstance(X[0], (list, tuple)):
        return model.predict(X)[0]
    return model.predict([X])[0]


def _process_tremor(tremor_data) -> float:
    """Simulated tremor model: scale amplitude_g to 0..1 with max 30.0."""
    try:
        detected = getattr(tremor_data, "tremor_detected", "no")
        amp = float(getattr(tremor_data, "amplitude_g", 0.0))
    except Exception:
        return 0.0
    if detected in ("no", False, 0, None):
        return 0.0
    score = min(1.0, amp / 30.0)
    return float(score)


def _process_rigidity(rigidity_data) -> float:
    """Heuristic rigidity: high when both muscles are tense above threshold."""
    try:
        wrist = float(getattr(rigidity_data, "emg_wrist", 0.0))
        arm = float(getattr(rigidity_data, "emg_arm", 0.0))
    except Exception:
        return 0.0
    TENSE_THRESHOLD = 5.0
    # If a trained rigidity model is available, use it.
    try:
        if _rigidity_model is not None:
            # The model artifact is expected to be a dict with keys: model, features
            if isinstance(_rigidity_model, dict) and "model" in _rigidity_model and "features" in _rigidity_model:
                model = _rigidity_model["model"]
                features = _rigidity_model["features"]
                # Build a feature vector from expected features; unknown features default to 0
                X = []
                for f in features:
                    # attempt to map feature names to available sensor values
                    if f == "emg_wrist_rms":
                        X.append(wrist)
                    elif f == "emg_arm_rms":
                        X.append(arm)
                    else:
                        # Default placeholder
                        X.append(0.0)
                # Use helper to predict with preserved feature names when possible
                try:
                    pred = _predict_with_feature_names(model, X)
                except Exception:
                    pred = model.predict([X])[0]
                # If classifier returns {0,1}, normalize to float
                try:
                    return float(pred)
                except Exception:
                    return min(1.0, float(pred))
            else:
                # If raw model object, try a simple predict using emg features
                try:
                    pred = _predict_with_feature_names(_rigidity_model, [wrist, arm])
                    return float(pred)
                except Exception:
                    pred = _rigidity_model.predict([[wrist, arm]])
                    return float(pred[0])
    except Exception as e:
        logger.warning("Rigidity model inference failed: %s", e)

    # Fallback heuristic
    if wrist > TENSE_THRESHOLD and arm > TENSE_THRESHOLD:
        score = min(1.0, ((wrist + arm) / 2.0) / 10.0)
        return float(score)
    return 0.0


def _process_slowness(safety_data) -> float:
    """Slowness: low movement magnitude => high slowness score."""
    try:
        ax = float(getattr(safety_data, "accel_x_g", 0.0))
        ay = float(getattr(safety_data, "accel_y_g", 0.0))
    except Exception:
        return 0.0
    mag = math.sqrt(ax * ax + ay * ay)
    score = 1.0 - min(1.0, mag / 1.5)
    return float(score)


def _process_gait(safety_data) -> float:
    """Gait/fall risk based on deviation from upright stance."""
    try:
        ax = float(getattr(safety_data, "accel_x_g", 0.0))
        ay = float(getattr(safety_data, "accel_y_g", 0.0))
        az = float(getattr(safety_data, "accel_z_g", 1.0))
    except Exception:
        return 0.0
    if getattr(safety_data, "fall_detected", False):
        return 1.0
    deviation = math.sqrt(ax * ax + ay * ay + (az - 1.0) ** 2)
    score = min(1.0, deviation / 2.0)
    return float(score)


async def process_data_with_ai(data: DeviceData) -> ProcessedData:
    """Main processing pipeline.

    Returns a `ProcessedData` instance containing original fields + `analysis`.
    """
    # Calculate scores
    # Optionally use PADS / sEMG models if available for improved scores
    tremor_score = _process_tremor(data.tremor)
    rigidity_score = _process_rigidity(data.rigidity)
    slowness_score = _process_slowness(data.safety)
    gait_score = _process_gait(data.safety)

    # If PADS model loaded and supports gait/slowness enrichment, attempt to call it
    try:
        if _pads_model is not None:
            # We expect pads model to provide gait/slowness adjustments; interfaces vary
            # This is a best-effort invocation — if it fails, we keep heuristics
            if isinstance(_pads_model, dict) and "model" in _pads_model and "features" in _pads_model:
                mdl = _pads_model["model"]
                feats = _pads_model["features"]
                X = []
                for f in feats:
                    # basic mapping for common features
                    if f == "accel_mag_mean":
                        ax = float(getattr(data.safety, "accel_x_g", 0.0))
                        ay = float(getattr(data.safety, "accel_y_g", 0.0))
                        mag = math.sqrt(ax * ax + ay * ay)
                        X.append(mag)
                    else:
                        X.append(0.0)
                try:
                    pred = _predict_with_feature_names(mdl, X)
                except Exception:
                    pred = mdl.predict([X])[0]
                # assume pred contains gait/slowness in [0,1]
                gait_score = float(pred)
    except Exception as e:
        logger.debug("PADS model inference skipped/failed: %s", e)

    # If sEMG model available, optionally refine rigidity/tremor
    try:
        if _semg_model is not None:
            if isinstance(_semg_model, dict) and "model" in _semg_model and "features" in _semg_model:
                mdl = _semg_model["model"]
                feats = _semg_model["features"]
                X = []
                for f in feats:
                    if f == "emg_wrist":
                        X.append(float(getattr(data.rigidity, "emg_wrist", 0.0)))
                    elif f == "emg_arm":
                        X.append(float(getattr(data.rigidity, "emg_arm", 0.0)))
                    else:
                        X.append(0.0)
                try:
                    pred = _predict_with_feature_names(mdl, X)
                except Exception:
                    pred = mdl.predict([X])[0]
                rigidity_score = float(pred)
    except Exception as e:
        logger.debug("sEMG model inference skipped/failed: %s", e)

    scores = {
        "tremor": round(float(tremor_score), 3),
        "rigidity": round(float(rigidity_score), 3),
        "slowness": round(float(slowness_score), 3),
        "gait": round(float(gait_score), 3),
    }

    # Determine critical event
    critical_event: Optional[str] = None
    if getattr(data.safety, "fall_detected", False):
        critical_event = "fall_detected"
    elif rigidity_score > 0.8:
        critical_event = "rigidity_spike"
    elif tremor_score > 0.8:
        critical_event = "tremor_spike"

    # Rehab suggestion: map top score to suggestion (deterministic tie-breaker)
    # If multiple max values, the order tremor->rigidity->slowness->gait wins
    order = ["tremor", "rigidity", "slowness", "gait"]
    top_symptom = max(order, key=lambda k: scores[k])
    rehab_map = {
        "tremor": "rehab_tremor",
        "rigidity": "rehab_rigidity",
        "slowness": "rehab_slowness",
        "gait": "rehab_gait",
    }
    rehab_suggestion = rehab_map.get(top_symptom)

    # Build AIAnalysis: interpret some booleans for frontend/RAG
    is_tremor_confirmed = tremor_score > 0.2
    is_rigid = rigidity_score > 0.2
    # Convert gait risk (0..1; higher==worse) to stability score out of 100 (higher==better)
    gait_stability_score = round(float((1.0 - gait_score) * 100.0), 2)

    analysis = AIAnalysis(
        is_tremor_confirmed=is_tremor_confirmed,
        is_rigid=is_rigid,
        gait_stability_score=gait_stability_score,
    )

    # Compose ProcessedData (inherits DeviceData)
    processed = ProcessedData(
        timestamp=data.timestamp,
        safety=data.safety,
        tremor=data.tremor,
        rigidity=data.rigidity,
        analysis=analysis,
        scores=scores,
        critical_event=critical_event,
        rehab_suggestion=rehab_suggestion,
    )

    logger.debug(f"Technical scores: {scores}, critical_event={critical_event}, rehab={rehab_suggestion}")
    return processed

