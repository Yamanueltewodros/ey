// src/lib/policiesApi.ts
export async function fetchPolicyDetails(policyId: string) {
  const res = await fetch(`/api/policies/${policyId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to fetch policy details (${res.status})`);
  }

  const json = await res.json();
  return (json?.data ?? json) as any;
}