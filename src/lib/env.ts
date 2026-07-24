export interface AppEnv {
  firebase: { apiKey: string; authDomain: string; projectId: string; storageBucket: string; messagingSenderId: string; appId: string; measurementId?: string };
  functionsRegion: string; appCheckSiteKey?: string; aiTipsBaseUrl?: string; useFirebaseEmulators: boolean; amasPublicEnabled: boolean; amasReviewEnabled: boolean;
}

const read = (key: string): string | undefined => {
  const value = (import.meta.env as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const requiredFirebaseKeys = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_APP_ID'] as const;
export const missingFirebaseVariables = requiredFirebaseKeys.filter((key) => !read(key));
const enabled = (key: string): boolean => read(key) === 'true';
const firebase = { apiKey: read('VITE_FIREBASE_API_KEY') ?? '', authDomain: read('VITE_FIREBASE_AUTH_DOMAIN') ?? '', projectId: read('VITE_FIREBASE_PROJECT_ID') ?? '', storageBucket: read('VITE_FIREBASE_STORAGE_BUCKET') ?? '', messagingSenderId: read('VITE_FIREBASE_MESSAGING_SENDER_ID') ?? '', appId: read('VITE_FIREBASE_APP_ID') ?? '', measurementId: read('VITE_FIREBASE_MEASUREMENT_ID') };

export const appEnv: AppEnv = { firebase, functionsRegion: read('VITE_FIREBASE_FUNCTIONS_REGION') ?? 'us-central1', appCheckSiteKey: read('VITE_FIREBASE_APPCHECK_SITE_KEY'), aiTipsBaseUrl: read('VITE_AI_TIPS_BASE_URL'), useFirebaseEmulators: enabled('VITE_USE_FIREBASE_EMULATORS'), amasPublicEnabled: enabled('VITE_AMAS_PUBLIC_ENABLED'), amasReviewEnabled: enabled('VITE_AMAS_REVIEW_ENABLED') };
export const isFirebaseConfigured = missingFirebaseVariables.length === 0;
export const firebaseConfigurationMessage = isFirebaseConfigured ? undefined : `Falta la configuración de Firebase: ${missingFirebaseVariables.join(', ')}. Consulta .env.example y docs/FIREBASE_SETUP.md.`;
