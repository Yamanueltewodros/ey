// src/pages/policy/PolicyDetailsModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Policy, PolicyHolder } from "./PolicyRevealer";
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";

interface PolicyDetailsModalProps {
  selectedPolicy: Policy | null;
  onClose: () => void;
}

/** ✅ Make ANY value safe to render as text in JSX */
const toText = (v: any): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);

  if (Array.isArray(v)) {
    return (
      v
        .map((x) => {
          if (x == null) return "";
          if (typeof x === "string" || typeof x === "number" || typeof x === "boolean") return String(x);

          if (typeof x === "object") {
            return (
              (x as any).label ||
              (x as any).title ||
              (x as any).name ||
              (x as any).fullName ||
              (x as any).username ||
              (x as any).email ||
              (x as any).policy ||
              (x as any).id ||
              "[item]"
            );
          }

          return String(x);
        })
        .filter(Boolean)
        .join(", ") || "—"
    );
  }

  if (typeof v === "object") {
    if ("username" in v || "roles" in v || "position" in v || "branch" in v || "department" in v) {
      return (v as any).fullName || (v as any).name || (v as any).username || (v as any).email || (v as any).id || "—";
    }
    return (v as any).label || (v as any).title || (v as any).name || (v as any).value || (v as any).policy || (v as any).id || "—";
  }

  return String(v);
};

/** ✅ Customer-friendly field name map */
const FRIENDLY_LABELS: Record<string, string> = {
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

  // Your nested holder fields (example)
  "holder.firstName": "First Name",
  "holder.lastName": "Last Name",
  "holder.email": "Email",
  "holder.phoneNumber": "Phone",
  "holder.dateOfBirth": "Date of Birth",
  "holder.address": "Address",
  "holder.age": "Age",

  // manager
  "manager.id": "Agent ID",
  "manager.username": "Agent Username",
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

/** ---------- helpers ---------- */
const titleize = (s: string) =>
  s
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const isUUIDish = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export const PolicyDetailsModal: React.FC<PolicyDetailsModalProps> = ({ selectedPolicy, onClose }) => {
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [policyData, setPolicyData] = useState<Policy | null>(null);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    if (selectedPolicy) {
      setPolicyData(selectedPolicy);
      setDetailsError("");
      setDetailsLoading(false);
      setPdfError("");
    } else {
      setPolicyData(null);
      setDetailsError("");
      setDetailsLoading(false);
      setPdfError("");
    }
  }, [selectedPolicy]);

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

  const shortId = (id?: string) => (id && String(id).length > 8 ? `…${String(id).slice(-8)}` : toText(id));

  const holderNameFromObject = (holder?: PolicyHolder) =>
    holder ? `${holder.firstName || ""} ${holder.lastName || ""}`.trim() || "—" : "—";

  // ---------- Prefer flat fields, fallback to nested ----------
  const getPolicyNumber = (p: Policy | any): string => {
    const raw = p?.policy ?? p?.policyDetails?.policyNumber ?? p?.policyNumber ?? p?.number ?? p?.policy_no ?? shortId(p?.id);
    return toText(raw);
  };

  const getPolicyType = (p: Policy | any): string => toText(p?.type ?? p?.policyType ?? p?.policy_type ?? p?.productType ?? "—");

  const getPremium = (p: Policy | any): string => formatMoney(p?.premium ?? p?.price ?? p?.amount ?? p?.policyPremium);

  const getStartDate = (p: Policy | any): string =>
    formatDate(p?.start ?? p?.policyDetails?.policyEffectiveDate ?? p?.effectiveDate ?? p?.startDate ?? p?.policyStartDate ?? p?.inceptionDate);

  const getEndDate = (p: Policy | any): string =>
    formatDate(p?.end ?? p?.policyDetails?.policyExpirationDate ?? p?.expirationDate ?? p?.endDate ?? p?.policyEndDate ?? p?.expiryDate);

  const getStatus = (p: Policy | any): string => toText(p?.status ?? p?.policyDetails?.status ?? p?.policyStatus ?? p?.state ?? "—");

  const getHolderDisplay = (p: Policy | any): string => {
    if (p?.holder) {
      // could be string or object
      const h = p.holder;
      if (typeof h === "string") return h;
      const name = `${h?.firstName || ""} ${h?.lastName || ""}`.trim();
      return name || toText(h?.email || h?.phoneNumber || h?.id || "—");
    }
    if (p?.policyHolder) {
      const name = holderNameFromObject(p.policyHolder);
      if (name !== "—") return name;
      if ((p as any).policyHolder?.email) return (p as any).policyHolder.email;
    }
    return toText(p?.policyHolderName ?? p?.holderName ?? p?.customerName ?? p?.insuredName ?? "—");
  };

  const getManagerDisplay = (p: Policy | any): string => toText(p?.manager ?? p?.managedBy ?? p?.agent ?? p?.createdBy);

  const getPaymentPlan = (p: Policy | any): string =>
    toText(p?.payment ?? p?.paymentDetails?.paymentPlan ?? p?.paymentPlan ?? p?.payPlan ?? p?.plan ?? "—");

  const getAssetsCount = (p: Policy | any): string => {
    const v = p?.assets ?? p?.assetCount ?? p?.vehiclesCount ?? p?.itemsCount;
    if (v === null || v === undefined || v === "") return "—";
    return toText(v);
  };

  const statusBadgeClass = (statusRaw?: string) => {
    const s = String(statusRaw || "").toUpperCase();
    if (s.includes("DRAFT")) return "bg-amber-50 text-amber-700 border border-amber-200";
    if (s.includes("CANCEL")) return "bg-red-50 text-red-700 border border-red-200";
    if (s.includes("EXPIRE")) return "bg-slate-100 text-slate-700 border border-slate-200";
    if (s.includes("PEND")) return "bg-blue-50 text-blue-700 border border-blue-200";
    if (s.includes("ACTIVE") || s.includes("APPROV") || s.includes("PAID"))
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    return "bg-slate-50 text-slate-700 border border-slate-200";
  };

  const reservedKeys = useMemo(
    () =>
      new Set([
        "id",
        "policy",
        "type",
        "premium",
        "start",
        "end",
        "status",
        "holder",
        "manager",
        "payment",
        "assets",
        "cssClass",
        "policyTypeNames",
        "policyHolder",
        "policyDetails",
        "vehicleDetails",
        "paymentDetails",
      ]),
    []
  );

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

    // money-ish keys
    if (k.includes("premium") || k.includes("amount") || k.includes("price")) return formatMoney(value);

    // date-ish keys
    if (k.includes("date") || k.endsWith("start") || k.endsWith("end")) return formatDate(value);

    if (typeof value === "boolean") return value ? "Yes" : "No";

    if (typeof value === "string" && isUUIDish(value)) return `…${value.slice(-8)}`;

    if (Array.isArray(value)) return value.length ? value.map((x) => toText(x)).join(", ") : "—";
    return toText(value);
  };

  const allFields = useMemo(() => {
    if (!policyData) return [];
    const flat = flatten(policyData);

    const entries = Object.entries(flat)
      .filter(([k]) => !k.startsWith("_"))
      .filter(([k]) => {
        const root = k.split(".")[0];
        if (HIDDEN_ROOT_KEYS.has(root)) return false;
        if (HIDDEN_PATH_PARTS.some((p) => k.toLowerCase().includes(p.toLowerCase()))) return false;
        return true;
      })
      .sort(([a], [b]) => a.localeCompare(b));

    return entries.map(([k, v]) => ({
      key: FRIENDLY_LABELS[k] || k.replaceAll(".", " • "),
      value: v,
      rawKey: k,
    }));
  }, [policyData]);

  const additionalFields = useMemo(() => {
    if (!policyData) return [];
    const flat = flatten(policyData);

    const entries = Object.entries(flat)
      .filter(([k]) => !k.startsWith("_"))
      .filter(([k]) => {
        const root = k.split(".")[0];
        if (reservedKeys.has(root)) return false;
        if (HIDDEN_ROOT_KEYS.has(root)) return false;
        if (HIDDEN_PATH_PARTS.some((p) => k.toLowerCase().includes(p.toLowerCase()))) return false;
        return true;
      })
      .sort(([a], [b]) => a.localeCompare(b));

    return entries.map(([k, v]) => ({
      key: FRIENDLY_LABELS[k] || k.replaceAll(".", " • "),
      value: v,
      rawKey: k,
    }));
  }, [policyData, reservedKeys]);

  // =========================
  // ✅ Professional PDF generation (from React state only)
  // =========================
  const generatePolicyPdf = async () => {
    if (!policyData) return;

    setPdfLoading(true);
    setPdfError("");

    try {
      const data: any = policyData;

      // ---- group flattened keys into sections (instead of "holder • ...") ----
      const flat = flatten(data);
      const entries = Object.entries(flat)
        .filter(([k]) => !k.startsWith("_"))
        .filter(([k]) => {
          const root = k.split(".")[0];
          if (HIDDEN_ROOT_KEYS.has(root)) return false;
          if (HIDDEN_PATH_PARTS.some((p) => k.toLowerCase().includes(p.toLowerCase()))) return false;
          return true;
        });

      const groupTitle = (root: string) => {
        const r = root.toLowerCase();
        if (r === "holder" || r === "policyholder") return "Policy Holder";
        if (r === "manager" || r === "agent" || r === "assignedagent") return "Assigned Agent";
        if (r.includes("vehicle")) return "Vehicle Details";
        if (r.includes("payment")) return "Payment Details";
        if (r.includes("policydetails")) return "Policy Details";
        if (r.includes("assets") || r.includes("policyassets")) return "Assets / Covered Items";
        return titleize(root);
      };

      const labelFor = (path: string) => FRIENDLY_LABELS[path] || titleize(path.split(".").slice(1).join(" ").replaceAll(".", " "));

      // group map: section -> rows
      const sections = new Map<string, Array<[string, string]>>();

      const pushRow = (sectionName: string, label: string, value: string) => {
        if (!sections.has(sectionName)) sections.set(sectionName, []);
        sections.get(sectionName)!.push([label, value]);
      };

      for (const [path, value] of entries) {
        const root = path.split(".")[0];
        const sectionName = groupTitle(root);

        // More readable label inside a section
        const label =
          FRIENDLY_LABELS[path] ||
          FRIENDLY_LABELS[root] ||
          (path.includes(".") ? titleize(path.split(".").slice(1).join(" ")) : titleize(path));

        // Avoid repeating top-level summary fields inside sections too much
        // (We show them in the “Summary” box already)
        const lower = path.toLowerCase();
        const isSummaryDup =
          lower === "policy" ||
          lower === "type" ||
          lower === "premium" ||
          lower === "start" ||
          lower === "end" ||
          lower === "status";

        // Keep policy id in a footer/reference instead
        const isPolicyId = lower === "id" || lower === "policyid";

        if (isSummaryDup || isPolicyId) continue;

        pushRow(sectionName, labelFor(path), prettyValue(path, value));
      }

      // Summary values
      const policyNumber = getPolicyNumber(data);
      const policyType = getPolicyType(data);
      const status = getStatus(data);
      const premium = getPremium(data);
      const startDate = getStartDate(data);
      const endDate = getEndDate(data);
      const holder = getHolderDisplay(data);
      const manager = getManagerDisplay(data);
      const payment = getPaymentPlan(data);
      const assets = getAssetsCount(data);
      const ref = data?.id ? shortId(String(data.id)) : "—";

      // ---- Build PDF ----
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      const marginX = 40;
      const topY = 38;

      // Brand colors
      const navy = [15, 23, 42] as any; // slate-900
      const slate = [100, 116, 139] as any;
      const light = [241, 245, 249] as any;

      // Header band
      doc.setFillColor(navy[0], navy[1], navy[2]);
      doc.rect(0, 0, pageW, 92, "F");

      // Brand block (left)
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("BEZA INSURANCE", marginX, topY); // ✅ change name here

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Policy Schedule & Summary", marginX, topY + 18);
      doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, topY + 34);

      // Document title (right)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("INSURANCE POLICY DOCUMENT", pageW - marginX, topY, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Policy #: ${policyNumber}`, pageW - marginX, topY + 20, { align: "right" });
      doc.text(`${policyType}`, pageW - marginX, topY + 36, { align: "right" });

      // subtle watermark (optional)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(42);
      doc.setFont("helvetica", "bold");
      doc.text("POLICY", pageW / 2, 70, { align: "center", angle: 0 });

      // Reset text color
      doc.setTextColor(15, 23, 42);

      // Summary “cards” area
      let y = 112;

      // Helper to draw a small card
      const card = (x: number, y: number, w: number, h: number, label: string, value: string) => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, w, h, 8, 8, "FD");
        doc.setFont("helvetica", "normal");
        doc.setTextColor(slate[0], slate[1], slate[2]);
        doc.setFontSize(9);
        doc.text(label.toUpperCase(), x + 12, y + 18);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(value, x + 12, y + 38, { maxWidth: w - 24 });
      };

      const cardW = (pageW - marginX * 2 - 16) / 2;
      const cardH = 54;

      card(marginX, y, cardW, cardH, "Status", status);
      card(marginX + cardW + 16, y, cardW, cardH, "Premium", premium);

      y += cardH + 12;

      card(marginX, y, cardW, cardH, "Policy Holder", holder);
      card(marginX + cardW + 16, y, cardW, cardH, "Assigned Agent", manager);

      y += cardH + 12;

      card(marginX, y, cardW, cardH, "Start Date", startDate);
      card(marginX + cardW + 16, y, cardW, cardH, "End Date", endDate);

      y += cardH + 14;

      // Small strip
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y, pageW - marginX, y);
      y += 14;

      // Policy meta table (compact)
      autoTable(doc, {
        startY: y,
        theme: "plain",
        margin: { left: marginX, right: marginX },
        styles: { font: "helvetica", fontSize: 10, cellPadding: 2 },
        body: [
          ["Payment Plan:", payment],
          ["Assets Covered:", assets],
        ],
        columnStyles: {
          0: { cellWidth: 140, textColor: slate },
          1: { cellWidth: pageW - marginX * 2 - 140, textColor: [15, 23, 42] },
        },
        didParseCell: (d: any) => {
          if (d.section === "body" && d.column.index === 0) d.cell.styles.fontStyle = "bold";
        },
      });

      y = (doc as any).lastAutoTable.finalY + 18;

      // Sections (grouped)
      const sectionOrder = [
        "Policy Details",
        "Policy Holder",
        "Assigned Agent",
        "Vehicle Details",
        "Assets / Covered Items",
        "Payment Details",
      ];

      const allSectionNames = Array.from(sections.keys());
      const sortedSections = [
        ...sectionOrder.filter((s) => sections.has(s)),
        ...allSectionNames.filter((s) => !sectionOrder.includes(s)),
      ];

      for (const sec of sortedSections) {
        const rows = sections.get(sec) || [];
        if (!rows.length) continue;

        // Section title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(sec, marginX, y);

        // Section subtitle line
        doc.setDrawColor(226, 232, 240);
        doc.line(marginX, y + 6, pageW - marginX, y + 6);

        y += 14;

        // Table for section
        autoTable(doc, {
          startY: y,
          theme: "grid",
          margin: { left: marginX, right: marginX },
          head: [["Item", "Value"]],
          body: rows,
          styles: { font: "helvetica", fontSize: 9, cellPadding: 6, overflow: "linebreak" },
          headStyles: { fillColor: light, textColor: navy },
          columnStyles: {
            0: { cellWidth: 200 },
            1: { cellWidth: pageW - marginX * 2 - 200 },
          },
          didParseCell: (d: any) => {
            // soften grid a bit
            d.cell.styles.lineColor = [226, 232, 240];
          },
        });

        y = (doc as any).lastAutoTable.finalY + 16;
      }

      // Footer on each page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        doc.setDrawColor(226, 232, 240);
        doc.line(marginX, pageH - 52, pageW - marginX, pageH - 52);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(slate[0], slate[1], slate[2]);
        doc.text(`Policy reference: ${ref}`, marginX, pageH - 34);
        doc.text(`Page ${i} of ${totalPages}`, pageW - marginX, pageH - 34, { align: "right" });

        doc.setFontSize(8);
        doc.text(
          "This document is for customer reference. Coverage is subject to the full terms, conditions, exclusions, and endorsements of the issued policy.",
          marginX,
          pageH - 18,
          { maxWidth: pageW - marginX * 2 }
        );
      }

      // File name
      const safePolicyNumber = String(policyNumber || "policy").replace(/[^\w\-]+/g, "_");
      doc.save(`Policy_${safePolicyNumber}.pdf`);
    } catch (e: any) {
      setPdfError(toText(e?.message || e));
    } finally {
      setPdfLoading(false);
    }
  };

  if (!policyData && !detailsLoading && !detailsError) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200 relative">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Policy details</h2>
            {policyData && (
              <p className="text-xs text-slate-500 mt-0.5">
                Policy #{getPolicyNumber(policyData)} <span className="mx-1">•</span> {getPolicyType(policyData)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 max-h-[70vh] overflow-y-auto text-sm">
          {detailsLoading && <p className="text-sm text-slate-600">Loading policy details…</p>}

          {detailsError && !detailsLoading && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {toText(detailsError)}
            </div>
          )}

          {pdfError && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {toText(pdfError)}
            </div>
          )}

          {policyData && !detailsLoading && !detailsError && (
            <>
              {/* Top summary strip */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <SummaryCard label="Status">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(
                      getStatus(policyData)
                    )}`}
                  >
                    {getStatus(policyData)}
                  </span>
                </SummaryCard>

                <SummaryCard label="Premium">
                  <span className="text-sm text-slate-900">{getPremium(policyData)}</span>
                </SummaryCard>

                <SummaryCard label="Start date">
                  <span className="text-sm text-slate-900">{getStartDate(policyData)}</span>
                </SummaryCard>

                <SummaryCard label="End date">
                  <span className="text-sm text-slate-900">{getEndDate(policyData)}</span>
                </SummaryCard>

                <SummaryCard label="Holder">
                  <span className="text-sm text-slate-900 break-all">{getHolderDisplay(policyData)}</span>
                </SummaryCard>

                <SummaryCard label="Manager">
                  <span className="text-sm text-slate-900 break-all">{getManagerDisplay(policyData)}</span>
                </SummaryCard>

                <SummaryCard label="Payment">
                  <span className="text-sm text-slate-900">{getPaymentPlan(policyData)}</span>
                </SummaryCard>

                <SummaryCard label="Assets">
                  <span className="text-sm text-slate-900">{getAssetsCount(policyData)}</span>
                </SummaryCard>
              </div>

              {/* Full Details */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-slate-700 mb-2">Details</h3>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="max-h-[340px] overflow-y-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wide">Item</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wide">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allFields.map((row) => (
                          <tr key={row.rawKey} className="hover:bg-slate-50/60">
                            <td className="px-3 py-2 text-[11px] text-slate-600 whitespace-nowrap">{row.key}</td>
                            <td className="px-3 py-2 text-[11px] text-slate-800 break-words">{prettyValue(row.rawKey, row.value)}</td>
                          </tr>
                        ))}
                        {allFields.length === 0 && (
                          <tr>
                            <td colSpan={2} className="px-3 py-6 text-center text-slate-500">
                              No details available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Extra fields */}
              {additionalFields.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2">More information</h3>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    {additionalFields.slice(0, 24).map((row) => (
                      <InfoCell key={row.rawKey} label={row.key} value={prettyValue(row.rawKey, row.value)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Reference */}
              <div className="mt-5 border-t border-slate-100 pt-2">
                <p className="text-[10px] text-slate-400">
                  Policy reference:{" "}
                  <span className="font-mono">{(policyData as any).id ? shortId(String((policyData as any).id)) : "—"}</span>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
          <div className="text-[11px] text-slate-500">{pdfLoading ? "Preparing PDF…" : ""}</div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!policyData || pdfLoading}
              onClick={generatePolicyPdf}
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium border ${
                pdfLoading
                  ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
              title="Download policy PDF"
            >
              {pdfLoading ? "Downloading…" : "Download PDF"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function SummaryCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-md bg-slate-50 px-2 py-1 border border-slate-100">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-[11px] text-slate-800 break-words">{toText(value)}</p>
    </div>
  );
}
