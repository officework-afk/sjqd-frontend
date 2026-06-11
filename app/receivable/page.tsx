"use client";

import AppShell from "../components/AppShell";
import { useEffect, useMemo, useState } from "react";
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

type ReceivableRow = {
  id: string;
  date: string;
  dueDate: string;
  customerName: string;
  invoiceNo: string;
  invoiceAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  status: string;
  source: "Sales" | "Purchase Return" | "Manual";
  rawId?: string;
};

type ReceiveMode = "Cash" | "Bank A/C";

export default function ReceivablePage() {
  const [rows, setRows] = useState<ReceivableRow[]>([]);
  const [search, setSearch] = useState("");

  const [receiveRow, setReceiveRow] = useState<ReceivableRow | null>(null);
  const [cashReceiveAmount, setCashReceiveAmount] = useState("");
  const [bankReceiveAmount, setBankReceiveAmount] = useState("");

  useEffect(() => {
    ensureDefaultAccountStorage();
    loadReceivables();
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

  const getInvoiceNo = (x: any) =>
    x.invoiceNo || x.returnNo || x.referenceNo || "-";

  const getPaymentStatus = (
    endpoint: string,
    invoiceNo: string,
    rawId?: string
  ) => {
    try {
      const store = JSON.parse(
        localStorage.getItem("invoicePaymentStatus") || "{}"
      );

      const byInvoiceNo = store[`${endpoint}:${invoiceNo}`];
      const byRawId = rawId ? store[`${endpoint}:${rawId}`] : null;
      const entry = byInvoiceNo || byRawId;

      if (entry) {
        return {
          paidAmount: Number(entry.paidAmount || 0),
          found: true,
        };
      }
    } catch {}

    return { paidAmount: 0, found: false };
  };

  const loadReceivables = () => {
    const sales = getStorageArray("sales");
    const purchaseReturn = getStorageArray("purchase-return");
    const manualReceivable = getStorageArray("receivableMaster");

    const fromSales: ReceivableRow[] = sales.map((x: any) => {
      const invoiceAmount = getAmount(x);
      const invoiceNo = getInvoiceNo(x);
      const rawId = String(x.id || invoiceNo);

      const { paidAmount: statusPaid } = getPaymentStatus(
        "sales",
        invoiceNo,
        rawId
      );

      const directReceived = Number(
        x.receivedAmount ||
          x.paidAmount ||
          x.amountReceived ||
          x.amtReceived ||
          x.received ||
          0
      );

      const receivedAmount = Math.max(statusPaid, directReceived);
      const pendingAmount = Math.max(invoiceAmount - receivedAmount, 0);

      return {
        id: `sales-${rawId}`,
        rawId,
        date: x.date || x.createdAt || new Date().toISOString().slice(0, 10),
        dueDate: x.dueDate || "",
        customerName: x.partyName || x.customerName || "Customer",
        invoiceNo,
        invoiceAmount,
        receivedAmount,
        pendingAmount,
        status:
          pendingAmount <= 0
            ? "Received"
            : receivedAmount > 0
            ? "Part Received"
            : "Not Received",
        source: "Sales",
      };
    });

    const fromPurchaseReturn: ReceivableRow[] = purchaseReturn.map((x: any) => {
      const invoiceAmount = getAmount(x);
      const invoiceNo = getInvoiceNo(x);
      const rawId = String(x.id || invoiceNo);

      const { paidAmount: statusPaid } = getPaymentStatus(
        "purchase-return",
        invoiceNo,
        rawId
      );

      const directReceived = Number(
        x.receivedAmount ||
          x.paidAmount ||
          x.amountReceived ||
          x.amtReceived ||
          x.received ||
          0
      );

      const receivedAmount = Math.max(statusPaid, directReceived);
      const pendingAmount = Math.max(invoiceAmount - receivedAmount, 0);

      return {
        id: `purchase-return-${rawId}`,
        rawId,
        date: x.date || x.createdAt || new Date().toISOString().slice(0, 10),
        dueDate: x.dueDate || "",
        customerName: x.supplierName || x.partyName || "Supplier",
        invoiceNo,
        invoiceAmount,
        receivedAmount,
        pendingAmount,
        status:
          pendingAmount <= 0
            ? "Received"
            : receivedAmount > 0
            ? "Part Received"
            : "Not Received",
        source: "Purchase Return",
      };
    });

    const salesInvoiceNos = new Set(fromSales.map((r) => r.invoiceNo));
    const purchaseReturnNos = new Set(
      fromPurchaseReturn.map((r) => r.invoiceNo)
    );

    const manualRows: ReceivableRow[] = manualReceivable
      .filter((x: any) => {
        const invNo = getInvoiceNo(x);
        return !salesInvoiceNos.has(invNo) && !purchaseReturnNos.has(invNo);
      })
      .map((x: any) => {
        const invoiceAmount = getAmount(x);
        const invoiceNo = getInvoiceNo(x);

        const receivedAmount = Number(
          x.received ||
            x.receivedAmount ||
            x.paidAmount ||
            x.amountReceived ||
            x.amtReceived ||
            0
        );

        const pendingAmount = Number(
          x.balance ||
            x.pendingAmount ||
            Math.max(invoiceAmount - receivedAmount, 0)
        );

        return {
          id: `manual-${x.id || invoiceNo}`,
          rawId: String(x.id || invoiceNo),
          date: x.date || new Date().toISOString().slice(0, 10),
          dueDate: x.dueDate || "",
          customerName: x.customerName || x.partyName || "Customer",
          invoiceNo,
          invoiceAmount,
          receivedAmount,
          pendingAmount,
          status:
            pendingAmount <= 0
              ? "Received"
              : receivedAmount > 0
              ? "Part Received"
              : "Not Received",
          source: "Manual",
        };
      });

    const all = [...fromSales, ...fromPurchaseReturn, ...manualRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setRows(all);
  };

  const openReceivePopup = (row: ReceivableRow) => {
    setReceiveRow(row);
    setCashReceiveAmount("");
    setBankReceiveAmount("");
  };

  const closeReceivePopup = () => {
    setReceiveRow(null);
    setCashReceiveAmount("");
    setBankReceiveAmount("");
  };

  const saveReceive = () => {
    if (!receiveRow) return;

    const cashAmount = Number(cashReceiveAmount || 0);
    const bankAmount = Number(bankReceiveAmount || 0);
    const amount = cashAmount + bankAmount;

    if (cashAmount < 0 || bankAmount < 0) {
      alert("Amount cannot be negative");
      return;
    }

    if (!amount || amount <= 0) {
      alert("Enter valid received amount");
      return;
    }

    if (amount > receiveRow.pendingAmount) {
      alert("Cash + Bank amount cannot be more than pending amount");
      return;
    }

    const finalReceivedAmount = receiveRow.receivedAmount + amount;
    const finalPendingAmount = Math.max(
      receiveRow.invoiceAmount - finalReceivedAmount,
      0
    );

    const finalStatus =
      finalPendingAmount <= 0
        ? "Received"
        : finalReceivedAmount > 0
        ? "Part Received"
        : "Not Received";

    const updateInvoiceArray = (key: string) => {
      const arr = getStorageArray(key);

      const updated = arr.map((x: any) => {
        const invoiceNo = getInvoiceNo(x);
        const match =
          String(x.id || invoiceNo) === receiveRow.rawId ||
          String(invoiceNo) === receiveRow.invoiceNo;

        if (!match) return x;

        return {
          ...x,

          received: finalReceivedAmount,
          receivedAmount: finalReceivedAmount,
          paidAmount: finalReceivedAmount,
          amountReceived: finalReceivedAmount,
          amtReceived: finalReceivedAmount,

          balance: finalPendingAmount,
          pendingAmount: finalPendingAmount,

          cashReceived: Number(x.cashReceived || 0) + cashAmount,
          bankReceived: Number(x.bankReceived || 0) + bankAmount,

          paymentMode:
            cashAmount > 0 && bankAmount > 0
              ? "Cash + Bank A/C"
              : cashAmount > 0
              ? DEFAULT_CASH_ACCOUNT
              : DEFAULT_BANK_ACCOUNT,

          paymentStatus:
            finalPendingAmount <= 0
              ? "received"
              : finalReceivedAmount > 0
              ? "part-received"
              : "not-received",
        };
      });

      saveStorageArray(key, updated);
    };

    if (receiveRow.source === "Sales") updateInvoiceArray("sales");
    if (receiveRow.source === "Purchase Return")
      updateInvoiceArray("purchase-return");
    if (receiveRow.source === "Manual") updateInvoiceArray("receivableMaster");

    const endpointMap: Record<string, string> = {
      Sales: "sales",
      "Purchase Return": "purchase-return",
      Manual: "manual",
    };

    const endpoint = endpointMap[receiveRow.source] || "manual";

    const store = JSON.parse(
      localStorage.getItem("invoicePaymentStatus") || "{}"
    );

    store[`${endpoint}:${receiveRow.invoiceNo}`] = {
      paidAmount: finalReceivedAmount,
      totalAmount: receiveRow.invoiceAmount,
      cashReceived:
        Number(store[`${endpoint}:${receiveRow.invoiceNo}`]?.cashReceived || 0) +
        cashAmount,
      bankReceived:
        Number(store[`${endpoint}:${receiveRow.invoiceNo}`]?.bankReceived || 0) +
        bankAmount,
      status: finalStatus,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("invoicePaymentStatus", JSON.stringify(store));

    if (cashAmount > 0) {
      saveStorageArray("cashMaster", [
        {
          id: Date.now(),
          date: new Date().toISOString().slice(0, 10),
          invoiceNo: receiveRow.invoiceNo,
          amount: cashAmount,
          type: "credit",
          partyName: receiveRow.customerName,
          mode: DEFAULT_CASH_ACCOUNT,
          referenceNo: receiveRow.invoiceNo,
          remarks: `Cash received for ${receiveRow.invoiceNo}`,
        },
        ...getStorageArray("cashMaster"),
      ]);

      saveStorageArray("cashEntries", [
        ...getStorageArray("cashEntries"),
        {
          id: Date.now(),
          date: new Date().toISOString().slice(0, 10),
          source: "Receivable",
          invoiceNo: receiveRow.invoiceNo,
          partyName: receiveRow.customerName,
          mode: DEFAULT_CASH_ACCOUNT,
          debit: 0,
          credit: cashAmount,
          amount: cashAmount,
          remarks: `Cash received for ${receiveRow.invoiceNo}`,
          createdAt: new Date().toISOString(),
        },
      ]);

      localStorage.setItem(
        "cashInHand",
        String(Number(localStorage.getItem("cashInHand") || 0) + cashAmount)
      );
    }

    if (bankAmount > 0) {
      saveStorageArray("bankEntries", [
        ...getStorageArray("bankEntries"),
        {
          id: Date.now() + 1,
          date: new Date().toISOString().slice(0, 10),
          source: "Receivable",
          invoiceNo: receiveRow.invoiceNo,
          partyName: receiveRow.customerName,
          mode: DEFAULT_BANK_ACCOUNT,
          debit: 0,
          credit: bankAmount,
          amount: bankAmount,
          remarks: `Bank received for ${receiveRow.invoiceNo}`,
          createdAt: new Date().toISOString(),
        },
      ]);

      localStorage.setItem(
        "bankBalance",
        String(Number(localStorage.getItem("bankBalance") || 0) + bankAmount)
      );
    }

    alert("Receivable updated successfully");
    closeReceivePopup();
    loadReceivables();
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (x) =>
        x.customerName.toLowerCase().includes(q) ||
        x.invoiceNo.toLowerCase().includes(q) ||
        x.status.toLowerCase().includes(q) ||
        x.source.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totalInvoice = filtered.reduce((sum, x) => sum + x.invoiceAmount, 0);
  const totalReceived = filtered.reduce((sum, x) => sum + x.receivedAmount, 0);
  const totalPending = filtered.reduce((sum, x) => sum + x.pendingAmount, 0);

  const money = (v: any) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  return (
    <AppShell>
      <main style={page}>
        <section style={hero}>
          <div>
            <h1 style={titleStyle}>Receivable Master</h1>
            <p style={sub}>
              Pending customer collections from sales and purchase returns.
            </p>
          </div>
          <div style={heroActions}>
            <button style={refreshBtn} onClick={loadReceivables}>
              Refresh
            </button>
          </div>
        </section>

        <section style={summaryGrid}>
          <Summary
            title="Invoice Amount"
            value={money(totalInvoice)}
            color="#60a5fa"
          />
          <Summary title="Received" value={money(totalReceived)} color="#22c55e" />
          <Summary
            title="Pending Receivable"
            value={money(totalPending)}
            color="#ef4444"
          />
        </section>

        <section style={card}>
          <div style={tableTop}>
            <h2 style={sectionTitle}>Receivable Entries</h2>
            <input
              style={input}
              placeholder="Search customer / invoice / status"
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
                  <th style={th}>Invoice No</th>
                  <th style={th}>Due Date</th>
                  <th style={th}>Customer</th>
                  <th style={th}>Invoice Amount</th>
                  <th style={th}>Received</th>
                  <th style={th}>Pending</th>
                  <th style={th}>Status</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={10}>
                      No receivables found
                    </td>
                  </tr>
                ) : (
                  filtered.map((x) => (
                    <tr key={x.id} style={tr}>
                      <td style={td}>{formatDate(x.date)}</td>
                      <td style={td}>{x.source}</td>
                      <td style={td}>{x.invoiceNo}</td>
                      <td style={td}>
                        {x.dueDate ? formatDate(x.dueDate) : "-"}
                      </td>
                      <td style={td}>{x.customerName}</td>
                      <td style={td}>{money(x.invoiceAmount)}</td>
                      <td style={{ ...td, color: "#15803d", fontWeight: 900 }}>
                        {money(x.receivedAmount)}
                      </td>
                      <td style={{ ...td, color: "#b91c1c", fontWeight: 950 }}>
                        {money(x.pendingAmount)}
                      </td>
                      <td style={td}>
                        <span style={statusBadge(x.status)}>{x.status}</span>
                      </td>
                      <td style={td}>
                        {x.pendingAmount > 0 && (
                          <button
                            style={receiveBtn}
                            onClick={() => openReceivePopup(x)}
                          >
                            Receive
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

        {receiveRow && (
          <div style={modalOverlay}>
            <div style={modalBox}>
              <h2 style={modalTitle}>Receive Amount</h2>

              <p style={modalText}>
                Invoice: <b>{receiveRow.invoiceNo}</b>
              </p>

              <p style={modalText}>
                Invoice Total: <b>{money(receiveRow.invoiceAmount)}</b>
              </p>

              <p style={modalText}>
                Already Received:{" "}
                <b style={{ color: "#15803d" }}>
                  {money(receiveRow.receivedAmount)}
                </b>
              </p>

              <p style={modalText}>
                Pending:{" "}
                <b style={{ color: "#b91c1c" }}>
                  {money(receiveRow.pendingAmount)}
                </b>
              </p>

              <label style={label}>Cash Received</label>
              <input
                style={modalInput}
                type="number"
                value={cashReceiveAmount}
                autoFocus
                placeholder="Enter cash amount"
                onChange={(e) => setCashReceiveAmount(e.target.value)}
              />

              <label style={label}>Bank Received</label>
              <input
                style={modalInput}
                type="number"
                value={bankReceiveAmount}
                placeholder="Enter bank amount"
                onChange={(e) => setBankReceiveAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveReceive();
                }}
              />

              <p style={totalLine}>
                Total Receiving Now:{" "}
                <b>
                  {money(
                    Number(cashReceiveAmount || 0) +
                      Number(bankReceiveAmount || 0)
                  )}
                </b>
              </p>

              <div style={modalActions}>
                <button style={cancelBtn} onClick={closeReceivePopup}>
                  Cancel
                </button>
                <button style={saveBtn} onClick={saveReceive}>
                  Save Receipt
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
  const isReceived = status === "Received";
  const isPart = status === "Part Received";

  return {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: 999,
    color: "white",
    fontWeight: 900,
    background: isReceived ? "#22c55e" : isPart ? "#f59e0b" : "#ef4444",
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

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 42,
  fontWeight: 950,
  color: positiveHeading,
};

const sub: React.CSSProperties = {
  marginTop: 10,
  fontWeight: 800,
  color: positiveMuted,
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
  color: positiveText,
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

const thead: React.CSSProperties = positiveTableHead;

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

const receiveBtn: React.CSSProperties = {
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
  width: 460,
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
  marginBottom: 12,
};

const modalText: React.CSSProperties = {
  fontWeight: 800,
  marginBottom: 4,
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
  boxSizing: "border-box" as const,
};

const totalLine: React.CSSProperties = {
  marginTop: 14,
  fontWeight: 900,
  color: "#111827",
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