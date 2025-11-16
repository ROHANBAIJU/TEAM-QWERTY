"""Simple test to send one packet to Node.js"""
import json
import time
try:
    import websocket
    ws = websocket.WebSocket()
    ws.connect("ws://localhost:8080")
    
    packet = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "tremor": {
            "frequency_hz": 5,
            "amplitude_g": 14.3,
            "tremor_detected": True
        },
        "rigidity": {
            "emg_wrist_mv": 55,
            "emg_arm_mv": 48,
            "rigid": False
        },
        "safety": {
            "fall_detected": False,
            "accel_x_g": 0.05,
            "accel_y_g": -0.03,
            "accel_z_g": 0.96,
            "battery_low": False
        },
        "gait": {
            "acceleration_z_g": 1.1,
            "step_count": 42
        }
    }
    
    print("✅ Connected to Node.js")
    print(f"📤 Sending packet...")
    ws.send(json.dumps(packet))
    print("✅ Packet sent!")
    ws.close()
    print("\n✅ Test complete! Check Node.js and FastAPI logs.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nMake sure Node.js is running:")
    print("  cd BACKEND/node_ingestion_service")
    print("  node index.js")
