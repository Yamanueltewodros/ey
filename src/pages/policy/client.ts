/**
 * api/client.ts
 * ─────────────────────────────────────────────────────────────
 * Central HTTP client. All API calls go through here.
 * - One place to change the base URL
 * - One place to change the auth token key
 * - One place to change how responses are parsed
 */

export const API_BASE = "/api";
export const TOKEN_KEY = "in-token";

// ─── Auth ────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function buildHeaders(): Record<string, string> {
  const token = getToken();
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Response parsers ────────────────────────────────────────

/** Parses a list response. Handles: T[] | { data } | { content } | { items } */
export async function parseList<T>(res: Response): Promise<T[]> {
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})${text ? `: ${text}` : ""}`);
  }

  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (Array.isArray(json)) return json as T[];
  if (Array.isArray(json?.data)) return json.data as T[];
  if (Array.isArray(json?.content)) return json.content as T[];
  if (Array.isArray(json?.items)) return json.items as T[];
  if (Array.isArray(json?.results)) return json.results as T[];
  return [];
}

/** Parses a single-item response. */
export async function parseItem<T>(res: Response): Promise<T | null> {
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})${text ? `: ${text}` : ""}`);
  }

  try {
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

// ─── Core fetch helpers ──────────────────────────────────────

/** GET request returning a list */
export async function getList<T>(path: string): Promise<T[]> {
  const res = await fetch(`${API_BASE}${path}`, { headers: buildHeaders() });
  return parseList<T>(res);
}

/** GET request returning a single item */
export async function getItem<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_BASE}${path}`, { headers: buildHeaders() });
  return parseItem<T>(res);
}

/** POST request */
export async function post<T>(path: string, body: unknown): Promise<T | null> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  return parseItem<T>(res);
}

/**
 * GET with primary + fallback URL.
 * Used by PolicyRevealer where the exact endpoint is uncertain.
 */
export async function getWithFallback<T>(
  primaryPath: string,
  fallbackPath: string
): Promise<T> {
  const tryFetch = async (path: string) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: buildHeaders() });
    const text = await res.text().catch(() => "");
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return { ok: res.ok, status: res.status, text, json };
  };

  const primary = await tryFetch(primaryPath);

  if (primary.ok) return primary.json ?? ({} as T);

  if (primary.status === 401 || primary.status === 403) {
    const err: any = new Error(primary.text || `Unauthorized (${primary.status})`);
    err.status = primary.status;
    throw err;
  }

  const shouldFallback =
    primary.status === 404 ||
    (primary.status >= 500 && (primary.text || "").toLowerCase().includes("no static resource"));

  if (!shouldFallback) {
    const err: any = new Error(`Failed (${primary.status})${primary.text ? `: ${primary.text}` : ""}`);
    err.status = primary.status;
    throw err;
  }

  const fallback = await tryFetch(fallbackPath);
  if (fallback.ok) return fallback.json ?? ({} as T);

  const err: any = new Error(`Failed (${fallback.status})${fallback.text ? `: ${fallback.text}` : ""}`);
  err.status = fallback.status;
  throw err;
}
