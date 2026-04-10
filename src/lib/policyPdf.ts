// src/lib/policyPdf.ts
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";

const toText = (v: any): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);

  if (Array.isArray(v)) {
    return (
      v
        .map((x) => {
          if (x == null) return "";
          if (typeof x === "string" || typeof x === "number" || typeof x === "boolean") return String(x);
          if (typeof x === "object")
            return (
              x.label || x.title || x.name || x.fullName || x.username || x.email || x.policy || x.id || "[item]"
            );
          return String(x);
        })
        .filter(Boolean)
        .join(", ") || "—"
    );
  }

  if (typeof v === "object") {
    if ("username" in v || "roles" in v || "position" in v || "branch" in v || "department" in v) {
      return v.fullName || v.name || v.username || v.email || v.id || "—";
    }
    return v.label || v.title || v.name || v.value || v.policy || v.id || "—";
  }

  return String(v);
};

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
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const shortId = (id?: string) =>
  id && String(id).length > 8 ? `…${String(id).slice(-8)}` : toText(id);

// ✅ Put your same label map here (add more anytime)
export const FRIENDLY_LABELS: Record<string, string> = {
  id: "Policy ID",
  policy: "Policy Number",
  type: "Policy Type",
  premium: "Premium",
  start: "Start Date",
  end: "End Date",
  status: "Status",
  holder: "Policy Holder",
  manager: "Assigned Agent",
  payment: "Payment Plan",
  assets: "Assets Covered",

  "policyDetails.policyNumber": "Policy Number",
  "policyDetails.policyEffectiveDate": "Start Date",
  "policyDetails.policyExpirationDate": "End Date",
  "policyDetails.status": "Status",

  "policyHolder.firstName": "First Name",
  "policyHolder.lastName": "Last Name",
  "policyHolder.email": "Email",
  "policyHolder.phone": "Phone",
  "policyHolder.dateOfBirth": "Date of Birth",

  "vehicleDetails.make": "Vehicle Make",
  "vehicleDetails.model": "Vehicle Model",
  "vehicleDetails.year": "Vehicle Year",
  "vehicleDetails.licensePlate": "License Plate",
  "vehicleDetails.vin": "VIN",

  "paymentDetails.paymentMethod": "Payment Method",
  "paymentDetails.paymentPlan": "Payment Plan",
  "paymentDetails.startDate": "Payment Start Date",
};

const HIDDEN_ROOT_KEYS = new Set<string>([
  "createdBy",
  "createdAt",
  "updatedAt",
  "updatedBy",
  "roles",
  "branch",
  "department",
  "position",
  "cssClass",
  "policyTypeNames",
]);

const HIDDEN_PATH_PARTS = ["createdBy", "createdAt", "updatedAt", "updatedBy", "roles", "branch", "department", "position"];

const flatten = (obj: any, prefix = "", out: Record<string, any> = {}) => {
  if (!obj || typeof obj !== "object") return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out[key] = v;
    }
  }
  return out;
};

const prettyValue = (key: string, value: any) => {
  if (value === null || value === undefined || value === "") return "—";
  const k = key.toLowerCase();

  if (k.includes("premium") || k.includes("amount") || k.includes("price")) return formatMoney(value);
  if (k.includes("date") || k.endsWith("start") || k.endsWith("end")) return formatDate(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.map((x) => toText(x)).join(", ") : "—";

  return toText(value);
};

// ---------- Summary helpers (same logic you used) ----------
const getPolicyNumber = (p: any): string => {
  const raw = p?.policy ?? p?.policyDetails?.policyNumber ?? p?.policyNumber ?? p?.number ?? p?.policy_no ?? shortId(p?.id);
  return toText(raw);
};
const getPolicyType = (p: any): string => toText(p?.type ?? p?.policyType ?? p?.policy_type ?? p?.productType ?? "—");
const getPremium = (p: any): string => formatMoney(p?.premium ?? p?.price ?? p?.amount ?? p?.policyPremium);
const getStartDate = (p: any): string =>
  formatDate(p?.start ?? p?.policyDetails?.policyEffectiveDate ?? p?.effectiveDate ?? p?.startDate ?? p?.policyStartDate ?? p?.inceptionDate);
const getEndDate = (p: any): string =>
  formatDate(p?.end ?? p?.policyDetails?.policyExpirationDate ?? p?.expirationDate ?? p?.endDate ?? p?.policyEndDate ?? p?.expiryDate);
const getStatus = (p: any): string => toText(p?.status ?? p?.policyDetails?.status ?? p?.policyStatus ?? p?.state ?? "—");

const holderNameFromObject = (holder?: any) =>
  holder ? `${holder.firstName || ""} ${holder.lastName || ""}`.trim() || "—" : "—";

const getHolderDisplay = (p: any): string => {
  if (p?.holder) return toText(p.holder);
  if (p?.policyHolder) {
    const name = holderNameFromObject(p.policyHolder);
    if (name !== "—") return name;
    if (p.policyHolder.email) return p.policyHolder.email;
  }
  const raw = p?.policyHolderName ?? p?.holderName ?? p?.customerName ?? p?.insuredName ?? "—";
  return toText(raw);
};

const getManagerDisplay = (p: any): string => toText(p?.manager ?? p?.managedBy ?? p?.agent ?? p?.createdBy);
const getPaymentPlan = (p: any): string =>
  toText(p?.payment ?? p?.paymentDetails?.paymentPlan ?? p?.paymentPlan ?? p?.payPlan ?? p?.plan ?? "—");
const getAssetsCount = (p: any): string => {
  const v = p?.assets ?? p?.assetCount ?? p?.vehiclesCount ?? p?.itemsCount;
  if (v === null || v === undefined || v === "") return "—";
  return toText(v);
};

// ✅ Main export
export function generatePolicyPdfFromData(policy: any, opts?: { companyName?: string }) {
  if (!policy) throw new Error("No policy data found for PDF generation.");

  const companyName = opts?.companyName || "Insurance Company";

  // Prepare table rows
  const flat = flatten(policy);

  const rows = Object.entries(flat)
    .filter(([k]) => !k.startsWith("_"))
    .filter(([k]) => {
      const root = k.split(".")[0];
      if (HIDDEN_ROOT_KEYS.has(root)) return false;
      if (HIDDEN_PATH_PARTS.some((p) => k.toLowerCase().includes(p.toLowerCase()))) return false;
      return true;
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => {
      const label = FRIENDLY_LABELS[k] || k.replaceAll(".", " • ");
      return [label, prettyValue(k, v)];
    });

  // Summary values
  const policyNumber = getPolicyNumber(policy);
  const policyType = getPolicyType(policy);
  const status = getStatus(policy);
  const premium = getPremium(policy);
  const startDate = getStartDate(policy);
  const endDate = getEndDate(policy);
  const holder = getHolderDisplay(policy);
  const manager = getManagerDisplay(policy);
  const payment = getPaymentPlan(policy);
  const assets = getAssetsCount(policy);
  const ref = policy?.id ? shortId(String(policy.id)) : "—";

  // PDF
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 40;

  // Header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 76, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INSURANCE POLICY SUMMARY", marginX, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(companyName, marginX, 50);
  doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, 65);

  // Right header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Policy #: ${policyNumber}`, pageW - marginX, 30, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`${policyType}`, pageW - marginX, 47, { align: "right" });

  let y = 92;

  // Summary table (clean, professional)
  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [["Key", "Value"]],
    body: [
      ["Status", status],
      ["Premium", premium],
      ["Start Date", startDate],
      ["End Date", endDate],
      ["Policy Holder", holder],
      ["Assigned Agent", manager],
      ["Payment Plan", payment],
      ["Assets Covered", assets],
    ],
    styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
    columnStyles: {
      0: { cellWidth: 160 },
      1: { cellWidth: pageW - marginX * 2 - 160 },
    },
    margin: { left: marginX, right: marginX },
  });

  y = (doc as any).lastAutoTable.finalY + 16;

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Policy Details", marginX, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    theme: "striped",
    head: [["Item", "Value"]],
    body: rows.length ? rows : [["No details available.", "—"]],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 5, overflow: "linebreak" },
    headStyles: { fillColor: [248, 250, 252], textColor: [51, 65, 85] },
    columnStyles: {
      0: { cellWidth: 210 },
      1: { cellWidth: pageW - marginX * 2 - 210 },
    },
    margin: { left: marginX, right: marginX },
  });

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageH - 46, pageW - marginX, pageH - 46);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Policy reference: ${ref}`, marginX, pageH - 28);
    doc.text(`Page ${i} of ${totalPages}`, pageW - marginX, pageH - 28, { align: "right" });

    doc.setFontSize(8);
    doc.text(
      "This document is provided for informational purposes. Coverage is subject to the terms, conditions, and exclusions of the issued policy.",
      marginX,
      pageH - 14
    );
  }

  const safeName = String(policyNumber || "policy").replace(/[^\w\-]+/g, "_");
  doc.save(`Policy_${safeName}.pdf`);
}
