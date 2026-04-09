/**
 * Generate a unique identifier for highlights and notes.
 * Uses crypto.randomUUID() when available, falls back to timestamp-based approach.
 *
 * @returns A unique ID string
 */
export function generateId(): string {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: timestamp + random string
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}

