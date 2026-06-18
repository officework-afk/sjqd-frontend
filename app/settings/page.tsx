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
const USER_STORAGE_PREFIX = "sjqd:user:";

const getAuthHeaders = (includeJson = true) => {
  const headers: Record<string, string> = {};
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const getAuthToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

const clearCurrentAccountScopedStorage = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const rawUser = localStorage.getItem("user");
    const parsedUser = rawUser ? JSON.parse(rawUser) : {};
    const userId = String(parsedUser?.id || parsedUser?.userId || "").trim();
    const keysToRemove: string[] = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;

      if (userId && key.startsWith(`${USER_STORAGE_PREFIX}${userId}:`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    [
      "companySettings",
      "company",
      "companyProfile",
      "businessProfile",
      "settings",
      "profile",
      "items",
      "buyerMaster",
      "supplierMaster",
      "cashMaster",
      "cashEntries",
      "cashInHand",
      "bankMaster",
      "bankEntries",
      "bankBalance",
      "paymentMaster",
      "receivableMaster",
      "defaultCashAccount",
      "defaultBankAccount",
      "invoiceEditConfig",
      "invoicePaymentStatus",
      "invoiceInvoiceMeta",
    ].forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore storage cleanup issues after clear-data action
  }
};

type SettingsForm = {
  salesPrefix: string;
  purchasePrefix: string;
  salesReturnPrefix: string;
  purchaseReturnPrefix: string;
  financialYear: string;
  stockMethod: string;
  lowStockLimit: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  terms: string;
  signatureImage: string;
  invoiceEditEnabled: boolean;
  invoiceEditPassword: string;
  invoiceEditPasswordConfirm: string;
  invoiceEditPasswordConfigured: boolean;
};

const defaultSettings: SettingsForm = {
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
  invoiceEditEnabled: false,
  invoiceEditPassword: "",
  invoiceEditPasswordConfirm: "",
  invoiceEditPasswordConfigured: false,
};

const getLocalSettings = (form: SettingsForm) => ({
  salesPrefix: form.salesPrefix,
  purchasePrefix: form.purchasePrefix,
  salesReturnPrefix: form.salesReturnPrefix,
  purchaseReturnPrefix: form.purchaseReturnPrefix,
  financialYear: form.financialYear,
  stockMethod: form.stockMethod,
  lowStockLimit: form.lowStockLimit,
  bankName: form.bankName,
  accountNumber: form.accountNumber,
  ifscCode: form.ifscCode,
  branchName: form.branchName,
  terms: form.terms,
  signatureImage: form.signatureImage,
  invoiceEditEnabled: form.invoiceEditEnabled,
});

const readResponseMessage = async (response: Response) => {
  try {
    const data = await response.json();
    return String(data?.message || "").trim();
  } catch {
    return "";
  }
};

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<SettingsForm>(defaultSettings);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [invoiceEditModalMode, setInvoiceEditModalMode] = useState<
    "set-password" | "verify-enable" | null
  >(null);
  const [showInvoiceEditPasswordModal, setShowInvoiceEditPasswordModal] =
    useState(false);
  const [invoiceEditPasswordDraft, setInvoiceEditPasswordDraft] = useState("");
  const [invoiceEditPasswordConfirmDraft, setInvoiceEditPasswordConfirmDraft] =
    useState("");
  const [invoiceEditEnablePasswordDraft, setInvoiceEditEnablePasswordDraft] =
    useState("");
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [backupDownloading, setBackupDownloading] = useState(false);
  const [backupRestoring, setBackupRestoring] = useState(false);
  const [deletingAccountData, setDeletingAccountData] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, []);

  const update = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const ensureAuthenticated = (message?: string) => {
    const token = getAuthToken();

    if (token) {
      return token;
    }

    if (message) {
      alert(message);
    }

    router.push("/login");
    return "";
  };

  const closeInvoiceEditPasswordModal = () => {
    setShowInvoiceEditPasswordModal(false);
    setInvoiceEditModalMode(null);
    setInvoiceEditPasswordDraft("");
    setInvoiceEditPasswordConfirmDraft("");
    setInvoiceEditEnablePasswordDraft("");
  };

  const openInvoiceEditPasswordModal = (
    mode: "set-password" | "verify-enable",
  ) => {
    setInvoiceEditModalMode(mode);
    setShowInvoiceEditPasswordModal(true);
    setInvoiceEditPasswordDraft("");
    setInvoiceEditPasswordConfirmDraft("");
    setInvoiceEditEnablePasswordDraft("");
  };

  const closeDeleteDataModal = () => {
    setShowDeleteDataModal(false);
    setDeletePassword("");
  };

  const openDeleteDataModal = () => {
    setShowDeleteDataModal(true);
    setDeletePassword("");
  };

  const handleInvoiceEditToggle = (checked: boolean) => {
    if (!checked) {
      setForm((prev) => ({
        ...prev,
        invoiceEditEnabled: false,
        invoiceEditPassword: "",
        invoiceEditPasswordConfirm: "",
      }));
      closeInvoiceEditPasswordModal();
      return;
    }

    if (!form.invoiceEditPasswordConfigured) {
      alert("First set and save the invoice edit password, then enable this option.");
      return;
    }

    openInvoiceEditPasswordModal("verify-enable");
  };

  const applyInvoiceEditPassword = () => {
    const cleanPassword = invoiceEditPasswordDraft.trim();
    const cleanConfirmPassword = invoiceEditPasswordConfirmDraft.trim();

    if (!cleanPassword) {
      alert("Please enter the invoice edit password.");
      return;
    }

    if (cleanPassword.length < 4) {
      alert("Invoice edit password must be at least 4 characters.");
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      alert("Invoice edit passwords do not match.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      invoiceEditEnabled: true,
      invoiceEditPassword: cleanPassword,
      invoiceEditPasswordConfirm: cleanConfirmPassword,
      }));
    closeInvoiceEditPasswordModal();
  };

  const verifyAndEnableInvoiceEdit = async () => {
    const password = invoiceEditEnablePasswordDraft.trim();

    if (!password) {
      alert("Please enter the saved invoice edit password.");
      return;
    }

    try {
      if (!ensureAuthenticated("Please login again to verify the invoice edit password.")) {
        return;
      }

      const res = await fetch(`${API}/settings/invoice-edit/verify`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.message || "Invoice edit password is incorrect.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        invoiceEditEnabled: true,
      }));
      closeInvoiceEditPasswordModal();
    } catch {
      alert("Could not verify the invoice edit password. Please try again.");
    }
  };

  async function loadSettings() {
    try {
      if (!ensureAuthenticated()) {
        return;
      }

      const local = localStorage.getItem("companySettings");

      if (local) {
        const parsed = JSON.parse(local);
        setForm((prev) => ({
          ...prev,
          ...parsed,
          invoiceEditPassword: "",
          invoiceEditPasswordConfirm: "",
        }));
      }

      const [companyRes, settingsRes] = await Promise.all([
        fetch(`${API}/company`, {
          headers: getAuthHeaders(false),
        }),
        fetch(`${API}/settings`, {
          headers: getAuthHeaders(false),
        }),
      ]);

      const companyData = companyRes.ok ? await companyRes.json() : null;
      const settingsData = settingsRes.ok ? await settingsRes.json() : null;

      const nextSettings: Partial<SettingsForm> = {};

      if (companyData) {
        nextSettings.salesPrefix = companyData.salesPrefix || defaultSettings.salesPrefix;
        nextSettings.purchasePrefix = companyData.purchasePrefix || defaultSettings.purchasePrefix;
        nextSettings.salesReturnPrefix =
          companyData.salesReturnPrefix || defaultSettings.salesReturnPrefix;
        nextSettings.purchaseReturnPrefix =
          companyData.purchaseReturnPrefix || defaultSettings.purchaseReturnPrefix;
        nextSettings.financialYear = companyData.financialYear || defaultSettings.financialYear;
        nextSettings.bankName = companyData.bankName || defaultSettings.bankName;
        nextSettings.accountNumber = companyData.accountNumber || defaultSettings.accountNumber;
        nextSettings.ifscCode = companyData.ifscCode || defaultSettings.ifscCode;
        nextSettings.branchName = companyData.branchName || defaultSettings.branchName;
        nextSettings.terms = companyData.terms || defaultSettings.terms;
        nextSettings.signatureImage =
          companyData.signatureImage || defaultSettings.signatureImage;
      }

      if (settingsData) {
        nextSettings.stockMethod = settingsData.stockMethod || defaultSettings.stockMethod;
        nextSettings.lowStockLimit = String(
          settingsData.lowStockLimit ?? defaultSettings.lowStockLimit,
        );
        nextSettings.invoiceEditEnabled = Boolean(settingsData.invoiceEditEnabled);
        nextSettings.invoiceEditPasswordConfigured = Boolean(
          settingsData.invoiceEditPasswordConfigured,
        );
      }

      setForm((prev) => ({
        ...prev,
        ...nextSettings,
        invoiceEditPassword: "",
        invoiceEditPasswordConfirm: "",
      }));

      localStorage.setItem(
        "companySettings",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("companySettings") || "{}"),
          ...getLocalSettings({
            ...defaultSettings,
            ...form,
            ...nextSettings,
            invoiceEditPassword: "",
            invoiceEditPasswordConfirm: "",
          }),
        }),
      );

      if (settingsData) {
        localStorage.setItem(
          "invoiceEditConfig",
          JSON.stringify({
            enabled: Boolean(settingsData.invoiceEditEnabled),
            passwordConfigured: Boolean(settingsData.invoiceEditPasswordConfigured),
          }),
        );
      }
    } catch {
      // local settings still work
    }
  }

  const saveSettings = async () => {
    const cleanPassword = form.invoiceEditPassword.trim();
    const cleanPasswordConfirm = form.invoiceEditPasswordConfirm.trim();

    if (form.invoiceEditEnabled) {
      if (!form.invoiceEditPasswordConfigured && !cleanPassword) {
        alert("Please set the invoice edit password before enabling invoice edit.");
        return;
      }

      if (cleanPassword && cleanPassword.length < 4) {
        alert("Invoice edit password must be at least 4 characters.");
        return;
      }

      if (cleanPassword && cleanPassword !== cleanPasswordConfirm) {
        alert("Invoice edit passwords do not match.");
        return;
      }
    }

    localStorage.setItem("companySettings", JSON.stringify(getLocalSettings(form)));
    localStorage.setItem(
      "invoiceEditConfig",
      JSON.stringify({
        enabled: form.invoiceEditEnabled,
        passwordConfigured:
          form.invoiceEditPasswordConfigured || Boolean(cleanPassword),
      }),
    );

    const backendCompanySettings = {
      salesPrefix: form.salesPrefix || "SAL",
      purchasePrefix: form.purchasePrefix || "PUR",
      salesReturnPrefix: form.salesReturnPrefix || "SR",
      purchaseReturnPrefix: form.purchaseReturnPrefix || "PR",
      financialYear: form.financialYear || "2026-27",
      stockMethod: form.stockMethod || "WEIGHTED_AVG",
      bankName: form.bankName || DEFAULT_BANK_ACCOUNT,
      accountNumber: form.accountNumber || "",
      ifscCode: form.ifscCode || "",
      branchName: form.branchName || "",
      terms: form.terms || "",
      signatureImage: form.signatureImage || "",
    };

    const backendSoftwareSettings = {
      stockMethod: form.stockMethod || "WEIGHTED_AVG",
      lowStockLimit: form.lowStockLimit || "10",
      invoiceEditEnabled: form.invoiceEditEnabled,
      invoiceEditPassword: cleanPassword,
    };

    try {
      if (!ensureAuthenticated("Please login again before saving settings.")) {
        return;
      }

      const [companyRes, settingsRes] = await Promise.all([
        fetch(`${API}/company`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(backendCompanySettings),
        }),
        fetch(`${API}/settings`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(backendSoftwareSettings),
        }),
      ]);

      const settingsMessage = settingsRes.ok ? "" : await readResponseMessage(settingsRes);
      const companyMessage = companyRes.ok ? "" : await readResponseMessage(companyRes);

      if (!companyRes.ok || !settingsRes.ok) {
        alert(
          settingsMessage ||
            companyMessage ||
            "Settings saved locally. Backend save failed.",
        );
        return;
      }

      const savedSoftwareSettings = await settingsRes.json().catch(() => null);

      setForm((prev) => ({
        ...prev,
        invoiceEditEnabled: Boolean(savedSoftwareSettings?.invoiceEditEnabled),
        invoiceEditPassword: "",
        invoiceEditPasswordConfirm: "",
        invoiceEditPasswordConfigured: Boolean(
          savedSoftwareSettings?.invoiceEditPasswordConfigured,
        ),
      }));

      localStorage.setItem(
        "invoiceEditConfig",
        JSON.stringify({
          enabled: Boolean(savedSoftwareSettings?.invoiceEditEnabled),
          passwordConfigured: Boolean(
            savedSoftwareSettings?.invoiceEditPasswordConfigured,
          ),
        }),
      );

      alert("Settings saved successfully");
    } catch {
      alert("Settings saved locally");
    }
  };

  const clearSettings = () => {
    if (!confirm("Reset software settings?")) return;
    localStorage.removeItem("companySettings");
    localStorage.removeItem("invoiceEditConfig");
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
      if (!ensureAuthenticated("Please login again before downloading backup.")) {
        return false;
      }

      setBackupDownloading(true);
      const res = await fetch(`${API}/backup/export`, {
        headers: getAuthHeaders(false),
      });
      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        alert("Session expired. Please login again.");
        router.push("/login");
        return false;
      }

      if (!res.ok) {
        alert(data?.message || "Backup download failed");
        return false;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `SJQD_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();

      URL.revokeObjectURL(url);
      return true;
    } catch {
      alert("Backup download failed. Please check backend server.");
      return false;
    } finally {
      setBackupDownloading(false);
    }
  };

  const restoreBackup = async () => {
    if (!backupFile) {
      alert("Please select backup JSON file");
      return;
    }

    if (!confirm("Restore will replace current data. Continue?")) return;

    try {
      if (!ensureAuthenticated("Please login again before restoring backup.")) {
        return;
      }

      setBackupRestoring(true);
      const text = await backupFile.text();
      const json = JSON.parse(text);

      const res = await fetch(`${API}/backup/restore`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(json),
      });

      const data = await res.json();

      if (res.status === 401) {
        alert("Session expired. Please login again.");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        alert(data.message || "Restore failed");
        return;
      }

      alert("Backup restored successfully");
      router.push("/dashboard");
    } catch {
      alert("Invalid backup file or restore failed.");
    } finally {
      setBackupRestoring(false);
    }
  };

  const clearAccountData = async () => {
    const password = deletePassword.trim();

    if (!password) {
      alert("Please enter the current account password.");
      return;
    }

    if (
      !confirm(
        "This will permanently clear all data for only this account. Your login will stay, but invoice data, item data, stock summary data, cash/bank data, receivable/payment data, parties, settings and reports will be removed. Continue?",
      )
    ) {
      return;
    }

    try {
      if (!ensureAuthenticated("Please login again before deleting account data.")) {
        return;
      }

      setDeletingAccountData(true);
      const res = await fetch(`${API}/backup/clear-account`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          password,
        }),
      });
      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        alert("Session expired. Please login again.");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        if (res.status === 404) {
          alert("Clear account route not found in backend. Restart backend server and try again.");
          return;
        }

        alert(data?.message || "Could not clear account data");
        return;
      }

      clearCurrentAccountScopedStorage();
      setBackupFile(null);
      closeDeleteDataModal();
      setForm(defaultSettings);
      await loadSettings();
      alert(data?.message || "Account data cleared successfully");
    } catch {
      alert("Failed to clear account data. Please try again.");
    } finally {
      setDeletingAccountData(false);
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
              <Field
                label="Sales Prefix"
                value={form.salesPrefix}
                onChange={(v: string) => update("salesPrefix", v.toUpperCase())}
              />
              <Field
                label="Purchase Prefix"
                value={form.purchasePrefix}
                onChange={(v: string) => update("purchasePrefix", v.toUpperCase())}
              />
              <Field
                label="Credit Note Prefix"
                value={form.salesReturnPrefix}
                onChange={(v: string) => update("salesReturnPrefix", v.toUpperCase())}
              />
              <Field
                label="Debit Note Prefix"
                value={form.purchaseReturnPrefix}
                onChange={(v: string) => update("purchaseReturnPrefix", v.toUpperCase())}
              />
            </div>
          </div>

          <div style={section}>
            <h2 style={sectionTitle}>Stock & Financial Settings</h2>

            <div style={grid}>
              <Field
                label="Financial Year"
                value={form.financialYear}
                onChange={(v: string) => update("financialYear", v)}
              />
              <Field
                label="Low Stock Alert Limit"
                value={form.lowStockLimit}
                onChange={(v: string) => update("lowStockLimit", v)}
                type="number"
              />

              <label style={fieldWrap}>
                <span style={labelStyle}>Stock Method</span>
                <select
                  style={input}
                  value={form.stockMethod}
                  onChange={(e) => update("stockMethod", e.target.value)}
                >
                  <option value="WEIGHTED_AVG">Weighted Average</option>
                  <option value="FIFO">FIFO</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </label>
            </div>
          </div>

          <div style={section}>
            <h2 style={sectionTitle}>Invoice Edit Protection</h2>
            <p style={sectionSub}>
              Create a password first, then use that password in settings to enable the invoice edit option.
            </p>

            <label style={toggleCard}>
              <div style={toggleTextWrap}>
                <span style={toggleTitle}>Enable invoice edit option</span>
                <span style={toggleText}>
                  {form.invoiceEditEnabled
                    ? "Edit action is now available on invoice reports without asking again for every invoice."
                    : "Edit action stays hidden on invoice reports until this option is enabled here."}
                </span>
              </div>
              <input
                style={checkboxInput}
                type="checkbox"
                checked={form.invoiceEditEnabled}
                onChange={(e) => handleInvoiceEditToggle(e.target.checked)}
              />
            </label>

            <div style={statusCard}>
              <p style={helperText}>
                {form.invoiceEditEnabled
                  ? "Invoice edit option is enabled. Users can edit invoices directly from the report page."
                  : form.invoiceEditPasswordConfigured
                  ? "Password is ready. Turn on the option and enter the saved password once to enable invoice edit."
                  : "Create and save the password first. After that, use the toggle and enter that password to enable invoice edit."}
              </p>

              <button
                style={changePasswordBtn}
                onClick={() => openInvoiceEditPasswordModal("set-password")}
              >
                {form.invoiceEditPasswordConfigured ? "Change Password" : "Set Password"}
              </button>
            </div>
          </div>

          <div style={section}>
            <h2 style={sectionTitle}>Bank Details</h2>

            <div style={grid}>
              <Field
                label="Bank Name"
                value={form.bankName}
                onChange={(v: string) => update("bankName", v)}
              />
              <Field
                label="Account Number"
                value={form.accountNumber}
                onChange={(v: string) => update("accountNumber", v)}
              />
              <Field
                label="IFSC Code"
                value={form.ifscCode}
                onChange={(v: string) => update("ifscCode", v.toUpperCase())}
              />
              <Field
                label="Branch Name"
                value={form.branchName}
                onChange={(v: string) => update("branchName", v)}
              />
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

            {form.signatureImage ? (
              <div style={signatureBox}>
                <img src={form.signatureImage} style={signatureImg} alt="Saved signature" />
                <button style={removeBtn} onClick={() => update("signatureImage", "")}>
                  Remove Signature
                </button>
              </div>
            ) : null}
          </div>

          <div style={section}>
            <h2 style={sectionTitle}>Invoice Terms</h2>
            <textarea
              style={textarea}
              value={form.terms}
              onChange={(e) => update("terms", e.target.value)}
            />
          </div>

          <div style={section}>
            <h2 style={sectionTitle}>Backup & Restore</h2>
            <p style={sectionSub}>
              Download a secure JSON backup or restore previous software data from backup file.
            </p>

            <div style={backupGrid}>
              <div style={backupBox}>
                <h3 style={backupTitle}>Download Backup</h3>
                <p style={backupText}>
                  Export sales, purchases, stock, parties, accounts and settings.
                </p>
                <button
                  style={backupGreenBtn}
                  onClick={() => void downloadBackup()}
                  disabled={backupDownloading || deletingAccountData}
                >
                  {backupDownloading ? "Preparing Backup..." : "Download Backup"}
                </button>
              </div>

              <div style={backupBox}>
                <h3 style={backupTitle}>Restore Backup</h3>
                <p style={backupText}>
                  Upload previous backup JSON file and restore your data.
                </p>

                <input
                  style={input}
                  type="file"
                  accept=".json"
                  onChange={(e) => setBackupFile(e.target.files?.[0] || null)}
                />

                <button
                  style={backupRedBtn}
                  onClick={() => void restoreBackup()}
                  disabled={backupRestoring || deletingAccountData}
                >
                  {backupRestoring ? "Restoring Backup..." : "Restore Backup"}
                </button>
              </div>
            </div>
          </div>

          <div style={section}>
            <h2 style={sectionTitle}>Danger Zone</h2>
            <p style={sectionSub}>
              Clear only this account&apos;s business data. Login access stays, but invoices,
              items, stock summary, cash/bank, receivable/payment, parties, company
              profile, settings and reports will be removed.
            </p>

            <div style={dangerZoneCard}>
              <div style={dangerZoneTextWrap}>
                <h3 style={dangerZoneTitle}>Delete all data for this account</h3>
                <p style={dangerZoneText}>
                  Use the current account password to clear invoice data, item data,
                  stock summary data, cash/bank records, receivable/payment records and
                  other business data in this account.
                </p>
              </div>

              <div style={dangerZoneActionRow}>
                <button
                  style={dangerZoneDeleteBtn}
                  onClick={openDeleteDataModal}
                  disabled={deletingAccountData}
                >
                  Delete All Account Data
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

      {showInvoiceEditPasswordModal ? (
        <div
          style={modalOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeInvoiceEditPasswordModal();
            }
          }}
        >
          <div style={modalCard}>
            <div style={modalHeader}>
              <div>
                <h3 style={modalTitle}>
                  {invoiceEditModalMode === "verify-enable"
                    ? "Enable Invoice Edit"
                    : "Invoice Edit Password"}
                </h3>
                <p style={modalText}>
                  {invoiceEditModalMode === "verify-enable"
                    ? "Enter the saved invoice edit password once to turn this option on."
                    : "Set or change the invoice edit password here, then save settings to apply it."}
                </p>
              </div>

              <button style={modalCloseBtn} onClick={closeInvoiceEditPasswordModal}>
                X
              </button>
            </div>

            {invoiceEditModalMode === "verify-enable" ? (
              <div style={singleFieldWrap}>
                <Field
                  label="Enter Saved Password"
                  value={invoiceEditEnablePasswordDraft}
                  onChange={setInvoiceEditEnablePasswordDraft}
                  type="password"
                />
              </div>
            ) : (
              <div style={grid}>
                <Field
                  label="Invoice Edit Password"
                  value={invoiceEditPasswordDraft}
                  onChange={setInvoiceEditPasswordDraft}
                  type="password"
                />
                <Field
                  label="Confirm Password"
                  value={invoiceEditPasswordConfirmDraft}
                  onChange={setInvoiceEditPasswordConfirmDraft}
                  type="password"
                />
              </div>
            )}

            <div style={modalButtonRow}>
              <button style={modalSecondaryBtn} onClick={closeInvoiceEditPasswordModal}>
                Cancel
              </button>
              <button
                style={modalPrimaryBtn}
                onClick={
                  invoiceEditModalMode === "verify-enable"
                    ? () => void verifyAndEnableInvoiceEdit()
                    : applyInvoiceEditPassword
                }
              >
                {invoiceEditModalMode === "verify-enable"
                  ? "Enable Option"
                  : "Use Password"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteDataModal ? (
        <div
          style={modalOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteDataModal();
            }
          }}
        >
          <div style={modalCard}>
            <div style={modalHeader}>
              <div>
                <h3 style={modalTitle}>Delete Account Data</h3>
                <p style={modalText}>
                  This removes only the current account&apos;s data. Enter the current
                  account password to continue.
                </p>
              </div>

              <button style={modalCloseBtn} onClick={closeDeleteDataModal}>
                X
              </button>
            </div>

            <div style={dangerWarningCard}>
              <strong style={dangerWarningTitle}>Permanent action</strong>
              <p style={dangerWarningText}>
                Sales, purchase, returns, adjustments, items, stock summary data,
                cash/bank data, receivable/payment data, party masters, company profile,
                settings and reports for this account will be deleted.
              </p>
            </div>

            <div style={singleFieldWrap}>
              <Field
                label="Current Account Password"
                value={deletePassword}
                onChange={setDeletePassword}
                type="password"
              />
            </div>

            <div style={dangerModalButtonRow}>
              <button
                style={modalSecondaryBtn}
                onClick={() => void downloadBackup()}
                disabled={backupDownloading || deletingAccountData}
              >
                {backupDownloading ? "Preparing Backup..." : "Download Backup"}
              </button>
              <button style={modalSecondaryBtn} onClick={closeDeleteDataModal}>
                Cancel
              </button>
              <button
                style={dangerZoneDeleteBtn}
                onClick={() => void clearAccountData()}
                disabled={deletingAccountData}
              >
                {deletingAccountData ? "Deleting Data..." : "Delete Everything"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
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

const dangerZoneCard: React.CSSProperties = {
  ...positivePanel,
  borderRadius: "20px",
  padding: "24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  border: "1px solid rgba(220, 38, 38, 0.18)",
};

const dangerZoneTextWrap: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const dangerZoneTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "20px",
  fontWeight: 950,
  color: positiveHeading,
};

const dangerZoneText: React.CSSProperties = {
  margin: 0,
  color: positiveMuted,
  fontWeight: 700,
  lineHeight: 1.6,
};

const dangerZoneNote: React.CSSProperties = {
  margin: 0,
  color: "#166534",
  fontWeight: 800,
  lineHeight: 1.5,
};

const dangerZoneActionRow: React.CSSProperties = {
  display: "grid",
  gap: "12px",
  minWidth: "260px",
};

const dangerZoneDeleteBtn: React.CSSProperties = {
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

const toggleCard: React.CSSProperties = {
  ...positivePanel,
  borderRadius: "18px",
  padding: "18px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  marginBottom: "18px",
};

const toggleTextWrap: React.CSSProperties = {
  display: "grid",
  gap: "6px",
};

const toggleTitle: React.CSSProperties = {
  color: positiveHeading,
  fontSize: "17px",
  fontWeight: 950,
};

const toggleText: React.CSSProperties = {
  color: positiveMuted,
  fontWeight: 700,
  lineHeight: 1.5,
};

const checkboxInput: React.CSSProperties = {
  width: "22px",
  height: "22px",
  cursor: "pointer",
  accentColor: "#16a34a",
};

const helperText: React.CSSProperties = {
  margin: 0,
  color: positiveMuted,
  fontWeight: 700,
  lineHeight: 1.5,
};

const singleFieldWrap: React.CSSProperties = {
  maxWidth: "420px",
};

const statusCard: React.CSSProperties = {
  ...positivePanel,
  borderRadius: "18px",
  padding: "18px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
};

const changePasswordBtn: React.CSSProperties = {
  ...paleButton,
  padding: "12px 18px",
  whiteSpace: "nowrap",
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

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(61, 43, 0, 0.24)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 1000,
};

const modalCard: React.CSSProperties = {
  ...positivePanel,
  width: "100%",
  maxWidth: "760px",
  borderRadius: "24px",
  padding: "26px",
};

const modalHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "20px",
};

const modalTitle: React.CSSProperties = {
  margin: 0,
  color: positiveHeading,
  fontSize: "28px",
  fontWeight: 950,
};

const modalText: React.CSSProperties = {
  margin: "10px 0 0",
  color: positiveMuted,
  fontWeight: 700,
  lineHeight: 1.5,
};

const modalCloseBtn: React.CSSProperties = {
  ...dangerButton,
  width: "42px",
  height: "42px",
  padding: 0,
  fontSize: "18px",
  flexShrink: 0,
};

const modalButtonRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
  marginTop: "22px",
};

const dangerModalButtonRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "14px",
  marginTop: "22px",
};

const modalSecondaryBtn: React.CSSProperties = {
  ...paleButton,
  padding: "16px 18px",
};

const modalPrimaryBtn: React.CSSProperties = {
  ...successButton,
  padding: "16px 18px",
};

const dangerWarningCard: React.CSSProperties = {
  borderRadius: "18px",
  padding: "18px 20px",
  background: "rgba(220, 38, 38, 0.08)",
  border: "1px solid rgba(220, 38, 38, 0.18)",
  marginBottom: "18px",
};

const dangerWarningTitle: React.CSSProperties = {
  color: "#991b1b",
  fontWeight: 950,
};

const dangerWarningText: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#7f1d1d",
  fontWeight: 700,
  lineHeight: 1.6,
};
