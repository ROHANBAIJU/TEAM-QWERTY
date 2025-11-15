// API service for making authenticated requests to the backend
import { getIdToken } from './authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // Get the current user's ID token
    const idToken = await getIdToken();
    
    if (!idToken) {
      throw new Error('User not authenticated');
    }

    // Add authorization header
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${idToken}`);
    headers.set('Content-Type', 'application/json');

    // Make the request
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `API request failed: ${response.status}`);
    }

    // Parse and return JSON response
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Ingest sensor data to backend
 */
export async function ingestSensorData(data: Record<string, unknown>) {
  return apiRequest('/ingest/data', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get raw sensor data history
 */
export async function getRawSensorData(limit: number = 10) {
  return apiRequest(`/ingest/raw?limit=${limit}`, {
    method: 'GET',
  });
}

/**
 * Health check endpoint (no auth required)
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'error', error: String(error) };
  }
}

/**
 * Sign up a new user (calls backend /auth/signup)
 */
export async function signUpUser(email: string, password: string, displayName?: string) {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        display_name: displayName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Sign up failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Sign up API error:', error);
    throw error;
  }
}

/**
 * Verify user with backend (calls backend /auth/login)
 */
export async function verifyUserWithBackend(idToken: string) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_token: idToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Login verification API error:', error);
    throw error;
  }
}

export default apiRequest;
