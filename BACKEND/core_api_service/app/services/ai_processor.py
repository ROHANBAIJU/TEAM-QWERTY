# File: BACKEND/core_api_service/app/services/ai_processor.py

from ..models.schemas import DeviceData, ProcessedData, AIAnalysis
import logging

logger = logging.getLogger(__name__)

# --- Mock AI Models ---
# In a real app, you would load a .pkl or .tflite model here
def load_tremor_model():
    logger.info("Mock Tremor AI Model loaded.")
    return lambda data: data.tremor.tremor_detected == "yes" and data.tremor.amplitude_g > 1.0

def load_rigidity_model():
    logger.info("Mock Rigidity AI Model loaded.")
    return lambda data: data.rigidity.rigid == "yes" and (data.rigidity.emg_wrist + data.rigidity.emg_arm) > 5.0
    
def load_gait_model():
    logger.info("Mock Gait AI Model loaded.")
    return lambda data: max(0.0, 100.0 - (abs(data.safety.accel_x_g) + abs(data.safety.accel_y_g)) * 20)

# Load models on startup
TREMOR_MODEL = load_tremor_model()
RIGIDITY_MODEL = load_rigidity_model()
GAIT_MODEL = load_gait_model()

# --- Main Processing Function ---
def process_data_with_ai(data: DeviceData) -> ProcessedData:
    """
    Runs the raw data through the internal AI models to
    generate additional insights.
    """
    
    # Run data through mock models
    is_tremor_confirmed = TREMOR_MODEL(data)
    is_rigid = RIGIDITY_MODEL(data)
    gait_stability_score = GAIT_MODEL(data)
    
    # Create the AIAnalysis object
    analysis = AIAnalysis(
        is_tremor_confirmed=is_tremor_confirmed,
        is_rigid=is_rigid,
        gait_stability_score=gait_stability_score
    )
    
    # Combine original data with new analysis
    processed_data = ProcessedData(
        **data.model_dump(),  # Unpack all fields from original data
        analysis=analysis
    )
    
    logger.debug(f"AI Processing complete: {analysis.model_dump()}")
    
    return processed_data

