export const DEFAULT_CASH_ACCOUNT = "Cash";
export const DEFAULT_BANK_ACCOUNT = "Bank A/C";

const BANK_MODE_ALIASES = new Set([
  "bank",
  "bank a/c",
  "bank account",
  "upi",
]);

export const normalizeAccountMode = (
  value: unknown,
  fallback = DEFAULT_CASH_ACCOUNT
) => {
  const raw = String(value ?? "").trim();

  if (!raw) return fallback;

  const lowered = raw.toLowerCase();

  if (lowered === "cash") return DEFAULT_CASH_ACCOUNT;
  if (BANK_MODE_ALIASES.has(lowered)) return DEFAULT_BANK_ACCOUNT;

  return raw;
};

export const isCashMode = (value: unknown) =>
  normalizeAccountMode(value, DEFAULT_CASH_ACCOUNT) === DEFAULT_CASH_ACCOUNT;

const ensureArrayStorage = (key: string) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      localStorage.setItem(key, JSON.stringify([]));
    }
  } catch {
    localStorage.setItem(key, JSON.stringify([]));
  }
};

export const ensureDefaultAccountStorage = () => {
  if (typeof window === "undefined") return;

  ["cashMaster", "bankMaster", "cashEntries", "bankEntries"].forEach(
    ensureArrayStorage
  );

  localStorage.setItem("defaultCashAccount", DEFAULT_CASH_ACCOUNT);
  localStorage.setItem("defaultBankAccount", DEFAULT_BANK_ACCOUNT);

  try {
    const rawSettings = localStorage.getItem("companySettings");
    const parsed =
      rawSettings && rawSettings.trim() ? JSON.parse(rawSettings) : {};

    const settings =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};

    if (!String((settings as Record<string, unknown>).bankName || "").trim()) {
      localStorage.setItem(
        "companySettings",
        JSON.stringify({
          ...settings,
          bankName: DEFAULT_BANK_ACCOUNT,
        })
      );
    }
  } catch {
    localStorage.setItem(
      "companySettings",
      JSON.stringify({ bankName: DEFAULT_BANK_ACCOUNT })
    );
  }
};
