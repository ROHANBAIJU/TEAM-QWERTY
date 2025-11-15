// Test WebSocket Client - Connects to Node.js server to trigger simulator
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('✅ Connected to Node.js WebSocket server');
  console.log('🎮 Hardware simulator should start sending data...');
});

ws.on('message', (data) => {
  console.log('📨 Received response:', data.toString());
});

ws.on('close', () => {
  console.log('🔌 Disconnected from server');
});

ws.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

// Keep connection alive
console.log('🔄 Connecting to ws://localhost:8080...');
