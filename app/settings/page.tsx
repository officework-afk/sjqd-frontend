"use client";

import AppShell from "../components/AppShell";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_BANK_ACCOUNT } from "../components/defaultAccounts";
import { API_BASE_URL } from "../lib/api";
import {
  dangerButton,
  paleButton,
  positiveHeading,
  positiveInputStrong,
  positiveMuted,
  positivePage,
  positivePanel,
  positivePanelSoft,
  positiveText,
  successButton,
} from "../components/positiveTheme";

const API = API_BASE_URL;

const defaultSettings = {
  salesPrefix: "SAL",
  purchasePrefix: "PUR",
  salesReturnPrefix: "SR",
  purchaseReturnPrefix: "PR",
  financialYear: "2026-27",
  stockMethod: "WEIGHTED_AVG",
  lowStockLimit: "10",
  bankName: DEFAULT_BANK_ACCOUNT,
  accountNumber: "",
  ifscCode: "",
  branchName: "",
  terms: "Goods once sold will not be taken back. Subject to local jurisdiction.",
  signatureImage: "",
};

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<any>(defaultSettings);
  const [backupFile, setBackupFile] = useState<File | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const update = (key: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const loadSettings = async () => {
    try {
      const local = localStorage.getItem("companySettings");

      if (local) {
        setForm((prev: any) => ({
          ...prev,
          ...JSON.parse(local),
        }));
      }

      const res = await fetch(`${API}/company`);
      const data = await res.json();

      if (data) {
        const nextSettings = {
          salesPrefix: data.salesPrefix || form.salesPrefix,
          purchasePrefix: data.purchasePrefix || form.purchasePrefix,
          salesReturnPrefix: data.salesReturnPrefix || form.salesReturnPrefix,
          purchaseReturnPrefix: data.purchaseReturnPrefix || form.purchaseReturnPrefix,
          financialYear: data.financialYear || form.financialYear,
          stockMethod: data.stockMethod || form.stockMethod,
          lowStockLimit: String(data.lowStockLimit || form.lowStockLimit),
          bankName: data.bankName || form.bankName,
          accountNumber: data.accountNumber || form.accountNumber,
          ifscCode: data.ifscCode || form.ifscCode,
          branchName: data.branchName || form.branchName,
          terms: data.terms || form.terms,
        };

        setForm((prev: any) => ({
          ...prev,
          ...nextSettings,
        }));
        localStorage.setItem(
          "companySettings",
          JSON.stringify({
            ...JSON.parse(localStorage.getItem("companySettings") || "{}"),
            ...nextSettings,
          }),
        );
      }
    } catch {
      // local settings still work
    }
  };

  const saveSettings = async () => {
    const localSettings = {
      ...form,
    };

    localStorage.setItem("companySettings", JSON.stringify(localSettings));

    const backendSettings = {
      salesPrefix: form.salesPrefix || "SAL",
      purchasePrefix: form.purchasePrefix || "PUR",
      salesReturnPrefix: form.salesReturnPrefix || "SR",
      purchaseReturnPrefix: form.purchaseReturnPrefix || "PR",
      financialYear: form.financialYear || "2026-27",
      stockMethod: form.stockMethod || "WEIGHTED_AVG",
      lowStockLimit: form.lowStockLimit || "10",
      bankName: form.bankName || DEFAULT_BANK_ACCOUNT,
      accountNumber: form.accountNumber || "",
      ifscCode: form.ifscCode || "",
      branchName: form.branchName || "",
      terms: form.terms || "",
    };

    try {
      const res = await fetch(`${API}/company`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendSettings),
      });

      if (!res.ok) {
        alert("Settings saved locally. Backend save failed.");
        return;
      }

      alert("Settings saved successfully");
    } catch {
      alert("Settings saved locally");
    }
  };

  const clearSettings = () => {
    if (!confirm("Reset software settings?")) return;
    localStorage.removeItem("companySettings");
    setForm(defaultSettings);
    alert("Settings reset");
  };

  const uploadSignature = (file?: File) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      update("signatureImage", String(reader.result));
    };

    reader.readAsDataURL(file);
  };


  const downloadBackup = async () => {
    try {
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
    } catch {
      alert("Backup download failed. Please check backend server.");
    }
  };

  const restoreBackup = async () => {
    if (!backupFile) {
      alert("Please select backup JSON file");
      return;
    }

    if (!confirm("Restore will replace current data. Continue?")) return;

    try {
      const text = await backupFile.text();
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
    } catch {
      alert("Invalid backup file or restore failed.");
    }
  };

  return (
    <AppShell>
      <main style={page}>
        <section style={card}>
          <div style={header}>
            <div>
              <h1 style={title}>Software Settings</h1>
              <p style={subTitle}>
                Manage invoice prefixes, stock method, bank details, terms and signature
              </p>
            </div>

            <button style={dashboardBtn} onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </button>
          </div>

          <div style={section}>
            <h2 style={sectionTitle}>Invoice Number Prefix</h2>

            <div style={grid}>
              <Field label="Sales Prefix" value={form.salesPrefix} onChange={(v: string) => update("salesPrefix", v.toUpperCase())} />
              <Field label="Purchase Prefix" value={form.purchasePrefix} onChange={(v: string) => update("purchasePrefix", v.toUpperCase())} />
              <Field label="Sales Return Prefix" value={form.salesReturnPrefix} onChange={(v: string) => update("salesReturnPrefix", v.toUpperCase())} />
              <Field label="Purchase Return Prefix" value={form.purchaseReturnPrefix} onChange={(v: string) => update("purchaseReturnPrefix", v.toUpperCase())} />
            </div>
          </div>

          <div style={section}>
            <h2 style={sectionTitle}>Stock & Financial Settings</h2>

            <div style={grid}>
              <Field label="Financial Year" value={form.financialYear} onChange={(v: string) => update("financialYear", v)} />
              <Field label="Low Stock Alert Limit" value={form.lowStockLimit} onChange={(v: string) => update("lowStockLimit", v)} type="number" />

              <label style={fieldWrap}>
                <span style={labelStyle}>Stock Method</span>
                <select style={input} value={form.stockMethod} onChange={(e) => update("stockMethod", e.target.value)}>
                  <option value="WEIGHTED_AVG">Weighted Average</option>
                  <option value="FIFO">FIFO</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </label>
            </div>
          </div>

          <div style={section}>
            <h2 style={sectionTitle}>Bank Details</h2>

            <div style={grid}>
              <Field label="Bank Name" value={form.bankName} onChange={(v: string) => update("bankName", v)} />
              <Field label="Account Number" value={form.accountNumber} onChange={(v: string) => update("accountNumber", v)} />
              <Field label="IFSC Code" value={form.ifscCode} onChange={(v: string) => update("ifscCode", v.toUpperCase())} />
              <Field label="Branch Name" value={form.branchName} onChange={(v: string) => update("branchName", v)} />
            </div>
          </div>

          <div style={section}>
            <h2 style={sectionTitle}>Authorized Signature</h2>

            <input
              style={input}
              type="file"
              accept="image/*"
              onChange={(e) => uploadSignature(e.target.files?.[0])}
            />

            {form.signatureImage && (
              <div style={signatureBox}>
                <img src={form.signatureImage} style={signatureImg} />
                <button style={removeBtn} onClick={() => update("signatureImage", "")}>
                  Remove Signature
                </button>
              </div>
            )}
          </div>

          <div style={section}>
            <h2 style={sectionTitle}>Invoice Terms</h2>
            <textarea style={textarea} value={form.terms} onChange={(e) => update("terms", e.target.value)} />
          </div>


          <div style={section}>
            <h2 style={sectionTitle}>Backup & Restore</h2>
            <p style={sectionSub}>
              Download a secure JSON backup or restore previous software data from backup file.
            </p>

            <div style={backupGrid}>
              <div style={backupBox}>
                <h3 style={backupTitle}>Download Backup</h3>
                <p style={backupText}>Export sales, purchases, stock, parties, accounts and settings.</p>
                <button style={backupGreenBtn} onClick={downloadBackup}>
                  Download Backup
                </button>
              </div>

              <div style={backupBox}>
                <h3 style={backupTitle}>Restore Backup</h3>
                <p style={backupText}>Upload previous backup JSON file and restore your data.</p>

                <input
                  style={input}
                  type="file"
                  accept=".json"
                  onChange={(e) => setBackupFile(e.target.files?.[0] || null)}
                />

                <button style={backupRedBtn} onClick={restoreBackup}>
                  Restore Backup
                </button>
              </div>
            </div>
          </div>

          <div style={buttonRow}>
            <button style={saveBtn} onClick={saveSettings}>
              Save Settings
            </button>
            <button style={resetBtn} onClick={clearSettings}>
              Reset Settings
            </button>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function Field({ label, value, onChange, type = "text" }: any) {
  return (
    <label style={fieldWrap}>
      <span style={labelStyle}>{label}</span>
      <input
        style={input}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
      />
    </label>
  );
}

const page: React.CSSProperties = {
  ...positivePage,
  minHeight: "100vh",
  padding: "32px",
  color: positiveText,
};

const card: React.CSSProperties = {
  maxWidth: "1250px",
  margin: "0 auto",
  borderRadius: "28px",
  padding: "34px",
  ...positivePanel,
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "30px",
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: "42px",
  fontWeight: 950,
  color: positiveHeading,
};

const subTitle: React.CSSProperties = {
  color: positiveMuted,
};

const dashboardBtn: React.CSSProperties = {
  ...paleButton,
  padding: "14px 22px",
};

const section: React.CSSProperties = {
  ...positivePanelSoft,
  borderRadius: "22px",
  padding: "26px",
  marginBottom: "24px",
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 20px",
  fontSize: "24px",
  fontWeight: 950,
  color: positiveHeading,
};


const sectionSub: React.CSSProperties = {
  color: positiveMuted,
  fontWeight: 700,
  margin: "0 0 18px",
};

const backupGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
};

const backupBox: React.CSSProperties = {
  ...positivePanel,
  borderRadius: "20px",
  padding: "24px",
};

const backupTitle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "20px",
  fontWeight: 950,
  color: positiveHeading,
};

const backupText: React.CSSProperties = {
  color: positiveMuted,
  fontWeight: 700,
};

const backupGreenBtn: React.CSSProperties = {
  ...successButton,
  padding: "15px 24px",
};

const backupRedBtn: React.CSSProperties = {
  ...dangerButton,
  padding: "15px 24px",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(240px, 1fr))",
  gap: "20px",
};

const fieldWrap: React.CSSProperties = {
  display: "grid",
  gap: "8px",
};

const labelStyle: React.CSSProperties = {
  color: positiveMuted,
  fontSize: "14px",
  fontWeight: 900,
};

const input: React.CSSProperties = {
  ...positiveInputStrong,
  width: "100%",
  height: "56px",
  borderRadius: "14px",
  padding: "0 16px",
  fontSize: "15px",
  fontWeight: 700,
};

const textarea: React.CSSProperties = {
  ...input,
  height: "120px",
  paddingTop: "14px",
};

const signatureBox: React.CSSProperties = {
  marginTop: "18px",
  display: "flex",
  alignItems: "center",
  gap: "18px",
};

const signatureImg: React.CSSProperties = {
  maxWidth: "240px",
  maxHeight: "100px",
  objectFit: "contain",
  background: "white",
  padding: "10px",
  borderRadius: "10px",
};

const buttonRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "18px",
};

const saveBtn: React.CSSProperties = {
  ...successButton,
  padding: "18px",
  fontSize: "18px",
};

const resetBtn: React.CSSProperties = {
  ...dangerButton,
  padding: "18px",
  fontSize: "18px",
};

const removeBtn: React.CSSProperties = {
  ...dangerButton,
  padding: "12px 18px",
};
