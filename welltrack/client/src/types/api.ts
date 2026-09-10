// Shared request/response shapes matching the server's Prisma models and
// controllers (server/prisma/schema.prisma, server/src/services/*). Keep in
// sync by hand until a codegen step exists.

export interface User {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  createdAt: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface Symptom {
  id: string;
  userId: string | null;
  name: string;
  category: string;
  isActive: boolean;
}

export interface SymptomLog {
  id: string;
  userId: string;
  symptomId: string;
  severity: number;
  notes: string | null;
  loggedAt: string;
  createdAt: string;
}

export interface MoodLog {
  id: string;
  userId: string;
  moodScore: number;
  energyLevel: number | null;
  stressLevel: number | null;
  notes: string | null;
  loggedAt: string;
  createdAt: string;
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface MedicationLog {
  id: string;
  userId: string;
  medicationId: string;
  taken: boolean;
  takenAt: string | null;
  notes: string | null;
  createdAt: string;
}

export type TrackingType = "boolean" | "numeric" | "duration";

export interface Habit {
  id: string;
  userId: string | null;
  name: string;
  trackingType: TrackingType;
  unit: string | null;
  isActive: boolean;
}

export interface HabitLog {
  id: string;
  userId: string;
  habitId: string;
  valueBoolean: boolean | null;
  valueNumeric: number | null;
  valueDuration: number | null;
  notes: string | null;
  loggedAt: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
