"use client";

import AppShell from "../components/AppShell";
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_BANK_ACCOUNT,
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

type BankEntry = {
  id: number;
  date: string;
  invoiceNo: string;
  partyName: string;
  amount: number;
  type: "debit" | "credit";
  mode?: string;
  remarks?: string;
};

const STORAGE_KEY = "bankMaster";

export default function BankPage() {
  const [entries, setEntries] = useState<BankEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    ensureDefaultAccountStorage();
    loadBank();
  }, []);

  const getStorageArray = (key: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const saveStorageArray = (key: string, value: any[]) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const normalizeEntry = (entry: any): BankEntry => ({
    id: Number(entry.id || Date.now() + Math.random()),
    date: entry.date || new Date().toLocaleDateString("en-GB"),
    invoiceNo: entry.invoiceNo || "-",
    partyName: entry.partyName || "-",
    amount: Number(entry.amount || 0),
    type: entry.type || "credit",
    mode: normalizeAccountMode(entry.mode, DEFAULT_BANK_ACCOUNT),
    remarks: entry.remarks || "Bank Entry",
  });

  const loadBank = () => {
    const bankMaster = getStorageArray("bankMaster").map(normalizeEntry);
    const bankEntries = getStorageArray("bankEntries").map(normalizeEntry);

    const merged = Array.from(
      new Map(
        [...bankMaster, ...bankEntries].map((e) => [
          `${e.id}-${e.invoiceNo}-${e.amount}-${e.type}`,
          e,
        ])
      ).values()
    );

    setEntries(merged);
    saveStorageArray(STORAGE_KEY, merged);
  };

  const money = (v: any) =>
    `₹${Number(v || 0).toLocaleString("en-IN")}`;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return entries.filter((e) => {
      const matchSearch =
        e.invoiceNo?.toLowerCase().includes(q) ||
        e.partyName?.toLowerCase().includes(q) ||
        e.remarks?.toLowerCase().includes(q);

      const matchType =
        filterType === "all" || e.type === filterType;

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
    if (!confirm("Delete this bank entry?")) return;

    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
      const debit =
        e.type === "debit" ? Number(e.amount || 0) : 0;

      const credit =
        e.type === "credit" ? Number(e.amount || 0) : 0;

      running += credit - debit;

      return [
        e.date,
        e.remarks || "-",
        e.invoiceNo || "-",
        e.partyName || "-",
        debit,
        credit,
        running,
        normalizeAccountMode(e.mode, DEFAULT_BANK_ACCOUNT),
        e.remarks || "-",
      ];
    });

    const csv = [headers, ...rows]
      .map((r) =>
        r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Bank_Summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  let runningBalance = 0;

  return (
    <AppShell>
      <main style={page}>
        <section style={hero}>
          <div>
            <h1 style={title}>Bank Summary</h1>
            <p style={subtitle}>
              Track bank debit, bank credit and running balance.
            </p>
          </div>

          <button style={exportBtn} onClick={exportCSV}>
            Export CSV
          </button>
        </section>

        <section style={summaryGrid}>
          <Summary
            title="Bank In / Credit"
            value={money(totalCredit)}
            color="#22c55e"
          />

          <Summary
            title="Bank Out / Debit"
            value={money(totalDebit)}
            color="#ef4444"
          />

          <Summary
            title="Bank Balance"
            value={money(balance)}
            color="#d4af37"
          />
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

            <button style={refreshBtn} onClick={loadBank}>
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
                      No bank entries found
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => {
                    const debit =
                      e.type === "debit"
                        ? Number(e.amount || 0)
                        : 0;

                    const credit =
                      e.type === "credit"
                        ? Number(e.amount || 0)
                        : 0;

                    runningBalance += credit - debit;

                    return (
                      <tr key={e.id} style={tr}>
                        <td style={td}>{e.date}</td>
                        <td style={td}>{e.remarks || "-"}</td>
                        <td style={td}>{e.invoiceNo}</td>
                        <td style={td}>{e.partyName}</td>

                        <td
                          style={{
                            ...td,
                            color: "#b91c1c",
                            fontWeight: 900,
                          }}
                        >
                          {debit ? money(debit) : "-"}
                        </td>

                        <td
                          style={{
                            ...td,
                            color: "#15803d",
                            fontWeight: 900,
                          }}
                        >
                          {credit ? money(credit) : "-"}
                        </td>

                        <td
                          style={{
                            ...td,
                            color: "#92400e",
                            fontWeight: 950,
                          }}
                        >
                          {money(runningBalance)}
                        </td>

                        <td style={td}>
                          {normalizeAccountMode(e.mode, DEFAULT_BANK_ACCOUNT)}
                        </td>

                        <td style={td}>
                          <button
                            style={deleteBtn}
                            onClick={() =>
                              deleteEntry(e.id)
                            }
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
    <div
      style={{
        ...summaryCard,
        borderTop: `5px solid ${color}`,
      }}
    >
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

const refreshBtn: React.CSSProperties = {
  ...successButton,
  padding: 17,
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
