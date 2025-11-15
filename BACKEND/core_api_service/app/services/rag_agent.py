# File: BACKEND/core_api_service/app/services/rag_agent.py

import logging
import random
from ..models.schemas import ProcessedData

logger = logging.getLogger(__name__)

# --- SYNTHETIC RAG ALERT TEMPLATES ---
# High-quality pre-written alert messages for instant delivery
# No external API calls needed - all responses are local and fast

SYNTHETIC_ALERTS = {
    "fall": [
        "🚨 **FALL DETECTED**\n\nImmediate attention required. The patient appears to have fallen based on sudden acceleration changes detected by the wrist sensor.\n\n**Recommended Actions:**\n• Check on the patient immediately\n• Assess for visible injuries\n• Ask about pain or discomfort\n• Help the patient to a safe seated position\n• Monitor for signs of confusion or disorientation\n\n**Medical Note:** Falls in Parkinson's patients are often due to postural instability or freezing of gait. This incident should be documented for the care team.",
        
        "🚨 **FALL ALERT - ASSISTANCE NEEDED**\n\nSensor data indicates a significant fall event detected at {timestamp}.\n\n**Critical Steps:**\n1. Approach the patient calmly and check responsiveness\n2. Look for any bleeding, swelling, or obvious fractures\n3. Do NOT move the patient if spinal injury is suspected\n4. Call emergency services if the patient is unconscious or severely injured\n5. If safe to move, help patient to a comfortable position\n\n**Context:** Postural instability is common in Parkinson's disease. This event requires immediate attention and should be reported to the neurologist.",
        
        "🚨 **EMERGENCY: FALL DETECTED**\n\nThe StanceSense system detected a fall at {timestamp}. Acceleration data shows sudden impact consistent with a fall event.\n\n**Immediate Actions Required:**\n• Locate and assess the patient now\n• Check vital signs (pulse, breathing)\n• Ask about head injury or loss of consciousness\n• Look for hip, wrist, or shoulder pain\n• Reassure the patient and avoid panic\n\n**Prevention Note:** Consider reviewing home safety measures and medication timing with the care team. Freezing episodes may be contributing to fall risk.",
        
        "🚨 **FALL EVENT - URGENT RESPONSE NEEDED**\n\nA fall has been detected by the patient's monitoring system at {timestamp}.\n\n**Response Protocol:**\n1. **Immediate Assessment:** Check patient location and consciousness\n2. **Injury Check:** Look for bruises, cuts, fractures, or head trauma\n3. **Comfort:** Help patient find a stable position if safe\n4. **Documentation:** Note time, location, and patient's account of what happened\n5. **Medical Review:** Contact physician if injury suspected or if this is a repeated fall\n\n**Safety Reminder:** Falls are a leading cause of injury in Parkinson's patients. Review environmental hazards and consider physical therapy assessment.",
        
        "🚨 **CRITICAL ALERT: PATIENT FALL**\n\nSensors registered a fall event at {timestamp}. This requires immediate caregiver attention.\n\n**What to Do Now:**\n• Go to the patient immediately\n• Stay calm and speak reassuringly\n• Check for responsiveness and breathing\n• Look for bleeding, deformity, or severe pain\n• If patient is alert and uninjured, help them up slowly\n• If unsure about injuries, call emergency services\n\n**Medical Context:** Falls occur due to Parkinson's motor symptoms including bradykinesia, rigidity, and postural instability. This incident should be logged for the next medical appointment."
    ],
    
    "rigidity_spike": [
        "⚠️ **RIGIDITY SPIKE DETECTED**\n\nThe patient is experiencing a significant increase in muscle rigidity at {timestamp}.\n\n**Recommended Actions:**\n• Check if medication dose is due or was recently missed\n• Help the patient find a comfortable position\n• Encourage gentle stretching or movement if tolerated\n• Apply heat therapy (warm compress) to affected muscles\n• Monitor for pain levels and offer comfort measures\n\n**Medical Note:** Rigidity spikes often indicate medication wearing off between doses. This should be documented for the neurologist to consider dosage timing adjustments.",
        
        "⚠️ **INCREASED RIGIDITY ALERT**\n\nEMG sensors show elevated muscle tension consistent with a rigidity episode at {timestamp}.\n\n**Supportive Care:**\n1. Ask the patient about discomfort or pain levels\n2. Review medication schedule - dose may be wearing off\n3. Encourage slow, gentle movements\n4. Offer warm bath or heating pad for comfort\n5. Help with relaxation techniques or deep breathing\n\n**Context:** Muscle rigidity is a core symptom of Parkinson's disease. Sudden spikes may indicate 'off' periods when medication effects diminish. Consider notifying the care team if episodes become frequent.",
        
        "⚠️ **MUSCLE RIGIDITY EPISODE**\n\nElevated muscle stiffness detected at {timestamp}. The patient may be experiencing discomfort.\n\n**Immediate Support:**\n• Assess patient's mobility and comfort level\n• Check medication log for last dose timing\n• Assist with position changes to reduce strain\n• Provide heat therapy to tense muscle groups\n• Document episode duration and severity\n\n**Treatment Note:** Rigidity spikes can be painful and limiting. This data helps optimize medication timing and may indicate need for dosage adjustment consultation.",
        
        "⚠️ **RIGIDITY ALERT - PATIENT SUPPORT NEEDED**\n\nThe monitoring system detected increased muscle tension at {timestamp}.\n\n**Care Recommendations:**\n1. **Comfort:** Help patient into a relaxed position\n2. **Medication Check:** Verify if next dose is due soon\n3. **Movement:** Encourage gentle range-of-motion exercises if able\n4. **Pain Management:** Apply heat and consider OTC pain relief if approved\n5. **Communication:** Ask patient to describe sensations and pain level\n\n**Clinical Context:** Rigidity is caused by abnormal muscle tone regulation in Parkinson's disease. Episodes often correlate with medication timing and may signal need for treatment plan review.",
        
        "⚠️ **ELEVATED RIGIDITY DETECTED**\n\nSensor data shows significant muscle stiffness increase at {timestamp}.\n\n**Patient Care Steps:**\n• Check in with patient about discomfort or pain\n• Review when last Parkinson's medication was taken\n• Encourage slow stretching of affected limbs\n• Offer massage or heat application for relief\n• Note any triggers (stress, fatigue, activity level)\n\n**Medical Insight:** Rigidity spikes are common in Parkinson's and often indicate medication 'wearing off.' This episode should be logged for physician review to optimize treatment timing."
    ],
    
    "tremor_severe": [
        "⚠️ **SEVERE TREMOR DETECTED**\n\nThe patient is experiencing pronounced tremor activity at {timestamp}.\n\n**Supportive Actions:**\n• Check if the patient needs assistance with tasks\n• Ensure medication has been taken as scheduled\n• Reduce environmental stressors or anxiety triggers\n• Help stabilize objects the patient is holding\n• Encourage rest if tremor is causing fatigue\n\n**Context:** Tremor severity can fluctuate with stress, fatigue, or medication timing. This episode should be monitored and reported if it persists or worsens.",
        
        "⚠️ **HIGH-AMPLITUDE TREMOR ALERT**\n\nSignificant tremor activity detected at {timestamp} with elevated amplitude.\n\n**Immediate Support:**\n1. Assess if tremor is interfering with daily activities\n2. Check medication adherence and timing\n3. Reduce environmental stimuli (noise, bright lights)\n4. Offer weighted utensils or stabilizing aids\n5. Monitor for patient frustration or distress\n\n**Medical Note:** Severe tremors may indicate medication adjustment needs or increased disease activity. Document frequency and duration for neurologist review.",
        
        "⚠️ **TREMOR EPISODE - PATIENT COMFORT CHECK**\n\nElevated tremor frequency and amplitude detected at {timestamp}.\n\n**Care Protocol:**\n• Approach patient calmly and offer assistance\n• Verify last medication dose was taken on time\n• Help with tasks requiring fine motor control\n• Encourage relaxation techniques or breathing exercises\n• Provide emotional support and reassurance\n\n**Clinical Context:** Tremor intensity varies throughout the day and can be exacerbated by stress or anxiety. This data helps track symptom patterns for treatment optimization."
    ],
    
    "gait_instability": [
        "⚠️ **GAIT INSTABILITY DETECTED**\n\nThe patient is showing signs of unsteady walking at {timestamp}.\n\n**Safety Measures:**\n• Stay close to the patient when they are walking\n• Ensure walking paths are clear of obstacles\n• Encourage use of assistive devices (cane, walker)\n• Avoid rushing or distractions during movement\n• Monitor for freezing episodes or shuffling gait\n\n**Prevention Note:** Gait instability increases fall risk. Consider environmental modifications and physical therapy consultation for balance training.",
        
        "⚠️ **WALKING INSTABILITY ALERT**\n\nSensor data indicates reduced gait stability at {timestamp}.\n\n**Immediate Precautions:**\n1. Accompany patient during walking activities\n2. Check footwear for proper fit and support\n3. Remove tripping hazards (rugs, cords, clutter)\n4. Encourage slower, deliberate steps\n5. Watch for freezing of gait episodes\n\n**Medical Context:** Gait disturbances are common in Parkinson's and increase fall risk. This data should be shared with physical therapist for targeted intervention strategies.",
        
        "⚠️ **BALANCE CONCERN - INCREASED MONITORING**\n\nGait analysis shows instability patterns at {timestamp}.\n\n**Safety Protocol:**\n• Provide close supervision during mobility\n• Encourage use of mobility aids consistently\n• Ensure adequate lighting in walking areas\n• Practice conscious walking techniques\n• Consider home safety evaluation\n\n**Treatment Note:** Gait training and balance exercises can improve stability. Document these episodes for care team to assess intervention effectiveness."
    ],
    
    "medication_overdue": [
        "💊 **MEDICATION REMINDER - OVERDUE**\n\nThe patient's scheduled medication is now overdue by more than 30 minutes.\n\n**Action Required:**\n• Locate the medication immediately\n• Verify correct dosage before administering\n• Ensure patient takes with food if required\n• Log the actual time medication is taken\n• Watch for symptom worsening if dose was significantly delayed\n\n**Important:** Consistent medication timing is critical for symptom control in Parkinson's disease. Missed or delayed doses can lead to 'off' periods with increased motor symptoms.",
        
        "💊 **DOSE TIMING ALERT**\n\nScheduled Parkinson's medication is overdue. Adherence is crucial for symptom management.\n\n**Immediate Steps:**\n1. Check if patient has already taken the dose\n2. Administer medication as soon as possible\n3. Note delay duration in medication log\n4. Monitor for symptom breakthrough\n5. Set additional reminders if delays are recurring\n\n**Clinical Note:** Medication 'holidays' or irregular dosing can worsen motor symptoms and reduce treatment effectiveness. Consistency is key for optimal disease management."
    ],
    
    "low_activity": [
        "📉 **LOW ACTIVITY ALERT**\n\nThe patient's movement data shows significantly reduced activity levels over the past 2 hours.\n\n**Wellness Check:**\n• Check on patient's current activity and mood\n• Ask about fatigue, pain, or discomfort\n• Encourage light movement or position changes\n• Assess if medication has been taken\n• Monitor for signs of depression or apathy\n\n**Health Note:** Prolonged inactivity can lead to stiffness, blood clots, and muscle weakness. Regular movement is important for Parkinson's disease management.",
        
        "📉 **REDUCED MOBILITY DETECTED**\n\nActivity tracking shows minimal movement over extended period.\n\n**Care Actions:**\n1. Visit patient to assess their status\n2. Ask about energy levels and motivation\n3. Encourage gentle exercise or walking\n4. Check for pain limiting movement\n5. Consider need for physical therapy referral\n\n**Medical Context:** Bradykinesia (slow movement) is a core Parkinson's symptom, but prolonged immobility should be evaluated to rule out other causes like depression, medication side effects, or new medical issues."
    ]
}

# Fallback messages if event type not found in templates
DEFAULT_ALERT = "⚠️ **HEALTH EVENT DETECTED**\n\nThe StanceSense monitoring system has detected an unusual health event requiring your attention. Please check on the patient and assess their current condition.\n\n**Recommended Actions:**\n• Verify patient's safety and comfort\n• Review recent medication timing\n• Note any symptoms the patient reports\n• Document the event with timestamp\n• Contact healthcare provider if concerns arise\n\n**Note:** This alert was generated by the automated monitoring system. Always use clinical judgment when responding to patient needs."

async def generate_contextual_alert(data: ProcessedData, event_type: str, consent: bool | None = None) -> str:
    """
    Generate instant contextual alerts using synthetic RAG templates.
    No external API calls - all responses are pre-written and local.
    
    This provides:
    1. Instant response times (<1ms vs seconds for API calls)
    2. Consistent, high-quality medical guidance
    3. No API rate limits or costs
    4. Offline capability
    """
    
    from datetime import datetime
    
    # Get current timestamp for alert
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Select alert template based on event type
    if event_type in SYNTHETIC_ALERTS:
        # Randomly select from multiple variations for natural variety
        alert_templates = SYNTHETIC_ALERTS[event_type]
        alert_message = random.choice(alert_templates)
    else:
        # Fallback for unknown event types
        alert_message = DEFAULT_ALERT
    
    # Inject timestamp into alert message
    alert_message = alert_message.replace("{timestamp}", timestamp)
    
    # Augment with current sensor data context
    sensor_context = f"\n\n**Current Sensor Readings:**\n"
    sensor_context += f"• Tremor Detected: {'Yes' if data.tremor.tremor_detected else 'No'}\n"
    sensor_context += f"• Tremor Frequency: {data.tremor.frequency_hz:.1f} Hz\n"
    sensor_context += f"• Tremor Amplitude: {data.tremor.amplitude_g:.2f}g\n"
    sensor_context += f"• Rigidity Status: {'Rigid' if data.rigidity.rigid else 'Normal'}\n"
    sensor_context += f"• EMG Wrist: {data.rigidity.emg_wrist:.0f} µV\n"
    sensor_context += f"• EMG Arm: {data.rigidity.emg_arm:.0f} µV\n"
    sensor_context += f"• Gait Stability Score: {data.analysis.gait_stability_score:.0f}/100\n"
    sensor_context += f"• Fall Detected: {'YES - IMMEDIATE ATTENTION' if data.safety.fall_detected else 'No'}\n"
    
    # Add AI analysis summary
    if hasattr(data, 'scores') and data.scores:
        sensor_context += f"\n**AI Analysis Summary:**\n"
        sensor_context += f"• Tremor Severity: {data.scores.get('tremor', 0) * 100:.0f}%\n"
        sensor_context += f"• Rigidity Severity: {data.scores.get('rigidity', 0) * 100:.0f}%\n"
        sensor_context += f"• Gait Impairment: {data.scores.get('gait', 0) * 100:.0f}%\n"
    
    # Combine alert message with sensor context
    full_alert = alert_message + sensor_context
    
    logger.info(f"Synthetic RAG alert generated for event '{event_type}' (instant, no API call)")
    
    return full_alert


