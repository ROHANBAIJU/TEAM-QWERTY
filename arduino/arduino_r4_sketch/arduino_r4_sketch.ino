// --- Libraries ---
#include <Wire.h>
#include <MPU6050.h>
#include <ArduinoJson.h>
#include <WiFiS3.h>
#include <WebSocketsClient.h>
#include <WiFiUdp.h>      // <-- NEW: Required for NTP
#include <NTPClient.h>    // <-- NEW: The NTP library

// --- WiFi & Server Settings ---
const char* ssid = "Udith";
const char* password = "udithmalu";
//const char* server_host = "10.64.105.230";
//const char* server_host = "10.19.86.95";
const char* server_host = "10.250.172.95"; // <-- Node ingestion server IP (update if different)
const uint16_t server_port = 8081; // match Node ingestion service default port
const char* server_path = "/";

// --- NEW: NTP Client Setup ---
const long utcOffsetInSeconds = 19800; // IST offset (5.5 * 3600)
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", utcOffsetInSeconds);

WebSocketsClient webSocket;
MPU6050 mpu;

// --- System Settings ---
#define SAMPLE_RATE 500
#define BAUD_RATE 115200

// --- Sensor Pins ---
#define EMG_WRIST_PIN A0
#define EMG_ARM_PIN A1

// --- Tunable Thresholds ---
#define FREEFALL_THRESHOLD 0.50
#define IMPACT_THRESHOLD 3.00
#define TREMOR_THRESHOLD 10.0
#define RIGIDITY_THRESHOLD 5.0
#define RIGIDITY_ALPHA 0.01

// --- Global State Variables ---
volatile float accX, accY, accZ;
volatile bool fallDetected = false;
volatile float tremorFrequency = 0;
volatile float tremorAmplitude = 0;
volatile bool tremorDetected = false;
volatile float avgWristEMG = 0;
volatile float avgArmEMG = 0;
volatile bool isRigid = false;

// --- Timers ---
unsigned long lastSampleTime = 0;
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 1000;

// --- WebSocket Event Handler (Unchanged) ---
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED: Serial.println("[WSc] Disconnected!"); break;
    case WStype_CONNECTED: Serial.println("[WSc] Connected to server!"); break;
    case WStype_TEXT:
      Serial.print("[WSc] Got text: ");
      Serial.println((char*)payload);
      break;
    case WStype_ERROR: Serial.println("[WSc] Error!"); break;
    default: break;
  }
}

// --- JSON Payload Function (MODIFIED) ---
String buildJsonPayload() {
  StaticJsonDocument<384> doc; 

  // --- CHANGED: Get REAL Timestamp from NTPClient ---
  // The 'getFormattedTime()' function returns a "HH:MM:SS" string
  doc["timestamp"] = timeClient.getFormattedTime(); 

  // --- Read Global Sensor Values ---
  JsonObject safety = doc.createNestedObject("safety");
  safety["fall_detected"] = fallDetected; 
  safety["accel_x_g"] = accX;
  safety["accel_y_g"] = accY;
  safety["accel_z_g"] = accZ;

  JsonObject tremor = doc.createNestedObject("tremor");
  tremor["frequency_hz"] = tremorFrequency;
  tremor["amplitude_g"] = tremorAmplitude;
  tremor["tremor_detected"] = tremorDetected;

  JsonObject rigidity = doc.createNestedObject("rigidity");
  // use backend-friendly keys
  rigidity["emg_wrist"] = avgWristEMG;
  rigidity["emg_arm"] = avgArmEMG;
  rigidity["rigid"] = isRigid;

  doc["device_id"] = "arduino_r4_01";

  String out;
  serializeJson(doc, out);
  return out;
}

// --- setup() Function (MODIFIED) ---
void setup() {
  Serial.begin(BAUD_RATE);
  Wire.begin();
  
  mpu.initialize();
  if (!mpu.testConnection()) {
    Serial.println("MPU6050 connection failed");
    while (1);
  }

  // --- Connect to WiFi ---
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // --- NEW: Start NTP Client ---
  Serial.println("Starting NTP client...");
  timeClient.begin();
  // We don't need to wait, 'update()' will handle syncing
  // --- END OF NEW BLOCK ---

  // --- Connect to WebSocket Server ---
  Serial.println("Connecting to WebSocket server...");
  webSocket.begin(server_host, server_port, server_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

// --- loop() Function (MODIFIED) ---
void loop() {
  // --- Task 1: Always run pollers ---
  webSocket.loop(); 
  timeClient.update(); // <-- NEW: This updates the time from the NTP server

  // --- Task 2: Read Sensors (runs at 500 Hz) ---
  unsigned long now_us = micros();
  if (now_us - lastSampleTime >= (1000000 / SAMPLE_RATE)) {
    lastSampleTime = now_us;

    // --- MPU6050 Data Acquisition ---
    int16_t ax_raw, ay_raw, az_raw;
    mpu.getAcceleration(&ax_raw, &ay_raw, &az_raw);
    accX = ax_raw / 16384.0;
    accY = ay_raw / 16384.0;
    accZ = az_raw / 16384.0;
    float totalAcc = sqrt(accX * accX + accY * accY + accZ * accZ);

    // --- LOGIC 1: Fall Detection (FIXED) ---
    static bool inFreefall = false;
    if (totalAcc < FREEFALL_THRESHOLD) { inFreefall = true; }
    if (inFreefall && totalAcc > IMPACT_THRESHOLD) {
      fallDetected = true; 
      inFreefall = false;
    }
    if (inFreefall && totalAcc > 1.2) { inFreefall = false; }

    // --- EMG Data Acquisition & Filtering ---
    float rawWrist = analogRead(EMG_WRIST_PIN);
    float rawArm = analogRead(EMG_ARM_PIN);
    float emgWristFiltered = HighPassFilterWrist(BandStopFilterWrist(rawWrist));
    float emgArmFiltered = HighPassFilterArm(BandStopFilterArm(rawArm));

    // --- LOGIC 2: Tremor Detection ---
    tremorAmplitude = max(abs(emgWristFiltered), abs(emgArmFiltered));
    tremorDetected = (tremorAmplitude > TREMOR_THRESHOLD);

    static unsigned long tremorWindowStart = 0;
    static int wristZeroCrossings = 0;
    static float lastWristSignal = 0;
    static float lastReportedFreq = 0; 
    if ((emgWristFiltered > 0 && lastWristSignal < 0) || (emgWristFiltered < 0 && lastWristSignal > 0)) {
      wristZeroCrossings++;
    }
    lastWristSignal = emgWristFiltered;
    if (now_us - tremorWindowStart >= 1000000) { // 1 sec
      lastReportedFreq = (float)wristZeroCrossings / 2.0; 
      tremorWindowStart = now_us;
      wristZeroCrossings = 0;
    }
    tremorFrequency = lastReportedFreq;

    // --- LOGIC 3: Rigidity Detection ---
    avgWristEMG = (RIGIDITY_ALPHA * abs(emgWristFiltered)) + (1.0 - RIGIDITY_ALPHA) * avgWristEMG;
    // --- TYPO FIX HERE ---
    avgArmEMG = (RIGIDITY_ALPHA * abs(emgArmFiltered))   + (1.0 - RIGIDITY_ALPHA) * avgArmEMG;
    isRigid = (avgWristEMG > RIGIDITY_THRESHOLD && avgArmEMG > RIGIDITY_THRESHOLD);
  }

  // --- Task 3: Send Data (runs at 1 Hz) ---
  unsigned long now_ms = millis();
  if (now_ms - lastSendTime >= sendInterval) {
    lastSendTime = now_ms;

    if (webSocket.isConnected()) {
      // buildJsonPayload() will now use the synced time from timeClient
      String payload = buildJsonPayload(); 
      Serial.print("Sending JSON: ");
      Serial.println(payload);
      webSocket.sendTXT(payload); 

      if (fallDetected) {
        Serial.println("Fall alert sent. Resetting flag.");
        fallDetected = false;
      }
    } else {
      Serial.println("WebSocket disconnected.");
    }
  }
}

// --- EMG Filter Definitions (Unchanged) ---
float HighPassFilterWrist(float input) {
  float output = input;
  static float z1 = 0, z2 = 0;
  float x = output - -0.82523238 * z1 - 0.29463653 * z2;
  output = 0.52996723 * x + -1.05993445 * z1 + 0.52996723 * z2;
  z2 = z1;
  z1 = x;
  return output;
}

float HighPassFilterArm(float input) {
  float output = input;
  static float z1 = 0, z2 = 0;
  float x = output - -0.82523238 * z1 - 0.29463653 * z2;
  output = 0.52996723 * x + -1.05993445 * z1 + 0.52996723 * z2;
  z2 = z1;
  z1 = x;
  return output;
}

float BandStopFilterWrist(float input) {
  static float z1a = 0, z2a = 0, z1b = 0, z2b = 0;
  float x = input - -1.56858163 * z1a - 0.96424138 * z2a;
  float output = 0.96508099 * x + -1.56202714 * z1a + 0.96508099 * z2a;
  z2a = z1a;
  z1a = x;
  x = output - -1.61100358 * z1b - 0.96592171 * z2b;
  output = 1.00000000 * x + -1.61854514 * z1b + 1.00000000 * z2b;
  z2b = z1b;
  z1b = x;
  return output;
}

float BandStopFilterArm(float input) {
  static float z1a = 0, z2a = 0, z1b = 0, z2b = 0;
  float x = input - -1.56858163 * z1a - 0.96424138 * z2a;
  float output = 0.96508099 * x + -1.56202714 * z1a + 0.96508099 * z2a;
  z2a = z1a;
  z1a = x;
  x = output - -1.61100358 * z1b - 0.96592171 * z2b;
  output = 1.00000000 * x + -1.61854514 * z1b + 1.00000000 * z2b;
  z2b = z1b;
  z1b = x;
  return output;
}