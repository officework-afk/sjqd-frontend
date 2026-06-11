"use client";

import AppShell from "../components/AppShell";
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CASH_ACCOUNT,
  ensureDefaultAccountStorage,
  normalizeAccountMode,
} from "../components/defaultAccounts";
import {
  dangerButton,
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

type CashEntry = {
  id: number;
  date: string;
  invoiceNo: string;
  partyName: string;
  amount: number;
  type: "debit" | "credit";
  mode?: string;
  remarks?: string;
  source?: string;
};

const STORAGE_KEY = "cashMaster";

export default function CashPage() {
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    ensureDefaultAccountStorage();
    loadCash();
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

  const normalizeEntry = (e: any): CashEntry => {
    const debit = Number(e.debit || 0);
    const credit = Number(e.credit || 0);
    const type: "debit" | "credit" =
      e.type === "debit" || debit > 0 ? "debit" : "credit";

    return {
      id: Number(e.id || Date.now() + Math.random()),
      date: e.date || new Date().toLocaleDateString("en-IN"),
      invoiceNo: e.invoiceNo || e.referenceNo || "-",
      partyName: e.partyName || e.customerName || e.supplierName || "-",
      amount: Number(e.amount || debit || credit || 0),
      type,
      mode: normalizeAccountMode(e.mode, DEFAULT_CASH_ACCOUNT),
      remarks: e.remarks || e.source || "-",
      source: e.source || DEFAULT_CASH_ACCOUNT,
    };
  };

  const loadCash = () => {
    const cashMaster = getStorageArray("cashMaster").map(normalizeEntry);
    const cashEntries = getStorageArray("cashEntries").map(normalizeEntry);

    const mergedMap = new Map<string, CashEntry>();

    [...cashMaster, ...cashEntries].forEach((e) => {
      const key = `${e.id}-${e.invoiceNo}-${e.amount}-${e.type}`;
      mergedMap.set(key, e);
    });

    const merged = Array.from(mergedMap.values());

    setEntries(merged);
    saveStorageArray(STORAGE_KEY, merged);
  };

  const money = (v: any) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return entries.filter((e) => {
      const matchSearch =
        String(e.invoiceNo || "").toLowerCase().includes(q) ||
        String(e.partyName || "").toLowerCase().includes(q) ||
        String(e.remarks || "").toLowerCase().includes(q) ||
        String(e.mode || "").toLowerCase().includes(q);

      const matchType = filterType === "all" || e.type === filterType;

      return matchSearch && matchType;
    });
  }, [entries, search, filterType]);

  const totalDebit = filtered
    .filter((e) => e.type === "debit")
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const totalCredit = filtered
    .filter((e) => e.type === "credit")
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const balance = totalCredit - totalDebit;

  const deleteEntry = (id: number) => {
    if (!confirm("Delete this cash entry?")) return;

    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveStorageArray(STORAGE_KEY, updated);
    saveStorageArray("cashEntries", updated);
    localStorage.setItem("cashInHand", String(getBalance(updated)));
  };

  const getBalance = (arr: CashEntry[]) => {
    const credit = arr
      .filter((e) => e.type === "credit")
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    const debit = arr
      .filter((e) => e.type === "debit")
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    return credit - debit;
  };

  const exportCSV = () => {
    let running = 0;

    const headers = [
      "Date",
      "Voucher Type",
      "Invoice No",
      "Party Name",
      "Debit",
      "Credit",
      "Balance",
      "Mode",
      "Remarks",
    ];

    const rows = filtered.map((e) => {
      const debit = e.type === "debit" ? Number(e.amount || 0) : 0;
      const credit = e.type === "credit" ? Number(e.amount || 0) : 0;
      running += credit - debit;

      return [
        e.date,
        e.remarks || "-",
        e.invoiceNo || "-",
        e.partyName || "-",
        debit,
        credit,
        running,
        normalizeAccountMode(e.mode, DEFAULT_CASH_ACCOUNT),
        e.remarks || "-",
      ];
    });

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Cash_Summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  let runningBalance = 0;

  return (
    <AppShell>
      <main style={page}>
        <section style={hero}>
          <div>
            <h1 style={title}>Cash Summary</h1>
            <p style={subtitle}>
              Track cash debit, cash credit and running balance.
            </p>
          </div>

          <div style={heroButtons}>
            <button style={refreshBtn} onClick={loadCash}>
              Refresh
            </button>

            <button style={exportBtn} onClick={exportCSV}>
              Export CSV
            </button>
          </div>
        </section>

        <section style={summaryGrid}>
          <Summary
            title="Cash In / Credit"
            value={money(totalCredit)}
            color="#22c55e"
          />
          <Summary
            title="Cash Out / Debit"
            value={money(totalDebit)}
            color="#ef4444"
          />
          <Summary title="Cash Balance" value={money(balance)} color="#d4af37" />
        </section>

        <section style={card}>
          <div style={toolbar}>
            <input
              style={input}
              placeholder="Search invoice / party / remarks"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              style={input}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Entries</option>
              <option value="credit">Credit Only</option>
              <option value="debit">Debit Only</option>
            </select>

            <button style={refreshBtn} onClick={loadCash}>
              Refresh
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr style={thead}>
                  <th style={th}>Date</th>
                  <th style={th}>Voucher Type</th>
                  <th style={th}>Invoice No</th>
                  <th style={th}>Party Name</th>
                  <th style={th}>Debit</th>
                  <th style={th}>Credit</th>
                  <th style={th}>Balance</th>
                  <th style={th}>Mode</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={9}>
                      No cash entries found
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => {
                    const debit = e.type === "debit" ? Number(e.amount || 0) : 0;
                    const credit =
                      e.type === "credit" ? Number(e.amount || 0) : 0;

                    runningBalance += credit - debit;

                    return (
                      <tr key={e.id} style={tr}>
                        <td style={td}>{e.date}</td>
                        <td style={td}>{e.remarks || "-"}</td>
                        <td style={td}>{e.invoiceNo || "-"}</td>
                        <td style={td}>{e.partyName || "-"}</td>

                        <td style={{ ...td, color: "#b91c1c", fontWeight: 900 }}>
                          {debit ? money(debit) : "-"}
                        </td>

                        <td style={{ ...td, color: "#15803d", fontWeight: 900 }}>
                          {credit ? money(credit) : "-"}
                        </td>

                        <td
                          style={{
                            ...td,
                            color: runningBalance < 0 ? "#b91c1c" : "#92400e",
                            fontWeight: 950,
                          }}
                        >
                          {money(runningBalance)}
                        </td>

                        <td style={td}>{e.mode || "Cash"}</td>

                        <td style={td}>
                          <button
                            style={deleteBtn}
                            onClick={() => deleteEntry(e.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function Summary({
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
      <p style={summaryLabel}>{title}</p>
      <h2 style={summaryValue}>{value}</h2>
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
  padding: 36,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const heroButtons: React.CSSProperties = {
  display: "flex",
  gap: 14,
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 42,
  fontWeight: 950,
  color: positiveHeading,
};

const subtitle: React.CSSProperties = {
  marginTop: 10,
  color: positiveMuted,
  fontWeight: 700,
};

const exportBtn: React.CSSProperties = {
  ...successButton,
  padding: "15px 26px",
};

const refreshBtn: React.CSSProperties = {
  ...successButton,
  padding: "15px 22px",
};

const summaryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 18,
  marginBottom: 24,
};

const summaryCard: React.CSSProperties = {
  ...positivePanel,
  borderRadius: 20,
  padding: 24,
};

const summaryLabel: React.CSSProperties = {
  margin: 0,
  color: positiveMuted,
  fontWeight: 900,
};

const summaryValue: React.CSSProperties = {
  margin: "14px 0 0",
  fontSize: "clamp(1.8rem, 2.9vw, 2.4rem)",
  fontWeight: 950,
  lineHeight: 1.15,
  overflowWrap: "anywhere",
};

const card: React.CSSProperties = {
  ...positivePanel,
  borderRadius: 24,
  padding: 28,
};

const toolbar: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 180px",
  gap: 16,
  marginBottom: 22,
};

const input: React.CSSProperties = {
  ...positiveInputStrong,
  height: 54,
  borderRadius: 14,
  padding: "0 15px",
  fontWeight: 800,
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1050,
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
  fontWeight: 700,
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
};

const deleteBtn: React.CSSProperties = {
  ...dangerButton,
  padding: "9px 13px",
};
