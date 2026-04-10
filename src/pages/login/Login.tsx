// src/pages/login/Login.tsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = "/api"; 
const IN_TOKEN_KEY = "in-token";
const IN_USER_KEY = "in-user";

type AnyObj = Record<string, any>;

type LoginResponse = AnyObj & {
  data?: AnyObj & { token?: string };
  token?: string; // fallback if backend returns token at root
};

function extractToken(payload: LoginResponse): string {
  return payload?.data?.token ?? payload?.token ?? "";
}

function extractRole(payload: LoginResponse): string {
  // Try common shapes; adjust later if your backend returns different keys
  return (
    payload?.data?.user?.role ??
    payload?.user?.role ??
    payload?.role ??
    ""
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // If RequireAuth redirected here, it usually sets location.state.from
  const fromPath =
    (location.state as any)?.from?.pathname ||
    "/profile"; // default landing page after login

  const [username, setUsername] = useState(""); // remove admin default so customers can use too
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      // try to read body safely (json or text)
      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const body = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        // if backend returns message string, show it
        const msg =
          typeof body === "string"
            ? body
            : body?.message || JSON.stringify(body);
        throw new Error(`Login failed (${res.status}): ${msg}`);
      }

      const data = body as LoginResponse;

      const token = extractToken(data);
      if (!token) throw new Error("No token returned from API.");

      // ✅ persist token
      localStorage.setItem(IN_TOKEN_KEY, token);

      // ✅ optionally store user payload (useful for role-based dashboards)
      localStorage.setItem(IN_USER_KEY, JSON.stringify(data));

      setSuccess("Login successful.");

      // ✅ Role-based redirect (optional)
      // If you want *all* roles to land on `fromPath`, comment this block out.
      const role = extractRole(data)?.toLowerCase();

      if (role.includes("customer")) {
        // example: customer dashboard route (change if yours differs)
        navigate("/customer", { replace: true });
      } else {
        // default: go back where user intended (protected route)
        navigate(fromPath, { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || "Error logging in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem-4rem)] bg-slate-50 flex items-center">
      <div className="container-prose">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
            <p className="mt-1 text-sm text-slate-600">
              Sign in with your account (Admin or Customer).
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Calls{" "}
            <code className="font-mono text-[10px]">POST /api/auth/login</code>{" "}
            and stores the JWT in{" "}
            <code className="font-mono text-[10px]">
              localStorage["{IN_TOKEN_KEY}"]
            </code>.
          </p>
        </div>
      </div>
    </div>
  );
}
