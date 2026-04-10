// src/lib/auth.ts
export const IN_TOKEN_KEY = "in-token";
export const IN_USER_KEY = "in-user";

export function getToken(): string {
  return localStorage.getItem(IN_TOKEN_KEY) || "";
}

export function isAuthed(): boolean {
  return !!getToken();
}

export function clearToken(): void {
  localStorage.removeItem(IN_TOKEN_KEY);
  localStorage.removeItem(IN_USER_KEY);
}

export function getStoredLoginPayload<T = any>(): T | null {
  try {
    const raw = localStorage.getItem(IN_USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
