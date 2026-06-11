  "use client";

import AppShell from "../components/AppShell";
import { useResponsive } from "../components/useResponsive";
import { API_BASE_URL } from "../lib/api";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  paleButton,
  positiveHeading,
  positiveHeroCard,
  positiveInputStrong,
  positiveMuted,
  positivePage,
  positivePanel,
  positiveTableHead,
  positiveText,
  successButton,
} from "../components/positiveTheme";
import {
  asExcelText,
  downloadExcelTemplate,
  getExcelValue,
  readExcelRows,
} from "../components/excelUtils";

const API = API_BASE_URL;

type TabType =
  | "ALL"
  | "SALES"
  | "PURCHASE"
  | "SALES RETURN"
  | "PURCHASE RETURN";

type Row = {
  id: string;
  date: string;
  time: string;
  type: Exclude<TabType, "ALL">;
  invoiceNo: string;
  originalInvoiceNo: string;
  party: string;
  gstNo: string;
  item: string;
  qty: number;
  rate: number;
  gstRate: number;
  amount: number;
  paidReceived: number;
  pending: number;
  status: string;
  path: string;
};

type Notice = {
  tone: "success" | "error";
  text: string;
};

const padDatePart = (value: number) => String(value).padStart(2, "0");

const buildIsoDate = (year: number, month: number, day: number) => {
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return "";
  }

  return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
};

const parseFlexibleDateInput = (value: string) => {
  const text = String(value || "").trim();
  if (!text) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const normalized = text.replace(/[.\-]/g, "/");
  const parts = normalized.split("/").map((part) => part.trim());
  if (parts.length !== 3) return "";

  if (parts[0].length === 4) {
    return buildIsoDate(
      Number(parts[0]),
      Number(parts[1]),
      Number(parts[2]),
    );
  }

  const rawYear = parts[2];
  const year =
    rawYear.length === 2 ? Number(`20${rawYear}`) : Number(rawYear);

  return buildIsoDate(Number(year), Number(parts[1]), Number(parts[0]));
};

const formatTypedDate = (value: string) => {
  if (!value) return "";
  const parsed = parseFlexibleDateInput(value);
  if (!parsed) return value;
  const [year, month, day] = parsed.split("-");
  return `${day}/${month}/${year}`;
};

const formatDate = (value: string) => {
  if (!value) return "-";
  const parsed = parseFlexibleDateInput(value);
  if (!parsed) return value;
  const [year, month, day] = parsed.split("-");
  return `${day}/${month}/${year}`;
};

const money = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const normalizeType = (value: string): Exclude<TabType, "ALL"> | null => {
  const normalized = asExcelText(value)
    .toUpperCase()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ");

  if (normalized === "SALE" || normalized === "SALES") return "SALES";
  if (normalized === "PURCHASE") return "PURCHASE";
  if (normalized === "SALES RETURN" || normalized === "SALE RETURN") {
    return "SALES RETURN";
  }
  if (normalized === "PURCHASE RETURN") return "PURCHASE RETURN";
  return null;
};

const getCompanyGST = (company: Record<string, unknown>) => {
  const possibleKeys = [
    "gstNumber",
    "gstNo",
    "gstin",
    "gst",
    "GSTNumber",
    "GSTNo",
    "GSTIN",
  ];

  for (const key of possibleKeys) {
    const value = String(company[key] || "").trim();
    if (value) return value;
  }

  const gstPattern =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/i;

  for (const value of Object.values(company)) {
    const text = String(value || "").trim();
    if (gstPattern.test(text)) return text.toUpperCase();
  }

  return "N/A";
};

export default function AllInvoiceReportPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();

  const importInputRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<TabType>("ALL");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [company, setCompany] = useState<Record<string, unknown>>({});

  const [search, setSearch] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  useEffect(() => {
    void loadRows();
    loadCompanySettings();
    window.setTimeout(() => searchRef.current?.focus(), 220);
  }, []);

  const loadCompanySettings = () => {
    try {
      const keys = [
        "companySettings",
        "company",
        "companyProfile",
        "businessProfile",
        "settings",
        "profile",
      ];
      const merged: Record<string, unknown> = {};

      keys.forEach((key) => {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            Object.assign(merged, parsed);
          }
        } catch {
          // ignore partial local keys
        }
      });

      setCompany(merged);
    } catch (error) {
      console.error("Failed to load company settings:", error);
    }
  };

  const getAmount = (row: any) =>
    Number(row.totalAmount || row.grandTotal || row.invoiceAmount || row.amount || 0);

  const getInvoiceNo = (row: any) =>
    row.invoiceNo || row.returnNo || row.referenceNo || "-";

  const getParty = (row: any) =>
    row.partyName || row.customerName || row.supplierName || row.party || "-";

  const getItem = (row: any) => {
    if (Array.isArray(row.items) && row.items.length > 0) {
      return row.items
        .map((item: any) => item.itemName || item.name)
        .filter(Boolean)
        .join(", ");
    }

    return row.itemName || row.item || "-";
  };

  const getQty = (row: any) => {
    if (Array.isArray(row.items) && row.items.length > 0) {
      return row.items.reduce(
        (sum: number, item: any) => sum + Number(item.quantity || item.qty || 0),
        0,
      );
    }

    return Number(row.quantity || row.qty || 0);
  };

  const getRate = (row: any) => {
    if (Array.isArray(row.items) && row.items.length > 0) {
      return Number(row.items[0]?.rate || 0);
    }

    return Number(row.rate || 0);
  };

  const getGstRate = (row: any) => {
    if (Array.isArray(row.items) && row.items.length > 0) {
      return Number(row.items[0]?.gstRate || row.items[0]?.gst || 0);
    }

    return Number(row.gstRate || row.gst || 0);
  };

  const getTime = (row: any) => {
    const raw = row.createdAt || row.updatedAt || row.date || "";
    if (!raw) return "-";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "-";
    if (date.getHours() === 0 && date.getMinutes() === 0) return "-";
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatus = (
    type: Exclude<TabType, "ALL">,
    amount: number,
    paidReceived: number,
  ) => {
    const pending = Math.max(amount - paidReceived, 0);

    if (type === "SALES" || type === "PURCHASE RETURN") {
      if (pending <= 0) return "Received";
      if (paidReceived > 0) return "Part Received";
      return "Not Received";
    }

    if (pending <= 0) return "Paid";
    if (paidReceived > 0) return "Part Paid";
    return "Not Paid";
  };

  const makeRows = (
    data: any[],
    type: Exclude<TabType, "ALL">,
    path: string,
  ): Row[] =>
    (Array.isArray(data) ? data : []).map((row: any, index: number) => {
      const amount = getAmount(row);
      const invoiceNo = getInvoiceNo(row);
      const paymentStatus = JSON.parse(
        localStorage.getItem("invoicePaymentStatus") || "{}",
      );
      const endpoint = path.replace("/", "");
      const paymentEntry =
        paymentStatus[`${endpoint}:${invoiceNo}`] ||
        (row.id ? paymentStatus[`${endpoint}:${row.id}`] : null);
      const paidReceived = Number(
        paymentEntry?.paidAmount ||
          paymentEntry?.receivedAmount ||
          row.paidAmount ||
          row.receivedAmount ||
          0,
      );
      const pending = Math.max(amount - paidReceived, 0);

      return {
        id: `${type}-${row.id || invoiceNo || index}`,
        date: row.date || row.createdAt || "",
        time: getTime(row),
        type,
        invoiceNo,
        originalInvoiceNo: row.originalInvoiceNo || row.originalInvoice || "-",
        party: getParty(row),
        gstNo: row.gstNo || row.gstNumber || "B2C",
        item: getItem(row),
        qty: getQty(row),
        rate: getRate(row),
        gstRate: getGstRate(row),
        amount,
        paidReceived,
        pending,
        status: getStatus(type, amount, paidReceived),
        path,
      };
    });

  const loadRows = async () => {
    setLoading(true);
    try {
      const [salesRes, purchaseRes, salesReturnRes, purchaseReturnRes] =
        await Promise.all([
          fetch(`${API}/sales`).then((res) => (res.ok ? res.json() : [])),
          fetch(`${API}/purchase`).then((res) => (res.ok ? res.json() : [])),
          fetch(`${API}/sales-return`).then((res) =>
            res.ok ? res.json() : [],
          ),
          fetch(`${API}/purchase-return`).then((res) =>
            res.ok ? res.json() : [],
          ),
        ]);

      setRows([
        ...makeRows(salesRes, "SALES", "/sales"),
        ...makeRows(purchaseRes, "PURCHASE", "/purchase"),
        ...makeRows(salesReturnRes, "SALES RETURN", "/sales-return"),
        ...makeRows(purchaseReturnRes, "PURCHASE RETURN", "/purchase-return"),
      ]);
    } catch (error) {
      console.error("Failed to load invoice report:", error);
      setNotice({
        tone: "error",
        text: "Live invoice report could not be loaded from the backend.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchTab = tab === "ALL" || row.type === tab;
      const matchSearch =
        !query ||
        row.invoiceNo.toLowerCase().includes(query) ||
        row.originalInvoiceNo.toLowerCase().includes(query) ||
        row.party.toLowerCase().includes(query) ||
        row.gstNo.toLowerCase().includes(query) ||
        row.item.toLowerCase().includes(query) ||
        String(row.amount).includes(query) ||
        String(row.gstRate).includes(query);
      const matchGst = !gstRate || String(row.gstRate) === gstRate;
      const matchStatus = !status || row.status === status;
      const matchMin = !minAmount || row.amount >= Number(minAmount);
      const matchMax = !maxAmount || row.amount <= Number(maxAmount);

      const rowDate = parseFlexibleDateInput(row.date);
      const fromIso = parseFlexibleDateInput(fromDate);
      const toIso = parseFlexibleDateInput(toDate);
      const matchFrom = !fromIso || (!!rowDate && rowDate >= fromIso);
      const matchTo = !toIso || (!!rowDate && rowDate <= toIso);

      return (
        matchTab &&
        matchSearch &&
        matchGst &&
        matchStatus &&
        matchMin &&
        matchMax &&
        matchFrom &&
        matchTo
      );
    });
  }, [rows, tab, search, gstRate, status, fromDate, toDate, minAmount, maxAmount]);

  const downloadSampleFormat = () => {
    downloadExcelTemplate("All_Invoice_Import_Sample.xlsx", "Invoices", [
      {
        Type: "SALES",
        "Invoice No / Return No": "SAL-2026-0040",
        "Original Invoice No": "",
        "Party Name": "Cash",
        "GST No": "B2C",
        "Item Name": "REGUEK 2D BARCODE SCANNER",
        Qty: 1,
        Rate: 5000,
        "GST %": 18,
      },
      {
        Type: "PURCHASE RETURN",
        "Invoice No / Return No": "PR-2026-0004",
        "Original Invoice No": "PUR-2026-0012",
        "Party Name": "KAVI TRADERS",
        "GST No": "27AAACR5055K1Z7",
        "Item Name": "VACUUM CLEANER",
        Qty: 1,
        Rate: 2000,
        "GST %": 18,
      },
    ]);
  };

  const importExcel = async (file?: File) => {
    if (!file) return;

    setImporting(true);
    setNotice(null);

    try {
      const excelRows = await readExcelRows(file);
      let importedCount = 0;
      let skippedCount = 0;

      for (const row of excelRows) {
        const type = normalizeType(
          asExcelText(
            getExcelValue(row, ["Type", "Invoice Type", "Entry Type"]),
          ),
        );
        const invoiceNo = asExcelText(
          getExcelValue(row, [
            "Invoice No / Return No",
            "Invoice No",
            "Return No",
            "Invoice Number",
          ]),
        );
        const originalInvoiceNo = asExcelText(
          getExcelValue(row, ["Original Invoice No", "Original Bill No"]),
        );
        const partyName = asExcelText(
          getExcelValue(row, [
            "Party Name",
            "Party",
            "Customer Name",
            "Supplier Name",
          ]),
        );
        const gstNo = asExcelText(
          getExcelValue(row, ["GST No", "GST Number", "GSTIN"]),
        );
        const itemName = asExcelText(
          getExcelValue(row, ["Item Name", "Item", "Product Name"]),
        );
        const quantity = Number(
          getExcelValue(row, ["Qty", "Quantity"]) || 0,
        );
        const rate = Number(getExcelValue(row, ["Rate", "Price"]) || 0);
        const gstRateValue = Number(
          getExcelValue(row, ["GST %", "GST Rate %", "GST Rate"]) || 0,
        );

        if (!type || !invoiceNo || !partyName || !itemName || quantity <= 0) {
          skippedCount += 1;
          continue;
        }

        const endpoint =
          type === "SALES"
            ? "sales"
            : type === "PURCHASE"
            ? "purchase"
            : type === "SALES RETURN"
            ? "sales-return"
            : "purchase-return";

        const body =
          type === "SALES"
            ? {
                invoiceNo,
                partyName,
                gstNo: gstNo || "B2C",
                itemName,
                quantity,
                rate,
                gstRate: gstRateValue,
              }
            : type === "PURCHASE"
            ? {
                invoiceNo,
                supplierName: partyName,
                gstNo,
                itemName,
                quantity,
                rate,
                gstRate: gstRateValue,
              }
            : type === "SALES RETURN"
            ? {
                returnNo: invoiceNo,
                originalInvoiceNo: originalInvoiceNo || "-",
                partyName,
                gstNo: gstNo || "B2C",
                itemName,
                quantity,
                rate,
                gstRate: gstRateValue,
              }
            : {
                returnNo: invoiceNo,
                originalInvoiceNo: originalInvoiceNo || "-",
                supplierName: partyName,
                gstNo,
                itemName,
                quantity,
                rate,
                gstRate: gstRateValue,
              };

        const res = await fetch(`${API}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          skippedCount += 1;
          continue;
        }

        importedCount += 1;
      }

      if (!importedCount) {
        throw new Error(
          "No invoice rows were imported. Please use the sample format and valid type names.",
        );
      }

      await loadRows();
      setNotice({
        tone: "success",
        text:
          skippedCount > 0
            ? `Imported ${importedCount} invoice row(s). Skipped ${skippedCount} row(s).`
            : `Imported ${importedCount} invoice row(s) successfully.`,
      });
    } catch (error) {
      console.error(error);
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Invoice import failed. Please use the sample format.",
      });
    } finally {
      setImporting(false);
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  };

  const exportCSV = () => {
    const headers = [
      "Date",
      "Time",
      "Type",
      "Invoice No / Return No",
      "Original Invoice No",
      "Party",
      "GST No",
      "Item",
      "Qty",
      "Rate",
      "GST %",
      "Amount",
      "Paid/Received",
      "Pending",
      "Status",
    ];

    const csvRows = filtered.map((row) => [
      formatDate(row.date),
      row.time,
      row.type,
      row.invoiceNo,
      row.originalInvoiceNo,
      row.party,
      row.gstNo,
      row.item,
      row.qty,
      row.rate,
      row.gstRate,
      row.amount,
      row.paidReceived,
      row.pending,
      row.status,
    ]);

    const csv = [headers, ...csvRows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "All_Invoice_Report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch("");
    setGstRate("");
    setStatus("");
    setFromDate("");
    setToDate("");
    setMinAmount("");
    setMaxAmount("");
    window.setTimeout(() => searchRef.current?.focus(), 50);
  };

  const totalAmount = filtered.reduce((sum, row) => sum + row.amount, 0);
  const totalPending = filtered.reduce((sum, row) => sum + row.pending, 0);

  const showOriginalColumn =
    tab === "ALL" || tab === "SALES RETURN" || tab === "PURCHASE RETURN";

  const companyGST = getCompanyGST(company);

  const filterGridStyle = {
    ...filterCard,
    gridTemplateColumns: isMobile
      ? "1fr"
      : isTablet
      ? "repeat(2,minmax(0,1fr))"
      : "2fr 1fr 1fr 1.05fr 1.05fr 1fr 1fr 150px",
  };

  const heroStyle = {
    ...hero,
    flexDirection: isTablet ? ("column" as const) : ("row" as const),
    alignItems: isTablet ? ("stretch" as const) : ("center" as const),
  };

  const heroBtnWrapStyle = {
    ...heroBtns,
    flexWrap: "wrap" as const,
    justifyContent: isTablet ? ("flex-start" as const) : ("flex-end" as const),
  };

  return (
    <AppShell>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print, aside, nav {
                display: none !important;
              }
              body {
                background: white !important;
              }
              .print-root {
                padding: 0 !important;
              }
            }
          `,
        }}
      />

      <main style={{ ...page, padding: isMobile ? 14 : isTablet ? 18 : 24 }} className="print-root">
        <section style={heroStyle} className="no-print">
          <div>
            <p style={eyebrow}>Combined Report</p>
            <h1 style={{ ...titleStyle, fontSize: isMobile ? 34 : 42 }}>
              All Invoice Report
            </h1>
            <p style={subtitle}>
              Sales, Purchase, Sales Return and Purchase Return combined report.
            </p>
          </div>

          <div style={heroBtnWrapStyle}>
            <button style={refreshBtn} onClick={() => void loadRows()} disabled={loading}>
              {loading ? "Syncing..." : "Refresh"}
            </button>
            <button
              style={importBtn}
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? "Importing..." : "Import Excel"}
            </button>
            <button style={sampleBtn} onClick={downloadSampleFormat}>
              Sample Format
            </button>
            <button style={exportBtn} onClick={exportCSV}>
              Export CSV
            </button>
            <button style={printBtn} onClick={() => window.print()}>
              Print
            </button>
          </div>
        </section>

        <section style={formatCard} className="no-print">
          <div style={formatTitle}>Excel Column Order</div>
          <div style={formatText}>
            Type | Invoice No / Return No | Original Invoice No | Party Name | GST No | Item Name | Qty | Rate | GST %
          </div>
          <div style={formatHint}>
            One Excel row should be one invoice item line. Valid type names:
            SALES, PURCHASE, SALES RETURN, PURCHASE RETURN.
          </div>
        </section>

        {notice ? (
          <section
            style={{
              ...noticeBox,
              ...(notice.tone === "success" ? successNotice : errorNotice),
            }}
            className="no-print"
          >
            {notice.text}
          </section>
        ) : null}

        <section style={tabs} className="no-print">
          {(
            [
              "ALL",
              "SALES",
              "PURCHASE",
              "SALES RETURN",
              "PURCHASE RETURN",
            ] as TabType[]
          ).map((item) => (
            <button
              key={item}
              style={{
                ...tabBtn,
                background:
                  tab === item
                    ? "linear-gradient(135deg,#16a34a,#22c55e)"
                    : "linear-gradient(135deg,#fff8dc,#f2df9d)",
                color: tab === item ? "white" : "#3f2a00",
              }}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </section>

        <section style={filterGridStyle} className="no-print">
          <input
            ref={searchRef}
            style={input}
            placeholder="Search invoice / GST / party / item / amount"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            style={input}
            value={gstRate}
            onChange={(event) => setGstRate(event.target.value)}
          >
            <option value="">All GST %</option>
            {["0", "3", "5", "12", "18", "28"].map((value) => (
              <option key={value} value={value}>
                {value}%
              </option>
            ))}
          </select>

          <select
            style={input}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Part Paid">Part Paid</option>
            <option value="Not Paid">Not Paid</option>
            <option value="Received">Received</option>
            <option value="Part Received">Part Received</option>
            <option value="Not Received">Not Received</option>
          </select>

          <CompactDateInput
            value={fromDate}
            placeholder="From Date"
            onChange={setFromDate}
          />

          <CompactDateInput
            value={toDate}
            placeholder="To Date"
            onChange={setToDate}
          />

          <input
            style={input}
            type="number"
            placeholder="Min Amount"
            value={minAmount}
            onChange={(event) => setMinAmount(event.target.value)}
          />

          <input
            style={input}
            type="number"
            placeholder="Max Amount"
            value={maxAmount}
            onChange={(event) => setMaxAmount(event.target.value)}
          />

          <button style={clearBtn} onClick={clearFilters}>
            Clear
          </button>
        </section>

        <input
          ref={importInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          onChange={(event) => void importExcel(event.target.files?.[0])}
        />

        <div
          style={{
            ...summaryGrid,
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3,minmax(0,1fr))",
          }}
        >
          <SummaryCard label="Records" value={String(filtered.length)} color="#60a5fa" />
          <SummaryCard label="Total Amount" value={money(totalAmount)} color="#22c55e" />
          <SummaryCard label="Pending" value={money(totalPending)} color="#ef4444" />
        </div>

        <section style={card}>
          <div style={tableTop}>
            <div>
              <h2 style={sectionTitle}>{tab} Report</h2>
              <p style={tableHint}>
                Company GST: {companyGST}
              </p>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr style={thead}>
                  <th style={th}>Date</th>
                  <th style={th}>Time</th>
                  <th style={th}>Type</th>
                  <th style={th}>{tab.includes("RETURN") ? "Return No" : "Invoice No"}</th>
                  {showOriginalColumn && <th style={th}>Original Invoice No</th>}
                  <th style={th}>Party</th>
                  <th style={th}>GST No</th>
                  <th style={th}>Item</th>
                  <th style={th}>Qty</th>
                  <th style={th}>Rate</th>
                  <th style={th}>GST %</th>
                  <th style={th}>Amount</th>
                  <th style={th}>Paid/Received</th>
                  <th style={th}>Pending</th>
                  <th style={th}>Status</th>
                  <th style={th} className="no-print">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td style={emptyTd} colSpan={showOriginalColumn ? 16 : 15}>
                      No invoice records found
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} style={tr}>
                      <td style={td}>{formatDate(row.date)}</td>
                      <td style={{ ...td, color: "#2563eb" }}>{row.time}</td>
                      <td style={td}>{row.type}</td>
                      <td style={td}>{row.invoiceNo}</td>
                      {showOriginalColumn && <td style={td}>{row.originalInvoiceNo}</td>}
                      <td style={{ ...td, textAlign: "left" }}>{row.party}</td>
                      <td style={td}>{row.gstNo}</td>
                      <td style={{ ...td, textAlign: "left" }}>{row.item}</td>
                      <td style={td}>{row.qty}</td>
                      <td style={td}>{money(row.rate)}</td>
                      <td style={td}>{row.gstRate}%</td>
                      <td style={{ ...td, fontWeight: 900 }}>{money(row.amount)}</td>
                      <td style={{ ...td, color: "#15803d", fontWeight: 900 }}>
                        {money(row.paidReceived)}
                      </td>
                      <td style={{ ...td, color: "#b91c1c", fontWeight: 900 }}>
                        {money(row.pending)}
                      </td>
                      <td style={td}>
                        <span style={badge(row.status)}>{row.status}</span>
                      </td>
                      <td style={td} className="no-print">
                        <button style={openBtn} onClick={() => router.push(row.path)}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{ ...summaryCard, borderTop: `5px solid ${color}` }}>
      <p style={summaryLabel}>{label}</p>
      <h2 style={summaryValue}>{value}</h2>
    </div>
  );
}

function CompactDateInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [typedValue, setTypedValue] = useState(formatTypedDate(value));

  useEffect(() => {
    setTypedValue(formatTypedDate(value));
  }, [value]);

  const commitValue = () => {
    const trimmed = typedValue.trim();
    if (!trimmed) {
      onChange("");
      return;
    }

    const parsed = parseFlexibleDateInput(trimmed);
    if (!parsed) {
      alert("Use DD/MM/YYYY or YYYY-MM-DD for dates.");
      setTypedValue(formatTypedDate(value));
      return;
    }

    onChange(parsed);
    setTypedValue(formatTypedDate(parsed));
  };

  return (
    <div style={dateInputShell}>
      <input
        style={dateTextInput}
        type="text"
        value={typedValue}
        placeholder={placeholder}
        onChange={(event) => setTypedValue(event.target.value)}
        onBlur={commitValue}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitValue();
          }
        }}
      />
      <input
        style={datePickerInput}
        type="date"
        value={value || ""}
        onChange={(event) => {
          onChange(event.target.value);
          setTypedValue(formatTypedDate(event.target.value));
        }}
      />
    </div>
  );
}

function badge(status: string): CSSProperties {
  const green = status === "Paid" || status === "Received";
  const yellow = status === "Part Paid" || status === "Part Received";

  return {
    display: "inline-block",
    borderRadius: 999,
    padding: "7px 12px",
    color: "white",
    fontWeight: 900,
    background: green ? "#22c55e" : yellow ? "#f59e0b" : "#ef4444",
    whiteSpace: "nowrap",
  };
}

const page: CSSProperties = {
  ...positivePage,
  minHeight: "100vh",
  padding: 24,
  color: positiveText,
};

const hero: CSSProperties = {
  ...positiveHeroCard,
  borderRadius: 24,
  padding: 36,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  marginBottom: 20,
};

const eyebrow: CSSProperties = {
  margin: 0,
  color: "#b45309",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: 1,
};

const titleStyle: CSSProperties = {
  margin: "10px 0 0",
  fontSize: 42,
  fontWeight: 950,
  color: positiveHeading,
};

const subtitle: CSSProperties = {
  marginTop: 10,
  color: positiveMuted,
  fontWeight: 800,
  lineHeight: 1.6,
  maxWidth: 760,
};

const heroBtns: CSSProperties = {
  display: "flex",
  gap: 12,
};

const refreshBtn: CSSProperties = {
  ...paleButton,
  padding: "14px 22px",
};

const importBtn: CSSProperties = {
  ...successButton,
  padding: "14px 22px",
};

const sampleBtn: CSSProperties = {
  ...paleButton,
  padding: "14px 22px",
};

const exportBtn: CSSProperties = {
  ...successButton,
  padding: "14px 22px",
};

const printBtn: CSSProperties = {
  border: "none",
  background: "linear-gradient(135deg,#d4af37,#eab308)",
  color: "#111827",
  borderRadius: 14,
  padding: "14px 22px",
  fontWeight: 900,
  cursor: "pointer",
};

const formatCard: CSSProperties = {
  ...positivePanel,
  borderRadius: 20,
  padding: 20,
  marginBottom: 18,
};

const formatTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 950,
  color: positiveHeading,
  marginBottom: 8,
};

const formatText: CSSProperties = {
  fontWeight: 800,
  lineHeight: 1.7,
  wordBreak: "break-word",
};

const formatHint: CSSProperties = {
  marginTop: 8,
  color: positiveMuted,
  fontWeight: 700,
};

const noticeBox: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 14,
  fontWeight: 800,
  marginBottom: 18,
  border: "1px solid transparent",
};

const successNotice: CSSProperties = {
  background: "rgba(34,197,94,0.15)",
  borderColor: "rgba(34,197,94,0.35)",
  color: "#166534",
};

const errorNotice: CSSProperties = {
  background: "rgba(239,68,68,0.15)",
  borderColor: "rgba(239,68,68,0.35)",
  color: "#991b1b",
};

const tabs: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 18,
};

const tabBtn: CSSProperties = {
  ...paleButton,
  padding: "14px 20px",
};

const filterCard: CSSProperties = {
  ...positivePanel,
  borderRadius: 22,
  padding: 22,
  display: "grid",
  gap: 12,
  marginBottom: 20,
};

const input: CSSProperties = {
  ...positiveInputStrong,
  height: 52,
  borderRadius: 14,
  padding: "0 14px",
  fontWeight: 800,
};

const dateInputShell: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) 60px",
  gap: 10,
  alignItems: "center",
};

const dateTextInput: CSSProperties = {
  ...input,
};

const datePickerInput: CSSProperties = {
  ...input,
  padding: "0 6px",
  textAlign: "center",
  cursor: "pointer",
};

const clearBtn: CSSProperties = {
  border: "none",
  borderRadius: 14,
  background: "#ef4444",
  color: "white",
  fontWeight: 950,
  cursor: "pointer",
};

const summaryGrid: CSSProperties = {
  display: "grid",
  gap: 18,
  marginBottom: 22,
};

const summaryCard: CSSProperties = {
  ...positivePanel,
  borderRadius: 20,
  padding: 24,
};

const summaryLabel: CSSProperties = {
  margin: 0,
  color: positiveMuted,
  fontWeight: 900,
};

const summaryValue: CSSProperties = {
  margin: "12px 0 0",
  fontSize: "clamp(1.8rem, 2.9vw, 2.4rem)",
  fontWeight: 950,
  color: positiveHeading,
  lineHeight: 1.15,
  overflowWrap: "anywhere",
};

const card: CSSProperties = {
  ...positivePanel,
  borderRadius: 24,
  padding: 28,
};

const tableTop: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 18,
  alignItems: "flex-end",
};

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 950,
  color: positiveHeading,
};

const tableHint: CSSProperties = {
  margin: "8px 0 0",
  color: positiveMuted,
  fontWeight: 700,
};

const table: CSSProperties = {
  width: "100%",
  minWidth: 1620,
  borderCollapse: "collapse",
};

const thead: CSSProperties = positiveTableHead;

const th: CSSProperties = {
  padding: 14,
  textAlign: "left",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const tr: CSSProperties = {
  borderBottom: "1px solid rgba(184,134,11,0.16)",
};

const td: CSSProperties = {
  padding: 14,
  fontWeight: 800,
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
};

const emptyTd: CSSProperties = {
  padding: 28,
  textAlign: "center",
  color: positiveMuted,
  fontWeight: 800,
};

const openBtn: CSSProperties = {
  border: "none",
  borderRadius: 10,
  background: "#2563eb",
  color: "white",
  padding: "9px 14px",
  fontWeight: 900,
  cursor: "pointer",
};
