from websocket import create_connection
urls=['ws://127.0.0.1:8000/ws/frontend-data','ws://127.0.0.1:8000/ws/frontend-data/']
for u in urls:
    try:
        print('Trying',u)
        ws=create_connection(u,timeout=3)
        print('Connected to',u)
        ws.close()
    except Exception as e:
        print('Failed',u,'->',repr(e))
