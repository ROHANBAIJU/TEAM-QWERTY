// --- Libraries ---
#include <Wire.h>
#include <MPU6050.h>
#include <ArduinoJson.h>
#include <WiFiS3.h>           // Correct library for Arduino R4 WiFi
#include <WebSocketsClient.h>   // The NEW, correct library

// --- WiFi & Server Settings (EDIT THESE) ---
const char* ssid = "Udith";
const char* password = "udithmalu";
const char* server_host = "10.64.105.230";
const uint16_t server_port = 8080;
const char* server_path = "/";

WebSocketsClient webSocket; // Create the client object
MPU6050 mpu;

// --- WebSocket Event Handler ---
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WSc] Disconnected!");
      break;
    case WStype_CONNECTED:
      Serial.println("[WSc] Connected to server!");
      break;
    case WStype_TEXT:
      Serial.print("[WSc] Got text: ");
      Serial.println((char*)payload); // Corrected print
      break;
    case WStype_ERROR:
      Serial.println("[WSc] Error!");
      break;
    default:
      break;
  }
}

// --- JSON Payload Function ---
String buildJsonPayload() {
  StaticJsonDocument<256> doc;
  doc["timestamp"] = "00:00:00"; // Placeholder

  JsonObject safety = doc.createNestedObject("safety");
  safety["fall_detected"] = false;
  safety["accel_x_g"] = 0.0;
  safety["accel_y_g"] = 0.0;
  safety["accel_z_g"] = 1.0;

  JsonObject tremor = doc.createNestedObject("tremor");
  tremor["frequency_hz"] = 0.0;
  tremor["amplitude_g"] = 0.0;
  tremor["tremor_detected"] = false;

  JsonObject rigidity = doc.createNestedObject("rigidity");
  rigidity["emg_wrist_avg"] = 0.0;
  rigidity["emg_arm_avg"] = 0.0;
  rigidity["is_rigid"] = false;

  doc["device_id"] = "arduino_r4_01";

  String out;
  serializeJson(doc, out);
  return out;
}

void setup() {
  Serial.begin(115200);
  Wire.begin();
  mpu.initialize();

  // --- Connect to WiFi ---
  Serial.print("Connecting to ");
  Serial.println(ssid);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    WiFi.begin(ssid, password);
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // --- Connect to WebSocket Server ---
  Serial.println("Connecting to WebSocket server...");
  webSocket.begin(server_host, server_port, server_path);
  webSocket.onEvent(webSocketEvent); // Register event handler
  webSocket.setReconnectInterval(5000); // Try to reconnect every 5s
}

unsigned long lastSend = 0;
const unsigned long sendInterval = 1000;

void loop() {
  // This is required to keep the WebSocket connection alive
  webSocket.loop(); 

  unsigned long now = millis();
  if (now - lastSend >= sendInterval) {
    lastSend = now;

    if (webSocket.isConnected()) {
      String payload = buildJsonPayload();
      Serial.print("Sending JSON: ");
      Serial.println(payload);
      webSocket.sendTXT(payload); // Use the correct send function
    } else {
      Serial.println("WebSocket disconnected.");
    }
  }
}