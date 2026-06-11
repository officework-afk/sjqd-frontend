"use client";

import AppShell from "../components/AppShell";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { API_BASE_URL } from "../lib/api";
import {
  positiveHeading,
  positiveHeroCard,
  positivePage,
  positivePanel,
  positiveTableHead,
  positiveText,
} from "../components/positiveTheme";

const API = API_BASE_URL;

type SaleRow = {
  id?: number;
  invoiceNo: string;
  partyName: string;
  gstNo: string;
  itemName: string;
  quantity: number;
  rate: number;
  gstRate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  createdAt: string;
};

export default function GSTR1Page() {
  const [sales, setSales] = useState<SaleRow[]>([]);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const res = await fetch(`${API}/sales`);
      const data = await res.json();
      setSales(Array.isArray(data) ? data : []);
    } catch {
      setSales([]);
    }
  };

  const b2b = useMemo(
    () =>
      sales.filter(
        (x) =>
          x.gstNo &&
          x.gstNo !== "B2C" &&
          x.gstNo.trim().length >= 15
      ),
    [sales]
  );

  const b2c = useMemo(
    () =>
      sales.filter(
        (x) =>
          !x.gstNo ||
          x.gstNo === "B2C" ||
          x.gstNo.trim().length < 15
      ),
    [sales]
  );

  const totalSales = sales.reduce(
    (sum, x) => sum + Number(x.taxableAmount || 0),
    0
  );

  const outputGst = sales.reduce(
    (sum, x) =>
      sum +
      Number(x.cgst || 0) +
      Number(x.sgst || 0) +
      Number(x.igst || 0),
    0
  );

  const money = (v: any) =>
    `₹${Number(v || 0).toLocaleString("en-IN")}`;

  const exportExcel = () => {
    const data = sales.map((x) => ({
      "Invoice No": x.invoiceNo,
      "Party Name": x.partyName,
      "GST No": x.gstNo || "B2C",
      "Item Name": x.itemName,
      Quantity: x.quantity,
      Rate: x.rate,
      Taxable: x.taxableAmount,
      "GST %": x.gstRate,
      CGST: x.cgst,
      SGST: x.sgst,
      IGST: x.igst,
      Total: x.totalAmount,
      Date: x.createdAt
        ? new Date(x.createdAt).toLocaleString("en-IN")
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "GSTR-1");
    XLSX.writeFile(wb, "GSTR1_Report.xlsx");
  };

  return (
    <AppShell>
      <main style={page}>
        <section style={hero}>
          <div>
            <h1 style={title}>GSTR-1 Report</h1>
            <p style={subtitle}>
              Outward supplies report for B2B and B2C sales invoices.
            </p>
          </div>

          <button style={exportBtn} onClick={exportExcel}>
            Export Excel
          </button>
        </section>

        <section style={summaryGrid}>
          <SummaryCard title="Total Sales" value={money(totalSales)} />
          <SummaryCard title="Output GST" value={money(outputGst)} />
          <SummaryCard title="B2B Invoices" value={String(b2b.length)} />
          <SummaryCard title="B2C Invoices" value={String(b2c.length)} />
        </section>

        <ReportTable
          title="B2B Sales With GSTIN"
          rows={b2b}
          money={money}
        />

        <ReportTable
          title="B2C Sales Without GSTIN"
          rows={b2c}
          money={money}
        />
      </main>
    </AppShell>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div style={summaryCard}>
      <div style={summaryTitle}>{title}</div>
      <div style={summaryValue}>{value}</div>
    </div>
  );
}

function ReportTable({
  title,
  rows,
  money,
}: {
  title: string;
  rows: SaleRow[];
  money: (v: any) => string;
}) {
  return (
    <section style={tableCard}>
      <h2 style={sectionTitle}>{title}</h2>

      <div style={{ overflowX: "auto" }}>
        <table style={table}>
          <thead>
            <tr style={thead}>
              <th style={th}>Invoice No</th>
              <th style={th}>Party Name</th>
              <th style={th}>GST No</th>
              <th style={th}>Taxable</th>
              <th style={th}>GST %</th>
              <th style={th}>CGST</th>
              <th style={th}>SGST</th>
              <th style={th}>IGST</th>
              <th style={th}>Total</th>
              <th style={th}>Date</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td style={td} colSpan={10}>
                  No records found
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id || i} style={tr}>
                  <td style={td}>{r.invoiceNo}</td>
                  <td style={td}>{r.partyName}</td>
                  <td style={td}>{r.gstNo || "B2C"}</td>
                  <td style={td}>{money(r.taxableAmount)}</td>
                  <td style={td}>{r.gstRate}%</td>
                  <td style={td}>{money(r.cgst)}</td>
                  <td style={td}>{money(r.sgst)}</td>
                  <td style={td}>{money(r.igst)}</td>
                  <td style={td}>{money(r.totalAmount)}</td>
                  <td style={td}>
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleString("en-IN")
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const page: React.CSSProperties = {
  ...positivePage,
  minHeight: "100vh",
  padding: 24,
  color: positiveText,
};

const hero: React.CSSProperties = {
  ...positiveHeroCard,
  borderRadius: 24,
  padding: "42px 40px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 42,
  fontWeight: 950,
  color: positiveHeading,
};

const subtitle: React.CSSProperties = {
  marginTop: 10,
  color: "#6b5b20",
  fontWeight: 700,
};

const exportBtn: React.CSSProperties = {
  border: "none",
  background: "#63c76a",
  color: "white",
  padding: "16px 28px",
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 900,
  cursor: "pointer",
};

const summaryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 18,
  marginBottom: 24,
};

const summaryCard: React.CSSProperties = {
  ...positivePanel,
  borderTop: "4px solid #d4af37",
  borderRadius: 18,
  padding: 24,
};

const summaryTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 900,
  opacity: 0.9,
};

const summaryValue: React.CSSProperties = {
  marginTop: 18,
  fontSize: 32,
  fontWeight: 950,
};

const tableCard: React.CSSProperties = {
  ...positivePanel,
  borderRadius: 22,
  padding: 24,
  marginBottom: 24,
};

const sectionTitle: React.CSSProperties = {
  marginTop: 0,
  fontSize: 24,
  fontWeight: 950,
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1100,
};

const thead: React.CSSProperties = {
  ...positiveTableHead,
};

const th: React.CSSProperties = {
  padding: "14px",
  textAlign: "left",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const tr: React.CSSProperties = {
  borderBottom: "1px solid rgba(184,134,11,0.16)",
};

const td: React.CSSProperties = {
  padding: "14px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
