"""
RAG Analysis Route for StanceSense
Analyzes aggregated patient data and generates insights using RAG
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging
from datetime import datetime, timedelta
import asyncio

from ..comms.firestore_client import get_firestore_db
from ..services.rag_agent import generate_contextual_alert
from ..dependencies import get_current_user
from ..comms.manager import frontend_manager
import json

router = APIRouter(prefix="/analyze", tags=["rag-analysis"])
logger = logging.getLogger(__name__)


class PatientAnalysisRequest(BaseModel):
    """Request to analyze patient data"""
    user_id: str
    trigger_source: Optional[str] = "manual"
    timestamp: Optional[str] = None


class PatientAnalysisResponse(BaseModel):
    """Response from patient data analysis"""
    status: str
    user_id: str
    analysis_timestamp: str
    insights: Optional[str] = None
    recommendations: Optional[str] = None
    critical_alerts: list = []


@router.post("-patient-data", response_model=PatientAnalysisResponse)
async def analyze_patient_data(
    request: PatientAnalysisRequest,
    # Note: Removed auth dependency for aggregation service to call
    # In production, use API key or internal service auth
):
    """
    Analyze aggregated patient data using RAG.
    Called automatically after Firestore aggregation writes.
    
    Flow:
    1. Fetch latest aggregated data from Firestore
    2. Analyze trends and patterns
    3. Generate insights using RAG
    4. Return recommendations
    """
    try:
        logger.info(f"Starting RAG analysis for user {request.user_id} (triggered by: {request.trigger_source})")
        
        db = get_firestore_db()
        if not db:
            raise HTTPException(status_code=503, detail="Firestore not initialized")
        
        # Fetch recent aggregated data (last 24 hours)
        aggregated_data = await fetch_recent_aggregated_data(db, request.user_id, hours=24)
        
        if not aggregated_data:
            logger.warning(f"No aggregated data found for {request.user_id}")
            return PatientAnalysisResponse(
                status="no_data",
                user_id=request.user_id,
                analysis_timestamp=datetime.now().isoformat(),
                insights="No recent data available for analysis",
                recommendations="Continue monitoring patient activity",
                critical_alerts=[]
            )
        
        # Analyze the data
        insights, recommendations, alerts = await analyze_aggregated_data(aggregated_data)
        
        # Generate game recommendations based on symptoms
        game_recommendations = generate_game_recommendations(
            tremor_episodes=sum(1 for point in aggregated_data if point.get("tremor", {}).get("critical")),
            rigidity_episodes=sum(1 for point in aggregated_data if point.get("rigidity", {}).get("critical")),
            fall_count=sum(point.get("safety", {}).get("fall_detected_count", 0) for point in aggregated_data)
        )
        
        # Save analysis results to Firestore
        await save_analysis_results(
            db=db,
            user_id=request.user_id,
            insights=insights,
            recommendations=recommendations,
            alerts=alerts,
            game_recommendations=game_recommendations
        )
        
        # 🎮 Broadcast RAG insights + game recommendations to frontend via WebSocket
        await broadcast_rag_insights(
            user_id=request.user_id,
            insights=insights,
            recommendations=recommendations,
            game_recommendations=game_recommendations,
            alerts=alerts
        )
        
        logger.info(f"✓ RAG analysis completed for {request.user_id}")
        
        return PatientAnalysisResponse(
            status="success",
            user_id=request.user_id,
            analysis_timestamp=datetime.now().isoformat(),
            insights=insights,
            recommendations=recommendations,
            critical_alerts=alerts
        )
        
    except Exception as e:
        logger.error(f"Error analyzing patient data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


async def fetch_recent_aggregated_data(db, user_id: str, hours: int = 24):
    """Fetch recent aggregated data from Firestore"""
    try:
        cutoff_time = (datetime.now() - timedelta(hours=hours)).isoformat()
        
        collection_ref = db.collection(
            "artifacts", "stancesense", "users", user_id, "aggregated_data"
        )
        
        # Query recent documents
        docs = await asyncio.to_thread(
            lambda: list(
                collection_ref
                .where("timestamp", ">=", cutoff_time)
                .order_by("timestamp", direction="DESCENDING")
                .limit(100)
                .stream()
            )
        )
        
        return [doc.to_dict() for doc in docs]
        
    except Exception as e:
        logger.error(f"Error fetching aggregated data: {e}")
        return []


async def analyze_aggregated_data(data_points: list):
    """
    Analyze aggregated data and generate insights.
    This is where RAG magic happens!
    """
    try:
        # Filter out None/invalid data points
        data_points = [dp for dp in data_points if dp and isinstance(dp, dict)]
        
        # Calculate overall trends
        total_points = len(data_points)
        
        if total_points == 0:
            return "No valid data to analyze", "Continue monitoring", []
        
        # Extract critical events
        critical_alerts = []
        tremor_episodes = 0
        rigidity_episodes = 0
        fall_count = 0
        
        for point in data_points:
            try:
                # Check for critical tremor
                if point.get("tremor", {}).get("critical"):
                    tremor_episodes += 1
                    critical_alerts.append({
                        "type": "high_tremor",
                        "timestamp": point.get("timestamp"),
                        "severity": "warning"
                    })
                
                # Check for critical rigidity
                if point.get("rigidity", {}).get("critical"):
                    rigidity_episodes += 1
                    critical_alerts.append({
                        "type": "high_rigidity",
                        "timestamp": point.get("timestamp"),
                        "severity": "warning"
                    })
                
                # Check for falls
                if point.get("safety", {}).get("any_falls"):
                    fall_count += point.get("safety", {}).get("fall_detected_count", 0)
                    critical_alerts.append({
                        "type": "fall_detected",
                        "timestamp": point.get("timestamp"),
                        "severity": "critical"
                    })
            except Exception as e:
                logger.warning(f"Error processing data point: {e}")
                continue
        
        # Generate insights using RAG (simplified version)
        # TODO: Integrate with Gemini API for advanced analysis
        
        insights = generate_insights(
            total_points=total_points,
            tremor_episodes=tremor_episodes,
            rigidity_episodes=rigidity_episodes,
            fall_count=fall_count
        )
        
        recommendations = generate_recommendations(
            tremor_episodes=tremor_episodes,
            rigidity_episodes=rigidity_episodes,
            fall_count=fall_count
        )
        
        logger.info(f"Analysis complete: {len(critical_alerts)} critical alerts detected")
        
        return insights, recommendations, critical_alerts
        
    except Exception as e:
        logger.error(f"Error during analysis: {e}")
        return "Analysis failed", "Please contact healthcare provider", []


def generate_insights(total_points: int, tremor_episodes: int, rigidity_episodes: int, fall_count: int) -> str:
    """Generate human-readable insights"""
    
    insights = []
    
    # Overall activity
    insights.append(f"Analyzed {total_points} aggregated data points from the past 24 hours.")
    
    # Tremor insights
    if tremor_episodes > 0:
        severity = "frequent" if tremor_episodes > 10 else "occasional"
        insights.append(f"Detected {tremor_episodes} {severity} tremor episodes.")
    else:
        insights.append("No significant tremor activity detected.")
    
    # Rigidity insights
    if rigidity_episodes > 0:
        severity = "severe" if rigidity_episodes > 10 else "moderate"
        insights.append(f"Detected {rigidity_episodes} {severity} rigidity episodes.")
    else:
        insights.append("Muscle rigidity levels within normal range.")
    
    # Fall insights
    if fall_count > 0:
        insights.append(f"⚠️ CRITICAL: {fall_count} fall(s) detected. Immediate medical attention recommended.")
    else:
        insights.append("No falls detected - good balance and stability.")
    
    return " ".join(insights)


def generate_recommendations(tremor_episodes: int, rigidity_episodes: int, fall_count: int) -> str:
    """Generate personalized recommendations"""
    
    recommendations = []
    
    # Fall-related recommendations
    if fall_count > 0:
        recommendations.append("🚨 Contact emergency services immediately if injured.")
        recommendations.append("Schedule urgent appointment with neurologist.")
        recommendations.append("Consider installing fall detection alerts at home.")
    
    # Tremor recommendations
    if tremor_episodes > 10:
        recommendations.append("💊 Consult doctor about medication adjustment for tremor control.")
        recommendations.append("🧘 Practice stress reduction techniques - stress can worsen tremors.")
    elif tremor_episodes > 0:
        recommendations.append("📝 Monitor tremor patterns and log in symptom diary.")
    
    # Rigidity recommendations
    if rigidity_episodes > 10:
        recommendations.append("🤸 Increase physical therapy sessions - focus on stretching exercises.")
        recommendations.append("💊 Discuss medication timing with doctor - may need adjustment.")
    elif rigidity_episodes > 0:
        recommendations.append("🏃 Maintain regular exercise routine to reduce stiffness.")
    
    # General recommendations
    if tremor_episodes == 0 and rigidity_episodes == 0 and fall_count == 0:
        recommendations.append("✅ Continue current treatment plan - symptoms well-controlled.")
        recommendations.append("🎯 Maintain healthy lifestyle: regular exercise, good sleep, balanced diet.")
    
    return " ".join(recommendations)


def generate_game_recommendations(tremor_episodes: int, rigidity_episodes: int, fall_count: int) -> list:
    """
    🎮 Generate personalized game recommendations for symptom management!
    StanceSense Gamified Therapy Engine
    """
    games = []
    
    # TREMOR-FOCUSED GAMES
    if tremor_episodes > 0:
        games.append({
            "name": "🎯 Steady Hand Challenge",
            "description": "Guide the ball through a maze without touching the walls - improves hand stability and tremor control",
            "symptom_target": "tremor",
            "difficulty": "hard" if tremor_episodes > 10 else "medium",
            "duration_minutes": 5,
            "benefits": ["Reduces hand tremors", "Improves fine motor control", "Builds focus"]
        })
        games.append({
            "name": "🎨 Precision Painting",
            "description": "Color within the lines to create beautiful artwork - therapeutic for tremor management",
            "symptom_target": "tremor",
            "difficulty": "medium",
            "duration_minutes": 10,
            "benefits": ["Calms tremors", "Enhances coordination", "Stress relief"]
        })
    
    # RIGIDITY-FOCUSED GAMES
    if rigidity_episodes > 0:
        games.append({
            "name": "🤸 Virtual Yoga Flow",
            "description": "Follow gentle stretching routines with motion tracking - reduces muscle stiffness",
            "symptom_target": "rigidity",
            "difficulty": "easy",
            "duration_minutes": 15,
            "benefits": ["Loosens stiff muscles", "Increases flexibility", "Pain relief"]
        })
        games.append({
            "name": "💪 Range of Motion Quest",
            "description": "Complete arm and leg movements to unlock achievements - combats rigidity",
            "symptom_target": "rigidity",
            "difficulty": "medium",
            "duration_minutes": 10,
            "benefits": ["Improves mobility", "Reduces stiffness", "Builds strength"]
        })
    
    # GAIT & BALANCE GAMES
    if fall_count > 0 or rigidity_episodes > 5:
        games.append({
            "name": "🚶 Balance Master",
            "description": "Walk the virtual tightrope and maintain balance - prevents falls",
            "symptom_target": "gait",
            "difficulty": "medium",
            "duration_minutes": 8,
            "benefits": ["Improves balance", "Reduces fall risk", "Boosts confidence"]
        })
        games.append({
            "name": "🏃 Step Rhythm Dance",
            "description": "Match your steps to the beat - fun way to improve gait patterns",
            "symptom_target": "gait",
            "difficulty": "easy",
            "duration_minutes": 12,
            "benefits": ["Better walking rhythm", "Coordination boost", "Enjoyable exercise"]
        })
    
    # GENERAL WELLNESS GAMES
    if tremor_episodes == 0 and rigidity_episodes == 0 and fall_count == 0:
        games.append({
            "name": "🧘 Mindfulness Garden",
            "description": "Relaxing meditation game to maintain your wellness - keep symptoms at bay",
            "symptom_target": "general",
            "difficulty": "easy",
            "duration_minutes": 10,
            "benefits": ["Stress reduction", "Symptom prevention", "Mental clarity"]
        })
        games.append({
            "name": "🎮 Daily Challenge Pack",
            "description": "Mixed exercises to keep you active and healthy - preventive care",
            "symptom_target": "general",
            "difficulty": "medium",
            "duration_minutes": 15,
            "benefits": ["Overall fitness", "Symptom maintenance", "Fun variety"]
        })
    
    return games[:4]  # Return top 4 game recommendations


async def broadcast_rag_insights(
    user_id: str,
    insights: str,
    recommendations: str,
    game_recommendations: list,
    alerts: list
):
    """
    📡 Broadcast RAG analysis + game recommendations to frontend via WebSocket
    This makes the dashboard update in real-time with AI insights!
    """
    try:
        message = {
            "type": "rag_analysis",
            "data": {
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
                "insights": insights,
                "recommendations": recommendations,
                "game_recommendations": game_recommendations,
                "critical_alerts_count": len(alerts),
                "alerts": alerts
            }
        }
        
        await frontend_manager.broadcast(json.dumps(message))
        logger.info(f"📡 Broadcasted RAG insights to {frontend_manager.active_connections} connected frontends")
        
    except Exception as e:
        logger.error(f"Error broadcasting RAG insights: {e}")
        # Non-critical - don't throw


async def save_analysis_results(
    db, 
    user_id: str, 
    insights: str, 
    recommendations: str, 
    alerts: list,
    game_recommendations: list = None
):
    """Save RAG analysis results to Firestore"""
    try:
        timestamp = datetime.now().isoformat()
        
        doc_ref = db.collection(
            "artifacts", "stancesense", "users", user_id, "rag_analysis"
        ).document(timestamp)
        
        analysis_data = {
            "timestamp": timestamp,
            "insights": insights,
            "recommendations": recommendations,
            "game_recommendations": game_recommendations or [],
            "critical_alerts_count": len(alerts),
            "alerts": alerts,
            "generated_by": "rag_agent",
        }
        
        await asyncio.to_thread(doc_ref.set, analysis_data)
        logger.info(f"Saved RAG analysis results for {user_id}")
        
    except Exception as e:
        logger.error(f"Error saving analysis results: {e}")
        # Don't throw - this is non-critical


@router.get("/history/{user_id}")
async def get_analysis_history(
    user_id: str,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get RAG analysis history for a user"""
    try:
        db = get_firestore_db()
        if not db:
            raise HTTPException(status_code=503, detail="Firestore not initialized")
        
        collection_ref = db.collection(
            "artifacts", "stancesense", "users", user_id, "rag_analysis"
        )
        
        docs = await asyncio.to_thread(
            lambda: list(
                collection_ref
                .order_by("timestamp", direction="DESCENDING")
                .limit(limit)
                .stream()
            )
        )
        
        history = [doc.to_dict() for doc in docs]
        
        return {
            "user_id": user_id,
            "analysis_count": len(history),
            "history": history
        }
        
    except Exception as e:
        logger.error(f"Error fetching analysis history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch history: {str(e)}"
        )
