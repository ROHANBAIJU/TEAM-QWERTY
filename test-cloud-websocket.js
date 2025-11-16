// Test WebSocket Client for GCP Deployment
// Tests the optimized Node.js service with in-memory cache

const WebSocket = require('ws');

const WS_URL = 'wss://node-ingestion-service-5chvuuiaeq-uc.a.run.app/ws/hardware-stream';

console.log('🚀 Testing GCP WebSocket Connection...');
console.log(`📡 URL: ${WS_URL}\n`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Connected to GCP Node.js WebSocket server');
  console.log('📤 Sending test sensor data...\n');
  
  // Send test data packet (Arduino format)
  const testData = {
    device_id: 'test_device_001',
    patient_id: 'test_patient_001',
    timestamp: new Date().toISOString(),
    tremor: {
      frequency_hz: 4.5,
      amplitude_g: 0.8,
      gyro_x: 10.2,
      gyro_y: 12.5,
      gyro_z: 8.3
    },
    rigidity: {
      emg_wrist_mv: 150.5,
      emg_forearm_mv: 180.2,
      resistance_score: 3
    },
    gait: {
      acceleration_z_g: 1.2,
      steps_per_min: 85,
      stride_length_m: 0.65
    },
    safety: {
      fall_detected: false,
      battery_low: false,
      battery_percent: 85
    }
  };
  
  ws.send(JSON.stringify(testData));
  console.log('📨 Test data sent:', JSON.stringify(testData, null, 2));
  
  // Send one more after 3 seconds
  setTimeout(() => {
    testData.timestamp = new Date().toISOString();
    testData.tremor.amplitude_g = 1.2;
    ws.send(JSON.stringify(testData));
    console.log('\n📨 Second test data sent');
    
    // Close after 5 seconds
    setTimeout(() => {
      console.log('\n✅ Test completed successfully!');
      ws.close();
    }, 5000);
  }, 3000);
});

ws.on('message', (data) => {
  console.log('📥 Received response:', data.toString());
});

ws.on('close', () => {
  console.log('🔌 Disconnected from server');
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket Error:', error.message);
  process.exit(1);
});
