export interface AppEnv {
  firebase: { apiKey: string; authDomain: string; projectId: string; storageBucket: string; messagingSenderId: string; appId: string; measurementId?: string };
  functionsRegion: string; appCheckSiteKey?: string; aiTipsBaseUrl?: string;
}

const read = (key: string): string | undefined => {
  const value = (import.meta.env as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const firebase = {
  apiKey: read('VITE_FIREBASE_API_KEY') ?? 'not-configured',
  authDomain: read('VITE_FIREBASE_AUTH_DOMAIN') ?? 'not-configured.firebaseapp.com',
  projectId: read('VITE_FIREBASE_PROJECT_ID') ?? 'psytst-72f06',
  storageBucket: read('VITE_FIREBASE_STORAGE_BUCKET') ?? 'not-configured.appspot.com',
  messagingSenderId: read('VITE_FIREBASE_MESSAGING_SENDER_ID') ?? 'not-configured',
  appId: read('VITE_FIREBASE_APP_ID') ?? 'not-configured',
  measurementId: read('VITE_FIREBASE_MEASUREMENT_ID'),
};

export const appEnv: AppEnv = { firebase, functionsRegion: read('VITE_FIREBASE_FUNCTIONS_REGION') ?? 'us-central1', appCheckSiteKey: read('VITE_FIREBASE_APPCHECK_SITE_KEY'), aiTipsBaseUrl: read('VITE_AI_TIPS_BASE_URL') };
export const isFirebaseConfigured = Object.values(firebase).some((value) => value && value !== 'not-configured' && value !== 'not-configured.firebaseapp.com' && value !== 'not-configured.appspot.com');
