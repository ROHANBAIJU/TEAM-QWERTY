import urllib.request
import sys
p='C:/Users/UDITH/Documents/GitHub/TEAM-QWERTY/scripts/test_payload.json'
with open(p,'rb') as f:
    data=f.read()
req=urllib.request.Request('http://127.0.0.1:8000/ingest/data', data=data, headers={'Content-Type':'application/json'})
try:
    with urllib.request.urlopen(req, timeout=5) as r:
        print('Status:', r.status)
        print(r.read().decode('utf-8')[:200])
except Exception as e:
    print('POST failed:', e)
    sys.exit(1)
