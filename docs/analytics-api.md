# Analytics API Documentation

## Overview
This document describes the REST API and WebSocket endpoints for the Parkinson's symptom tracking and rehab game system.

## Base URL
```
http://localhost:3000/api
```

---

## REST Endpoints

### 1. Get Symptom Scores

**Endpoint:** `GET /api/analytics/symptom-scores`

**Description:** Retrieves current symptom scores and historical data for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "updatedAt": "2025-10-23T10:23:00Z",
  "scores": {
    "tremor": 42,
    "rigidity": 28,
    "slowness": 55,
    "gait": 33
  },
  "history": {
    "tremor": [40, 41, 42, 43, 42, 42],
    "rigidity": [30, 29, 28, 27, 28, 28],
    "slowness": [60, 58, 59, 57, 56, 55],
    "gait": [35, 34, 33, 33, 34, 33]
  }
}
```

**Fields:**
- `updatedAt`: ISO 8601 timestamp of last score calculation
- `scores`: Current symptom scores (0-100, higher = more severe)
  - `tremor`: Tremor amplitude score
  - `rigidity`: Muscle rigidity/co-contraction score
  - `slowness`: Bradykinesia (movement slowness) score
  - `gait`: Fall risk / gait instability score
- `history`: Array of last 6-12 score values for sparkline rendering

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Server error

---

### 2. Create Game Session

**Endpoint:** `POST /api/games/session`

**Description:** Starts a new rehab game session.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "gameId": "steady-hand",
  "symptom": "tremor",
  "userId": "user-123",
  "mode": "practice"
}
```

**Fields:**
- `gameId`: Game identifier (`steady-hand`, `strength-meter`, `rhythm-tap`, `rhythm-walker`)
- `symptom`: Target symptom (`tremor`, `rigidity`, `slowness`, `gait`)
- `userId`: User identifier
- `mode`: Session mode (`practice`, `assessment`)

**Response:** `201 Created`
```json
{
  "sessionId": "sess-1729681380123",
  "status": "started",
  "gameId": "steady-hand",
  "symptom": "tremor",
  "startedAt": "2025-10-23T10:23:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid gameId or missing required fields
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Server error

---

### 3. Submit Game Result

**Endpoint:** `POST /api/games/session/:sessionId/result`

**Description:** Submits the results of a completed game session.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "score": 78,
  "durationMs": 120000,
  "metrics": {
    "collisions": 3,
    "tremorLevel": 42,
    "maxTremor": 68,
    "avgTremor": 45
  }
}
```

**Fields:**
- `score`: Final game score (0-100)
- `durationMs`: Session duration in milliseconds
- `metrics`: Game-specific metrics (varies by game type)

**Metric Examples by Game:**
- **Steady Hand Maze (Tremor):**
  ```json
  {
    "collisions": 3,
    "tremorLevel": 42,
    "maxTremor": 68,
    "avgTremor": 45,
    "completionTime": 95000
  }
  ```

- **Strength Meter (Rigidity):**
  ```json
  {
    "rounds": 5,
    "avgMaxClench": 85,
    "avgRelaxScore": 78,
    "coContractionIndex": 0.32
  }
  ```

- **Rhythm Tap (Slowness):**
  ```json
  {
    "totalTaps": 42,
    "hits": 38,
    "misses": 4,
    "accuracy": 90,
    "avgTapInterval": 714,
    "maxCombo": 12
  }
  ```

- **Rhythm Walker (Gait):**
  ```json
  {
    "totalSteps": 65,
    "stepsOnBeat": 58,
    "rhythmAccuracy": 89,
    "stepConsistency": 92,
    "avgStepInterval": 923,
    "stepIntervalVariance": 45
  }
  ```

**Response:** `200 OK`
```json
{
  "status": "ok",
  "sessionId": "sess-1729681380123",
  "scoreRecorded": true,
  "symptomUpdated": true,
  "newSymptomScore": 40
}
```

**Error Responses:**
- `400 Bad Request`: Invalid sessionId or metrics
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Session not found
- `500 Internal Server Error`: Server error

---

## WebSocket Connection

### Sensor Data Stream

**Endpoint:** `ws://localhost:3000/ws/sensors`

**Query Parameters:**
- `userId`: User identifier (required)
- `deviceId`: Device identifier (optional)

**Example:**
```javascript
const ws = new WebSocket('ws://localhost:3000/ws/sensors?userId=user-123');
```

---

### Server -> Client Messages

#### 1. Sensor Frame
Real-time sensor data from hardware devices.

```json
{
  "type": "sensor_frame",
  "ts": 1729681380123,
  "device": "wrist-1",
  "mpu": {
    "accel_x_g": 0.98,
    "accel_y_g": -0.12,
    "accel_z_g": 0.05,
    "gyro_x": 2.5,
    "gyro_y": -1.3,
    "gyro_z": 0.8
  },
  "emg": {
    "emg_wrist": 245,
    "emg_arm": 189
  }
}
```

**Fields:**
- `type`: Always `"sensor_frame"`
- `ts`: Unix timestamp (milliseconds)
- `device`: Device identifier (`wrist-1`, `arm-1`)
- `mpu`: MPU6050 sensor data
  - `accel_x_g`, `accel_y_g`, `accel_z_g`: Acceleration in g (9.8 m/s²)
  - `gyro_x`, `gyro_y`, `gyro_z`: Angular velocity in deg/s
- `emg`: EMG (Electromyography) data
  - `emg_wrist`: Wrist muscle activity (0-1023 ADC value)
  - `emg_arm`: Arm muscle activity (0-1023 ADC value)

**Frequency:** ~20-50 Hz (20-50 messages per second)

---

#### 2. Symptom Update
Periodic symptom score updates (calculated from sensor data).

```json
{
  "type": "symptom_update",
  "ts": 1729681380123,
  "scores": {
    "tremor": 42,
    "rigidity": 28,
    "slowness": 55,
    "gait": 33
  },
  "history": {
    "tremor": [40, 41, 42, 43, 42, 42],
    "rigidity": [30, 29, 28, 27, 28, 28],
    "slowness": [60, 58, 59, 57, 56, 55],
    "gait": [35, 34, 33, 33, 34, 33]
  }
}
```

**Frequency:** Every 5-10 seconds or on significant change

---

#### 3. Connection Status
Connection and device status updates.

```json
{
  "type": "status",
  "connected": true,
  "devices": ["wrist-1", "arm-1"],
  "message": "All devices connected"
}
```

---

### Client -> Server Messages

#### 1. Start Game Session
Notify server that a game session has started.

```json
{
  "type": "start_game",
  "gameId": "steady-hand",
  "sessionId": "sess-1729681380123"
}
```

**Response:** Server will tag sensor frames with `sessionId` for game-specific processing.

---

#### 2. Stop Game Session
Notify server that a game session has ended.

```json
{
  "type": "stop_game",
  "sessionId": "sess-1729681380123"
}
```

---

#### 3. Request Calibration
Request sensor calibration (user at rest).

```json
{
  "type": "calibrate",
  "device": "wrist-1",
  "duration": 5000
}
```

**Response:**
```json
{
  "type": "calibration_complete",
  "device": "wrist-1",
  "baseline": {
    "tremor_rms": 0.05,
    "emg_baseline": 120
  }
}
```

---

## Authentication

All API endpoints require Bearer token authentication:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens are obtained via the login endpoint (not covered in this document).

---

## Rate Limits

- REST API: 100 requests per minute per user
- WebSocket: 1 connection per user per device

---

## Error Codes

### HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### WebSocket Error Messages
```json
{
  "type": "error",
  "code": "DEVICE_DISCONNECTED",
  "message": "Wrist device lost connection",
  "timestamp": 1729681380123
}
```

**Error Codes:**
- `DEVICE_DISCONNECTED`: Hardware device lost connection
- `INVALID_MESSAGE`: Client sent malformed message
- `AUTH_FAILED`: WebSocket authentication failed
- `RATE_LIMIT`: Too many messages from client

---

## Testing

### Demo Mode (Frontend Only)
The frontend includes a demo mode toggle that generates simulated sensor data without requiring backend connection. Enable it in the Analytics tab to test the UI.

### Sample cURL Commands

**Get Symptom Scores:**
```bash
curl -X GET http://localhost:3000/api/analytics/symptom-scores \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create Game Session:**
```bash
curl -X POST http://localhost:3000/api/games/session \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "steady-hand",
    "symptom": "tremor",
    "userId": "user-123",
    "mode": "practice"
  }'
```

**Submit Game Result:**
```bash
curl -X POST http://localhost:3000/api/games/session/sess-123/result \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 78,
    "durationMs": 120000,
    "metrics": {
      "collisions": 3,
      "tremorLevel": 42
    }
  }'
```

---

## Notes

- All timestamps are in UTC
- Sensor data is streamed at high frequency; consider client-side buffering
- Score calculations use exponential moving average (alpha=0.2)
- History arrays are limited to last 12 values
- Game sessions auto-expire after 3 minutes for safety

---

## Contact

For API support or questions, contact the development team.
