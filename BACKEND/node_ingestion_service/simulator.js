// Hardware Simulator - Generates realistic sensor data packets
// This simulates Arduino/ESP32 wearable devices sending data

const DEVICE_IDS = [
  'wrist_unit_001',
  'arm_patch_002'
];

// Device hardware status simulation
const deviceStatus = {
  wrist_unit_001: {
    battery: 82,
    signal_strength: -58, // dBm
    firmware_version: 'v1.9.4',
    last_ping: Date.now(),
    connection_quality: 'strong',
    packet_loss: 0.3,
    latency_ms: 42
  },
  arm_patch_002: {
    battery: 15,
    signal_strength: -67, // dBm
    firmware_version: 'v1.4.1',
    last_ping: Date.now(),
    connection_quality: 'moderate',
    packet_loss: 1.2,
    latency_ms: 67
  }
};

// Battery drain simulation
setInterval(() => {
  deviceStatus.wrist_unit_001.battery = Math.max(0, deviceStatus.wrist_unit_001.battery - 0.01);
  deviceStatus.arm_patch_002.battery = Math.max(0, deviceStatus.arm_patch_002.battery - 0.015);
}, 60000); // Drain every minute

// Simulation state to create realistic patterns
let simulationTime = 0;
let medicationTaken = false;
let lastFallTime = 0;

/**
 * Generate a random value within range
 */
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Generate timestamp in ISO format
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Simulate different patient states
 */
function getPatientState() {
  const hour = new Date().getHours();
  
  // Morning stiffness (6-9 AM)
  if (hour >= 6 && hour < 9) {
    return {
      rigidityMultiplier: 1.5,
      tremorMultiplier: 1.2,
      state: 'morning_stiffness'
    };
  }
  
  // Post-medication (after taking dose)
  if (medicationTaken && simulationTime - lastFallTime < 120) {
    return {
      rigidityMultiplier: 0.6,
      tremorMultiplier: 0.7,
      state: 'medicated'
    };
  }
  
  // Pre-medication (symptoms worsen)
  if (!medicationTaken && hour >= 13 && hour < 15) {
    return {
      rigidityMultiplier: 1.3,
      tremorMultiplier: 1.4,
      state: 'pre_medication'
    };
  }
  
  // Evening fatigue (6-9 PM)
  if (hour >= 18 && hour < 21) {
    return {
      rigidityMultiplier: 1.1,
      tremorMultiplier: 1.3,
      state: 'evening_fatigue'
    };
  }
  
  // Normal baseline
  return {
    rigidityMultiplier: 1.0,
    tremorMultiplier: 1.0,
    state: 'baseline'
  };
}

/**
 * Generate realistic tremor data
 */
function generateTremorData(deviceId, state) {
  const baseFrequency = deviceId === 'wrist_unit_001' ? 4.5 : 5.2; // Hz
  const baseAmplitude = randomInRange(0.3, 0.9) * state.tremorMultiplier; // G-forces
  
  // Occasional tremor spikes (10% chance)
  const hasTremorSpike = Math.random() < 0.1;
  const amplitude = hasTremorSpike ? randomInRange(0.85, 0.95) : baseAmplitude;
  
  return {
    tremor_detected: amplitude > 0.5,
    frequency_hz: baseFrequency + randomInRange(-0.3, 0.3),
    amplitude_g: amplitude
  };
}

/**
 * Generate realistic rigidity data
 */
function generateRigidityData(state) {
  const baseEMG_wrist = randomInRange(0.2, 0.6) * state.rigidityMultiplier; // EMG in mV
  const baseEMG_arm = randomInRange(0.2, 0.6) * state.rigidityMultiplier;
  
  // Rigidity spike (5% chance)
  const hasRigiditySpike = Math.random() < 0.05;
  const emg_wrist = hasRigiditySpike ? randomInRange(0.75, 0.9) : baseEMG_wrist;
  const emg_arm = hasRigiditySpike ? randomInRange(0.75, 0.9) : baseEMG_arm;
  
  // Determine if rigid based on EMG levels
  const avgEMG = (emg_wrist + emg_arm) / 2;
  
  return {
    rigid: avgEMG > 0.65,
    emg_wrist: emg_wrist,
    emg_arm: emg_arm
  };
}

/**
 * Generate realistic gait data
 */
function generateGaitData() {
  const baseStepCount = Math.floor(randomInRange(1200, 1500));
  const baseCadence = randomInRange(105, 120);
  const baseStrideLength = randomInRange(0.55, 0.75);
  
  // Shuffling gait detection (8% chance)
  const isShuffling = Math.random() < 0.08;
  
  return {
    step_count: baseStepCount,
    cadence: isShuffling ? randomInRange(80, 95) : baseCadence,
    stride_length: isShuffling ? randomInRange(0.35, 0.50) : baseStrideLength,
    symmetry: randomInRange(0.75, 0.95),
    variability: isShuffling ? randomInRange(0.25, 0.40) : randomInRange(0.05, 0.20)
  };
}

/**
 * Generate realistic safety data (fall detection)
 */
function generateSafetyData() {
  // Fall detection (2% chance - rare event)
  const fallDetected = Math.random() < 0.02;
  
  if (fallDetected) {
    lastFallTime = simulationTime;
    console.log('🚨 [SIMULATOR] FALL EVENT GENERATED');
  }
  
  // Accelerometer data in G-forces
  const accel_x_g = fallDetected ? randomInRange(2.5, 4.0) : randomInRange(-0.3, 0.3);
  const accel_y_g = fallDetected ? randomInRange(2.5, 4.0) : randomInRange(-0.3, 0.3);
  const accel_z_g = fallDetected ? randomInRange(-2.0, -0.5) : randomInRange(0.8, 1.2); // Z-axis shows gravity
  
  return {
    fall_detected: fallDetected,
    accel_x_g: accel_x_g,
    accel_y_g: accel_y_g,
    accel_z_g: accel_z_g
  };
}

/**
 * Generate vitals data
 */
function generateVitalsData() {
  return {
    heart_rate: Math.floor(randomInRange(65, 95)),
    temperature: randomInRange(36.2, 37.1).toFixed(1),
    battery_level: Math.floor(randomInRange(60, 100))
  };
}

/**
 * Generate complete data packet
 */
function generateDataPacket() {
  simulationTime++;
  
  // Randomly trigger medication event (every ~200 packets)
  if (simulationTime % 200 === 0) {
    medicationTaken = !medicationTaken;
    console.log(`💊 [SIMULATOR] Medication ${medicationTaken ? 'TAKEN' : 'WEARING OFF'}`);
  }
  
  const deviceId = DEVICE_IDS[Math.floor(Math.random() * DEVICE_IDS.length)];
  const state = getPatientState();
  
  const packet = {
    device_id: deviceId,
    timestamp: getTimestamp(),
    safety: generateSafetyData(),
    tremor: generateTremorData(deviceId, state),
    rigidity: generateRigidityData(state)
  };
  
  return packet;
}

/**
 * Start continuous simulation
 */
function startSimulation(ws, intervalMs = 3000, forwardCallback = null) {
  console.log(`🎮 [SIMULATOR] Starting data generation every ${intervalMs}ms`);
  console.log('📊 [SIMULATOR] Scenarios: Normal baseline, Morning stiffness, Medication effects, Tremor spikes, Rigidity spikes, Fall detection');
  
  // Send initial packet immediately
  const initialPacket = generateDataPacket();
  ws.send(JSON.stringify(initialPacket));
  console.log(`📤 [SIMULATOR] Initial packet sent from ${initialPacket.device_id}`);
  
  // Forward to FastAPI if callback provided
  if (forwardCallback) {
    forwardCallback(initialPacket).catch(err => console.error('Failed to forward initial packet:', err.message));
  }
  
  // Continue sending packets at intervals
  const interval = setInterval(() => {
    const packet = generateDataPacket();
    ws.send(JSON.stringify(packet));
    
    // Forward to FastAPI if callback provided
    if (forwardCallback) {
      forwardCallback(packet).catch(err => console.error('Failed to forward packet:', err.message));
    }
    
    // Log interesting events
    if (packet.safety.fall_detected === true) {
      console.log(`🚨 [SIMULATOR] FALL DETECTED - Device: ${packet.device_id}`);
    } else if (packet.tremor.amplitude_g > 0.8) {
      console.log(`📈 [SIMULATOR] HIGH TREMOR - Device: ${packet.device_id}, Amplitude: ${packet.tremor.amplitude_g.toFixed(2)}g`);
    } else if (packet.rigidity.rigid === true) {
      console.log(`🔒 [SIMULATOR] RIGIDITY SPIKE - Device: ${packet.device_id}, EMG: ${packet.rigidity.emg_wrist.toFixed(2)}mV`);
    } else {
      console.log(`✓ [SIMULATOR] Normal packet sent from ${packet.device_id}`);
    }
  }, intervalMs);
  
  // Cleanup on disconnect
  ws.on('close', () => {
    clearInterval(interval);
    console.log('🛑 [SIMULATOR] Stopped data generation');
  });
  
  return interval;
}

/**
 * Get current device status for hardware monitoring
 */
function getDeviceStatus(deviceId) {
  const status = deviceStatus[deviceId];
  if (!status) return null;
  
  // Update last ping
  status.last_ping = Date.now();
  
  // Simulate signal strength fluctuation
  status.signal_strength = status.signal_strength + randomInRange(-2, 2);
  
  // Update connection quality based on signal
  if (status.signal_strength > -60) {
    status.connection_quality = 'strong';
  } else if (status.signal_strength > -70) {
    status.connection_quality = 'moderate';
  } else {
    status.connection_quality = 'weak';
  }
  
  return {
    device_id: deviceId,
    battery_percent: Math.round(status.battery * 10) / 10,
    signal_strength_dbm: Math.round(status.signal_strength),
    connection_quality: status.connection_quality,
    firmware_version: status.firmware_version,
    last_ping: new Date(status.last_ping).toISOString(),
    packet_loss_percent: status.packet_loss,
    latency_ms: status.latency_ms,
    uptime_seconds: Math.floor((Date.now() - (status.last_ping - 94680000)) / 1000), // Mock 26h uptime
    status: status.battery < 20 ? 'warning' : 'operational'
  };
}

/**
 * Get all devices status
 */
function getAllDevicesStatus() {
  return DEVICE_IDS.map(id => getDeviceStatus(id)).filter(s => s !== null);
}

module.exports = {
  generateDataPacket,
  startSimulation,
  getDeviceStatus,
  getAllDevicesStatus
};
