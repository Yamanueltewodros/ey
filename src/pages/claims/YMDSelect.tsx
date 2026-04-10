// src/pages/policy/YMDSelect.tsx
import React from "react";

export const pad2 = (n: number) => String(n).padStart(2, "0");

const MONTHS = [
  { value: "1", label: "Jan" },
  { value: "2", label: "Feb" },
  { value: "3", label: "Mar" },
  { value: "4", label: "Apr" },
  { value: "5", label: "May" },
  { value: "6", label: "Jun" },
  { value: "7", label: "Jul" },
  { value: "8", label: "Aug" },
  { value: "9", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const isValidYMD = (y: string, m: string, d: string) => {
  if (!y || !m || !d) return false;
  const yn = Number(y);
  const mn = Number(m);
  const dn = Number(d);
  if (!Number.isFinite(yn) || !Number.isFinite(mn) || !Number.isFinite(dn)) return false;
  if (mn < 1 || mn > 12) return false;
  if (dn < 1) return false;
  const md = new Date(yn, mn, 0).getDate();
  return dn <= md;
};

export const parseISO = (iso?: string) => {
  if (!iso || typeof iso !== "string") return { y: "", m: "", d: "" };

  const parts = iso.split("-");
  if (parts.length !== 3) return { y: "", m: "", d: "" };

  const [y, m, d] = parts;
  const yy = (y || "").trim();
  const mm = (m || "").trim();
  const dd = (d || "").trim();

  if (!yy || !mm || !dd) return { y: yy || "", m: mm || "", d: dd || "" };
  if (!/^\d{4}$/.test(yy)) return { y: "", m: "", d: "" };
  if (!/^\d{1,2}$/.test(mm)) return { y: yy, m: "", d: "" };
  if (!/^\d{1,2}$/.test(dd)) return { y: yy, m: String(Number(mm)), d: "" };

  // month/day stored unpadded so selects match ("1", "2"...)
  return { y: yy, m: String(Number(mm)), d: String(Number(dd)) };
};

export const toISO = (y: string, m: string, d: string) => {
  if (!isValidYMD(y, m, d)) return "";
  return `${y}-${pad2(Number(m))}-${pad2(Number(d))}`;
};

export type YMDValue = { y: string; m: string; d: string };

interface YMDSelectProps {
  label: string;
  valueISO: string;
  onChangeISO: (nextISO: string) => void;

  minYear?: number;
  maxYear?: number;
  required?: boolean;
  disabled?: boolean;

  // optional UX helpers
  helperText?: string;
  errorText?: string;

  // optional: helps form libs
  name?: string;

  // optional: order of inputs
  displayOrder?: ("Y" | "M" | "D")[];
}

export const YMDSelect: React.FC<YMDSelectProps> = ({
  label,
  valueISO,
  onChangeISO,
  minYear = 1950,
  maxYear = new Date().getFullYear() + 10,
  required = false,
  disabled = false,
  helperText,
  errorText,
  name,
  displayOrder = ["Y", "M", "D"],
}) => {
  const [ymd, setYmd] = React.useState<YMDValue>(() => parseISO(valueISO));

  React.useEffect(() => {
    setYmd(parseISO(valueISO));
  }, [valueISO]);

  const yearNum = ymd.y ? Number(ymd.y) : NaN;
  const monthNum = ymd.m ? Number(ymd.m) : NaN;

  const maxDay =
    Number.isFinite(yearNum) && Number.isFinite(monthNum)
      ? daysInMonth(yearNum, monthNum)
      : 31;

  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) list.push(y);
    return list;
  }, [minYear, maxYear]);

  const days = React.useMemo(() => {
    return Array.from({ length: maxDay }, (_, i) => String(i + 1));
  }, [maxDay]);

  const commit = (next: YMDValue) => {
    if (disabled) return;

    // clamp day if needed (Feb 30 -> Feb 28/29)
    let d = next.d;
    const yn = next.y ? Number(next.y) : NaN;
    const mn = next.m ? Number(next.m) : NaN;

    if (d && Number.isFinite(yn) && Number.isFinite(mn)) {
      const md = daysInMonth(yn, mn);
      if (Number(d) > md) d = String(md);
    }

    const normalized = { ...next, d };
    setYmd(normalized);
    onChangeISO(toISO(normalized.y, normalized.m, normalized.d));
  };

  const base =
    "block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-1";
  const enabled =
    "border-slate-300 bg-white text-slate-900 focus:border-slate-900 focus:ring-slate-900";
  const disabledCls =
    "border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed";
  const invalidCls = errorText ? "border-red-400 focus:border-red-600 focus:ring-red-600" : "";

  const fieldClass = `${base} ${disabled ? disabledCls : enabled} ${invalidCls}`;

  const Field = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">
        {title}
      </label>
      {children}
    </div>
  );

  const SelectYear = (
    <Field title="Year">
      <select
        value={ymd.y}
        onChange={(e) => commit({ ...ymd, y: e.target.value })}
        className={fieldClass}
        required={required}
        disabled={disabled}
        aria-label={`${label} year`}
      >
        <option value="">YYYY</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    </Field>
  );

  const SelectMonth = (
    <Field title="Month">
      <select
        value={ymd.m}
        onChange={(e) => commit({ ...ymd, m: e.target.value })}
        className={fieldClass}
        required={required}
        disabled={disabled || !ymd.y}
        aria-label={`${label} month`}
      >
        <option value="">{ymd.y ? "Select month" : "Pick year first"}</option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
    </Field>
  );

  const SelectDay = (
    <Field title="Day">
      <select
        value={ymd.d}
        onChange={(e) => commit({ ...ymd, d: e.target.value })}
        className={fieldClass}
        required={required}
        disabled={disabled || !ymd.y || !ymd.m}
        aria-label={`${label} day`}
      >
        <option value="">
          {ymd.y && ymd.m ? "Select day" : "Pick year & month first"}
        </option>
        {days.map((d) => (
          <option key={d} value={d}>
            {pad2(Number(d))}
          </option>
        ))}
      </select>
    </Field>
  );

  const renderMap: Record<"Y" | "M" | "D", React.ReactNode> = {
    Y: SelectYear,
    M: SelectMonth,
    D: SelectDay,
  };

  const isoValue = toISO(ymd.y, ymd.m, ymd.d);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {/* Optional small “preview” so user sees final format */}
        <span className="text-xs text-slate-500">
          {isoValue ? isoValue : "YYYY-MM-DD"}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {displayOrder.map((k) => (
          <React.Fragment key={k}>{renderMap[k]}</React.Fragment>
        ))}
      </div>

      {(helperText || errorText) && (
        <div className="mt-2 text-xs">
          {errorText ? (
            <p className="text-red-600">{errorText}</p>
          ) : (
            <p className="text-slate-500">{helperText}</p>
          )}
        </div>
      )}

      {/* Useful for form libs */}
      <input type="hidden" name={name} value={isoValue} />
    </div>
  );
};
