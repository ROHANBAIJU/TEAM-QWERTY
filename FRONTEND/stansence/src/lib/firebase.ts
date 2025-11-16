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

// Always initialize Firebase (even with demo credentials for development)
if (typeof window !== 'undefined') {
  // Only initialize on client side
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase initialization error:', error);
    // Create fallback to prevent undefined errors
    try {
      app = initializeApp({
        apiKey: 'AIzaSyDemoKey',
        authDomain: 'stance-sense-qwerty.firebaseapp.com',
        projectId: 'stance-sense-qwerty',
        storageBucket: 'stance-sense-qwerty.appspot.com',
        messagingSenderId: '315465328987',
        appId: '1:315465328987:web:demo'
      });
      auth = getAuth(app);
    } catch (fallbackError) {
      console.error('Firebase fallback initialization failed:', fallbackError);
    }
  }
}

export { auth, app };
export default app;
