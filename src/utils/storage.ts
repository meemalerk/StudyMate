import AsyncStorage from '@react-native-async-storage/async-storage';

/** Loads and JSON-parses a persisted value. Returns null on any failure (missing key,
 * corrupt data, storage error) so callers can fall back to their defaults. */
export async function loadJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Best-effort persistence — failures (e.g. storage full) are swallowed since losing a
 * write shouldn't crash the app; the in-memory state remains the source of truth. */
export async function saveJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore.
  }
}
