// src/pages/claims/ClaimTrack.tsx
import { useEffect, useMemo, useState } from "react";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";

const API_BASE = "/api";
const IN_TOKEN_KEY = "in-token";

type ClaimType = "car" | "home" | "life" | "marine-cargo";

type Claim = {
  id: string;
  claimNumber?: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
  claimDate?: string;
  claimType?: string;
  policyTypeId?: string;
  policyId?: string;
  policy?: any;
  description?: string;
  claimAmount?: number;
  [key: string]: any;
};

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text().catch(() => "");
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const err: any = new Error(
      json?.error || json?.message || text || `Request failed (${res.status})`
    );
    err.status = res.status;
    throw err;
  }
  return json;
}

function extractArray<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data;
  const candidates = [data?.data, data?.content, data?.items, data?.results];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

function formatDate(s?: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString();
}

export default function ClaimTrack() {
  const [type, setType] = useState<ClaimType>("car");

  const [query, setQuery] = useState(""); // claim id OR claimNumber
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Postman-aligned: customer claims list
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);

  const [result, setResult] = useState<Claim | null>(null);

  const token = localStorage.getItem(IN_TOKEN_KEY);

  const typeLabel = useMemo(() => {
    if (type === "marine-cargo") return "Marine Cargo";
    return type.charAt(0).toUpperCase() + type.slice(1);
  }, [type]);

  // ✅ Load claims once (better UX + fewer API calls)
  useEffect(() => {
    const loadClaims = async () => {
      setError("");
      setLoadingClaims(true);

      if (!token) {
        setClaims([]);
        setLoadingClaims(false);
        return;
      }

      try {
        const init: RequestInit = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        // Postman: GET /api/customer/claims
        const data = await fetchJson(`${API_BASE}/customer/claims`, init);
        const list = extractArray<Claim>(data);
        setClaims(list);
      } catch (e: any) {
        setClaims([]);
        // don't spam errors on mount; only show if user tries to search
      } finally {
        setLoadingClaims(false);
      }
    };

    loadClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!token) {
      setError("You must be logged in to track claims (customer claims are account-based).");
      return;
    }

    if (!query.trim()) {
      setError("Enter a Claim ID (or Claim Number if your backend returns one).");
      return;
    }

    const q = query.trim().toLowerCase();

    // ✅ Search locally first (fast)
    let found =
      claims.find((c) => (c.id || "").toLowerCase() === q) ||
      claims.find((c) => (c.claimNumber || "").toLowerCase() === q);

    if (found) {
      setResult(found);
      return;
    }

    // ✅ If not found, refetch once then try again (covers “newly submitted” claims)
    setLoading(true);
    try {
      const init: RequestInit = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const data = await fetchJson(`${API_BASE}/customer/claims`, init);
      const list = extractArray<Claim>(data);
      setClaims(list);

      found =
        list.find((c) => (c.id || "").toLowerCase() === q) ||
        list.find((c) => (c.claimNumber || "").toLowerCase() === q);

      if (!found) {
        setError("No claim found under your account with that reference.");
        return;
      }

      setResult(found);
    } catch (err: any) {
      setError(err?.message || "Failed to load your claims.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-prose section space-y-6">
      <div>
        <h1 className="h2 mb-1">Track Claim</h1>
        <p className="p text-slate-600">
          Aligned to backend: this reads <span className="font-mono">GET /api/customer/claims</span> and finds a claim by{" "}
          <strong>Claim ID</strong> (or Claim Number if your API returns one).
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Form */}
        <div className="lg:col-span-7">
          <Card className="max-w-xl">
            <CardBody>
              <form className="space-y-5" onSubmit={handleCheck}>
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900 text-sm">Claim reference</h2>
                    <span className="text-xs text-slate-500">
                      {token ? (loadingClaims ? "Loading…" : `${claims.length} claim(s) loaded`) : "Not logged in"}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm">Product (UI only)</span>
                      <Select className="mt-1" value={type} onChange={(e) => setType(e.target.value as ClaimType)}>
                        <option value="car">Car Insurance</option>
                        <option value="home">Home Insurance</option>
                        <option value="life">Life Insurance</option>
                        <option value="marine-cargo">Marine Cargo Insurance</option>
                      </Select>
                      <p className="mt-1 text-xs text-slate-500">
                        Claim tracking is account-based; product is just a UI filter label.
                      </p>
                    </label>

                    <label className="block">
                      <span className="text-sm">Claim ID / Claim Number</span>
                      <Input
                        className="mt-1"
                        placeholder="Paste claim id (UUID) or claim number"
                        value={query}
                        onChange={(e: any) => setQuery(e.target.value)}
                        required
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Tracking uses your logged-in account (no DOB/last-name verification endpoint in Postman).
                      </p>
                    </label>
                  </div>
                </section>

                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Uses <span className="font-mono">GET /api/customer/claims</span>.
                  </p>
                  <Button variant="primary" type="submit" full={false} disabled={loading || loadingClaims}>
                    {loading ? "Checking…" : "Check status"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Result */}
        <div className="lg:col-span-5">
          <Card className="lg:sticky lg:top-24">
            <CardBody>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900 text-sm">Claim status</h2>
                <Badge className="bg-slate-100">Read-only</Badge>
              </div>

              {!result ? (
                <p className="text-sm text-slate-600">
                  Enter your claim reference to see the claim that exists under your account.
                </p>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Status</span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                      {result.status || "Submitted"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Last update</span>
                    <span>{formatDate(result.updatedAt || result.createdAt)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Product</span>
                    <span>{typeLabel}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Claim date</span>
                    <span>{formatDate(result.claimDate)}</span>
                  </div>

                  {typeof result.claimAmount === "number" && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Amount</span>
                      <span>{result.claimAmount}</span>
                    </div>
                  )}

                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-slate-700 font-medium mb-1">Description</p>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{result.description || "—"}</p>
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-slate-700 font-medium mb-1">Reference</p>
                    <p className="text-xs text-slate-500 font-mono break-all">{result.claimNumber || result.id}</p>
                  </div>

                  {(result.policyId || result.policyTypeId) && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="text-slate-700 font-medium mb-1">Policy reference</p>
                      <p className="text-xs text-slate-500 font-mono break-all">
                        {result.policyId || result.policyTypeId}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
