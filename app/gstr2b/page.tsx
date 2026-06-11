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

type PurchaseRow = {
  id?: number;
  invoiceNo: string;
  supplierName: string;
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

export default function GSTR2BPage() {
  const [purchase, setPurchase] = useState<PurchaseRow[]>([]);

  useEffect(() => {
    loadPurchase();
  }, []);

  const loadPurchase = async () => {
    try {
      const res = await fetch(`${API}/purchase`);
      const data = await res.json();

      setPurchase(Array.isArray(data) ? data : []);
    } catch {
      setPurchase([]);
    }
  };

  const b2bPurchase = useMemo(() => {
    return purchase.filter(
      (x) =>
        x.gstNo &&
        x.gstNo !== "B2C" &&
        x.gstNo.trim().length >= 15
    );
  }, [purchase]);

  const totalPurchase = purchase.reduce(
    (sum, x) => sum + Number(x.taxableAmount || 0),
    0
  );

  const inputGst = purchase.reduce(
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
    const rows = purchase.map((x) => ({
      "Invoice No": x.invoiceNo,
      Supplier: x.supplierName,
      GSTIN: x.gstNo,
      Item: x.itemName,
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

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "GSTR-2B");
    XLSX.writeFile(wb, "GSTR2B_Report.xlsx");
  };

  return (
    <AppShell>
      <main style={page}>
        <section style={hero}>
          <div>
            <h1 style={title}>GSTR-2B Report</h1>

            <p style={subtitle}>
              Purchase GST report with Input Tax Credit details.
            </p>
          </div>

          <button style={exportBtn} onClick={exportExcel}>
            Export Excel
          </button>
        </section>

        <section style={summaryGrid}>
          <SummaryCard
            title="Total Purchase"
            value={money(totalPurchase)}
          />

          <SummaryCard
            title="Input GST"
            value={money(inputGst)}
          />

          <SummaryCard
            title="B2B Purchase"
            value={String(b2bPurchase.length)}
          />
        </section>

        <section style={tableCard}>
          <h2 style={sectionTitle}>
            B2B Purchase With GSTIN
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr style={thead}>
                  <th style={th}>Invoice No</th>
                  <th style={th}>Supplier</th>
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
                {b2bPurchase.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={10}>
                      No records found
                    </td>
                  </tr>
                ) : (
                  b2bPurchase.map((row, i) => (
                    <tr key={row.id || i} style={tr}>
                      <td style={td}>{row.invoiceNo}</td>

                      <td style={td}>
                        {row.supplierName}
                      </td>

                      <td style={td}>{row.gstNo}</td>

                      <td style={td}>
                        {money(row.taxableAmount)}
                      </td>

                      <td style={td}>
                        {row.gstRate}%
                      </td>

                      <td style={td}>
                        {money(row.cgst)}
                      </td>

                      <td style={td}>
                        {money(row.sgst)}
                      </td>

                      <td style={td}>
                        {money(row.igst)}
                      </td>

                      <td style={td}>
                        {money(row.totalAmount)}
                      </td>

                      <td style={td}>
                        {row.createdAt
                          ? new Date(
                              row.createdAt
                            ).toLocaleString("en-IN")
                          : "-"}
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
  background: "#7c3aed",
  color: "white",
  padding: "16px 28px",
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 900,
  cursor: "pointer",
};

const summaryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 18,
  marginBottom: 24,
};

const summaryCard: React.CSSProperties = {
  ...positivePanel,
  borderTop: "4px solid #8b5cf6",
  borderRadius: 18,
  padding: 24,
};

const summaryTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 900,
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
};

const sectionTitle: React.CSSProperties = {
  marginTop: 0,
  fontSize: 24,
  fontWeight: 950,
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1000,
};

const thead: React.CSSProperties = {
  ...positiveTableHead,
};

const th: React.CSSProperties = {
  padding: 14,
  textAlign: "left",
  fontWeight: 900,
};

const tr: React.CSSProperties = {
  borderBottom: "1px solid rgba(184,134,11,0.16)",
};

const td: React.CSSProperties = {
  padding: 14,
  fontWeight: 700,
};
