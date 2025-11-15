// Authentication service using Firebase Auth
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Sign up a new user with email and password
 */
export const signUp = async (email: string, password: string, displayName?: string) => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }

    // Get ID token
    const idToken = await userCredential.user.getIdToken();
    
    return {
      user: userCredential.user,
      idToken,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign up';
    console.error('Sign up error:', error);
    throw new Error(message);
  }
};

/**
 * Sign in an existing user with email and password
 */
export const signIn = async (email: string, password: string) => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Get ID token for API authentication
    const idToken = await userCredential.user.getIdToken();
    
    return {
      user: userCredential.user,
      idToken,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign in';
    console.error('Sign in error:', error);
    throw new Error(message);
  }
};

/**
 * Sign out the current user
 */
export const logOut = async () => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }

  try {
    await signOut(auth);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign out';
    console.error('Sign out error:', error);
    throw new Error(message);
  }
};

/**
 * Get the current user's ID token (for API calls)
 */
export const getIdToken = async (forceRefresh: boolean = false): Promise<string | null> => {
  if (!auth) {
    return null;
  }

  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error('Get token error:', error);
    return null;
  }
};

/**
 * Subscribe to auth state changes
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }
  return onAuthStateChanged(auth, callback);
};

/**
 * Get the current user
 */
export const getCurrentUser = (): User | null => {
  if (!auth) {
    return null;
  }
  return auth.currentUser;
};

/**
 * Sign in with Google popup
 */
export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }

  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Get ID token for API authentication
    const idToken = await userCredential.user.getIdToken();
    
    return {
      user: userCredential.user,
      idToken,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign in with Google';
    console.error('Google sign in error:', error);
    throw new Error(message);
  }
};
