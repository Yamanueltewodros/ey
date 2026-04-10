// src/utils/PolicyPDFGeneratorClient.tsx
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Policy } from "./PolicyRevealer";

/**
 * Client-side PDF generator for insurance policies
 * No backend required - generates PDFs directly in the browser
 */
export class PolicyPDFGeneratorClient {
  private policy: Policy;
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;

  constructor(policy: Policy) {
    this.policy = policy;
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Format values for display
   */
  private formatValue(value: any, type: "text" | "money" | "date" = "text"): string {
    if (value === null || value === undefined || value === "" || value === "—") {
      return "—";
    }

    if (type === "money") {
      try {
        const num = parseFloat(String(value).replace(/[^0-9.-]/g, ""));
        if (!isNaN(num)) {
          return `$${num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        }
      } catch (e) {
        return String(value);
      }
    }

    if (type === "date") {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
      } catch (e) {
        return String(value);
      }
    }

    return String(value);
  }

  /**
   * Extract policy data with fallbacks
   */
  private getPolicyNumber(): string {
    return this.formatValue(
      this.policy.policy ||
        this.policy.id ||
        "N/A"
    );
  }

  private getPolicyType(): string {
    return this.formatValue(this.policy.type || "—");
  }

  private getStatus(): string {
    return this.formatValue(this.policy.status || "—");
  }

  private getPremium(): string {
    return this.formatValue(this.policy.premium, "money");
  }

  private getStartDate(): string {
    return this.formatValue(this.policy.start, "date");
  }

  private getEndDate(): string {
    return this.formatValue(this.policy.end, "date");
  }

  private getPaymentPlan(): string {
    return this.formatValue(this.policy.payment || "—");
  }

  private getHolderInfo(): any {
    if (typeof this.policy.holder === "string") {
      return { name: this.policy.holder };
    }
    if (typeof this.policy.holder === "object" && this.policy.holder) {
      const h = this.policy.holder as any;
      return {
        name: `${h.firstName || ""} ${h.lastName || ""}`.trim() || "—",
        email: h.email || "—",
        phone: h.phone || "—",
        dob: this.formatValue(h.dateOfBirth, "date"),
      };
    }
    return { name: "—" };
  }

  /**
   * Get status color based on status value
   */
  private getStatusColor(status: string): [number, number, number] {
    const s = status.toUpperCase();
    if (s.includes("ACTIVE") || s.includes("APPROV") || s.includes("PAID"))
      return [16, 185, 129]; // Green
    if (s.includes("PEND")) return [59, 130, 246]; // Blue
    if (s.includes("CANCEL")) return [239, 68, 68]; // Red
    if (s.includes("EXPIRE")) return [100, 116, 139]; // Gray
    if (s.includes("DRAFT")) return [245, 158, 11]; // Amber
    return [100, 116, 139]; // Default gray
  }

  /**
   * Add header section
   */
  private addHeader(): void {
    // Company name / Logo area
    this.doc.setFillColor(30, 64, 175); // Blue background
    this.doc.rect(0, 0, this.pageWidth, 25, "F");

    // Title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("INSURANCE POLICY DOCUMENT", this.pageWidth / 2, 12, {
      align: "center",
    });

    // Policy number
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(
      `Policy Number: ${this.getPolicyNumber()}`,
      this.pageWidth / 2,
      19,
      { align: "center" }
    );

    this.currentY = 35;
  }

  /**
   * Add section header
   */
  private addSectionHeader(title: string): void {
    this.checkPageBreak(15);

    this.doc.setFillColor(248, 250, 252); // Light gray background
    this.doc.rect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      8,
      "F"
    );

    this.doc.setTextColor(15, 23, 42);
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, this.margin + 3, this.currentY + 5.5);

    this.currentY += 12;
  }

  /**
   * Check if we need a page break
   */
  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  /**
   * Add policy summary section
   */
  private addSummarySection(): void {
    this.addSectionHeader("Policy Summary");

    const status = this.getStatus();
    const statusColor = this.getStatusColor(status);

    const summaryData = [
      ["Policy Type", this.getPolicyType()],
      ["Status", status],
      ["Premium Amount", this.getPremium()],
      ["Effective Date", this.getStartDate()],
      ["Expiration Date", this.getEndDate()],
      ["Payment Plan", this.getPaymentPlan()],
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [],
      body: summaryData,
      margin: { left: this.margin, right: this.margin },
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      columnStyles: {
        0: {
          fontStyle: "bold",
          fillColor: [248, 250, 252],
          textColor: [100, 116, 139],
          cellWidth: 60,
        },
        1: {
          textColor: [15, 23, 42],
        },
      },
      didParseCell: (data) => {
        // Color the status cell
        if (data.row.index === 1 && data.column.index === 1) {
          data.cell.styles.textColor = statusColor;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Add policy holder section
   */
  private addHolderSection(): void {
    this.addSectionHeader("Policy Holder Information");

    const holder = this.getHolderInfo();
    const holderData = [
      ["Name", holder.name || "—"],
      ["Email", holder.email || "—"],
      ["Phone", holder.phone || "—"],
      ["Date of Birth", holder.dob || "—"],
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [],
      body: holderData,
      margin: { left: this.margin, right: this.margin },
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      columnStyles: {
        0: {
          fontStyle: "bold",
          fillColor: [248, 250, 252],
          textColor: [100, 116, 139],
          cellWidth: 60,
        },
        1: {
          textColor: [15, 23, 42],
        },
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Add coverage details section
   */
  private addCoverageSection(): void {
    this.addSectionHeader("Coverage Details");

    // Get additional fields
    const excludeKeys = new Set([
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
      "createdBy",
      "createdAt",
      "updatedAt",
      "updatedBy",
    ]);

    const additionalData: [string, string][] = [];

    // Flatten and filter policy data
    const flatten = (obj: any, prefix = ""): void => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (excludeKeys.has(key) || key.startsWith("_")) continue;

        if (
          value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        ) {
          flatten(value, fullKey);
        } else {
          const formattedKey = fullKey
            .split(".")
            .map((part) => part.replace(/([A-Z])/g, " $1"))
            .join(" • ")
            .replace(/^\w/, (c) => c.toUpperCase());

          let formattedValue = "—";
          if (fullKey.toLowerCase().includes("date")) {
            formattedValue = this.formatValue(value, "date");
          } else if (
            fullKey.toLowerCase().includes("amount") ||
            fullKey.toLowerCase().includes("premium") ||
            fullKey.toLowerCase().includes("price")
          ) {
            formattedValue = this.formatValue(value, "money");
          } else {
            formattedValue = this.formatValue(value);
          }

          additionalData.push([formattedKey, formattedValue]);
        }
      }
    };

    flatten(this.policy);

    if (additionalData.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(
        "No additional coverage details available.",
        this.margin + 3,
        this.currentY
      );
      this.currentY += 10;
    } else {
      autoTable(this.doc, {
        startY: this.currentY,
        head: [],
        body: additionalData,
        margin: { left: this.margin, right: this.margin },
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: {
            fontStyle: "bold",
            fillColor: [248, 250, 252],
            textColor: [100, 116, 139],
            cellWidth: 60,
          },
          1: {
            textColor: [15, 23, 42],
          },
        },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }
  }

  /**
   * Add footer section
   */
  private addFooter(): void {
    this.checkPageBreak(30);

    // Disclaimer
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 116, 139);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Important Notice:", this.margin, this.currentY);

    this.doc.setFont("helvetica", "normal");
    const disclaimerText =
      "This document is a summary of your insurance policy. Please refer to your complete policy documentation for full terms, conditions, and coverage details. For questions, contact your insurance representative.";

    const splitDisclaimer = this.doc.splitTextToSize(
      disclaimerText,
      this.pageWidth - 2 * this.margin
    );
    this.doc.text(splitDisclaimer, this.margin, this.currentY + 5);

    this.currentY += splitDisclaimer.length * 4 + 10;

    // Generated timestamp and reference
    this.doc.setFontSize(8);
    this.doc.setTextColor(148, 163, 184);
    const timestamp = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    this.doc.text(
      `Document generated on ${timestamp}`,
      this.pageWidth / 2,
      this.currentY,
      { align: "center" }
    );
    this.doc.text(
      `Policy Reference: ${this.policy.id || "N/A"}`,
      this.pageWidth / 2,
      this.currentY + 4,
      { align: "center" }
    );
  }

  /**
   * Generate and download the PDF
   */
  async download(filename?: string): Promise<void> {
    try {
      // Build the document
      this.addHeader();
      this.addSummarySection();
      this.addHolderSection();
      this.addCoverageSection();
      this.addFooter();

      // Generate filename
      const policyNum = String(this.getPolicyNumber()).replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
      const finalFilename =
        filename || `Policy_${policyNum}_${Date.now()}.pdf`;

      // Save the PDF
      this.doc.save(finalFilename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new Error("Failed to generate PDF");
    }
  }

  /**
   * Get PDF as blob (useful for preview or upload)
   */
  async getBlob(): Promise<Blob> {
    this.addHeader();
    this.addSummarySection();
    this.addHolderSection();
    this.addCoverageSection();
    this.addFooter();

    return this.doc.output("blob");
  }
}

/**
 * React hook for easy PDF generation
 */
export const usePolicyPDFClient = (policy: Policy | null) => {
  const generatePDF = async () => {
    if (!policy) {
      throw new Error("No policy selected");
    }
    const generator = new PolicyPDFGeneratorClient(policy);
    await generator.download();
  };

  const getPDFBlob = async (): Promise<Blob | null> => {
    if (!policy) return null;
    const generator = new PolicyPDFGeneratorClient(policy);
    return await generator.getBlob();
  };

  return { generatePDF, getPDFBlob };
};
