import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import { isNativeApp } from "./native";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const NATIVE_STORAGE_PREFIX = "pitchnest_auth_";

let nativeStorageReady: Promise<void> | null = null;

async function prepareNativeStorage(): Promise<void> {
  if (!isNativeApp()) return;
  if (!nativeStorageReady) {
    nativeStorageReady = SecureStorage.setKeyPrefix(NATIVE_STORAGE_PREFIX);
  }
  await nativeStorageReady;
}

async function writeNativeSession(user: unknown, token: string): Promise<void> {
  try {
    await prepareNativeStorage();
    await Promise.all([
      SecureStorage.setItem(TOKEN_KEY, token),
      SecureStorage.setItem(USER_KEY, JSON.stringify(user)),
    ]);
  } catch (error) {
    console.error("Could not persist the native session securely:", error);
  }
}

/**
 * Hydrates localStorage from Android Keystore-backed storage before React
 * mounts. Existing code can keep its synchronous storage contract while the
 * long-lived native credential remains encrypted at rest.
 */
export async function hydrateNativeAuthSession(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    await prepareNativeStorage();
    const [token, user] = await Promise.all([
      SecureStorage.getItem(TOKEN_KEY),
      SecureStorage.getItem(USER_KEY),
    ]);
    if (token && user) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, user);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch (error) {
    // A corrupt/unavailable secure store must fail closed, never retain a stale
    // browser mirror that the user can no longer revoke reliably.
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    console.error("Could not restore the native session:", error);
  }
}

function storageAvailable(storage: Storage): boolean {
  try {
    const key = "__pn_storage_check__";
    storage.setItem(key, key);
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): string | null {
  try {
    return sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

/**
 * Keep ordinary sessions inside this browser tab. Only an explicit
 * "Keep me logged in" choice persists credentials after the browser closes.
 */
export function storeAuthSession(user: unknown, token: string, persistent = false): void {
  const target = persistent || isNativeApp() ? localStorage : sessionStorage;
  if (!storageAvailable(target)) throw new Error("Browser storage is unavailable");
  clearBrowserAuthSession();
  target.setItem(USER_KEY, JSON.stringify(user));
  target.setItem(TOKEN_KEY, token);
  if (isNativeApp()) void writeNativeSession(user, token);
}

export function updateStoredToken(token: string): void {
  try {
    const target = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
    target.setItem(TOKEN_KEY, token);
    if (isNativeApp()) {
      void prepareNativeStorage().then(() => SecureStorage.setItem(TOKEN_KEY, token)).catch(() => undefined);
    }
  } catch {
    // The in-memory context retains the refreshed token for this page.
  }
}

export function updateStoredUser(user: unknown): void {
  try {
    const target = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
    target.setItem(USER_KEY, JSON.stringify(user));
    if (isNativeApp()) {
      void prepareNativeStorage().then(() => SecureStorage.setItem(USER_KEY, JSON.stringify(user))).catch(() => undefined);
    }
  } catch {
    // The in-memory context remains authoritative for this page.
  }
}

function clearBrowserAuthSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {}
}

export function clearAuthSession(): void {
  clearBrowserAuthSession();
  if (isNativeApp()) {
    void prepareNativeStorage()
      .then(() => Promise.all([SecureStorage.removeItem(TOKEN_KEY), SecureStorage.removeItem(USER_KEY)]))
      .catch(() => undefined);
  }
}
