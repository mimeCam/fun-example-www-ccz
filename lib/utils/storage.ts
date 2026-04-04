/**
 * Safe localStorage utilities with error handling.
 * Provides type-safe storage operations with graceful fallback.
 */

export type StorageSerializer<T> = (data: T) => string;
export type StorageDeserializer<T> = (data: string) => T;

const defaultSerializer = <T>(data: T): string => JSON.stringify(data);
const defaultDeserializer = <T>(data: string): T => JSON.parse(data);

/**
 * Safely get item from localStorage with error handling.
 *
 * @param key - Storage key
 * @param deserializer - Optional custom deserializer
 * @returns Parsed data or null if not found/error
 */
export function safeGetItem<T>(
  key: string,
  deserializer: StorageDeserializer<T> = defaultDeserializer
): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const item = localStorage.getItem(key);
    return item ? deserializer(item) : null;
  } catch (error) {
    console.warn(`Failed to get item from localStorage (key: ${key}):`, error);
    return null;
  }
}

/**
 * Safely set item in localStorage with error handling.
 *
 * @param key - Storage key
 * @param value - Value to store
 * @param serializer - Optional custom serializer
 * @returns true if successful, false otherwise
 */
export function safeSetItem<T>(
  key: string,
  value: T,
  serializer: StorageSerializer<T> = defaultSerializer
): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(key, serializer(value));
    return true;
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Consider clearing old notes.');
    } else {
      console.warn(`Failed to set item in localStorage (key: ${key}):`, error);
    }
    return false;
  }
}

/**
 * Safely remove item from localStorage.
 *
 * @param key - Storage key
 * @returns true if successful, false otherwise
 */
export function safeRemoveItem(key: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove item from localStorage (key: ${key}):`, error);
    return false;
  }
}

// TODO: Add session storage variants if needed
// TODO: Add compression for large data sets
