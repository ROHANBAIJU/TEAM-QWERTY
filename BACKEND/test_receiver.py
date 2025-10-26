from flask import Flask, request
import json

app = Flask(__name__)

@app.route('/ingest/data', methods=['POST'])
def ingest():
    try:
        data = request.get_json(force=True)
    except Exception as e:
        print('Failed to parse JSON:', e)
        print('Raw data:', request.data)
        return 'bad json', 400

    print('\n=== RECEIVED PAYLOAD ===')
    try:
        print(json.dumps(data, indent=2))
    except Exception:
        print(data)
    print('=== END PAYLOAD ===\n')

    # Return 204 No Content so Arduino sees a success
    return ('', 204)

if __name__ == '__main__':
    # Listen on all interfaces so the Arduino/other devices can reach it
    app.run(host='0.0.0.0', port=8000)
