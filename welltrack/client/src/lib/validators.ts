// Mirrors server/src/validators/auth.validators.ts so the UI can show
// immediate feedback; the server remains the source of truth.

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 72) return "Password must be 72 characters or fewer";
  if (!/[A-Za-z]/.test(password)) return "Password must contain at least one letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return undefined;
}

export function validateDisplayName(displayName: string): string | undefined {
  if (!displayName.trim()) return "Display name is required";
  if (displayName.length > 100) return "Display name must be 100 characters or fewer";
  return undefined;
}
