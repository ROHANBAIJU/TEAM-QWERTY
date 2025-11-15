// File: BACKEND/node_ingestion_service/index.js

require('dotenv').config(); // Load environment variables
const { WebSocketServer } = require('ws');
const axios = require('axios'); // Used to send data to Python backend
const { startSimulation } = require('./simulator'); // Hardware simulator

// --- CONFIGURATION ---
const NODE_SERVER_PORT = 8080; // Port the Arduino connects to
const FASTAPI_INGEST_URL = 'http://127.0.0.1:8000/ingest/data'; // Internal URL for your Python API
const ENABLE_SIMULATOR = process.env.SIMULATOR === 'true' || true; // Enable by default for testing
const SIMULATOR_INTERVAL = 3000; // Send data every 3 seconds

// Create the WebSocket server
const wss = new WebSocketServer({ port: NODE_SERVER_PORT });

console.log(`[Node.js] WebSocket Ingestion Service running on ws://localhost:${NODE_SERVER_PORT}`);
console.log(`[Node.js] Simulator mode: ${ENABLE_SIMULATOR ? 'ENABLED ✓' : 'DISABLED (waiting for real hardware)'}`);

// Helper function to forward data to FastAPI
async function forwardToFastAPI(dataPacket) {
  const authToken = process.env.FIREBASE_TEST_TOKEN || 'simulator_test_token';
  
  try {
    const response = await axios.post(FASTAPI_INGEST_URL, dataPacket, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`[Node.js] ✓ Forwarded to FastAPI - Status: ${response.status}, ID: ${response.data.id}`);
    return response.data;
  } catch (err) {
    console.error('[Node.js] ❌ FAILED to forward to FastAPI:', err.response?.data || err.message);
    throw err;
  }
}

wss.on('connection', ws => {
  console.log('[Node.js] Device connected.');
  
  // Start simulator if enabled - pass forwardToFastAPI callback
  if (ENABLE_SIMULATOR) {
    console.log('[Node.js] Starting hardware simulator...');
    startSimulation(ws, SIMULATOR_INTERVAL, forwardToFastAPI);
  }

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
      
      // Corrected the missing comma in the tremor object from your example
      if (dataPacket.tremor && dataPacket.tremor.tremor_detected === undefined) {
          // This is a guess based on your data struct, adjust as needed
          if (dataPacket.tremor.amplitude_g > 10) { // Example logic
            dataPacket.tremor.tremor_detected = "yes";
          } else {
            dataPacket.tremor.tremor_detected = "no";
          }
      }

      // 2. Log what we received
      console.log('[Node.js] Received data from device:', dataPacket);

      // 3. Forward the data to the FastAPI Core Service
      await forwardToFastAPI(dataPacket);

    } catch (error) {
      console.error('[Node.js] Error processing message:', error.message);
      // Optional: send error back to device
      // ws.send(JSON.stringify({ error: "Invalid JSON format" }));
    }
  });

  ws.on('close', () => {
    console.log('[Node.js] Device disconnected.');
  });

  ws.on('error', (error) => {
    console.error('[Node.js] WebSocket error:', error.message);
  });
});

