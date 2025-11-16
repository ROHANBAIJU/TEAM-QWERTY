#!/usr/bin/env python3
"""
Interactive Cloud System Test Script
Tests the deployed GCP Node.js backend with WebSocket data streaming

Usage:
    python test_cloud_system.py

Features:
    - Multiple symptom scenario options
    - Sends data packets every 5 seconds
    - Runs for 60 seconds per session (12 packets total)
    - Loops to allow testing different scenarios
"""

import websocket
import json
import time
import sys
from datetime import datetime

# GCP Cloud Run WebSocket URL
CLOUD_WS_URL = "wss://node-ingestion-service-5chvuuiaeq-uc.a.run.app/ws/hardware-stream"

# Device identification
DEVICE_ID = "test_device_001"
PATIENT_ID = "test_patient_001"

# Predefined symptom scenarios
SCENARIOS = {
    "1": {
        "name": "✅ All Normal - No Symptoms",
        "data": {
            "safety": {
                "fall_detected": False,
                "accel_x_g": 0.02,
                "accel_y_g": -0.01,
                "accel_z_g": 0.98
            },
            "tremor": {
                "frequency_hz": 2.1,
                "amplitude_g": 0.05,
                "tremor_detected": False
            },
            "rigidity": {
                "emg_wrist": 12.5,
                "emg_arm": 15.2,
                "rigid": False
            }
        }
    },
    "2": {
        "name": "🤝 Tremor Detected Only",
        "data": {
            "safety": {
                "fall_detected": False,
                "accel_x_g": 0.03,
                "accel_y_g": 0.02,
                "accel_z_g": 0.97
            },
            "tremor": {
                "frequency_hz": 5.8,
                "amplitude_g": 24.5,
                "tremor_detected": True
            },
            "rigidity": {
                "emg_wrist": 18.3,
                "emg_arm": 22.1,
                "rigid": False
            }
        }
    },
    "3": {
        "name": "💪 Rigidity Detected Only",
        "data": {
            "safety": {
                "fall_detected": False,
                "accel_x_g": 0.01,
                "accel_y_g": -0.02,
                "accel_z_g": 0.99
            },
            "tremor": {
                "frequency_hz": 1.9,
                "amplitude_g": 0.08,
                "tremor_detected": False
            },
            "rigidity": {
                "emg_wrist": 145.7,
                "emg_arm": 182.3,
                "rigid": True
            }
        }
    },
    "4": {
        "name": "🚨 Fall Detected Only",
        "data": {
            "safety": {
                "fall_detected": True,
                "accel_x_g": 2.45,
                "accel_y_g": -1.87,
                "accel_z_g": 0.23
            },
            "tremor": {
                "frequency_hz": 2.3,
                "amplitude_g": 0.12,
                "tremor_detected": False
            },
            "rigidity": {
                "emg_wrist": 16.8,
                "emg_arm": 19.5,
                "rigid": False
            }
        }
    },
    "5": {
        "name": "⚠️ Tremor + Rigidity Detected",
        "data": {
            "safety": {
                "fall_detected": False,
                "accel_x_g": 0.04,
                "accel_y_g": 0.03,
                "accel_z_g": 0.96
            },
            "tremor": {
                "frequency_hz": 6.2,
                "amplitude_g": 28.9,
                "tremor_detected": True
            },
            "rigidity": {
                "emg_wrist": 156.2,
                "emg_arm": 194.7,
                "rigid": True
            }
        }
    },
    "6": {
        "name": "🆘 All Symptoms - Critical",
        "data": {
            "safety": {
                "fall_detected": True,
                "accel_x_g": 2.12,
                "accel_y_g": -1.56,
                "accel_z_g": 0.31
            },
            "tremor": {
                "frequency_hz": 7.3,
                "amplitude_g": 32.4,
                "tremor_detected": True
            },
            "rigidity": {
                "emg_wrist": 168.9,
                "emg_arm": 203.5,
                "rigid": True
            }
        }
    },
    "7": {
        "name": "🔄 Moderate Tremor + Fall",
        "data": {
            "safety": {
                "fall_detected": True,
                "accel_x_g": 1.89,
                "accel_y_g": -1.34,
                "accel_z_g": 0.42
            },
            "tremor": {
                "frequency_hz": 5.1,
                "amplitude_g": 19.7,
                "tremor_detected": True
            },
            "rigidity": {
                "emg_wrist": 21.4,
                "emg_arm": 24.8,
                "rigid": False
            }
        }
    }
}

def print_menu():
    """Display the scenario selection menu"""
    print("\n" + "="*60)
    print("🏥 STANCESENSE CLOUD SYSTEM TEST")
    print("="*60)
    print(f"\n📡 Cloud Server: {CLOUD_WS_URL}")
    print(f"🔧 Device ID: {DEVICE_ID}")
    print(f"👤 Patient ID: {PATIENT_ID}")
    print("\n" + "-"*60)
    print("SELECT SYMPTOM SCENARIO:")
    print("-"*60)
    
    for key, scenario in sorted(SCENARIOS.items()):
        print(f"  [{key}] {scenario['name']}")
    
    print("\n  [0] Exit Test")
    print("="*60)

def send_packets(scenario_key):
    """Send data packets for 60 seconds (12 packets, 5-second intervals)"""
    scenario = SCENARIOS[scenario_key]
    
    print(f"\n🚀 Starting transmission: {scenario['name']}")
    print(f"⏱️  Duration: 60 seconds (12 packets @ 5s intervals)")
    print(f"📊 Scenario data:")
    print(json.dumps(scenario['data'], indent=2))
    print("\n" + "-"*60)
    
    try:
        print(f"🔌 Connecting to {CLOUD_WS_URL}...")
        ws = websocket.create_connection(CLOUD_WS_URL, timeout=10)
        print("✅ Connected successfully!")
        
        packets_sent = 0
        start_time = time.time()
        
        for i in range(12):  # 12 packets over 60 seconds
            # Build packet with current timestamp
            packet = {
                "device_id": DEVICE_ID,
                "patient_id": PATIENT_ID,
                "timestamp": datetime.now().isoformat(),
                **scenario['data']
            }
            
            # Send packet
            ws.send(json.dumps(packet))
            packets_sent += 1
            elapsed = time.time() - start_time
            
            print(f"📤 Packet {packets_sent}/12 sent at {datetime.now().strftime('%H:%M:%S')} "
                  f"(elapsed: {elapsed:.1f}s)")
            
            # Wait 5 seconds before next packet (unless it's the last one)
            if i < 11:
                time.sleep(5)
        
        ws.close()
        total_time = time.time() - start_time
        
        print("\n" + "-"*60)
        print(f"✅ Transmission complete!")
        print(f"📊 Stats: {packets_sent} packets sent in {total_time:.1f} seconds")
        print(f"🔍 Check your:")
        print(f"   • Vercel frontend: Real-time dashboard updates")
        print(f"   • Firestore: 'sensor_data' collection (1-min aggregations)")
        print(f"   • GCP Logs: Node.js and FastAPI service logs")
        print("="*60)
        
    except websocket.WebSocketTimeoutException:
        print("\n❌ Connection timeout!")
        print("   Is the GCP Cloud Run service running?")
        print(f"   Try: gcloud run services describe node-ingestion-service --region=us-central1")
        
    except websocket.WebSocketException as e:
        print(f"\n❌ WebSocket error: {e}")
        print("   Check if the Cloud Run service allows unauthenticated WebSocket connections")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Main test loop"""
    print("\n" + "="*60)
    print("🚀 StanceSense Cloud System Test Script")
    print("="*60)
    print("\n📋 This script will:")
    print("   1. Connect to your GCP-hosted Node.js WebSocket server")
    print("   2. Send symptom data packets every 5 seconds")
    print("   3. Run for 60 seconds (12 packets total)")
    print("   4. Ask for next scenario to test")
    print("\n💡 Tip: Open your Vercel frontend to see real-time updates!")
    
    input("\nPress Enter to continue...")
    
    while True:
        print_menu()
        
        try:
            choice = input("\nEnter your choice (0-7): ").strip()
            
            if choice == "0":
                print("\n👋 Exiting test script. Goodbye!")
                sys.exit(0)
            
            if choice not in SCENARIOS:
                print("\n⚠️  Invalid choice! Please select 1-7 or 0 to exit.")
                continue
            
            # Confirm before starting
            scenario_name = SCENARIOS[choice]['name']
            confirm = input(f"\n🎯 Start transmitting '{scenario_name}'? (y/n): ").strip().lower()
            
            if confirm == 'y':
                send_packets(choice)
            else:
                print("❌ Cancelled. Returning to menu...")
            
        except KeyboardInterrupt:
            print("\n\n⚠️  Interrupted by user. Exiting...")
            sys.exit(0)
        except Exception as e:
            print(f"\n❌ Unexpected error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    # Check for websocket-client library
    try:
        import websocket
    except ImportError:
        print("\n❌ Error: 'websocket-client' library not found!")
        print("\n📦 Install it with:")
        print("   pip install websocket-client")
        sys.exit(1)
    
    main()
