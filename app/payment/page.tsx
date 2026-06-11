"use client";

import AppShell from "../components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { handleEnterAdvance } from "../components/useEnterAdvance";
import {
  DEFAULT_BANK_ACCOUNT,
  DEFAULT_CASH_ACCOUNT,
  ensureDefaultAccountStorage,
  isCashMode,
  normalizeAccountMode,
} from "../components/defaultAccounts";
import {
  infoButton,
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

type PaymentRow = {
  id: string;
  date: string;
  dueDate: string;
  supplierName: string;
  invoiceNo: string;
  invoiceAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  source: "Purchase" | "Sales Return" | "Manual";
  rawId?: string;
};

type PaymentMode = "Cash" | "Bank A/C";

export default function PaymentPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [search, setSearch] = useState("");

  const [payRow, setPayRow] = useState<PaymentRow | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState<PaymentMode>(DEFAULT_CASH_ACCOUNT);

  useEffect(() => {
    ensureDefaultAccountStorage();
    loadPayments();
  }, []);

  const getStorageArray = (key: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const saveStorageArray = (key: string, data: any[]) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const getAmount = (x: any) =>
    Number(x.totalAmount || x.grandTotal || x.invoiceAmount || x.amount || 0);

  const loadPayments = () => {
    const purchase = getStorageArray("purchase");
    const salesReturn = getStorageArray("sales-return");
    const manualPayment = getStorageArray("paymentMaster");

    const fromPurchase: PaymentRow[] = purchase.map((x: any) => {
      const invoiceAmount = getAmount(x);
      const paidAmount = Number(x.paidAmount || 0);
      const pendingAmount = Math.max(invoiceAmount - paidAmount, 0);

      return {
        id: `purchase-${x.id || x.invoiceNo}`,
        rawId: String(x.id || x.invoiceNo),
        date: x.date || x.createdAt || new Date().toISOString().slice(0, 10),
        dueDate: x.dueDate || "",
        supplierName: x.supplierName || x.partyName || "Supplier",
        invoiceNo: x.invoiceNo || "-",
        invoiceAmount,
        paidAmount,
        pendingAmount,
        status:
          pendingAmount <= 0 ? "Paid" : paidAmount > 0 ? "Part Paid" : "Not Paid",
        source: "Purchase",
      };
    });

    const fromSalesReturn: PaymentRow[] = salesReturn.map((x: any) => {
      const invoiceAmount = getAmount(x);
      const paidAmount = Number(x.paidAmount || 0);
      const pendingAmount = Math.max(invoiceAmount - paidAmount, 0);

      return {
        id: `sales-return-${x.id || x.returnNo}`,
        rawId: String(x.id || x.returnNo),
        date: x.date || x.createdAt || new Date().toISOString().slice(0, 10),
        dueDate: x.dueDate || "",
        supplierName: x.partyName || x.supplierName || "Customer",
        invoiceNo: x.returnNo || x.invoiceNo || "-",
        invoiceAmount,
        paidAmount,
        pendingAmount,
        status:
          pendingAmount <= 0 ? "Paid" : paidAmount > 0 ? "Part Paid" : "Not Paid",
        source: "Sales Return",
      };
    });

    const manualRows: PaymentRow[] = manualPayment.map((x: any) => {
      const invoiceAmount = getAmount(x);
      const paidAmount = Number(x.paidAmount || 0);
      const pendingAmount = Math.max(invoiceAmount - paidAmount, 0);

      return {
        id: `manual-${x.id || x.invoiceNo || x.referenceNo}`,
        rawId: String(x.id || x.invoiceNo || x.referenceNo),
        date: x.date || new Date().toISOString().slice(0, 10),
        dueDate: x.dueDate || "",
        supplierName: x.supplierName || x.partyName || "Supplier",
        invoiceNo: x.invoiceNo || x.referenceNo || "-",
        invoiceAmount,
        paidAmount,
        pendingAmount,
        status:
          pendingAmount <= 0 ? "Paid" : paidAmount > 0 ? "Part Paid" : "Not Paid",
        source: "Manual",
      };
    });

    setRows([...fromPurchase, ...fromSalesReturn, ...manualRows]);
  };

  const openPayPopup = (row: PaymentRow) => {
    setPayRow(row);
    setPayAmount(String(row.pendingAmount));
    setPayMode(DEFAULT_CASH_ACCOUNT);
  };

  const closePayPopup = () => {
    setPayRow(null);
    setPayAmount("");
    setPayMode(DEFAULT_CASH_ACCOUNT);
  };

  const savePayment = () => {
    if (!payRow) return;

    const amount = Number(payAmount || 0);

    if (!amount || amount <= 0) {
      alert("Enter valid amount");
      return;
    }

    if (amount > payRow.pendingAmount) {
      alert("Paid amount cannot be more than pending amount");
      return;
    }

    const updateInvoiceArray = (key: string) => {
      const arr = getStorageArray(key);

      const updated = arr.map((x: any) => {
        const match =
          String(x.id || x.invoiceNo || x.returnNo || x.referenceNo) === payRow.rawId ||
          String(x.invoiceNo || x.returnNo || x.referenceNo) === payRow.invoiceNo;

        if (!match) return x;

        const invoiceAmount = getAmount(x);
        const newPaid = Number(x.paidAmount || 0) + amount;
        const newPending = Math.max(invoiceAmount - newPaid, 0);

        return {
          ...x,
          paidAmount: newPaid,
          pendingAmount: newPending,
          paymentMode: payMode,
          paymentStatus:
            newPending <= 0 ? "paid" : newPaid > 0 ? "part-paid" : "not-paid",
        };
      });

      saveStorageArray(key, updated);
    };

    if (payRow.source === "Purchase") updateInvoiceArray("purchase");
    if (payRow.source === "Sales Return") updateInvoiceArray("sales-return");
    if (payRow.source === "Manual") updateInvoiceArray("paymentMaster");

    const cashEntries = getStorageArray("cashEntries");
    const bankEntries = getStorageArray("bankEntries");

    const normalizedPayMode = normalizeAccountMode(
      payMode,
      DEFAULT_CASH_ACCOUNT
    ) as PaymentMode;

    const entry = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      source: "Payment",
      invoiceNo: payRow.invoiceNo,
      partyName: payRow.supplierName,
      mode: normalizedPayMode,
      debit: amount,
      credit: 0,
      amount,
      remarks: `Payment made for ${payRow.invoiceNo}`,
      createdAt: new Date().toISOString(),
    };

    if (isCashMode(normalizedPayMode)) {
      saveStorageArray("cashEntries", [...cashEntries, entry]);
      localStorage.setItem(
        "cashInHand",
        String(Number(localStorage.getItem("cashInHand") || 0) - amount)
      );
    } else {
      saveStorageArray("bankEntries", [...bankEntries, entry]);
      localStorage.setItem(
        "bankBalance",
        String(Number(localStorage.getItem("bankBalance") || 0) - amount)
      );
    }

    alert("Payment updated successfully");
    closePayPopup();
    loadPayments();
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return rows.filter(
      (x) =>
        x.supplierName.toLowerCase().includes(q) ||
        x.invoiceNo.toLowerCase().includes(q) ||
        x.status.toLowerCase().includes(q) ||
        x.source.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totalInvoice = filtered.reduce((sum, x) => sum + x.invoiceAmount, 0);
  const totalPaid = filtered.reduce((sum, x) => sum + x.paidAmount, 0);
  const totalPending = filtered.reduce((sum, x) => sum + x.pendingAmount, 0);

  const money = (v: any) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  return (
    <AppShell>
      <main style={page}>
        <section style={hero}>
          <div>
            <h1 style={title}>Payment Master</h1>
            <p style={sub}>Pending supplier payments and purchase dues.</p>
          </div>

          <div style={heroActions}>
            <button style={refreshBtn} onClick={loadPayments}>
              Refresh
            </button>
          </div>
        </section>

        <section style={summaryGrid}>
          <Summary title="Invoice Amount" value={money(totalInvoice)} color="#60a5fa" />
          <Summary title="Paid" value={money(totalPaid)} color="#22c55e" />
          <Summary title="Pending Payment" value={money(totalPending)} color="#ef4444" />
        </section>

        <section style={card}>
          <div style={tableTop}>
            <h2 style={sectionTitle}>Payment Entries</h2>

            <input
              style={input}
              placeholder="Search supplier / invoice / status"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr style={thead}>
                  <th style={th}>Date</th>
                  <th style={th}>Source</th>
                  <th style={th}>Invoice</th>
                  <th style={th}>Due Date</th>
                  <th style={th}>Supplier</th>
                  <th style={th}>Invoice Amount</th>
                  <th style={th}>Paid</th>
                  <th style={th}>Pending</th>
                  <th style={th}>Status</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={10}>
                      No payment entries found
                    </td>
                  </tr>
                ) : (
                  filtered.map((x) => (
                    <tr key={x.id} style={tr}>
                      <td style={td}>{formatDate(x.date)}</td>
                      <td style={td}>{x.source}</td>
                      <td style={td}>{x.invoiceNo}</td>
                      <td style={td}>{x.dueDate ? formatDate(x.dueDate) : "-"}</td>
                      <td style={td}>{x.supplierName}</td>
                      <td style={td}>{money(x.invoiceAmount)}</td>
                      <td style={{ ...td, color: "#15803d", fontWeight: 900 }}>{money(x.paidAmount)}</td>
                      <td style={{ ...td, color: "#b91c1c", fontWeight: 950 }}>
                        {money(x.pendingAmount)}
                      </td>
                      <td style={td}>
                        <span style={statusBadge(x.status)}>{x.status}</span>
                      </td>
                      <td style={td}>
                        {x.pendingAmount > 0 && (
                          <button style={payBtn} onClick={() => openPayPopup(x)}>
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {payRow && (
          <div style={modalOverlay}>
            <div style={modalBox} onKeyDown={handleEnterAdvance}>
              <h2 style={modalTitle}>Pay Amount</h2>

              <p style={modalText}>
                Invoice: <b>{payRow.invoiceNo}</b>
              </p>
              <p style={modalText}>
                Pending: <b>{money(payRow.pendingAmount)}</b>
              </p>

              <label style={label}>Amount Paid</label>
              <input
                style={modalInput}
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />

              <label style={label}>Paid Through</label>
              <select
                style={modalInput}
                value={payMode}
                onChange={(e) =>
                  setPayMode(
                    normalizeAccountMode(
                      e.target.value,
                      DEFAULT_CASH_ACCOUNT
                    ) as PaymentMode
                  )
                }
              >
                <option value={DEFAULT_CASH_ACCOUNT}>{DEFAULT_CASH_ACCOUNT}</option>
                <option value={DEFAULT_BANK_ACCOUNT}>{DEFAULT_BANK_ACCOUNT}</option>
              </select>

              <div style={modalActions}>
                <button
                  style={cancelBtn}
                  onClick={closePayPopup}
                  data-enter-skip="true"
                >
                  Cancel
                </button>

                <button style={saveBtn} onClick={savePayment}>
                  Save Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function Summary({ title, value, color }: any) {
  return (
    <div style={{ ...summaryCard, borderTop: `5px solid ${color}` }}>
      <p style={summaryLabel}>{title}</p>
      <h2 style={summaryValue}>{value}</h2>
    </div>
  );
}

function formatDate(date: string) {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN");
}

function statusBadge(status: string): React.CSSProperties {
  const isPaid = status === "Paid";
  const isPart = status === "Part Paid";

  return {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: 999,
    color: "white",
    fontWeight: 900,
    background: isPaid ? "#22c55e" : isPart ? "#f59e0b" : "#ef4444",
  };
}

const page: React.CSSProperties = {
  ...positivePage,
  minHeight: "100vh",
  padding: "26px",
};

const hero: React.CSSProperties = {
  ...positiveHeroCard,
  borderRadius: 24,
  padding: 36,
  marginBottom: 24,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 42,
  fontWeight: 950,
  color: positiveHeading,
};

const sub: React.CSSProperties = {
  marginTop: 10,
  color: positiveMuted,
  fontWeight: 800,
};

const heroActions: React.CSSProperties = {
  display: "flex",
  gap: 14,
};

const refreshBtn: React.CSSProperties = {
  ...paleButton,
  padding: "14px 22px",
};

const summaryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 20,
  marginBottom: 24,
};

const summaryCard: React.CSSProperties = {
  ...positivePanel,
  borderRadius: 18,
  padding: 24,
};

const summaryLabel: React.CSSProperties = {
  margin: 0,
  fontWeight: 900,
  color: positiveMuted,
};

const summaryValue: React.CSSProperties = {
  fontSize: "clamp(1.8rem, 2.9vw, 2.5rem)",
  marginBottom: 0,
  lineHeight: 1.15,
  overflowWrap: "anywhere",
};

const card: React.CSSProperties = {
  ...positivePanel,
  borderRadius: 22,
  padding: 28,
};

const tableTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 20,
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 950,
};

const input: React.CSSProperties = {
  ...positiveInputStrong,
  width: 330,
  height: 52,
  borderRadius: 14,
  padding: "0 16px",
  fontWeight: 800,
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
  padding: 14,
  textAlign: "left",
  fontWeight: 950,
};

const tr: React.CSSProperties = {
  borderBottom: "1px solid rgba(184,134,11,0.16)",
};

const td: React.CSSProperties = {
  padding: 14,
  fontWeight: 800,
  fontVariantNumeric: "tabular-nums",
};

const payBtn: React.CSSProperties = {
  ...infoButton,
  padding: "10px 16px",
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "grid",
  placeItems: "center",
  zIndex: 9999,
};

const modalBox: React.CSSProperties = {
  width: 430,
  background: "white",
  borderRadius: 20,
  padding: 28,
  color: "#111827",
  boxShadow: "0 25px 70px rgba(0,0,0,0.35)",
};

const modalTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 30,
  fontWeight: 950,
};

const modalText: React.CSSProperties = {
  fontWeight: 800,
};

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 900,
  marginTop: 16,
  marginBottom: 8,
};

const modalInput: React.CSSProperties = {
  width: "100%",
  height: 52,
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  padding: "0 14px",
  fontSize: 17,
  fontWeight: 800,
};

const modalActions: React.CSSProperties = {
  display: "flex",
  gap: 12,
  marginTop: 22,
};

const cancelBtn: React.CSSProperties = {
  flex: 1,
  height: 50,
  ...paleButton,
};

const saveBtn: React.CSSProperties = {
  flex: 1,
  height: 50,
  ...successButton,
};
