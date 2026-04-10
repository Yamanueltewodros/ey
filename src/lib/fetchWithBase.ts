const API_BASE = (import.meta.env.PROD ? import.meta.env.VITE_API_BASE : "") || "";

export function patchFetch() {
  if (!API_BASE) return; // Local dev -> keep normal /api proxy

  const originalFetch = window.fetch;

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/api")) {
      input = API_BASE + input;
    }
    return originalFetch(input, init);
  };
}