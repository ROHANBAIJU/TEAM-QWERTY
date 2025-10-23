"""
CLI test harness for the AI processing pipeline.

Usage:
    python tools/test_ai_pipeline.py

This script will:
 - build a few sample `DeviceData` objects (normal and critical),
 - run `process_data_with_ai` on them,
 - print the ProcessedData (model_dump) and scores,
 - if a critical_event is present, call the RAG agent to show the generated alert (or KB fallback).

"""
import asyncio
import json
import logging
import os
import sys
from pprint import pprint

# Ensure package root is on sys.path so 'app' imports resolve when running this script
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app.models.schemas import DeviceData
from app.services.ai_processor import process_data_with_ai
from app.services.rag_agent import generate_contextual_alert

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


SAMPLES = [
    # Normal-ish sample (based on user's example but corrected)
    {
        "timestamp": "2025-10-23T19:37:00Z",
        "safety": {"fall_detected": False, "accel_x_g": 0.02, "accel_y_g": -0.01, "accel_z_g": 0.98},
        "tremor": {"frequency_hz": 5, "amplitude_g": 14.3000021, "tremor_detected": "yes"},
        "rigidity": {"emg_wrist": -0.88, "emg_arm": 9, "rigid": "yes"},
    },
    # Critical rigidity (to trigger RAG)
    {
        "timestamp": "2025-10-23T19:38:00Z",
        "safety": {"fall_detected": False, "accel_x_g": 0.05, "accel_y_g": 0.01, "accel_z_g": 0.99},
        "tremor": {"frequency_hz": 4, "amplitude_g": 2.0, "tremor_detected": "no"},
        "rigidity": {"emg_wrist": 9.5, "emg_arm": 9.8, "rigid": "yes"},
    },
    # Fall detected sample
    {
        "timestamp": "2025-10-23T19:39:00Z",
        "safety": {"fall_detected": True, "accel_x_g": 1.5, "accel_y_g": 0.8, "accel_z_g": 0.2},
        "tremor": {"frequency_hz": 2, "amplitude_g": 0.5, "tremor_detected": "no"},
        "rigidity": {"emg_wrist": 1.0, "emg_arm": 1.2, "rigid": "no"},
    },
]


async def run_sample(sample):
    try:
        device = DeviceData.parse_obj(sample)
    except Exception as e:
        logger.error(f"Invalid sample data: {e}")
        return

    processed = await process_data_with_ai(device)

    print("\n=== Sample timestamp:", device.timestamp)
    # Show scores and runtime attributes
    scores = getattr(processed, "scores", {})
    critical = getattr(processed, "critical_event", None)
    rehab = getattr(processed, "rehab_suggestion", None)

    print("Scores:")
    pprint(scores)
    print("Critical event:", critical)
    print("Rehab suggestion:", rehab)

    print("Processed model dump:")
    pprint(processed.model_dump())

    # If critical, call RAG and show text (rag_agent will fallback to KB if no API key)
    if critical:
        alert_text = await generate_contextual_alert(processed, critical)
        print("\nRAG generated alert text:")
        print(alert_text)


async def main():
    for s in SAMPLES:
        await run_sample(s)


if __name__ == "__main__":
    asyncio.run(main())
