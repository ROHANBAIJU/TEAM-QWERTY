import threading
import time
import json
import sys

from websocket import create_connection
import requests

WS_URL = 'ws://127.0.0.1:8000/ws/frontend-data'
POST_URL = 'http://127.0.0.1:8000/ingest/data'

payload = {
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "device_id": "e2e_test_client",
    "safety": {"fall_detected": False, "accel_x_g": 0.0, "accel_y_g": 0.0, "accel_z_g": 1.0},
    "tremor": {"frequency_hz": 0.0, "amplitude_g": 0.0, "tremor_detected": False},
    "rigidity": {"emg_wrist": 0.0, "emg_arm": 0.0, "rigid": False}
}

received = None


def do_post_after_delay(delay=0.5):
    time.sleep(delay)
    try:
        r = requests.post(POST_URL, json=payload, timeout=5)
        print('POST status:', r.status_code)
    except Exception as e:
        print('POST failed:', e)


try:
    print('Connecting to WS', WS_URL)
    ws = create_connection(WS_URL, timeout=5)
    print('WS connected')
except Exception as e:
    print('WS connect failed:', e)
    sys.exit(2)

# start poster thread
poster = threading.Thread(target=do_post_after_delay, args=(0.5,))
poster.start()

# wait for message (with timeout)
try:
    msg = ws.recv()
    print('WS received:', msg[:1000])
except Exception as e:
    print('WS recv failed or timed out:', e)
finally:
    try:
        ws.close()
    except Exception:
        pass

poster.join(timeout=1)
print('Done')
