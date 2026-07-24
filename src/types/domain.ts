import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'patient' | 'psychologist' | 'professional_reviewer' | 'admin' | 'owner';
export type LocaleCode = 'es' | 'en' | 'fr' | 'pt' | 'it' | 'de' | 'zh';
export type LicenseStatus = 'public_domain' | 'review_only' | 'license_pending' | 'license_confirmed' | 'expired' | 'blocked';
export type AccessMode = 'public' | 'authenticated' | 'reviewer_allowlist' | 'entitlement_required';

export interface ProfessionalProfile {
  headline?: string;
  specialties: string[];
  languages: LocaleCode[];
  modalities: string[];
  priceMXN?: number;
  sessionMinutes?: number;
  isPublicPhone: boolean;
  isPublicLocation: boolean;
  availability: Record<string, string[]>;
  isVerified: boolean;
  acceptingNewPatients: boolean;
  licenseNumber?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface UserProfile {
  uid: string;
  email?: string;
  role: UserRole;
  name: string;
  photoUrl?: string;
  phone?: string;
  lang: LocaleCode;
  dob?: Timestamp;
  gender?: string;
  country?: string;
  state?: string;
  city?: string;
  timeZone?: string;
  termsAccepted: boolean;
  termsAcceptedAt?: Timestamp;
  termsVersion?: string;
  consents: { analyticsAnon: boolean; reminders: boolean; email: boolean; push: boolean };
  patientPrefs: { modalities: string[]; motives: string[]; hours: string[] };
  professional?: ProfessionalProfile;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface LocalizedText { es: string; en?: string; [locale: string]: string | undefined }
export interface TestOption { id: string; labelKey?: string; label?: string; value?: number; image?: string; score?: number }
export interface TestQuestion {
  id: string;
  promptKey?: string;
  prompt?: string;
  type?: string;
  required?: boolean;
  options: TestOption[];
  scores?: { scale: string; mapping?: string }[];
  scoresMatrix?: Record<string, number[]>;
  imageQuestion?: string;
  optionImages?: string[];
}
export interface ResultRange { min: number; max: number; label: string; color?: string; advice?: string; labelKey?: string; adviceKey?: string; id?: string; minInclusive?: number; maxInclusive?: number }
export interface TestScale { id: string; title: string; method?: string }
export interface PsychologicalTest {
  id: string; slug?: string; version?: string; locale?: LocaleCode;
  algorithmVersion?: string; contentVersion?: string;
  titleKey?: string; descriptionKey?: string; title?: string; description?: string;
  estimatedMinutes: number; questionCount?: number; questions: TestQuestion[];
  scales?: TestScale[]; resultBands?: ResultRange[]; results?: { scales: { id: string; ranges: ResultRange[] }[] };
  allowBackNavigation?: boolean; timeLimitSec?: number; shuffleQuestions?: boolean;
  group?: string; category?: string; subcategory?: string; tags?: string[];
  licenseStatus?: LicenseStatus; accessMode?: AccessMode; payloadAvailable?: boolean;
}
export interface ScaleResult { scaleId: string; score: number; range?: ResultRange }
export interface TestRunResult {
  id: string; testId: string; instrumentId: string; instrumentVersion: string; algorithmVersion: string; contentVersion: string; slug?: string; version?: string; locale?: LocaleCode;
  title?: string; answers: Record<string, string>; totalScore: number; bandId?: string;
  responses: Record<string, string>; scaleTotals: Record<string, number>; interpretation?: string; scales?: ScaleResult[]; completedAt: string; userId?: string; advice?: string;
}
export type AppointmentStatus = 'pending' | 'accepted' | 'declined' | 'counter_proposed' | 'cancelled';
export interface Appointment { id: string; patientId: string; psychologistId: string; participantIds: string[]; status: AppointmentStatus; startTime?: Timestamp; proposedStartTime?: Timestamp; timezone: string; notes?: string; createdAt?: Timestamp; updatedAt?: Timestamp }
export interface ChatMessage { id: string; appointmentId: string; senderId: string; participantIds: string[]; text: string; createdAt?: Timestamp }
