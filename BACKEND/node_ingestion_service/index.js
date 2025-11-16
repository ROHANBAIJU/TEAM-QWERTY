// File: BACKEND/node_ingestion_service/index.js

require('dotenv').config(); // Load environment variables
const { WebSocketServer } = require('ws');
const axios = require('axios'); // Used to send data to Python backend
const http = require('http'); // For health check endpoint
const { startSimulation } = require('./simulator'); // Hardware simulator
const redisCache = require('./redis-cache'); // Redis caching layer
const aggregationService = require('./aggregation-service'); // Periodic aggregation

// --- CONFIGURATION WITH PROPER FALLBACKS ---
const NODE_SERVER_PORT = process.env.PORT || process.env.NODE_SERVER_PORT || 8080;
const FASTAPI_INGEST_URL = process.env.FASTAPI_INGEST_URL || 'http://127.0.0.1:8000/ingest/data';
const ENABLE_SIMULATOR = process.env.SIMULATOR === 'true';
const SIMULATOR_INTERVAL = parseInt(process.env.SIMULATOR_INTERVAL || '3000');
const USE_REDIS_CACHE = process.env.USE_REDIS_CACHE !== 'false'; // Enable by default
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

console.log('[Node.js] Configuration:');
console.log(`  Port: ${NODE_SERVER_PORT}`);
console.log(`  FastAPI URL: ${FASTAPI_INGEST_URL}`);
console.log(`  Redis: ${REDIS_HOST}:${REDIS_PORT}`);
console.log(`  Redis Caching: ${USE_REDIS_CACHE ? 'ENABLED' : 'DISABLED'}`);

// Create HTTP server for health check
const httpServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      redis: USE_REDIS_CACHE ? redisCache.isConnected : false,
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

httpServer.listen(NODE_SERVER_PORT, () => {
  console.log(`[Node.js] HTTP Health Check running on http://localhost:${NODE_SERVER_PORT}/health`);
});

// Initialize Redis cache
(async () => {
  if (USE_REDIS_CACHE) {
    await redisCache.initialize();
    // Start aggregation service (disabled for demo mode)
    // aggregationService.start();
    console.log('[Node.js] ℹ️  Aggregation service disabled for demo mode');
  }
})();

// Create the WebSocket server on the same HTTP server
const wss = new WebSocketServer({ server: httpServer });

console.log(`[Node.js] WebSocket Ingestion Service running on ws://localhost:${NODE_SERVER_PORT}`);
console.log(`[Node.js] Simulator mode: ${ENABLE_SIMULATOR ? 'ENABLED ✓' : 'DISABLED (waiting for real hardware)'}`);
console.log(`[Node.js] Redis caching: ${USE_REDIS_CACHE ? 'ENABLED ✓' : 'DISABLED'}`);

// Helper function to process data with Redis caching
async function processDataPacket(dataPacket, userId = 'test_patient_001') {
  try {
    if (USE_REDIS_CACHE) {
      // Store in Redis for real-time access
      await redisCache.storeRecentData(userId, dataPacket);
      await redisCache.storeLatestReading(userId, dataPacket);
      
      // Add to aggregation buffer (for periodic Firestore writes)
      await redisCache.addToAggregateBuffer(userId, dataPacket);
      
      console.log(`[Node.js] ✓ Cached data in Redis for ${userId}`);
      
      // Only forward critical events to FastAPI immediately
      if (isCriticalEvent(dataPacket)) {
        console.log(`[Node.js] ⚠️ CRITICAL EVENT - forwarding to FastAPI immediately`);
        await forwardToFastAPI(dataPacket);
      }
    } else {
      // Legacy mode: forward everything immediately
      await forwardToFastAPI(dataPacket);
    }
    
    // Broadcast to all connected WebSocket clients (for real-time dashboard)
    broadcastToClients(dataPacket);
    
  } catch (error) {
    console.error('[Node.js] Error processing data packet:', error.message);
  }
}

// Helper function to check if event is critical
function isCriticalEvent(dataPacket) {
  return (
    dataPacket.safety?.fall_detected === true ||
    dataPacket.safety?.battery_low === true ||
    dataPacket.tremor?.amplitude_g > 15 ||
    dataPacket.rigidity?.emg_wrist_mv > 500 ||
    dataPacket.gait?.acceleration_z_g > 2.5
  );
}

// Helper function to broadcast data to WebSocket clients (for dashboard)
function broadcastToClients(dataPacket) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN state
      client.send(JSON.stringify({
        type: 'sensor_update',
        data: dataPacket,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

// Helper function to forward data to FastAPI (legacy mode or critical events)
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
  
  // Send cache stats on connection
  if (USE_REDIS_CACHE) {
    redisCache.getStats('test_patient_001').then(stats => {
      ws.send(JSON.stringify({ type: 'cache_stats', stats }));
    });
  }
  
  // Start simulator if enabled - pass processDataPacket callback
  if (ENABLE_SIMULATOR) {
    console.log('[Node.js] Starting hardware simulator...');
    startSimulation(ws, SIMULATOR_INTERVAL, processDataPacket);
  }

  ws.on('message', async (message) => {
    try {
      // 1. Receive and parse the data packet from Arduino/Hardware
      const dataPacket = JSON.parse(message.toString());

      // Simple validation
      if (!dataPacket.timestamp || !dataPacket.safety) {
        console.warn('[Node.js] ⚠️  Incomplete packet. Discarding.');
        return;
      }

      // 2. Log what we received - DEMO MODE
      console.log('\n' + '='.repeat(70));
      console.log('📦 [Node.js] HARDWARE PACKET RECEIVED');
      console.log('='.repeat(70));
      console.log('⏰ Timestamp:', dataPacket.timestamp);
      console.log('🔒 Rigidity:', {
        emg_wrist: dataPacket.rigidity?.emg_wrist,
        emg_arm: dataPacket.rigidity?.emg_arm,
        rigid: dataPacket.rigidity?.rigid
      });
      console.log('🫨 Tremor:', {
        amplitude_g: dataPacket.tremor?.amplitude_g,
        frequency_hz: dataPacket.tremor?.frequency_hz,
        detected: dataPacket.tremor?.tremor_detected
      });
      console.log('🚨 Safety:', {
        fall_detected: dataPacket.safety?.fall_detected,
        accel_z_g: dataPacket.safety?.accel_z_g
      });

      // 3. Process the data (Redis cache or direct forward)
      console.log('📤 Forwarding to FastAPI for AI processing...');
      await processDataPacket(dataPacket);

    } catch (error) {
      console.error('[Node.js] ❌ Error processing message:', error.message);
    }
  });

  ws.on('close', () => {
    console.log('[Node.js] Device disconnected.');
  });

  ws.on('error', (error) => {
    console.error('[Node.js] WebSocket error:', error.message);
  });
});

