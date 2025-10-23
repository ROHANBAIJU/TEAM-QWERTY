# File: test_backend.py
# This script simulates an Arduino device connecting to the Node.js
# server and sending one data packet.
#
# Make sure to install the websocket client:
# pip install websocket-client

import websocket
import json
import time

# The Node.js server URL
NODE_WS_URL = "ws://localhost:8080"

# --- Your Sample Data Packet ---
# (I've fixed the missing comma in the 'tremor' object from your example)
DATA_PACKET = {
  "timestamp": f"19:37:{int(time.time()) % 60}", # Add seconds to make it unique
  "safety": {
    "fall_detected": False,
      "accel_x_g": 0.02,
      "accel_y_g": -0.01,
      "accel_z_g": 0.98
  },
  "tremor": {
    "frequency_hz": 5,
    "amplitude_g": 14.3000021,
    "tremor_detected": "yes"
  },
  "rigidity": {
    "emg_wrist": -0.88,
    "emg_arm": 9,
    "rigid": "yes"
  }
}

def run_test():
    try:
        print(f"Connecting to Node.js server at {NODE_WS_URL}...")
        # create_connection opens a connection, sends a message, and waits for a response
        ws = websocket.create_connection(NODE_WS_URL)
        print("Connection successful!")
        
        print(f"\nSending data packet:\n{json.dumps(DATA_PACKET, indent=2)}")
        ws.send(json.dumps(DATA_PACKET))
        
        print("\nData sent. Closing connection.")
        ws.close()
        
        print("\n--- TEST COMPLETE ---")
        print("Check your Node.js and FastAPI server logs.")
        print("Then, check your Firestore 'sensor_data' collection!")

    except Exception as e:
        print(f"\n--- TEST FAILED ---")
        print(f"Error: {e}")
        print("Is the Node.js server (node_ingestion_service) running on port 8080?")

if __name__ == "__main__":
    # You'll need to install this library first:
    # pip install websocket-client
    run_test()
