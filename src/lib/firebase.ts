import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { connectAuthEmulator, getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';
import { appEnv, firebaseConfigurationMessage, isFirebaseConfigured } from './env';

export const firebaseApp = isFirebaseConfigured ? initializeApp(appEnv.firebase) : undefined;
export const auth = firebaseApp ? getAuth(firebaseApp) : undefined;
export const db = firebaseApp ? getFirestore(firebaseApp) : undefined;
export const storage = firebaseApp ? getStorage(firebaseApp) : undefined;
export const functions = firebaseApp ? getFunctions(firebaseApp, appEnv.functionsRegion) : undefined;
export const googleProvider = firebaseApp ? new GoogleAuthProvider() : undefined;

if (firebaseApp && appEnv.appCheckSiteKey && typeof window !== 'undefined') initializeAppCheck(firebaseApp, { provider: new ReCaptchaV3Provider(appEnv.appCheckSiteKey), isTokenAutoRefreshEnabled: true });
if (auth && db && storage && functions && appEnv.useFirebaseEmulators && import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8081);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

const unavailable = (): never => { throw new Error(firebaseConfigurationMessage ?? 'Firebase no está configurado.'); };
export const requireAuth = (): Auth => auth ?? unavailable();
export const requireFirestore = (): Firestore => db ?? unavailable();
export const requireStorage = (): FirebaseStorage => storage ?? unavailable();
export const requireFunctions = (): Functions => functions ?? unavailable();
