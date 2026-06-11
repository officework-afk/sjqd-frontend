"use client";

import AppShell from "../components/AppShell";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../lib/api";
import {
  dangerButton,
  positiveHeading,
  positiveInputStrong,
  positiveMuted,
  positivePage,
  positivePanel,
  positivePanelSoft,
  successButton,
} from "../components/positiveTheme";

const API = API_BASE_URL;

export default function BackupPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);

  const downloadBackup = async () => {
    const res = await fetch(`${API}/backup/export`);
    const data = await res.json();

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `SJQD_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const restoreBackup = async () => {
    if (!file) {
      alert("Please select backup JSON file");
      return;
    }

    if (!confirm("Restore will replace current data. Continue?")) return;

    const text = await file.text();
    const json = JSON.parse(text);

    const res = await fetch(`${API}/backup/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Restore failed");
      return;
    }

    alert("Backup restored successfully");
    router.push("/dashboard");
  };

  return (
    <AppShell>
      <main style={page}>
        <section style={card}>
          <h1 style={title}>Backup & Restore</h1>
          <p style={sub}>Secure your business data with JSON backup</p>

          <div style={grid}>
            <div style={box}>
              <h2>Download Backup</h2>
              <p>Export all sales, purchases, returns, stock and settings.</p>
              <button onClick={downloadBackup} style={greenBtn}>
                Download Backup
              </button>
            </div>

            <div style={box}>
              <h2>Restore Backup</h2>
              <p>Upload previous backup file and restore your data.</p>

              <input
                type="file"
                accept=".json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={input}
              />

              <button onClick={restoreBackup} style={redBtn}>
                Restore Backup
              </button>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

const page: React.CSSProperties = {
  ...positivePage,
  minHeight: "100vh",
  padding: "30px",
  color: positiveHeading,
};

const card: React.CSSProperties = {
  ...positivePanel,
  borderRadius: "26px",
  padding: "34px",
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: "36px",
  fontWeight: 950,
  color: positiveHeading,
};

const sub: React.CSSProperties = {
  color: positiveMuted,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "22px",
  marginTop: "30px",
};

const box: React.CSSProperties = {
  ...positivePanelSoft,
  borderRadius: "20px",
  padding: "28px",
};

const input: React.CSSProperties = {
  ...positiveInputStrong,
  display: "block",
  width: "100%",
  margin: "18px 0",
  padding: "14px",
  borderRadius: "12px",
};

const greenBtn: React.CSSProperties = {
  ...successButton,
  padding: "15px 24px",
};

const redBtn: React.CSSProperties = {
  ...dangerButton,
  padding: "15px 24px",
};
