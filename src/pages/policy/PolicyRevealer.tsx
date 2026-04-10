// src/pages/policy/PolicyRevealer.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePolicyData } from "./PolicyRevealerHooks";
import { PolicyDetailsModal } from "./PolicyDetailsModal";

const API_BASE = "/api";
const IN_TOKEN_KEY = "in-token";

export type PolicyHolder = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
};

export type PolicyDetails = {
  policyNumber?: string;
  policyEffectiveDate?: string;
  policyExpirationDate?: string;
  status?: string;
};

export type VehicleDetails = {
  make?: string;
  model?: string;
  year?: number | string;
  licensePlate?: string;
  vin?: string;
};

export type PaymentDetails = {
  paymentMethod?: string;
  paymentPlan?: string;
  startDate?: string;
};

export type Policy = {
  id: string;

  // ✅ flat API fields (from your Postman/screenshot)
  policy?: any; // could be string OR object in some APIs
  type?: any;
  premium?: any;
  start?: any;
  end?: any;
  status?: any;
  assets?: any;
  holder?: any;
  manager?: any;
  payment?: any;

  policyTypeNames?: any;
  cssClass?: any;

  // ✅ older nested shape fallbacks
  policyHolder?: PolicyHolder;
  policyDetails?: PolicyDetails;
  vehicleDetails?: VehicleDetails;
  paymentDetails?: PaymentDetails;

  [key: string]: any;
};

/** ✅ Make ANY value safe to render as text in JSX */
const toText = (v: any): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
    return String(v);

  if (Array.isArray(v)) {
    return (
      v
        .map((x) => {
          if (x == null) return "";
          if (
            typeof x === "string" ||
            typeof x === "number" ||
            typeof x === "boolean"
          )
            return String(x);
          if (typeof x === "object")
            return (
              x.fullName ||
              x.name ||
              x.username ||
              x.email ||
              x.policy ||
              x.id ||
              "[object]"
            );
          return String(x);
        })
        .filter(Boolean)
        .join(", ") || "—"
    );
  }

  if (typeof v === "object") {
    return (
      v.fullName ||
      v.name ||
      v.username ||
      v.email ||
      v.policy ||
      v.id ||
      JSON.stringify(v)
    );
  }

  return String(v);
};

async function fetchJsonWithFallback(
  primaryUrl: string,
  fallbackUrl: string,
  init?: RequestInit
) {
  const tryFetch = async (url: string) => {
    const res = await fetch(url, init);
    const text = await res.text().catch(() => "");
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { res, text, json };
  };

  const a = await tryFetch(primaryUrl);
  if (a.res.ok) return a.json ?? {};

  if (a.res.status === 401 || a.res.status === 403) {
    const msg = a.text || `Unauthorized (${a.res.status})`;
    const err: any = new Error(msg);
    err.status = a.res.status;
    throw err;
  }

  const shouldFallback =
    a.res.status === 404 ||
    (a.res.status >= 500 &&
      (a.text || "").toLowerCase().includes("no static resource"));

  if (!shouldFallback) {
    const err: any = new Error(
      `Failed (${a.res.status})${a.text ? `: ${a.text}` : ""}`
    );
    err.status = a.res.status;
    throw err;
  }

  const b = await tryFetch(fallbackUrl);
  if (b.res.ok) return b.json ?? {};

  const err: any = new Error(
    `Failed (${b.res.status})${b.text ? `: ${b.text}` : ""}`
  );
  err.status = b.res.status;
  throw err;
}

export default function PolicyRevealer() {
  const navigate = useNavigate();
  const { policies, loading, error } = usePolicyData();
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [authError, setAuthError] = useState<string>("");

  const shortId = (id?: string) =>
    id && id.length > 8 ? `…${id.slice(-8)}` : id || "—";

  const formatDate = (value?: any) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return toText(value);
    return d.toLocaleDateString();
  };

  const formatMoney = (value?: any) => {
    if (value === null || value === undefined || value === "") return "—";
    const n = Number(value);
    if (Number.isNaN(n)) return toText(value);
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const holderNameFromObject = (holder?: PolicyHolder) =>
    holder
      ? `${holder.firstName || ""} ${holder.lastName || ""}`.trim() || "—"
      : "—";

  // ✅ MAIN-SUMMARY GETTERS (prefer flat API, fallback to old nested)
  const getPolicyNumber = (p: Policy | any): string => {
    const raw =
      p?.policy ?? // ✅ Postman/screenshot (could be string OR object)
      p?.policyDetails?.policyNumber ??
      p?.policyNumber ??
      p?.number ??
      p?.policy_no ??
      shortId(p?.id);

    return toText(raw);
  };

  const getType = (p: Policy | any): string => {
    const raw =
      p?.type ?? // ✅ Postman/screenshot
      p?.policyType ??
      p?.policy_type ??
      p?.productType ??
      "—";
    return toText(raw);
  };

  const getPremium = (p: Policy | any): string => {
    const raw = p?.premium ?? p?.price ?? p?.amount ?? p?.policyPremium;
    return formatMoney(raw);
  };

  const getStartDate = (p: Policy | any): string => {
    const raw =
      p?.start ?? // ✅ Postman/screenshot
      p?.policyDetails?.policyEffectiveDate ??
      p?.effectiveDate ??
      p?.startDate ??
      p?.policyStartDate ??
      p?.inceptionDate;
    return formatDate(raw);
  };

  const getEndDate = (p: Policy | any): string => {
    const raw =
      p?.end ?? // ✅ Postman/screenshot
      p?.policyDetails?.policyExpirationDate ??
      p?.expirationDate ??
      p?.endDate ??
      p?.policyEndDate ??
      p?.expiryDate;
    return formatDate(raw);
  };

  const getStatus = (p: Policy | any): string => {
    const raw =
      p?.status ?? // ✅ Postman/screenshot
      p?.policyDetails?.status ??
      p?.policyStatus ??
      p?.state ??
      "—";
    return toText(raw);
  };

  const getHolderDisplay = (p: Policy | any): string => {
    if (p?.holder) return toText(p.holder); // ✅ may be string OR object
    if (p?.policyHolder) {
      const name = holderNameFromObject(p.policyHolder);
      if (name !== "—") return name;
      if (p.policyHolder.email) return p.policyHolder.email;
    }
    const raw =
      p?.policyHolderName ??
      p?.holderName ??
      p?.customerName ??
      p?.insuredName ??
      "—";
    return toText(raw);
  };

  const statusBadgeClass = (statusRaw?: string) => {
    const s = String(statusRaw || "").toUpperCase();
    if (s.includes("DRAFT"))
      return "bg-amber-50 text-amber-700 border border-amber-200";
    if (s.includes("CANCEL"))
      return "bg-red-50 text-red-700 border border-red-200";
    if (s.includes("EXPIRE"))
      return "bg-slate-100 text-slate-700 border border-slate-200";
    if (s.includes("PEND"))
      return "bg-blue-50 text-blue-700 border border-blue-200";
    if (s.includes("ACTIVE") || s.includes("APPROV") || s.includes("PAID"))
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    return "bg-slate-50 text-slate-700 border border-slate-200";
  };

  // ✅ list-based fallback if no /{id} endpoints exist
  const fetchFromListAndFind = async (init: RequestInit, policyId: string) => {
    const urls = [
      `${API_BASE}/customer/policies`,
      `${API_BASE}/policies`,
      `${API_BASE}/customer/policies/`,
      `${API_BASE}/policies/`,
    ];

    for (const url of urls) {
      const res = await fetch(url, init);
      const text = await res.text().catch(() => "");
      if (!res.ok) continue;

      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      const list = Array.isArray(json) ? json : json?.items || json?.data || [];
      if (Array.isArray(list)) {
        const found = list.find((x: any) => String(x?.id) === String(policyId));
        if (found) return found as Policy;
      }
    }

    return null;
  };

  const handleViewDetails = async (policyId: string) => {
    try {
      setAuthError("");

      const token = localStorage.getItem(IN_TOKEN_KEY);
      if (!token) {
        setAuthError("You must be logged in to view policy details.");
        return;
      }

      const init: RequestInit = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      // Try /customer/policies/{id} then /policies/{id}
      let data: any = null;

      try {
        data = await fetchJsonWithFallback(
          `${API_BASE}/customer/policies/${policyId}`,
          `${API_BASE}/policies/${policyId}`,
          init
        );
      } catch (e: any) {
        // trailing slash variations
        try {
          data = await fetchJsonWithFallback(
            `${API_BASE}/customer/policies/${policyId}/`,
            `${API_BASE}/policies/${policyId}/`,
            init
          );
        } catch (e2: any) {
          // if both endpoints are missing, try list endpoints and find by id
          const found = await fetchFromListAndFind(init, policyId);
          if (!found) throw e2;
          data = found;
        }
      }

      let policy: Policy | null = null;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        policy = data as Policy;
      } else if (Array.isArray(data) && data.length > 0) {
        policy = data[0] as Policy;
      }

      if (!policy) throw new Error("No details found for this policy.");
      setSelectedPolicy(policy);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        setAuthError("Your session expired. Please login again.");
      } else {
        setAuthError(err?.message || "Error loading policy details.");
      }
    }
  };

  const totalPolicies = policies.length;

  return (
    <div className="container-prose py-10">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Policies</h1>
          <p className="mt-1 text-sm text-slate-600">
            Quick view (summary). Click “View details” to see full information.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Total policies:{" "}
            <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-white">
              {totalPolicies}
            </span>
          </span>

          <button
            type="button"
            onClick={() => navigate("/policies/new")}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            + Add Policy
          </button>
        </div>
      </div>

      {authError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {authError}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Loading your policies…
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {toText(error)}
        </div>
      )}

      {!loading && !error && policies.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-800">No policies found</p>
          <p className="mt-1 text-sm text-slate-500">
            When you purchase a policy, it will appear here.
          </p>
        </div>
      )}

      {!loading && !error && policies.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-slate-200">
            <p className="text-xs font-medium text-slate-700">
              Showing {policies.length} policy{policies.length === 1 ? "" : "ies"}
              .
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Policy #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Premium
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Start
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    End
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {policies.map((p: any) => {
                  const policyNumber = getPolicyNumber(p);
                  const type = getType(p);
                  const premium = getPremium(p);
                  const start = getStartDate(p);
                  const end = getEndDate(p);
                  const status = getStatus(p);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                        {policyNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800 whitespace-nowrap">
                        {type}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800 whitespace-nowrap">
                        {premium}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {start}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {end}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(p.id)}
                          className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>
              Showing <span className="font-medium">{policies.length}</span>{" "}
              policy{policies.length === 1 ? "" : "ies"}
            </span>

            <span className="hidden sm:inline">
              Click a row’s <span className="font-medium">View details</span> for
              full data.
            </span>
          </div>
        </div>
      )}

      <PolicyDetailsModal
        selectedPolicy={selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
      />
    </div>
  );
}
