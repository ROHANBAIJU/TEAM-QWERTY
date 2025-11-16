# File: BACKEND/core_api_service/app/services/care_recommendations.py

import logging
from ..models.schemas import ProcessedData

logger = logging.getLogger(__name__)

# Game recommendations based on symptoms
GAME_RECOMMENDATIONS = {
    "tremor_focus": {
        "name": "Steady Hand Game",
        "reason": "Practice steady muscle control to reduce tremor amplitude through hand coordination training",
        "target_symptom": "tremor",
        "difficulty": "moderate",
        "benefits": [
            "Real-time hand steadiness feedback",
            "Strengthens fine motor control",
            "Builds tremor management confidence"
        ]
    },
    "rigidity_focus": {
        "name": "EMG Strength Dial",
        "reason": "Use muscle control biofeedback to improve flexibility and reduce stiffness",
        "target_symptom": "rigidity",
        "difficulty": "moderate",
        "benefits": [
            "Real-time EMG muscle control feedback",
            "Reduces muscle tension through active control",
            "Prevents contractures and improves mobility"
        ]
    },
    "gait_focus": {
        "name": "Rhythm Walker Game",
        "reason": "Interactive rhythm-based exercises to improve gait stability and prevent falls",
        "target_symptom": "gait",
        "difficulty": "moderate",
        "benefits": [
            "Enhances postural control and balance",
            "Reduces fall risk through rhythm training",
            "Builds confidence in movement patterns"
        ]
    },
    "general_wellness": {
        "name": "Steady Hand Game",
        "reason": "Maintain fine motor coordination and cognitive function through engaging activities",
        "target_symptom": "general",
        "difficulty": "easy",
        "benefits": [
            "Cognitive stimulation",
            "Hand-eye coordination",
            "Mood improvement"
        ]
    }
}


def generate_care_recommendations(data: ProcessedData) -> dict:
    """
    Generate personalized care recommendations and game suggestions based on sensor data.
    Returns dict with care_recommendations (list) and recommended_game (dict).
    """
    
    recommendations = []
    recommended_game = None
    
    # Extract scores
    tremor_score = data.scores.get('tremor', 0) if hasattr(data, 'scores') and data.scores else 0
    rigidity_score = data.scores.get('rigidity', 0) if hasattr(data, 'scores') and data.scores else 0
    gait_score = data.scores.get('gait', 0) if hasattr(data, 'scores') and data.scores else 0
    
    # Tremor-specific recommendations
    if tremor_score > 0.6 or data.tremor.tremor_detected:
        recommendations.append("🤲 Try weighted utensils or stabilizing aids to assist with daily tasks")
        recommendations.append("☕ Avoid caffeine and ensure adequate rest to minimize tremor intensity")
        recommendations.append("💆 Practice relaxation techniques - stress can exacerbate tremors")
        if not recommended_game:
            recommended_game = GAME_RECOMMENDATIONS["tremor_focus"]
    
    elif tremor_score > 0.3:
        recommendations.append("📝 Monitor tremor patterns throughout the day - note times of improvement")
        recommendations.append("🧘 Gentle exercises and stretching may help reduce tremor frequency")
    
    # Rigidity-specific recommendations
    if rigidity_score > 0.7 or data.rigidity.rigid:
        recommendations.append("🔥 Apply heat therapy (warm bath or heating pad) to stiff muscles")
        recommendations.append("💪 Gentle stretching exercises every 2-3 hours can reduce stiffness")
        recommendations.append("💊 Review medication timing - rigidity often indicates 'wearing off' period")
        if not recommended_game:
            recommended_game = GAME_RECOMMENDATIONS["rigidity_focus"]
    
    elif rigidity_score > 0.4:
        recommendations.append("🚶 Regular movement throughout the day helps prevent muscle stiffness")
        recommendations.append("🛀 Consider warm water exercises for gentle muscle relaxation")
    
    # Gait/balance-specific recommendations
    if gait_score > 0.6 or data.analysis.gait_stability_score < 40:
        recommendations.append("⚠️ Use assistive devices (cane/walker) to prevent falls")
        recommendations.append("💡 Ensure good lighting and clear pathways - remove tripping hazards")
        recommendations.append("👟 Wear supportive, non-slip footwear at all times")
        recommendations.append("🤝 Request accompaniment during walking activities for safety")
        if not recommended_game:
            recommended_game = GAME_RECOMMENDATIONS["gait_focus"]
    
    elif gait_score > 0.3 or data.analysis.gait_stability_score < 70:
        recommendations.append("🎯 Practice conscious walking - focus on heel-to-toe steps")
        recommendations.append("🏋️ Consider physical therapy for balance training exercises")
    
    # Fall detection
    if data.safety.fall_detected:
        recommendations.append("🚨 Assess for injuries immediately and contact healthcare provider")
        recommendations.append("📋 Document fall details for medical team review")
        recommendations.append("🏠 Conduct home safety evaluation to prevent future falls")
    
    # Medication adherence
    if tremor_score > 0.5 or rigidity_score > 0.5:
        recommendations.append("⏰ Verify medications are taken on schedule - symptom control depends on timing")
    
    # General wellness
    if not recommendations:
        recommendations.append("✅ Symptom levels are currently stable - continue routine care")
        recommendations.append("📊 Keep monitoring daily to track patterns over time")
        recommendations.append("🎯 Engage in light physical and cognitive activities")
        recommended_game = GAME_RECOMMENDATIONS["general_wellness"]
    
    # Default game if none selected yet
    if not recommended_game:
        # Choose based on highest severity
        if tremor_score >= rigidity_score and tremor_score >= gait_score:
            recommended_game = GAME_RECOMMENDATIONS["tremor_focus"]
        elif rigidity_score >= gait_score:
            recommended_game = GAME_RECOMMENDATIONS["rigidity_focus"]
        elif gait_score > 0:
            recommended_game = GAME_RECOMMENDATIONS["gait_focus"]
        else:
            recommended_game = GAME_RECOMMENDATIONS["general_wellness"]
    
    logger.info(f"Generated {len(recommendations)} care recommendations and game suggestion: {recommended_game['name']}")
    
    return {
        "care_recommendations": recommendations[:5],  # Limit to top 5 most relevant
        "recommended_game": recommended_game
    }
