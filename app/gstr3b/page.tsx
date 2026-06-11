"use client";

import AppShell from "../components/AppShell";
import { useEffect, useState } from "react";
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

export default function GSTR3BPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [s, p] = await Promise.all([
        fetch(`${API}/sales`).then((r) => r.json()),
        fetch(`${API}/purchase`).then((r) => r.json()),
      ]);

      setSales(Array.isArray(s) ? s : []);
      setPurchases(Array.isArray(p) ? p : []);
    } catch {
      setSales([]);
      setPurchases([]);
    }
  };

  const sum = (rows: any[], key: string) =>
    rows.reduce((a, b) => a + Number(b[key] || 0), 0);

  const money = (v: any) =>
    `₹${Number(v || 0).toLocaleString("en-IN")}`;

  const outwardTaxable = sum(sales, "taxableAmount");
  const outputCgst = sum(sales, "cgst");
  const outputSgst = sum(sales, "sgst");
  const outputIgst = sum(sales, "igst");
  const outputGst = outputCgst + outputSgst + outputIgst;

  const inwardTaxable = sum(purchases, "taxableAmount");
  const inputCgst = sum(purchases, "cgst");
  const inputSgst = sum(purchases, "sgst");
  const inputIgst = sum(purchases, "igst");
  const inputGst = inputCgst + inputSgst + inputIgst;

  const netCgst = outputCgst - inputCgst;
  const netSgst = outputSgst - inputSgst;
  const netIgst = outputIgst - inputIgst;
  const netPayable = outputGst - inputGst;

  const exportExcel = () => {
    const data = [
      {
        Particulars: "Outward Taxable Sales",
        Amount: outwardTaxable,
      },
      {
        Particulars: "Output CGST",
        Amount: outputCgst,
      },
      {
        Particulars: "Output SGST",
        Amount: outputSgst,
      },
      {
        Particulars: "Output IGST",
        Amount: outputIgst,
      },
      {
        Particulars: "Total Output GST",
        Amount: outputGst,
      },
      {
        Particulars: "Inward Taxable Purchases",
        Amount: inwardTaxable,
      },
      {
        Particulars: "Input CGST",
        Amount: inputCgst,
      },
      {
        Particulars: "Input SGST",
        Amount: inputSgst,
      },
      {
        Particulars: "Input IGST",
        Amount: inputIgst,
      },
      {
        Particulars: "Total Input GST / ITC",
        Amount: inputGst,
      },
      {
        Particulars: "Net CGST Payable",
        Amount: netCgst,
      },
      {
        Particulars: "Net SGST Payable",
        Amount: netSgst,
      },
      {
        Particulars: "Net IGST Payable",
        Amount: netIgst,
      },
      {
        Particulars: "Net GST Payable",
        Amount: netPayable,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "GSTR-3B");
    XLSX.writeFile(wb, "GSTR3B_Report.xlsx");
  };

  return (
    <AppShell>
      <main style={page}>
        <section style={hero}>
          <div>
            <h1 style={title}>GSTR-3B Report</h1>
            <p style={subtitle}>
              Monthly GST summary with output tax, input credit and net liability.
            </p>
          </div>

          <button style={exportBtn} onClick={exportExcel}>
            Export Excel
          </button>
        </section>

        <section style={summaryGrid}>
          <SummaryCard title="Outward Sales" value={money(outwardTaxable)} />
          <SummaryCard title="Output GST" value={money(outputGst)} />
          <SummaryCard title="Input GST / ITC" value={money(inputGst)} />
          <SummaryCard title="Net GST Payable" value={money(netPayable)} />
        </section>

        <section style={tableCard}>
          <h2 style={sectionTitle}>GSTR-3B Tax Summary</h2>

          <table style={table}>
            <thead>
              <tr style={thead}>
                <th style={th}>Particulars</th>
                <th style={th}>Amount</th>
              </tr>
            </thead>

            <tbody>
              <Row name="Outward Taxable Sales" value={money(outwardTaxable)} />
              <Row name="Output CGST" value={money(outputCgst)} />
              <Row name="Output SGST" value={money(outputSgst)} />
              <Row name="Output IGST" value={money(outputIgst)} />
              <Row name="Total Output GST" value={money(outputGst)} bold />

              <Row name="Inward Taxable Purchases" value={money(inwardTaxable)} />
              <Row name="Input CGST" value={money(inputCgst)} />
              <Row name="Input SGST" value={money(inputSgst)} />
              <Row name="Input IGST" value={money(inputIgst)} />
              <Row name="Total Input GST / ITC" value={money(inputGst)} bold />

              <Row name="Net CGST Payable" value={money(netCgst)} />
              <Row name="Net SGST Payable" value={money(netSgst)} />
              <Row name="Net IGST Payable" value={money(netIgst)} />
              <Row name="Net GST Payable" value={money(netPayable)} highlight />
            </tbody>
          </table>
        </section>
      </main>
    </AppShell>
  );
}

function SummaryCard({ title, value }: any) {
  return (
    <div style={summaryCard}>
      <div style={summaryTitle}>{title}</div>
      <div style={summaryValue}>{value}</div>
    </div>
  );
}

function Row({ name, value, bold, highlight }: any) {
  return (
    <tr>
      <td style={{ ...td, fontWeight: bold || highlight ? 950 : 700 }}>
        {name}
      </td>
      <td
        style={{
          ...td,
          fontWeight: bold || highlight ? 950 : 700,
          color: highlight ? "#4ade80" : "white",
          fontSize: highlight ? 20 : 16,
        }}
      >
        {value}
      </td>
    </tr>
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
  background: "#16a34a",
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
  borderTop: "4px solid #22c55e",
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
  fontSize: 30,
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
};

const thead: React.CSSProperties = {
  ...positiveTableHead,
};

const th: React.CSSProperties = {
  padding: 16,
  textAlign: "left",
  fontWeight: 950,
};

const td: React.CSSProperties = {
  padding: 16,
  borderBottom: "1px solid rgba(184,134,11,0.16)",
  fontWeight: 700,
};
