"use client";

import AppShell from "../components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { API_BASE_URL } from "../lib/api";
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

const API = API_BASE_URL;

export default function StockSummaryPage() {
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [it, s, p, sr, pr] = await Promise.all([
        fetch(`${API}/items`).then((r) => r.json()),
        fetch(`${API}/sales`).then((r) => r.json()),
        fetch(`${API}/purchase`).then((r) => r.json()),
        fetch(`${API}/sales-return`).then((r) => r.json()),
        fetch(`${API}/purchase-return`).then((r) => r.json()),
      ]);

      setItems(Array.isArray(it) ? it : []);
      setSales(Array.isArray(s) ? s : []);
      setPurchases(Array.isArray(p) ? p : []);
      setSalesReturns(Array.isArray(sr) ? sr : []);
      setPurchaseReturns(Array.isArray(pr) ? pr : []);
    } catch {
      setItems([]);
      setSales([]);
      setPurchases([]);
      setSalesReturns([]);
      setPurchaseReturns([]);
    }
  };

  const qtySum = (rows: any[], itemName: string) =>
    rows
      .filter((r) => String(r.itemName).toLowerCase() === String(itemName).toLowerCase())
      .reduce((sum, r) => sum + Number(r.quantity || 0), 0);

  const stockRows = useMemo(() => {
    return items
      .map((item, index) => {
        const itemName = item.itemName;

        const purchaseQty = qtySum(purchases, itemName);
        const salesQty = qtySum(sales, itemName);
        const salesReturnQty = qtySum(salesReturns, itemName);
        const purchaseReturnQty = qtySum(purchaseReturns, itemName);

        const currentStock = Number(item.currentStock || 0);
        const rate = Number(item.lastPurchaseRate || item.purchaseRate || 0);
        const stockValue = currentStock * rate;

        const openingStock =
          currentStock - purchaseQty - salesReturnQty + salesQty + purchaseReturnQty;

        let status = "In Stock";
        if (currentStock <= 0) status = "Out of Stock";
        else if (currentStock <= 10) status = "Low Stock";

        return {
          siNo: index + 1,
          itemName,
          openingStock,
          purchaseQty,
          salesQty,
          salesReturnQty,
          purchaseReturnQty,
          currentStock,
          rate,
          stockValue,
          status,
        };
      })
      .filter((r) =>
        r.itemName.toLowerCase().includes(search.toLowerCase())
      );
  }, [items, purchases, sales, salesReturns, purchaseReturns, search]);

  const totalStockValue = stockRows.reduce(
    (sum, r) => sum + Number(r.stockValue || 0),
    0
  );

  const totalItems = stockRows.length;
  const lowStockCount = stockRows.filter((r) => r.status === "Low Stock").length;
  const outOfStockCount = stockRows.filter((r) => r.status === "Out of Stock").length;

  const money = (n: any) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const exportExcel = () => {
    const data = stockRows.map((r) => ({
      "SI No": r.siNo,
      "Item Name": r.itemName,
      "Opening Stock": r.openingStock,
      Purchase: r.purchaseQty,
      Sales: r.salesQty,
      "Sales Return": r.salesReturnQty,
      "Purchase Return": r.purchaseReturnQty,
      "Current Stock": r.currentStock,
      "Last Purchase Rate": r.rate,
      "Stock Value": r.stockValue,
      Status: r.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Stock Summary");
    XLSX.writeFile(wb, "Stock_Summary_Report.xlsx");
  };

  const printReport = () => {
    const rowsHtml = stockRows
      .map(
        (r) => `
          <tr>
            <td>${r.siNo}</td>
            <td>${r.itemName}</td>
            <td>${r.openingStock}</td>
            <td>${r.purchaseQty}</td>
            <td>${r.salesQty}</td>
            <td>${r.salesReturnQty}</td>
            <td>${r.purchaseReturnQty}</td>
            <td>${r.currentStock}</td>
            <td>${money(r.rate)}</td>
            <td>${money(r.stockValue)}</td>
            <td>${r.status}</td>
          </tr>
        `
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head>
        <title>Stock Summary Report</title>
        <style>
          body { font-family: Cambria, Georgia, 'Times New Roman', serif; padding: 24px; color: #111827; }
          h1 { color: #5f4300; margin-bottom: 4px; }
          .sub { color: #6b7280; margin-bottom: 20px; }
          .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .card { border: 1px solid #ddd; padding: 14px; border-radius: 8px; }
          .card b { display:block; font-size: 22px; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #5f4300; color: white; padding: 8px; border: 1px solid #ddd; text-align: left; }
          td { padding: 8px; border: 1px solid #ddd; }
          button { margin-bottom: 18px; padding: 12px 20px; border: none; background: #16a34a; color: white; border-radius: 8px; font-weight: bold; cursor: pointer; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Print / Save PDF</button>
        <h1>Stock Summary Report</h1>
        <div class="sub">Generated on ${new Date().toLocaleString("en-IN")}</div>

        <div class="cards">
          <div class="card">Total Items <b>${totalItems}</b></div>
          <div class="card">Stock Value <b>${money(totalStockValue)}</b></div>
          <div class="card">Low Stock <b>${lowStockCount}</b></div>
          <div class="card">Out of Stock <b>${outOfStockCount}</b></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>SI No</th>
              <th>Item Name</th>
              <th>Opening</th>
              <th>Purchase</th>
              <th>Sales</th>
              <th>Sales Return</th>
              <th>Purchase Return</th>
              <th>Current Stock</th>
              <th>Rate</th>
              <th>Stock Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <AppShell>
      <main style={page}>
        <section style={header}>
          <div>
            <h1 style={title}>Stock Summary</h1>
            <p style={subTitle}>Complete inventory movement and valuation report</p>
          </div>

          <div style={actions}>
            <button style={greenBtn} onClick={exportExcel}>
              Export Excel
            </button>
            <button style={goldBtn} onClick={printReport}>
              Print / PDF
            </button>
            <button style={darkBtn} onClick={() => router.push("/dashboard")}>
              Dashboard
            </button>
          </div>
        </section>

        <section style={cards}>
          <SummaryCard title="Total Items" value={String(totalItems)} color="#22c55e" />
          <SummaryCard title="Stock Value" value={money(totalStockValue)} color="#b8860b" />
          <SummaryCard title="Low Stock" value={String(lowStockCount)} color="#f59e0b" />
          <SummaryCard title="Out of Stock" value={String(outOfStockCount)} color="#ef4444" />
        </section>

        <section style={tableCard}>
          <div style={tableHeader}>
            <h2 style={tableTitle}>Inventory Details</h2>

            <input
              style={searchInput}
              placeholder="Search item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr style={thead}>
                  <th style={th}>SI No</th>
                  <th style={th}>Item Name</th>
                  <th style={th}>Opening Stock</th>
                  <th style={th}>Purchase</th>
                  <th style={th}>Sales</th>
                  <th style={th}>Sales Return</th>
                  <th style={th}>Purchase Return</th>
                  <th style={th}>Current Stock</th>
                  <th style={th}>Rate</th>
                  <th style={th}>Stock Value</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {stockRows.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={11}>
                      No stock found
                    </td>
                  </tr>
                ) : (
                  stockRows.map((r) => (
                    <tr key={r.itemName} style={tr}>
                      <td style={td}>{r.siNo}</td>
                      <td style={td}>{r.itemName}</td>
                      <td style={td}>{r.openingStock}</td>
                      <td style={td}>{r.purchaseQty}</td>
                      <td style={td}>{r.salesQty}</td>
                      <td style={td}>{r.salesReturnQty}</td>
                      <td style={td}>{r.purchaseReturnQty}</td>
                  <td style={td}>
                    <span
                      style={{
                        fontWeight: 950,
                        fontSize: 18,
                        padding: "8px 14px",
                        borderRadius: 12,
                        background:
                          Number(r.currentStock) < 0
                            ? "#ef4444"
                            : Number(r.currentStock) === 0
                            ? "#f59e0b"
                            : "#22c55e",
                        color: "white",
                        display: "inline-block",
                        minWidth: 70,
                        textAlign: "center",
                      }}
                    >
                      {r.currentStock}
                    </span>
                  </td>
                      <td style={td}>{money(r.rate)}</td>
                      <td style={td}>{money(r.stockValue)}</td>
                      <td style={td}>
                        <span
                          style={{
                            ...statusBadge,
                            background:
                              r.status === "In Stock"
                                ? "#16a34a"
                                : r.status === "Low Stock"
                                ? "#f59e0b"
                                : "#dc2626",
                          }}
                        >
                          {r.status}
                        </span>
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
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{ ...summaryCard, borderTop: `5px solid ${color}` }}>
      <p style={cardTitle}>{title}</p>
      <h2 style={cardValue}>{value}</h2>
    </div>
  );
}

const page: React.CSSProperties = {
  ...positivePage,
  minHeight: "100vh",
  padding: "28px",
  color: positiveText,
};

const header: React.CSSProperties = {
  ...positiveHeroCard,
  borderRadius: "26px",
  padding: "34px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "22px",
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: "34px",
  fontWeight: 950,
  color: positiveHeading,
};

const subTitle: React.CSSProperties = {
  margin: "8px 0 0",
  color: positiveMuted,
  fontSize: "16px",
};

const actions: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const greenBtn: React.CSSProperties = {
  ...successButton,
  padding: "14px 20px",
};

const goldBtn: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  background: "linear-gradient(135deg,#b8860b,#facc15)",
  color: "#1f1700",
  padding: "14px 20px",
  fontWeight: 900,
  cursor: "pointer",
};

const darkBtn: React.CSSProperties = {
  ...paleButton,
  padding: "14px 20px",
};

const cards: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "18px",
  marginBottom: "22px",
};

const summaryCard: React.CSSProperties = {
  ...positivePanel,
  borderRadius: "20px",
  padding: "24px",
};

const cardTitle: React.CSSProperties = {
  margin: 0,
  color: positiveMuted,
  fontSize: "14px",
  fontWeight: 900,
};

const cardValue: React.CSSProperties = {
  margin: "16px 0 0",
  fontSize: "30px",
  fontWeight: 950,
  color: positiveHeading,
};

const tableCard: React.CSSProperties = {
  ...positivePanel,
  borderRadius: "24px",
  padding: "28px",
};

const tableHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "18px",
};

const tableTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "22px",
};

const searchInput: React.CSSProperties = {
  ...positiveInputStrong,
  width: "320px",
  height: "48px",
  borderRadius: "12px",
  padding: "0 16px",
  outline: "none",
  fontSize: "15px",
};

const table: React.CSSProperties = {
  width: "100%",
  minWidth: "1350px",
  borderCollapse: "collapse",
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

const statusBadge: React.CSSProperties = {
  color: "white",
  padding: "7px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 900,
};
