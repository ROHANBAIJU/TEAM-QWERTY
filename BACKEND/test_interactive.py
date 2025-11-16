"""
Interactive Test Script for StanceSense Node.js WebSocket Server
Sends test data packets every 5 seconds for 60 seconds
User can choose different test scenarios
"""

import json
import time
import sys
from datetime import datetime
try:
    import websocket
    create_connection = websocket.create_connection
except (AttributeError, ImportError):
    from websocket import create_connection

# Configuration
NODE_WS_URL = "ws://localhost:8080"

# Test Scenarios
SCENARIOS = {
    "1": {
        "name": "Normal/Healthy Readings",
        "description": "No symptoms detected - all values normal",
        "data": {
            "tremor": {
                "frequency_hz": 2,
                "amplitude_g": 3.5,
                "tremor_detected": False
            },
            "rigidity": {
                "emg_wrist": 45.0,
                "emg_arm": 38.0,
                "rigid": False
            },
            "safety": {
                "fall_detected": False,
                "accel_x_g": 0.02,
                "accel_y_g": -0.01,
                "accel_z_g": 0.98
            }
        }
    },
    "2": {
        "name": "Tremor Detected (No Fall, No Rigidity)",
        "description": "Moderate tremor detected",
        "data": {
            "tremor": {
                "frequency_hz": 5,
                "amplitude_g": 14.3,
                "tremor_detected": True
            },
            "rigidity": {
                "emg_wrist": 55.0,
                "emg_arm": 48.0,
                "rigid": False
            },
            "safety": {
                "fall_detected": False,
                "accel_x_g": 0.05,
                "accel_y_g": -0.03,
                "accel_z_g": 0.96
            }
        }
    },
    "3": {
        "name": "Tremor + Rigidity Detected (No Fall)",
        "description": "High tremor and rigidity - critical symptoms",
        "data": {
            "tremor": {
                "frequency_hz": 6,
                "amplitude_g": 18.7,
                "tremor_detected": True
            },
            "rigidity": {
                "emg_wrist": 520.0,
                "emg_arm": 485.0,
                "rigid": True
            },
            "safety": {
                "fall_detected": False,
                "accel_x_g": 0.08,
                "accel_y_g": -0.05,
                "accel_z_g": 0.94
            }
        }
    },
    "4": {
        "name": "FALL DETECTED - CRITICAL EVENT",
        "description": "Patient has fallen - emergency alert",
        "data": {
            "tremor": {
                "frequency_hz": 8,
                "amplitude_g": 22.5,
                "tremor_detected": True
            },
            "rigidity": {
                "emg_wrist": 385.0,
                "emg_arm": 412.0,
                "rigid": True
            },
            "safety": {
                "fall_detected": True,
                "accel_x_g": 2.5,
                "accel_y_g": -1.8,
                "accel_z_g": 0.15
            }
        }
    },
    "5": {
        "name": "High Rigidity Only",
        "description": "Severe muscle stiffness detected",
        "data": {
            "tremor": {
                "frequency_hz": 3,
                "amplitude_g": 6.2,
                "tremor_detected": False
            },
            "rigidity": {
                "emg_wrist": 650.0,
                "emg_arm": 720.0,
                "rigid": True
            },
            "safety": {
                "fall_detected": False,
                "accel_x_g": 0.04,
                "accel_y_g": -0.02,
                "accel_z_g": 0.97
            }
        }
    },
    "6": {
        "name": "Gait Instability + Low Battery",
        "description": "Poor gait and device needs charging",
        "data": {
            "tremor": {
                "frequency_hz": 4,
                "amplitude_g": 9.1,
                "tremor_detected": True
            },
            "rigidity": {
                "emg_wrist": 125.0,
                "emg_arm": 98.0,
                "rigid": False
            },
            "safety": {
                "fall_detected": False,
                "accel_x_g": 0.35,
                "accel_y_g": -0.28,
                "accel_z_g": 0.82
            }
        }
    }
}


class TestRunner:
    def __init__(self):
        self.ws = None
        self.packets_sent = 0
        
    def connect(self):
        """Connect to WebSocket server"""
        try:
            print(f"\n🔌 Connecting to {NODE_WS_URL}...")
            self.ws = create_connection(NODE_WS_URL, timeout=5)
            print("✅ Connected successfully!\n")
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            print("\n💡 Make sure Node.js server is running:")
            print("   cd BACKEND/node_ingestion_service")
            print("   npm start\n")
            return False
    
    def disconnect(self):
        """Close WebSocket connection"""
        if self.ws:
            try:
                self.ws.close()
                print("\n🔌 Disconnected from server")
            except:
                pass
    
    def send_packet(self, scenario_data):
        """Send a single data packet"""
        try:
            # Create packet with current timestamp
            packet = {
                "timestamp": datetime.now().isoformat() + "Z",
                **scenario_data
            }
            
            # Send to server
            self.ws.send(json.dumps(packet))
            self.packets_sent += 1
            
            return True
        except Exception as e:
            print(f"\n❌ Error sending packet: {e}")
            return False
    
    def run_scenario(self, scenario_key):
        """Run a test scenario for 60 seconds"""
        scenario = SCENARIOS[scenario_key]
        
        print("\n" + "="*70)
        print(f"🚀 STARTING TEST: {scenario['name']}")
        print(f"📝 {scenario['description']}")
        print("="*70)
        print("\n⏱️  Duration: 60 seconds")
        print("📦 Frequency: 1 packet every 5 seconds (12 packets total)")
        print("\nPress Ctrl+C to stop early...\n")
        
        self.packets_sent = 0
        start_time = time.time()
        duration = 60  # seconds
        interval = 5   # seconds
        
        try:
            while time.time() - start_time < duration:
                # Send packet
                if self.send_packet(scenario['data']):
                    elapsed = int(time.time() - start_time)
                    remaining = duration - elapsed
                    print(f"✅ Packet {self.packets_sent} sent | "
                          f"Elapsed: {elapsed}s | Remaining: {remaining}s")
                else:
                    print("❌ Failed to send packet - reconnecting...")
                    if not self.connect():
                        break
                
                # Wait 5 seconds before next packet
                time.sleep(interval)
            
            print(f"\n✅ Test completed! Sent {self.packets_sent} packets")
            
        except KeyboardInterrupt:
            print(f"\n\n⏹️  Test stopped by user. Sent {self.packets_sent} packets")
        except Exception as e:
            print(f"\n❌ Error during test: {e}")


def show_menu():
    """Display scenario menu"""
    print("\n" + "="*70)
    print("🏥 STANCESENSE TEST SCRIPT - Interactive Mode")
    print("="*70)
    print("\nChoose a test scenario:\n")
    
    for key, scenario in SCENARIOS.items():
        print(f"  [{key}] {scenario['name']}")
        print(f"      {scenario['description']}\n")
    
    print(f"  [0] Exit")
    print("\n" + "="*70)


def main():
    """Main program loop"""
    print("\n🏥 StanceSense Interactive Test Script")
    print("Tests WebSocket connection to Node.js server at localhost:8080\n")
    
    runner = TestRunner()
    
    # Initial connection
    if not runner.connect():
        sys.exit(1)
    
    try:
        while True:
            show_menu()
            choice = input("\n👉 Enter your choice (0-6): ").strip()
            
            if choice == "0":
                print("\n👋 Goodbye!")
                break
            
            if choice not in SCENARIOS:
                print("\n❌ Invalid choice. Please select 0-6.")
                continue
            
            # Run the selected scenario
            runner.run_scenario(choice)
            
            # Ask to continue
            print("\n" + "="*70)
            continue_test = input("\n🔄 Run another test? (y/n): ").strip().lower()
            if continue_test != 'y':
                print("\n👋 Thanks for testing!")
                break
    
    except KeyboardInterrupt:
        print("\n\n⏹️  Test script interrupted by user")
    
    finally:
        runner.disconnect()


if __name__ == "__main__":
    # Check if websocket-client is installed
    try:
        from websocket import create_connection
    except ImportError:
        print("\n❌ Error: websocket-client not installed")
        print("\n💡 Install it with:")
        print("   pip install websocket-client\n")
        sys.exit(1)
    
    main()
