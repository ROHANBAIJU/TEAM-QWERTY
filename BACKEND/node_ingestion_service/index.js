// File: BACKEND/node_ingestion_service/index.js

const { WebSocketServer } = require('ws');
const axios = require('axios'); // Used to send data to Python backend

// --- CONFIGURATION ---
// Allow overriding the node server port via env var, default to 8081 to avoid clashes
const NODE_SERVER_PORT = process.env.NODE_SERVER_PORT ? parseInt(process.env.NODE_SERVER_PORT, 10) : 8081; // Port the Arduino connects to
const FASTAPI_INGEST_URL = 'http://127.0.0.1:8000/ingest/data'; // Internal URL for your Python API
// Optional internal key for trusted forwarders (dev only)
const INTERNAL_KEY = process.env.INTERNAL_KEY || null;

// Create the WebSocket server
const os = require('os');
// Listen on all interfaces so devices on the LAN can connect
const wss = new WebSocketServer({ port: NODE_SERVER_PORT, host: '0.0.0.0' });

// Prevent unhandled errors from crashing the process and log them instead
wss.on('error', (err) => {
  console.error('[Node.js] WebSocket server error:', err && err.message ? err.message : err);
});

// Log listening addresses for convenience
const nets = os.networkInterfaces();
const addresses = [];
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // skip over internal (i.e. 127.0.0.1) and non-ipv4
    if (net.family === 'IPv4' && !net.internal) {
      addresses.push(net.address);
    }
  }
}
console.log('[Node.js] WebSocket Ingestion Service running on:');
addresses.forEach(a => console.log(`  ws://${a}:${NODE_SERVER_PORT}`));
console.log(`  (also ws://localhost:${NODE_SERVER_PORT})`);

wss.on('connection', ws => {
  console.log('[Node.js] Arduino device connected.');

  ws.on('message', async (message) => {
    try {
      // 1. Receive and parse the data packet from Arduino
      // We use toString() because data arrives as a Buffer
      const dataPacket = JSON.parse(message.toString());

      // Simple validation (can be more complex)
      if (!dataPacket.timestamp || !dataPacket.safety) {
        console.warn('[Node.js] Received incomplete data packet. Discarding.');
        return;
      }
      
      // Normalize tremor.tremor_detected to boolean if needed
      if (dataPacket.tremor && dataPacket.tremor.tremor_detected === undefined) {
          // Fallback: decide based on amplitude if missing
          dataPacket.tremor.tremor_detected = !!(dataPacket.tremor.amplitude_g && dataPacket.tremor.amplitude_g > 10);
      } else if (dataPacket.tremor && typeof dataPacket.tremor.tremor_detected === 'string') {
          // Convert string 'yes'/'no' to boolean
          const v = dataPacket.tremor.tremor_detected.toString().toLowerCase();
          dataPacket.tremor.tremor_detected = (v === 'yes' || v === 'true' || v === '1');
      }

      // Normalize rigidity field names to match backend schema
      if (dataPacket.rigidity) {
        // map emg_wrist_avg -> emg_wrist, emg_arm_avg -> emg_arm
        if (dataPacket.rigidity.emg_wrist_avg !== undefined && dataPacket.rigidity.emg_wrist === undefined) {
          dataPacket.rigidity.emg_wrist = dataPacket.rigidity.emg_wrist_avg;
        }
        if (dataPacket.rigidity.emg_arm_avg !== undefined && dataPacket.rigidity.emg_arm === undefined) {
          dataPacket.rigidity.emg_arm = dataPacket.rigidity.emg_arm_avg;
        }
        // map is_rigid or isRigid -> rigid
        if (dataPacket.rigidity.is_rigid !== undefined && dataPacket.rigidity.rigid === undefined) {
          dataPacket.rigidity.rigid = !!dataPacket.rigidity.is_rigid;
        }
        if (dataPacket.rigidity.isRigid !== undefined && dataPacket.rigidity.rigid === undefined) {
          dataPacket.rigidity.rigid = !!dataPacket.rigidity.isRigid;
        }
      }

      // 2. Log what we received
      console.log('[Node.js] Received data from device:', dataPacket);

      // 3. Forward the data to the FastAPI Core Service
      // Attach X-Internal-Key header if provided in the environment so the
      // backend can treat this forwarder as trusted (dev-only behavior).
      const headers = {};
      if (INTERNAL_KEY) {
        headers['X-Internal-Key'] = INTERNAL_KEY;
      }

      // We don't wait for a response, just fire and forget.
      axios.post(FASTAPI_INGEST_URL, dataPacket, { headers })
        .catch(err => {
          console.error('[Node.js] FAILED to forward data to FastAPI:', err.message);
        });

    } catch (error) {
      console.error('[Node.js] Error processing message:', error.message);
      // Optional: send error back to device
      // ws.send(JSON.stringify({ error: "Invalid JSON format" }));
    }
  });

  ws.on('close', () => {
    console.log('[Node.js] Arduino device disconnected.');
  });

  ws.on('error', (error) => {
    console.error('[Node.js] WebSocket error:', error.message);
  });
});

