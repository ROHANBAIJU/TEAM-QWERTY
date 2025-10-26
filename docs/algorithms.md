# Sensor Processing Algorithms

## Overview
This document specifies the algorithms for converting raw sensor data into normalized symptom scores (0-100 scale). All algorithms use sliding window processing and exponential moving average (EMA) smoothing.

---

## Common Configuration

### Smoothing Parameters
```python
# Exponential Moving Average
EMA_ALPHA = 0.2  # Weight for new value (0.0-1.0)

# Sliding window sizes
TREMOR_WINDOW_SIZE = 2.0  # seconds
RIGIDITY_WINDOW_SIZE = 3.0  # seconds
SLOWNESS_ASSESSMENT_DURATION = 10.0  # seconds
GAIT_ASSESSMENT_STEPS = 10  # number of steps

# Sampling rates
MPU6050_SAMPLE_RATE = 50  # Hz
EMG_SAMPLE_RATE = 200  # Hz
```

### Score Normalization
All symptom scores are normalized to 0-100:
- **0**: Healthy baseline (no symptom)
- **50**: Moderate severity
- **100**: Severe/maximum severity

```python
def normalize_score(value, min_val, max_val):
    """Clamp and normalize value to 0-100 range"""
    clamped = max(min_val, min(value, max_val))
    normalized = ((clamped - min_val) / (max_val - min_val)) * 100
    return round(normalized, 2)

def ema_update(current_ema, new_value, alpha=0.2):
    """Exponential moving average update"""
    if current_ema is None:
        return new_value
    return alpha * new_value + (1 - alpha) * current_ema
```

---

## 1. Tremor Score

### Hardware
- **Sensor:** MPU6050 (Accelerometer + Gyroscope)
- **Placement:** Wrist device
- **Primary metric:** Acceleration amplitude in 4-6 Hz band

### Algorithm

#### Step 1: Bandpass Filter
Extract tremor-frequency components (4-6 Hz) from acceleration data.

```python
from scipy.signal import butter, filtfilt

def bandpass_filter(data, lowcut=4.0, highcut=6.0, fs=50.0):
    """
    Butterworth bandpass filter for tremor frequency range
    
    Args:
        data: Array of acceleration samples (g)
        lowcut: Lower frequency bound (Hz)
        highcut: Upper frequency bound (Hz)
        fs: Sampling frequency (Hz)
    
    Returns:
        Filtered acceleration data
    """
    nyquist = fs / 2.0
    low = lowcut / nyquist
    high = highcut / nyquist
    
    b, a = butter(N=4, Wn=[low, high], btype='band')
    filtered = filtfilt(b, a, data)
    
    return filtered
```

#### Step 2: Compute RMS Amplitude
Calculate Root Mean Square (RMS) of filtered signal over sliding window.

```python
import numpy as np

def compute_tremor_rms(accel_x, accel_y, accel_z, window_size=2.0, fs=50.0):
    """
    Compute RMS amplitude of tremor
    
    Args:
        accel_x, accel_y, accel_z: Acceleration arrays (g)
        window_size: Window duration (seconds)
        fs: Sampling frequency (Hz)
    
    Returns:
        RMS amplitude (g)
    """
    # Combine 3-axis acceleration (magnitude)
    accel_mag = np.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
    
    # Bandpass filter
    filtered = bandpass_filter(accel_mag, fs=fs)
    
    # Compute RMS over window
    window_samples = int(window_size * fs)
    if len(filtered) < window_samples:
        return 0.0
    
    window = filtered[-window_samples:]
    rms = np.sqrt(np.mean(window**2))
    
    return rms
```

#### Step 3: Normalize to Score
Map RMS amplitude to 0-100 score.

```python
# Calibration constants (adjust based on empirical data)
TREMOR_RMS_MIN = 0.0   # Healthy baseline (g)
TREMOR_RMS_MAX = 0.5   # Severe tremor (g)

def calculate_tremor_score(accel_x, accel_y, accel_z):
    """
    Calculate tremor symptom score
    
    Returns:
        Tremor score (0-100)
    """
    rms = compute_tremor_rms(accel_x, accel_y, accel_z)
    score = normalize_score(rms, TREMOR_RMS_MIN, TREMOR_RMS_MAX)
    
    return score
```

### Pseudocode Summary
```
INPUT: accel_x, accel_y, accel_z (last 2 seconds of data)

1. Compute magnitude: mag = sqrt(x² + y² + z²)
2. Apply bandpass filter (4-6 Hz)
3. Compute RMS: rms = sqrt(mean(filtered²))
4. Normalize: score = map(rms, [0, 0.5], [0, 100])
5. Apply EMA smoothing
6. OUTPUT: tremor_score (0-100)
```

---

## 2. Rigidity Score

### Hardware
- **Sensor:** EMG Op-Amp (Dual channel)
- **Placement:** Flexor and extensor muscles (forearm)
- **Primary metric:** Co-contraction index

### Algorithm

#### Step 1: Detect Muscle Activation
Determine when each muscle exceeds baseline threshold.

```python
def detect_activation(emg_value, baseline, threshold_margin=50):
    """
    Detect if muscle is activated
    
    Args:
        emg_value: Current EMG reading (ADC units, 0-1023)
        baseline: Resting baseline value
        threshold_margin: Activation threshold above baseline
    
    Returns:
        Boolean: True if muscle is activated
    """
    return emg_value > (baseline + threshold_margin)
```

#### Step 2: Compute Co-contraction Index
Calculate percentage of time both muscles are active simultaneously.

```python
def compute_cocontraction_index(emg_wrist, emg_arm, 
                                baseline_wrist, baseline_arm,
                                window_size=3.0, fs=200.0):
    """
    Compute co-contraction index for rigidity assessment
    
    Args:
        emg_wrist: Array of wrist EMG samples
        emg_arm: Array of arm EMG samples
        baseline_wrist: Wrist baseline value
        baseline_arm: Arm baseline value
        window_size: Window duration (seconds)
        fs: Sampling frequency (Hz)
    
    Returns:
        Co-contraction index (0.0-1.0)
    """
    window_samples = int(window_size * fs)
    if len(emg_wrist) < window_samples:
        return 0.0
    
    wrist_window = emg_wrist[-window_samples:]
    arm_window = emg_arm[-window_samples:]
    
    # Detect activation in each sample
    wrist_active = [detect_activation(v, baseline_wrist) for v in wrist_window]
    arm_active = [detect_activation(v, baseline_arm) for v in arm_window]
    
    # Count simultaneous activation
    cocontraction_count = sum([w and a for w, a in zip(wrist_active, arm_active)])
    
    # Co-contraction index
    cci = cocontraction_count / len(wrist_window)
    
    return cci
```

#### Step 3: Normalize to Score
```python
# Calibration constants
RIGIDITY_CCI_MIN = 0.0   # No co-contraction (healthy)
RIGIDITY_CCI_MAX = 0.8   # High co-contraction (severe rigidity)

def calculate_rigidity_score(emg_wrist, emg_arm, baseline_wrist, baseline_arm):
    """
    Calculate rigidity symptom score
    
    Returns:
        Rigidity score (0-100)
    """
    cci = compute_cocontraction_index(emg_wrist, emg_arm, 
                                      baseline_wrist, baseline_arm)
    score = normalize_score(cci, RIGIDITY_CCI_MIN, RIGIDITY_CCI_MAX)
    
    return score
```

### Pseudocode Summary
```
INPUT: emg_wrist[], emg_arm[] (last 3 seconds), baseline values

1. For each sample pair (wrist, arm):
   - wrist_active = (emg_wrist > baseline_wrist + margin)
   - arm_active = (emg_arm > baseline_arm + margin)
   - cocontraction = wrist_active AND arm_active

2. cci = count(cocontraction) / total_samples

3. Normalize: score = map(cci, [0, 0.8], [0, 100])

4. Apply EMA smoothing

5. OUTPUT: rigidity_score (0-100)
```

---

## 3. Slowness Score (Bradykinesia)

### Hardware
- **Sensor:** MPU6050 (Accelerometer)
- **Placement:** Wrist device
- **Primary metric:** Tap count per 10 seconds

### Algorithm

#### Step 1: Detect Taps
Identify acceleration peaks that indicate tapping motion.

```python
from scipy.signal import find_peaks

def detect_taps(accel_y, fs=50.0, height=1.5, distance=10):
    """
    Detect tap events from acceleration data
    
    Args:
        accel_y: Vertical acceleration array (g)
        fs: Sampling frequency (Hz)
        height: Minimum peak height (g)
        distance: Minimum samples between peaks
    
    Returns:
        Array of tap timestamps
    """
    # Find peaks in acceleration
    peaks, _ = find_peaks(accel_y, height=height, distance=distance)
    
    return peaks
```

#### Step 2: Count Taps in Assessment Window
```python
def count_taps_in_window(accel_y, duration=10.0, fs=50.0):
    """
    Count taps over assessment window
    
    Args:
        accel_y: Acceleration data
        duration: Assessment duration (seconds)
        fs: Sampling frequency (Hz)
    
    Returns:
        Number of taps detected
    """
    window_samples = int(duration * fs)
    if len(accel_y) < window_samples:
        return 0
    
    window_data = accel_y[-window_samples:]
    taps = detect_taps(window_data, fs=fs)
    
    return len(taps)
```

#### Step 3: Normalize to Score
Lower tap count = higher slowness score (inverted relationship).

```python
# Calibration constants
SLOWNESS_MAX_TAPS = 40  # Healthy individual taps (per 10s)
SLOWNESS_MIN_TAPS = 10  # Severe bradykinesia taps (per 10s)

def calculate_slowness_score(accel_y):
    """
    Calculate slowness symptom score
    
    Returns:
        Slowness score (0-100)
    """
    tap_count = count_taps_in_window(accel_y)
    
    # Invert: fewer taps = higher score
    if tap_count >= SLOWNESS_MAX_TAPS:
        score = 0.0
    elif tap_count <= SLOWNESS_MIN_TAPS:
        score = 100.0
    else:
        # Linear interpolation (inverted)
        score = (1 - (tap_count - SLOWNESS_MIN_TAPS) / 
                (SLOWNESS_MAX_TAPS - SLOWNESS_MIN_TAPS)) * 100
    
    return round(score, 2)
```

### Pseudocode Summary
```
INPUT: accel_y[] (10-second assessment window)

1. Detect peaks in acceleration (taps):
   - peaks = find_peaks(accel_y, height=1.5g, distance=10 samples)

2. tap_count = length(peaks)

3. Normalize (inverted):
   - If tap_count >= 40: score = 0
   - If tap_count <= 10: score = 100
   - Else: score = (1 - (tap_count - 10) / 30) * 100

4. OUTPUT: slowness_score (0-100)
```

---

## 4. Gait Score (Fall Risk)

### Hardware
- **Sensor:** MPU6050 (Accelerometer)
- **Placement:** Wrist or ankle
- **Primary metric:** Step interval variance + arm swing variance

### Algorithm

#### Step 1: Detect Steps
Identify step events from acceleration patterns.

```python
def detect_steps(accel_z, fs=50.0):
    """
    Detect step events from vertical acceleration
    
    Args:
        accel_z: Forward acceleration (g)
        fs: Sampling frequency (Hz)
    
    Returns:
        Array of step timestamps (sample indices)
    """
    # Detect peaks in forward acceleration
    steps, _ = find_peaks(accel_z, height=0.8, distance=int(fs * 0.4))
    
    return steps
```

#### Step 2: Compute Step Interval Variability
```python
def compute_step_variability(step_timestamps, fs=50.0):
    """
    Compute coefficient of variation for step intervals
    
    Args:
        step_timestamps: Array of step indices
        fs: Sampling frequency (Hz)
    
    Returns:
        Coefficient of variation (CV) as percentage
    """
    if len(step_timestamps) < 3:
        return 0.0
    
    # Compute intervals (in seconds)
    intervals = np.diff(step_timestamps) / fs
    
    # Coefficient of variation
    mean_interval = np.mean(intervals)
    std_interval = np.std(intervals)
    
    cv = (std_interval / mean_interval) * 100
    
    return cv
```

#### Step 3: Compute Arm Swing Variability
```python
def compute_arm_swing_variance(accel_y, fs=50.0):
    """
    Compute arm swing amplitude variance
    
    Args:
        accel_y: Lateral acceleration (g)
        fs: Sampling frequency (Hz)
    
    Returns:
        Variance of peak-to-peak amplitude
    """
    # Detect swing peaks
    peaks_pos, _ = find_peaks(accel_y, height=0.5, distance=int(fs * 0.5))
    peaks_neg, _ = find_peaks(-accel_y, height=0.5, distance=int(fs * 0.5))
    
    if len(peaks_pos) < 2 or len(peaks_neg) < 2:
        return 0.0
    
    # Compute peak-to-peak amplitudes
    amplitudes = []
    for i in range(min(len(peaks_pos), len(peaks_neg))):
        amplitude = abs(accel_y[peaks_pos[i]] - accel_y[peaks_neg[i]])
        amplitudes.append(amplitude)
    
    # Variance
    variance = np.var(amplitudes)
    
    return variance
```

#### Step 4: Combine and Normalize
```python
# Calibration constants
GAIT_CV_MIN = 0.0      # Perfect consistency
GAIT_CV_MAX = 30.0     # High variability
GAIT_VAR_MIN = 0.0     # Stable arm swing
GAIT_VAR_MAX = 0.5     # Irregular arm swing

# Weights
WEIGHT_STEP_VAR = 0.6
WEIGHT_ARM_VAR = 0.4

def calculate_gait_score(accel_y, accel_z):
    """
    Calculate gait symptom score
    
    Returns:
        Gait score (0-100)
    """
    steps = detect_steps(accel_z)
    step_cv = compute_step_variability(steps)
    arm_var = compute_arm_swing_variance(accel_y)
    
    # Normalize each component
    step_score = normalize_score(step_cv, GAIT_CV_MIN, GAIT_CV_MAX)
    arm_score = normalize_score(arm_var, GAIT_VAR_MIN, GAIT_VAR_MAX)
    
    # Weighted combination
    gait_score = (step_score * WEIGHT_STEP_VAR + 
                  arm_score * WEIGHT_ARM_VAR)
    
    return round(gait_score, 2)
```

### Pseudocode Summary
```
INPUT: accel_y[], accel_z[] (10-step walking assessment)

1. Detect steps:
   - steps = find_peaks(accel_z, height=0.8g)

2. Compute step interval variability:
   - intervals = diff(steps) / sample_rate
   - cv = (stddev(intervals) / mean(intervals)) * 100

3. Compute arm swing variance:
   - peaks = find_peaks(accel_y)
   - amplitudes = peak_to_peak values
   - variance = var(amplitudes)

4. Normalize each:
   - step_score = map(cv, [0, 30], [0, 100])
   - arm_score = map(variance, [0, 0.5], [0, 100])

5. Combine:
   - gait_score = 0.6 * step_score + 0.4 * arm_score

6. OUTPUT: gait_score (0-100)
```

---

## Baseline Calibration

All algorithms require baseline calibration for each user.

### Calibration Procedure
1. User remains at rest for 5 seconds
2. Collect sensor data
3. Compute baseline values:
   - **Tremor:** RMS of resting acceleration
   - **Rigidity:** Resting EMG levels
   - **Slowness:** Not applicable (assessment-based)
   - **Gait:** Not applicable (assessment-based)

```python
def calibrate_baseline(sensor_data, duration=5.0):
    """
    Calibrate baseline values from resting state
    
    Args:
        sensor_data: Dictionary with sensor arrays
        duration: Calibration duration (seconds)
    
    Returns:
        Dictionary of baseline values
    """
    baseline = {
        'tremor_rms': np.mean(np.sqrt(np.mean(sensor_data['accel']**2, axis=0))),
        'emg_wrist_baseline': np.percentile(sensor_data['emg_wrist'], 10),
        'emg_arm_baseline': np.percentile(sensor_data['emg_arm'], 10)
    }
    
    return baseline
```

---

## Testing & Validation

### Unit Tests
Each algorithm should have unit tests with:
- Known input → expected output
- Edge cases (empty data, extreme values)
- Baseline vs. severe symptom data

### Example Test Case (Tremor)
```python
def test_tremor_score():
    # Simulate healthy resting state
    accel_x = np.random.normal(0, 0.05, 100)
    accel_y = np.random.normal(0, 0.05, 100)
    accel_z = np.random.normal(1.0, 0.05, 100)
    
    score = calculate_tremor_score(accel_x, accel_y, accel_z)
    assert 0 <= score <= 20, "Healthy baseline should have low tremor score"
    
    # Simulate severe tremor (4-6 Hz oscillation)
    t = np.linspace(0, 2, 100)
    accel_x = 0.3 * np.sin(2 * np.pi * 5 * t)  # 5 Hz tremor
    
    score = calculate_tremor_score(accel_x, accel_y, accel_z)
    assert score >= 60, "Severe tremor should have high score"
```

---

## Performance Considerations

- **Latency:** Target < 100ms for score updates
- **Memory:** Use circular buffers for sliding windows
- **CPU:** Offload FFT/filtering to optimized libraries (NumPy, SciPy)
- **Accuracy:** Re-calibrate baseline daily or after medication

---

## References

1. Bandpass filtering: Butterworth (4th order)
2. Tremor frequency range: 4-6 Hz (Parkinsonian tremor)
3. Co-contraction: Rudolph et al. (2000)
4. Gait variability: Hausdorff et al. (2005)

---

## Notes

- All constants are starting values; adjust based on clinical validation
- Consider age, medication timing, and fatigue in score interpretation
- Store raw sensor data for offline analysis and algorithm refinement
