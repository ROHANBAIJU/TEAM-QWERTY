/**
 * Medication and Notes Service
 * Handles API communication for logging medications and patient notes
 */

const API_BASE_URL = 'http://localhost:8000/api';
const AUTH_TOKEN = 'simulator_test_token';

interface MedicationLog {
  timestamp: string;
  medication_name: string;
  dosage: string;
  notes?: string;
  taken_at?: string;
}

interface MedicationHistoryResponse {
  medications: Array<MedicationLog & { id: string }>;
  count: number;
  limit: number;
  days: number;
}

interface PatientNote {
  timestamp: string;
  content: string;
  severity?: 'low' | 'moderate' | 'high';
  category?: 'symptom' | 'observation' | 'general';
  tags?: string[];
}

interface NotesHistoryResponse {
  notes: Array<PatientNote & { id: string }>;
  count: number;
  limit: number;
  days: number;
  category?: string;
}

interface MedicationLogResponse {
  success: boolean;
  message: string;
  id: string;
  medication: MedicationLog;
}

interface NoteSubmitResponse {
  success: boolean;
  message: string;
  id: string;
  note: PatientNote;
}

/**
 * Log a medication intake
 */
export async function logMedication(medication: MedicationLog): Promise<MedicationLogResponse> {
  const response = await fetch(`${API_BASE_URL}/medications/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify(medication)
  });

  if (!response.ok) {
    throw new Error(`Failed to log medication: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get medication log history
 */
export async function getMedicationHistory(
  limit: number = 50,
  days: number = 30
): Promise<MedicationHistoryResponse> {
  const response = await fetch(
    `${API_BASE_URL}/medications/history?limit=${limit}&days=${days}`,
    {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch medication history: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Submit a patient note
 */
export async function submitPatientNote(note: PatientNote): Promise<NoteSubmitResponse> {
  const response = await fetch(`${API_BASE_URL}/notes/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify(note)
  });

  if (!response.ok) {
    throw new Error(`Failed to submit note: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get patient notes history
 */
export async function getNotesHistory(
  limit: number = 100,
  days: number = 30,
  category?: string
): Promise<NotesHistoryResponse> {
  let url = `${API_BASE_URL}/notes/history?limit=${limit}&days=${days}`;
  if (category) {
    url += `&category=${category}`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notes history: ${response.statusText}`);
  }

  return response.json();
}
