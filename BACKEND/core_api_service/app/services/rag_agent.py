# File: BACKEND/core_api_service/app/services/rag_agent.py

import httpx
import logging
from ..models.schemas import ProcessedData
from ..config import settings

logger = logging.getLogger(__name__)

# --- Mock Knowledge Base ---
# This is the "Retrieval" part of RAG.
# In a real app, this would be a vector database.
KNOWLEDGE_BASE = {
    "fall": "Falls in Parkinson's patients are often due to postural instability or 'freezing of gait.' This is a medical emergency. The patient may need assistance and their care team should be notified. Check for signs of injury and reassure the patient.",
    "rigidity_spike": "A sudden spike in rigidity can be a sign of medication 'wearing-off' or significant muscle distress. This can be painful. The patient may need to rest or perform light stretches. This event should be logged for their doctor's review."
}

async def generate_contextual_alert(data: ProcessedData, event_type: str) -> str:
    """
    Uses RAG (Retrieval-Augmented Generation) to create a
    rich, human-readable alert.
    
    1. Retrieves knowledge from our knowledge base.
    2. Augments a prompt with this knowledge.
    3. Calls the Gemini LLM to generate the alert.
    """
    
    # 1. Retrieval
    retrieved_knowledge = KNOWLEDGE_BASE.get(event_type, "A notable health event was detected.")
    
    # 2. Augmentation
    system_prompt = f"""
    You are an AI assistant for the StanceSense Parkinson's monitor. 
    Your job is to create a concise, calm, and helpful alert message for a caregiver.
    
    Use this knowledge to inform your response: "{retrieved_knowledge}"
    
    Be supportive and clear. Do not be overly alarming.
    Start with a clear heading (e.g., "FALL DETECTED").
    """
    
    user_prompt = f"""
    A critical event '{event_type}' was just detected for the patient.
    Here is the sensor data:
    - Tremor Detected: {data.tremor.tremor_detected}
    - Rigidity Detected: {data.rigidity.rigid}
    - AI Gait Score: {data.analysis.gait_stability_score:.0f}/100
    
    Please generate the alert message.
    """
    
    # 3. Generation (Calling Gemini API)
    # This uses the gemini-2.5-flash model for speed.
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.warning("GEMINI_API_KEY not set! Returning knowledge base text.")
        return f"**EVENT: {event_type.upper()}**\n{retrieved_knowledge}"
        
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={api_key}"

    payload = {
        "contents": [{"parts": [{"text": user_prompt}]}],
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(api_url, json=payload, headers={'Content-Type': 'application/json'})
            
            response.raise_for_status() # Raise an exception for bad status codes
            
            result = response.json()
            text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
            
            if not text:
                raise Exception("Empty response from API")
                
            logger.info("RAG agent generated alert successfully.")
            return text

    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}")
        # Fallback to a simple message
        return f"**EVENT: {event_type.upper()}**\n{retrieved_knowledge}\n(Could not connect to AI for details)"

