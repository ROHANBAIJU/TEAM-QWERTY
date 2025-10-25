# File: BACKEND/core_api_service/app/models/schemas.py

from pydantic import BaseModel
from typing import Optional, Any, Dict

# --- Input Schemas (from Arduino) ---
# Note: Your example JSON had a syntax error. I've corrected it
# by assuming "tremor_detected" and "rigid" are strings.

class SafetyData(BaseModel):
    fall_detected: bool
    accel_x_g: float
    accel_y_g: float
    accel_z_g: float

class TremorData(BaseModel):
    frequency_hz: float
    amplitude_g: float
    tremor_detected: bool

class RigidityData(BaseModel):
    emg_wrist: float
    emg_arm: float
    rigid: bool

class DeviceData(BaseModel):
    """
    The main data packet as received from the Node.js service.
    """
    timestamp: str
    device_id: Optional[str] = None
    safety: SafetyData
    tremor: TremorData
    rigidity: RigidityData

# --- Output Schemas (Processed Data) ---

class AIAnalysis(BaseModel):
    """
    Additional insights from our internal AI models.
    """
    is_tremor_confirmed: bool
    is_rigid: bool
    gait_stability_score: float

class ProcessedData(DeviceData):
    """
    The enriched data packet that gets sent to the frontend.
    It includes the original data + AI analysis.
    """
    analysis: AIAnalysis
    # Optional runtime fields populated by the AI processor
    scores: Optional[Dict[str, float]] = None
    critical_event: Optional[str] = None
    rehab_suggestion: Optional[str] = None

class Alert(BaseModel):
    """
    Schema for a critical alert to be saved in Firestore and sent to frontend.
    """
    timestamp: str
    event_type: str  # "fall", "rigidity_spike", etc.
    message: str     # The rich message from the RAG agent
    data_snapshot: dict # A snapshot of the data that caused the alert

