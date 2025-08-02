import { env } from '../config/env';
import admin from 'firebase-admin';

let firebaseApp: admin.app.App | undefined;

const projectId = env.VITE_FIREBASE_PROJECT_ID;
const rawKeyFromEnv = env.FIREBASE_PRIVATE_KEY;
const b64KeyFromEnv = env.FIREBASE_PRIVATE_KEY_B64;
const clientEmail = env.FIREBASE_CLIENT_EMAIL;

let privateKey: string | undefined;

if (b64KeyFromEnv && b64KeyFromEnv.trim() !== '') {
  try {
    privateKey = Buffer.from(b64KeyFromEnv, 'base64').toString('utf8');
  } catch (e) {
    console.error("Failed to decode FIREBASE_PRIVATE_KEY_B64. Ensure it's a valid Base64 string.", e);
  }
} else if (rawKeyFromEnv) {
  privateKey = rawKeyFromEnv.replace(/\\n/g, '\n');
}

if (projectId && privateKey && clientEmail) {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      privateKey,
      clientEmail,
    }),
  });
} else {
  console.warn('Firebase Admin credentials are missing. Admin features are disabled.');
}

export const auth = firebaseApp ? admin.auth() : undefined;
export const firestore = firebaseApp ? admin.firestore() : undefined;
export const storage = firebaseApp ? admin.storage() : undefined;

export async function verifyFirebaseToken(token: string) {
  if (!auth) {
    throw new Error('Firebase Admin not configured');
  }
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw new Error('Invalid Firebase token');
  }
}

export async function createCustomToken(uid: string, additionalClaims?: any) {
  if (!auth) {
    throw new Error('Firebase Admin not configured');
  }
  try {
    return await auth.createCustomToken(uid, additionalClaims);
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw new Error('Failed to create custom token');
  }
}

export async function setUserClaims(uid: string, claims: any) {
  if (!auth) {
    throw new Error('Firebase Admin not configured');
  }
  try {
    await auth.setCustomUserClaims(uid, claims);
  } catch (error) {
    console.error('Error setting user claims:', error);
    throw new Error('Failed to set user claims');
  }
}
