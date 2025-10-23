Models produced by training scripts in `tools/`.

Files
- `pads_model_baseline.joblib` - baseline RandomForest model trained with subject-level split (features list included in the joblib dict).
- `pads_model_tuned.joblib` - hyperparameter-tuned RandomForest (RandomizedSearchCV) saved with best params in the joblib dict.
- `acoustic_model.joblib` - RandomForest trained on `Parkinsson disease.csv` features.
- `report_pads.txt` - classification report and confusion matrix for the PADS evaluation (test set).
- `preds_pads.csv` - sample predictions (test rows head) for PADS model.
- `report_acoustic.txt` - classification report and confusion matrix for the acoustic model.
- `preds_acoustic.csv` - sample predictions (test rows head) for acoustic model.

How to load a model (example)
```python
import joblib
mdl = joblib.load('models/pads_model_tuned.joblib')
clf = mdl['model']
features = mdl.get('features')
# prepare a DataFrame `X` with the same columns as `features` then:
preds = clf.predict(X[features])
```

Notes & next steps
- The PADS model training now uses a subject-level split (GroupShuffleSplit) to avoid leakage from multiple recordings per subject.
- Labels are preferred from `preprocessed/file_list.csv` when present; otherwise the script falls back to `patients/patient_XXX.json` condition mapping.
- Current PADS test accuracy (baseline): see `report_pads.txt`.
- Suggested improvements: richer features (spectral bands, windowed summary stats), subject-level aggregation, alternative classifiers (XGBoost/LightGBM), and model calibration.
