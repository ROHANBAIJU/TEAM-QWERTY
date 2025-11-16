// Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration from environment variables
// For demo/development, uses placeholder values if not set
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'stance-sense-qwerty.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'stance-sense-qwerty',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'stance-sense-qwerty.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'demo-sender-id',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app-id',
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

// Check if we're in a browser environment and have valid config
const hasValidConfig = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'demo-api-key';

if (typeof window !== 'undefined' && hasValidConfig) {
  // Only initialize on client side with valid config
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase initialization skipped:', error);
  }
}

export { auth, app };
export default app;
