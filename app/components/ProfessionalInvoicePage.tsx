"use client";

import AppShell from "./AppShell";
import {
  DEFAULT_BANK_ACCOUNT,
  DEFAULT_CASH_ACCOUNT,
  normalizeAccountMode,
} from "./defaultAccounts";
import { API_BASE_URL } from "../lib/api";
import { useResponsive } from "./useResponsive";
import {
  paleButton,
  positiveHeading,
  positiveHeroCard,
  positiveInputStrong,
  positiveMuted,
  positivePage,
  positivePanel,
  positivePanelSoft,
  positiveTableHead,
  positiveText,
} from "./positiveTheme";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API = API_BASE_URL;

type PageType = "sales" | "purchase" | "sales-return" | "purchase-return";

type InvoiceLine = {
  id: number;
  itemName: string;
  quantity: number;
  rate: number;
  gstRate: number;
  discountType: "amount" | "percentage";
  discountValue: number;
  subtotalAmount: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
};

type PartyRow = {
  id: number;
  partyName: string;
  gstNo: string;
  phone: string;
  state: string;
  pincode: string;
  address: string;
  remarks?: string;
  dueDays?: string | number;
};

type NewItemForm = {
  itemName: string;
  barcode: string;
  gstRate: string;
  salesRate: string;
  purchaseRate: string;
  openingStock: string;
};

type FocusZone = "customer" | "item" | "other";

const sortPartyRows = (rows: PartyRow[]) =>
  [...rows].sort((a, b) =>
    String(a.partyName || "").localeCompare(String(b.partyName || ""), undefined, {
      sensitivity: "base",
    })
  );

const getTodayDateInput = () => {
  const now = new Date();
  const shifted = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 10);
};

const padDatePart = (value: number) => String(value).padStart(2, "0");

const buildIsoDate = (year: number, month: number, day: number) => {
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return "";
  }

  return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
};

const parseFlexibleDateInput = (value: string) => {
  const text = String(value || "").trim();
  if (!text) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const normalized = text.replace(/[.\-]/g, "/");
  const parts = normalized.split("/").map((part) => part.trim());

  if (parts.length !== 3) {
    return "";
  }

  if (parts[0].length === 4) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    return buildIsoDate(year, month, day);
  }

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const rawYear = parts[2];
  const year =
    rawYear.length === 2 ? Number(`20${rawYear}`) : Number(rawYear);

  return buildIsoDate(year, month, day);
};

const formatDateForTyping = (value: string) => {
  if (!value) return "";

  const parsed = parseFlexibleDateInput(value);
  if (!parsed) return value;

  const [year, month, day] = parsed.split("-");
  return `${day}/${month}/${year}`;
};

const addDaysToDateInput = (days: number, baseDateInput = getTodayDateInput()) => {
  const normalizedBase = parseFlexibleDateInput(baseDateInput) || getTodayDateInput();
  const [year, month, day] = normalizedBase.split("-").map(Number);
  const base = new Date(year, month - 1, day, 12, 0, 0, 0);
  base.setDate(base.getDate() + Math.max(days, 0));
  const shifted = new Date(base.getTime() - base.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 10);
};

const parseDueDays = (value: unknown) => {
  const parsed = Number(String(value ?? "").trim() || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const resolveFlexibleDueDateInput = (
  value: string,
  baseDateInput = getTodayDateInput(),
) => {
  const text = String(value || "").trim();
  if (!text) return "";

  if (/^\d+$/.test(text)) {
    return addDaysToDateInput(Number(text), baseDateInput);
  }

  return parseFlexibleDateInput(text);
};

type FlexibleDateFieldHandle = {
  commit: () => string | null;
};

type FlexibleDateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onSubmit?: () => void;
};

export default function ProfessionalInvoicePage({ type }: { type: PageType }) {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const originalInvoiceRef = useRef<HTMLInputElement | null>(null);
  const barcodeRef = useRef<HTMLInputElement | null>(null);
  const manualItemRef = useRef<HTMLInputElement | null>(null);
  const quantityRef = useRef<HTMLInputElement | null>(null);
  const rateRef = useRef<HTMLInputElement | null>(null);
  const gstRateRef = useRef<HTMLInputElement | null>(null);
  const discountTypeRef = useRef<HTMLSelectElement | null>(null);
  const discountValueRef = useRef<HTMLInputElement | null>(null);
  const addLineButtonRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const customerInputRef = useRef<HTMLInputElement | null>(null);
  const dueDateInputRef = useRef<HTMLInputElement | null>(null);
  const dueDateFieldRef = useRef<FlexibleDateFieldHandle | null>(null);
  const customerDropdownRef = useRef<HTMLDivElement | null>(null);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerHighlightIdx, setCustomerHighlightIdx] = useState(0);

  const focusZoneRef = useRef<FocusZone>("other");
  const [isMasterItem, setIsMasterItem] = useState(false);

  const focusPartyLookup = () => {
    customerInputRef.current?.focus();
    setCustomerDropdownOpen(true);
  };

  const focusDueDateField = () => {
    setTimeout(() => {
      dueDateInputRef.current?.focus();
      dueDateInputRef.current?.select();
    }, 60);
  };

  const focusItemEntryField = () => {
    setTimeout(() => {
      barcodeRef.current?.focus();
      barcodeRef.current?.select();
    }, 60);
  };

  const cfg: any = {
    sales: {
      title: "Sales Invoice",
      endpoint: "sales",
      noKey: "invoiceNo",
      partyKey: "partyName",
      partyLabel: "Customer",
      partyMasterType: "buyer",
      partyStorageKey: "buyerMaster",
      prefixKey: "salesPrefix",
      prefixDefault: "SAL",
      saveText: "Save Sales Invoice",
      color: "#16a34a",
      isIncoming: true,
    },
    purchase: {
      title: "Purchase Invoice",
      endpoint: "purchase",
      noKey: "invoiceNo",
      partyKey: "supplierName",
      partyLabel: "Supplier",
      partyMasterType: "supplier",
      partyStorageKey: "supplierMaster",
      prefixKey: "purchasePrefix",
      prefixDefault: "PUR",
      saveText: "Save Purchase Invoice",
      color: "#d98b22",
      isIncoming: false,
    },
    "sales-return": {
      title: "Sales Return",
      endpoint: "sales-return",
      noKey: "returnNo",
      partyKey: "partyName",
      partyLabel: "Customer",
      partyMasterType: "buyer",
      partyStorageKey: "buyerMaster",
      prefixKey: "salesReturnPrefix",
      prefixDefault: "SR",
      saveText: "Save Sales Return",
      color: "#db2777",
      isReturn: true,
      isIncoming: false,
    },
    "purchase-return": {
      title: "Purchase Return",
      endpoint: "purchase-return",
      noKey: "returnNo",
      partyKey: "supplierName",
      partyLabel: "Supplier",
      partyMasterType: "supplier",
      partyStorageKey: "supplierMaster",
      prefixKey: "purchaseReturnPrefix",
      prefixDefault: "PR",
      saveText: "Save Purchase Return",
      color: "#2563eb",
      isReturn: true,
      isIncoming: true,
    },
  }[type];

  const enableCustomerAccountShortcuts = cfg.partyLabel === "Customer";

  const isQuickAccountPartyName = (value: string) => {
    const normalized = normalizeAccountMode(value, value);
    return (
      normalized === DEFAULT_CASH_ACCOUNT || normalized === DEFAULT_BANK_ACCOUNT
    );
  };

  const resolveCustomerShortcut = (value: string) => {
    if (!enableCustomerAccountShortcuts) return null;

    const normalized = normalizeAccountMode(value, value);
    return isQuickAccountPartyName(normalized) ? normalized : null;
  };

  const [company, setCompany] = useState<any>({});
  const [entries, setEntries] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [parties, setParties] = useState<PartyRow[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLine[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [barcode, setBarcode] = useState("");

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [saveConfirmData, setSaveConfirmData] = useState<{
    total: number;
    invoiceNo: string;
    partyName: string;
    payload: any;
  } | null>(null);
  const [paymentSplit, setPaymentSplit] = useState({ cash: "", bank: "" });
  const [newItemModalTitle, setNewItemModalTitle] = useState("Add New Item");
  const pendingScannedBarcodeRef = useRef("");

  const [itemDropdownOpen, setItemDropdownOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [itemHighlightIdx, setItemHighlightIdx] = useState(0);
  const itemSearchRef = useRef<HTMLInputElement | null>(null);
  const itemDropdownRef = useRef<HTMLDivElement | null>(null);

  const [newParty, setNewParty] = useState<PartyRow>({
    id: 0,
    partyName: "",
    gstNo: "",
    phone: "",
    state: "",
    pincode: "",
    address: "",
    remarks: "",
    dueDays: cfg.partyMasterType === "buyer" ? "15" : "30",
  });

  const [newItem, setNewItem] = useState<NewItemForm>({
    itemName: "",
    barcode: "",
    gstRate: "",
    salesRate: "",
    purchaseRate: "",
    openingStock: "",
  });

  const [form, setForm] = useState<any>({
    invoiceNo: "",
    returnNo: "",
    originalInvoiceNo: "",
    partyName: "",
    supplierName: "",
    dueDate: getTodayDateInput(),
    gstNo: "",
    phone: "",
    state: "",
    pincode: "",
    address: "",
    itemName: "",
    quantity: 0,
    rate: 0,
    gstRate: 0,
    discountType: "percentage",
    discountValue: 0,
  });

  useEffect(() => {
    loadAll();
  }, [type]);

  useEffect(() => {
    return () => stopLiveCamera();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if (customerInputRef.current) {
        customerInputRef.current.focus();
        setCustomerDropdownOpen(true);
      }
    }, 300);
  }, [type]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(e.target as Node)) {
        setItemDropdownOpen(false);
      }
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const saveEntryRef = useRef<() => void>(() => {});
  const invoiceItemsRef = useRef<InvoiceLine[]>([]);
  const anyModalOpenRef = useRef(false);

  useEffect(() => { invoiceItemsRef.current = invoiceItems; }, [invoiceItems]);

  useEffect(() => {
    anyModalOpenRef.current =
      showPartyModal || showItemModal || showSaveConfirm ||
      showExtractionModal || showLiveCamera || showPaymentOptions;
  }, [showPartyModal, showItemModal, showSaveConfirm, showExtractionModal, showLiveCamera, showPaymentOptions]);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showSaveConfirm || showPartyModal || showItemModal || showExtractionModal || showLiveCamera || showPaymentOptions) {
          e.preventDefault();
          e.stopPropagation();
          setShowSaveConfirm(false);
          setShowPartyModal(false);
          setShowItemModal(false);
          setShowExtractionModal(false);
          closeLiveCamera();
          setShowPaymentOptions(false);
          return; 
        }
        
        e.preventDefault();
        const isFormDirty = invoiceItems.length > 0 || !!form[cfg.partyKey] || !!form.itemName;
        if (isFormDirty) {
          const confirmExit = window.confirm("You have unsaved changes. Are you sure you want to exit to Dashboard?");
          if (confirmExit) {
            router.push("/dashboard");
          }
        } else {
          router.push("/dashboard");
        }
        return;
      }

      if (showSaveConfirm) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSaveConfirm(true);
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
          e.preventDefault();
          handleSaveConfirm(false);
          return;
        }
        return;
      }

      if (anyModalOpenRef.current) return;

      if (e.key === "F2") {
        e.preventDefault();
        saveEntryRef.current();
        return;
      }

      if (e.key === "F3") {
        e.preventDefault();
        openPartyPopup(customerSearch || form[cfg.partyKey] || "");
        return;
      }

      if (e.key === "F8") {
        e.preventDefault();
        setCustomerDropdownOpen(false);
        setItemDropdownOpen(false);
        barcodeRef.current?.focus();
        barcodeRef.current?.select();
        return;
      }

      if (e.key === "F4") {
        e.preventDefault();
        const zone = focusZoneRef.current;
        if (zone === "customer") {
          openPartyPopup();
        } else {
          setNewItem({ itemName: "", barcode: "", gstRate: "", salesRate: "", purchaseRate: "", openingStock: "" });
          pendingScannedBarcodeRef.current = "";
          setNewItemModalTitle("Add New Item");
          setShowItemModal(true);
        }
        return;
      }

      if (e.key === "Delete") {
        const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
        const isEditable =
          tag === "input" || tag === "textarea" || tag === "select" ||
          (document.activeElement as HTMLElement)?.isContentEditable;

        if (!isEditable) {
          e.preventDefault();
          setInvoiceItems((prev) => {
            if (prev.length === 0) return prev;
            return prev.slice(0, -1);
          });
        }
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalKey, true);
    return () => window.removeEventListener("keydown", handleGlobalKey, true);
  }, [showSaveConfirm, showPartyModal, showItemModal, showExtractionModal, showLiveCamera, showPaymentOptions, saveConfirmData, paymentSplit, invoiceItems, form, type]);

  const money = (n: any) => `Rs ${Number(n || 0).toLocaleString("en-IN")}`;
  const parseMoneyInput = (value: string) =>
    Number(String(value || "").replace(/,/g, "").trim() || 0);
  const formatMoney = (n: any) => `Rs ${Number(n || 0).toLocaleString("en-IN")}`;
  const formatMoneyExact = (n: any) =>
    `Rs ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const getPaymentStatusLabel = (pendingAmount: number, settledAmount: number) => {
    if (pendingAmount <= 0) return cfg.isIncoming ? "Received" : "Paid";
    if (settledAmount > 0) return cfg.isIncoming ? "Partial Received" : "Partial Paid";
    return cfg.isIncoming ? "Not Received" : "Not Paid";
  };
  const getPaymentSplitTotals = (total: number, split = paymentSplit) => {
    const cashAmount = Math.max(parseMoneyInput(split.cash), 0);
    const bankAmount = Math.max(parseMoneyInput(split.bank), 0);
    const enteredAmount = cashAmount + bankAmount;
    const settledAmount = Math.min(enteredAmount, total);
    const pendingAmount = Math.max(total - settledAmount, 0);

    return {
      cashAmount,
      bankAmount,
      enteredAmount,
      settledAmount,
      pendingAmount,
      isOverLimit: enteredAmount > total,
    };
  };
  const amountReceived = paymentSplit.cash;
  const setAmountReceived = (value: string) =>
    setPaymentSplit((prev) => ({ ...prev, cash: value }));

  const getStorageArray = (key: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const resolveInvoiceDueDate = (
    party?: Partial<PartyRow> | null,
    partyName?: string,
  ) => {
    const shortcutName =
      resolveCustomerShortcut(partyName || String(party?.partyName || "")) || "";

    if (shortcutName) {
      return getTodayDateInput();
    }

    const dueDays = parseDueDays((party as any)?.dueDays);
    return dueDays > 0 ? addDaysToDateInput(dueDays) : getTodayDateInput();
  };

  const loadParties = () => {
    const saved = sortPartyRows(
      getStorageArray(cfg.partyStorageKey).map((p: any) => ({
      id: Number(p.id || Date.now()),
      partyName: p.partyName || p.name || p.supplierName || p.customerName || "",
      gstNo: p.gstNo || p.gstNumber || p.gstin || "",
      phone: p.phone || "",
      state: p.state || "",
      pincode: p.pincode || "",
      address: p.address || "",
      remarks: p.remarks || "",
      dueDays: p.dueDays ?? p.creditDays ?? (cfg.partyMasterType === "buyer" ? "15" : "30"),
      }))
    );
    setParties(saved);
  };

  const loadAll = async () => {
    try {
      const [companyRes, entryRes, itemRes] = await Promise.all([
        fetch(`${API}/company`).catch(() => null),
        fetch(`${API}/${cfg.endpoint}`).catch(() => null),
        fetch(`${API}/items`).catch(() => null),
      ]);

      const companyData = companyRes ? await companyRes.json().catch(() => ({})) : {};
      const entryData = entryRes ? await entryRes.json().catch(() => []) : [];
      const itemData = itemRes ? await itemRes.json().catch(() => []) : [];

      setCompany(companyData || {});
      setEntries(Array.isArray(entryData) ? entryData : []);
      setItems(Array.isArray(itemData) ? itemData : getStorageArray("items"));
    } catch (err) {
      console.error("Load error:", err);
      setCompany({});
      setEntries([]);
      setItems(getStorageArray("items"));
    }

    loadParties();
  };

  const prefix = company?.[cfg.prefixKey] || cfg.prefixDefault;
  const autoNo = `${prefix}-${new Date().getFullYear()}-${String(entries.length + 1).padStart(4, "0")}`;

  const update = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const customerOptions = useMemo(() => {
    const quickOptions = enableCustomerAccountShortcuts
      ? [
          {
            id: -2,
            partyName: DEFAULT_BANK_ACCOUNT,
            gstNo: "",
            phone: "",
            state: "",
            pincode: "",
            address: "",
            remarks: "",
            dueDays: "0",
          },
          {
            id: -1,
            partyName: DEFAULT_CASH_ACCOUNT,
            gstNo: "",
            phone: "",
            state: "",
            pincode: "",
            address: "",
            remarks: "",
            dueDays: "0",
          },
        ]
      : [];

    const deduped = new Map<string, PartyRow>();

    [...quickOptions, ...parties].forEach((party) => {
      const key = String(party.partyName || "").trim().toLowerCase();
      if (key && !deduped.has(key)) {
        deduped.set(key, party);
      }
    });

    return sortPartyRows(Array.from(deduped.values()));
  }, [enableCustomerAccountShortcuts, parties]);

  const findCustomerOption = (rawValue: string) => {
    const typedValue = String(rawValue || "").trim();
    if (!typedValue) return null;

    const shortcut = resolveCustomerShortcut(typedValue);
    if (shortcut) {
      return customerOptions.find(
        (party) =>
          String(party.partyName || "").trim().toLowerCase() ===
          shortcut.toLowerCase()
      );
    }

    const query = typedValue.toLowerCase();
    return (
      customerOptions.find((party) => {
        const name = String(party.partyName || "").trim().toLowerCase();
        const gst = String(party.gstNo || "").trim().toLowerCase();
        return name === query || (gst && gst === query);
      }) || null
    );
  };

  const getDefaultPaymentSplitForParty = (partyName: string, total: number) => {
    const quickAccount = resolveCustomerShortcut(partyName);

    if (quickAccount === DEFAULT_BANK_ACCOUNT) {
      return { cash: "", bank: String(total) };
    }

    return { cash: String(total), bank: "" };
  };

  // Keeps both Cash and Bank boxes editable.
  // Example: if Bank has full amount and you type Cash 2000, Bank auto-reduces to balance.
  const updatePaymentSplitAmount = (field: "cash" | "bank", value: string) => {
    if (!saveConfirmData) {
      setPaymentSplit((prev) => ({ ...prev, [field]: value }));
      return;
    }

    const total = Number(saveConfirmData.total || 0);
    const enteredAmount = Math.max(parseMoneyInput(value), 0);
    const otherField = field === "cash" ? "bank" : "cash";
    const otherCurrent = Math.max(parseMoneyInput(paymentSplit[otherField]), 0);
    const allowedOtherAmount = Math.max(total - enteredAmount, 0);
    const adjustedOtherAmount = Math.min(otherCurrent, allowedOtherAmount);

    setPaymentSplit((prev) => ({
      ...prev,
      [field]: value,
      [otherField]: adjustedOtherAmount > 0 ? String(adjustedOtherAmount) : "",
    }));
  };

  const selectParty = (partyName: string) => {
    const resolvedPartyName = resolveCustomerShortcut(partyName) || partyName;
    const selected = customerOptions.find(
      (p) =>
        String(p.partyName || "").trim().toLowerCase() ===
        String(resolvedPartyName || "").trim().toLowerCase()
    );
    const isQuickAccount = isQuickAccountPartyName(resolvedPartyName);

    setForm((prev: any) => ({
      ...prev,
      [cfg.partyKey]: resolvedPartyName,
      gstNo: isQuickAccount ? "" : selected?.gstNo || "",
      phone: isQuickAccount ? "" : selected?.phone || "",
      state: isQuickAccount ? "" : selected?.state || "",
      pincode: isQuickAccount ? "" : selected?.pincode || "",
      address: isQuickAccount ? "" : selected?.address || "",
      dueDate: resolveInvoiceDueDate(selected, resolvedPartyName),
    }));
    setCustomerSearch(resolvedPartyName);
    focusDueDateField();
  };

  const applyCustomerInput = (rawValue: string) => {
    const typedValue = String(rawValue || "").trim();
    const exactMatch = findCustomerOption(typedValue);

    if (exactMatch) {
      selectParty(exactMatch.partyName);
      return;
    }

    setCustomerSearch(typedValue);
    setForm((prev: any) => ({
      ...prev,
      [cfg.partyKey]: typedValue,
      gstNo: "",
      phone: "",
      state: "",
      pincode: "",
      address: "",
    }));
    setCustomerDropdownOpen(false);

    if (typedValue) {
      focusDueDateField();
    }
  };

  const openPartyPopup = (customName?: string) => {
    setNewParty({
      id: 0,
      partyName: customName || form[cfg.partyKey] || "",
      gstNo: form.gstNo || "",
      phone: form.phone || "",
      state: form.state || "",
      pincode: form.pincode || "",
      address: form.address || "",
      remarks: "",
      dueDays: cfg.partyMasterType === "buyer" ? "15" : "30",
    });
    setShowPartyModal(true);
  };

  const saveParty = () => {
    if (!newParty.partyName.trim()) {
      alert(`${cfg.partyLabel} name required`);
      return;
    }

    const old = getStorageArray(cfg.partyStorageKey);
    const id = newParty.id || Date.now();
    const cleanParty = {
      ...newParty,
      id,
      name: newParty.partyName.trim(),
      partyName: newParty.partyName.trim(),
      gstNo: String(newParty.gstNo || "").trim().toUpperCase(),
      gstNumber: String(newParty.gstNo || "").trim().toUpperCase(),
      dueDays: String(parseDueDays(newParty.dueDays)),
      creditDays: String(parseDueDays(newParty.dueDays)),
    };
    const withoutSame = old.filter(
      (p: any) =>
        String(p.partyName || p.name || "").toLowerCase() !== cleanParty.partyName.toLowerCase()
    );
    const sortedParties = sortPartyRows([cleanParty, ...withoutSame]);

    localStorage.setItem(cfg.partyStorageKey, JSON.stringify(sortedParties));
    setParties(sortedParties);
    setForm((prev: any) => ({
      ...prev,
      [cfg.partyKey]: cleanParty.partyName,
      gstNo: cleanParty.gstNo,
      phone: cleanParty.phone,
      state: cleanParty.state,
      pincode: cleanParty.pincode,
      address: cleanParty.address,
      dueDate: resolveInvoiceDueDate(cleanParty, cleanParty.partyName),
    }));
    setCustomerSearch(cleanParty.partyName);
    setShowPartyModal(false);
    focusDueDateField();
  };

  const selectItem = (itemName: string) => {
    const selectedItem = items.find((x: any) => String(x.itemName) === String(itemName));
    setForm((prev: any) => ({
      ...prev,
      itemName: selectedItem?.itemName || itemName,
      gstRate: Number(selectedItem?.gstRate || selectedItem?.gst || 0),
      rate:
        type === "purchase" || type === "purchase-return"
          ? Number(selectedItem?.purchaseRate || selectedItem?.rate || 0)
          : Number(selectedItem?.salesRate || selectedItem?.rate || 0),
    }));
    
    setIsMasterItem(true);
    setTimeout(() => quantityRef.current?.focus(), 50);
  };

  const findItemByBarcode = (code: string) => {
    const q = String(code || "").trim().toLowerCase();
    if (!q) return null;
    return (
      items.find((x: any) =>
        [x.barcode, x.itemCode, x.code, x.sku, x.itemName]
          .map((v) => String(v || "").toLowerCase())
          .includes(q)
      ) || null
    );
  };

  const addOrIncreaseScannedItem = (item: any, qtyToAdd = 1) => {
    const itemName = item.itemName || item.name || "";
    const rate =
      type === "purchase" || type === "purchase-return"
        ? Number(item.purchaseRate || item.rate || 0)
        : Number(item.salesRate || item.rate || 0);
    const gstRate = Number(item.gstRate || item.gst || 0);

    if (!itemName || !rate) {
      alert("Item rate is missing. Please update Item Master.");
      return;
    }

    setInvoiceItems((prev: InvoiceLine[]) => {
      const index = prev.findIndex(
        (line) =>
          String(line.itemName).toLowerCase() === String(itemName).toLowerCase() &&
          Number(line.rate) === Number(rate) &&
          Number(line.gstRate) === Number(gstRate)
      );

      if (index >= 0) {
        return prev.map((line, i) =>
          i === index
            ? calcLine({ ...line, quantity: Number(line.quantity || 0) + qtyToAdd })
            : line
        );
      }

      return [
        ...prev,
        calcLine({
          id: Date.now() + Math.floor(Math.random() * 10000),
          itemName,
          quantity: qtyToAdd,
          rate,
          gstRate,
          discountType: "percentage",
          discountValue: 0,
        }),
      ];
    });

    setForm((prev: any) => ({
      ...prev,
      itemName: "",
      quantity: 0,
      rate: 0,
      gstRate: 0,
      discountType: "percentage",
      discountValue: 0,
    }));

    setBarcode("");
    setTimeout(() => barcodeRef.current?.focus(), 50);
  };

  const addByBarcode = () => {
    const scannedBarcode = barcode.trim();
    const item = findItemByBarcode(scannedBarcode);
    if (!item) {
      pendingScannedBarcodeRef.current = scannedBarcode;
      setNewItemModalTitle(scannedBarcode ? `Add New Item for Barcode ${scannedBarcode}` : "Add New Item");
      setNewItem({
        itemName: "",
        barcode: scannedBarcode,
        gstRate: "",
        salesRate: "",
        purchaseRate: "",
        openingStock: "",
      });
      setShowItemModal(true);
      return;
    }
    addOrIncreaseScannedItem(item, 1);
  };

  const saveNewItem = async () => {
    if (!newItem.itemName.trim()) {
      alert("Item name required");
      return;
    }

    const payload: any = {
      itemName: newItem.itemName.trim(),
      barcode: newItem.barcode.trim(),
      gstRate: Number(newItem.gstRate || 0),
      salesRate: Number(newItem.salesRate || 0),
      purchaseRate: Number(newItem.purchaseRate || 0),
      currentStock: Number(newItem.openingStock || 0),
      openingStock: Number(newItem.openingStock || 0),
    };

    let saved = payload;

    try {
      const res = await fetch(`${API}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        saved = await res.json().catch(() => payload);
      }
    } catch {
      // boundaries clean fallback
    }

    const oldItems = getStorageArray("items");
    const updatedItems = [
      { ...payload, ...saved, id: saved?.id || Date.now() },
      ...items.filter(
        (x: any) => String(x.itemName).toLowerCase() !== payload.itemName.toLowerCase()
      ),
    ];

    localStorage.setItem(
      "items",
      JSON.stringify([{ ...payload, ...saved, id: saved?.id || Date.now() }, ...oldItems])
    );
    const savedItem = { ...payload, ...saved, id: saved?.id || Date.now() };
    setItems(updatedItems);
    pendingScannedBarcodeRef.current = pendingScannedBarcodeRef.current.trim();
    if (
      pendingScannedBarcodeRef.current &&
      String(savedItem.barcode || "").trim().toLowerCase() ===
        pendingScannedBarcodeRef.current.toLowerCase()
    ) {
      addOrIncreaseScannedItem(savedItem, 1);
    } else {
      selectItem(payload.itemName);
    }
    pendingScannedBarcodeRef.current = "";
    setNewItemModalTitle("Add New Item");
    setNewItem({ itemName: "", barcode: "", gstRate: "", salesRate: "", purchaseRate: "", openingStock: "" });
    setShowItemModal(false);
  };

  const calcLine = (raw: any): InvoiceLine => {
    const lineQty = Number(raw.quantity || 0);
    const lineRate = Number(raw.rate || 0);
    const lineGstRate = Number(raw.gstRate || 0);
    const lineDiscountType = raw.discountType || "percentage";
    const lineDiscountValue = Number(raw.discountValue || 0);
    const lineSubtotal = lineQty * lineRate;
    const rawDiscount =
      lineDiscountType === "percentage"
        ? (lineSubtotal * lineDiscountValue) / 100
        : lineDiscountValue;
    const lineDiscount = Math.min(Math.max(rawDiscount, 0), lineSubtotal);
    const lineTaxable = lineSubtotal - lineDiscount;
    const lineGstAmount = (lineTaxable * lineGstRate) / 100;
    const isB2C = !form.gstNo || form.gstNo === "B2C";
    const lineCgst = isB2C ? lineGstAmount / 2 : 0;
    const lineSgst = isB2C ? lineGstAmount / 2 : 0;
    const lineIgst = isB2C ? 0 : lineGstAmount;

    return {
      id: Number(raw.id || Date.now()),
      itemName: raw.itemName || "",
      quantity: lineQty,
      rate: lineRate,
      gstRate: lineGstRate,
      discountType: lineDiscountType,
      discountValue: lineDiscountValue,
      subtotalAmount: lineSubtotal,
      discountAmount: lineDiscount,
      taxableAmount: lineTaxable,
      cgst: lineCgst,
      sgst: lineSgst,
      igst: lineIgst,
      totalAmount: lineTaxable + lineCgst + lineSgst + lineIgst,
    };
  };

  const currentLine = calcLine({
    id: Date.now(),
    itemName: form.itemName,
    quantity: Number(form.quantity || 0),
    rate: Number(form.rate || 0),
    gstRate: Number(form.gstRate || 0),
    discountType: form.discountType || "percentage",
    discountValue: Number(form.discountValue || 0),
  });

  const activeLines =
    invoiceItems.length > 0
      ? invoiceItems
      : form.itemName && Number(form.quantity || 0) > 0 && Number(form.rate || 0) > 0
      ? [currentLine]
      : [];

  const subtotalAmount = activeLines.reduce((s, x) => s + Number(x.subtotalAmount || 0), 0);
  const discountAmount = activeLines.reduce((s, x) => s + Number(x.discountAmount || 0), 0);
  const taxableAmount = activeLines.reduce((s, x) => s + Number(x.taxableAmount || 0), 0);
  const cgst = activeLines.reduce((s, x) => s + Number(x.cgst || 0), 0);
  const sgst = activeLines.reduce((s, x) => s + Number(x.sgst || 0), 0);
  const igst = activeLines.reduce((s, x) => s + Number(x.igst || 0), 0);
  const amountBeforeRound = activeLines.reduce((s, x) => s + Number(x.totalAmount || 0), 0);
  const grandTotal = Math.round(amountBeforeRound);
  const roundOff = Number((grandTotal - amountBeforeRound).toFixed(2));
  const totalAmount = grandTotal;

  const addItemToInvoice = () => {
    if (!form.itemName || !Number(form.quantity || 0) || !Number(form.rate || 0)) {
      alert("Select item, quantity and rate before Add Item");
      return;
    }
    if (form.discountType === "percentage" && Number(form.discountValue || 0) > 100) {
      alert("Discount percentage cannot be more than 100%");
      return;
    }

    setInvoiceItems((prev) => [
      ...prev,
      { ...currentLine, id: Date.now() + Math.floor(Math.random() * 10000) },
    ]);

    setForm((prev: any) => ({
      ...prev,
      itemName: "",
      quantity: 0,
      rate: 0,
      gstRate: 0,
      discountType: "percentage",
      discountValue: 0,
    }));

    setItemSearch("");
    setIsMasterItem(false);
    setItemDropdownOpen(false);
    setTimeout(() => barcodeRef.current?.focus(), 60);
  };

  const removeInvoiceItem = (id: number) => {
    setInvoiceItems((prev) => prev.filter((x) => x.id !== id));
  };

  const loadInvoiceItemForEdit = (line: InvoiceLine) => {
    setForm((prev: any) => ({
      ...prev,
      itemName: line.itemName,
      quantity: line.quantity,
      rate: line.rate,
      gstRate: line.gstRate,
      discountType: line.discountType,
      discountValue: line.discountValue,
    }));
    removeInvoiceItem(line.id);
  };

  const clearForm = () => {
    setEditingId(null);
    setInvoiceItems([]);
    setBarcode("");
    setCustomerSearch("");
    setIsMasterItem(false);
    setPaymentSplit({ cash: "", bank: "" });
    pendingScannedBarcodeRef.current = "";
    setNewItemModalTitle("Add New Item");
    setForm({
      invoiceNo: "",
      returnNo: "",
      originalInvoiceNo: "",
      partyName: "",
      supplierName: "",
      dueDate: getTodayDateInput(),
      gstNo: "",
      phone: "",
      state: "",
      pincode: "",
      address: "",
      itemName: "",
      quantity: 0,
      rate: 0,
      gstRate: 0,
      discountType: "percentage",
      discountValue: 0,
    });
    setTimeout(() => customerInputRef.current?.focus(), 100);
  };

  const buildPayload = (dueDateOverride?: string) => {
    const noValue = form[cfg.noKey] || autoNo;
    const lines = activeLines.length > 0 ? activeLines : [currentLine].filter((x) => x.itemName);
    const first = lines[0] || currentLine;

    const payload: any = {
      [cfg.noKey]: noValue,
      [cfg.partyKey]: form[cfg.partyKey],
      dueDate: dueDateOverride || form.dueDate || getTodayDateInput(),
      gstNo: form.gstNo || "B2C",
      phone: form.phone || "",
      state: form.state || "",
      pincode: form.pincode || "",
      address: form.address || "",
      itemName: lines.map((x) => x.itemName).filter(Boolean).join(", ") || first.itemName,
      quantity: lines.reduce((s, x) => s + Number(x.quantity || 0), 0),
      rate: first.rate || 0,
      gstRate: lines.length > 1 ? 0 : first.gstRate || 0,
      taxableAmount,
      cgst,
      sgst,
      igst,
      amountBeforeRound,
      roundOff,
      totalAmount,
      grandTotal: totalAmount,
      items: lines,
      subtotalAmount,
      discountType: form.discountType || "percentage",
      discountValue: Number(form.discountValue || 0),
      discountAmount,
      paymentStatus: cfg.isIncoming ? "not_received" : "not_paid",
    };

    if (cfg.isReturn) {
      payload.originalInvoiceNo = form.originalInvoiceNo || "-";
    }

    return payload;
  };

  const saveInvoiceMeta = (payload: any, id?: any) => {
    const invoiceNo = payload.invoiceNo || payload.returnNo || form[cfg.noKey] || autoNo;
    const key = `${cfg.endpoint}:${id || editingId || invoiceNo}`;
    const old = JSON.parse(localStorage.getItem("invoiceInvoiceMeta") || "{}");

    old[key] = {
      invoiceNo,
      dueDate: payload.dueDate || form.dueDate || "",
      items: payload.items || activeLines,
      subtotalAmount,
      discountType: form.discountType || "percentage",
      discountValue: Number(form.discountValue || 0),
      discountAmount,
      taxableAmount,
      cgst,
      sgst,
      igst,
      amountBeforeRound,
      roundOff,
      totalAmount,
      grandTotal: totalAmount,
      updatedAt: new Date().toISOString(),
    };

    old[`${cfg.endpoint}:${invoiceNo}`] = old[key];
    localStorage.setItem("invoiceInvoiceMeta", JSON.stringify(old));
  };

  const upsertPendingMaster = (
    invoiceNo: string,
    partyName: string,
    pendingAmount: number,
    total: number,
    settledAmount = 0,
    dueDate = form.dueDate || ""
  ) => {
    const key = cfg.isIncoming ? "receivableMaster" : "paymentMaster";
    const old = getStorageArray(key);
    const withoutCurrent = old.filter((x: any) => x.invoiceNo !== invoiceNo);

    if (pendingAmount <= 0) {
      localStorage.setItem(key, JSON.stringify(withoutCurrent));
      return;
    }

    const row = cfg.isIncoming
      ? {
          id: Date.now(),
          date: new Date().toISOString().slice(0, 10),
          invoiceNo,
          customerName: partyName,
          partyName,
          invoiceAmount: total,
          amount: total,
          paidAmount: settledAmount,
          received: settledAmount,
          receivedAmount: settledAmount,
          balance: pendingAmount,
          pendingAmount,
          dueDate,
          status: getPaymentStatusLabel(pendingAmount, settledAmount),
          source: cfg.title,
          remarks: cfg.title,
        }
      : {
          id: Date.now(),
          date: new Date().toISOString().slice(0, 10),
          invoiceNo,
          partyName,
          supplierName: partyName,
          invoiceAmount: total,
          amount: total,
          paidAmount: settledAmount,
          pendingAmount,
          dueDate,
          paymentMode: pendingAmount > 0 ? "Pending" : "Settled",
          referenceNo: invoiceNo,
          status: getPaymentStatusLabel(pendingAmount, settledAmount),
          source: cfg.title,
          remarks: cfg.title,
        };

    localStorage.setItem(key, JSON.stringify([row, ...withoutCurrent]));
  };

  const saveEntry = async () => {
    if (!form[cfg.partyKey]) {
      alert(`Please select or enter ${cfg.partyLabel}`);
      return;
    }
    if (activeLines.length === 0) {
      alert("Please add at least one item");
      return;
    }

    const committedDueDate = dueDateFieldRef.current?.commit();
    if (committedDueDate === null) {
      return;
    }

    const resolvedDueDate =
      committedDueDate === ""
        ? getTodayDateInput()
        : committedDueDate || form.dueDate || getTodayDateInput();

    const payload = buildPayload(resolvedDueDate);
    const url = editingId ? `${API}/${cfg.endpoint}/${editingId}` : `${API}/${cfg.endpoint}`;
    const method = editingId ? "PUT" : "POST";

    if (type === "sales") {
      for (const line of activeLines) {
        const selectedItem = items.find(
          (x: any) => String(x.itemName).toLowerCase() === String(line.itemName).toLowerCase()
        );
        const currentStock = Number(selectedItem?.currentStock || 0);
        const newStock = currentStock - Number(line.quantity || 0);

        if (newStock < 0) {
          const ok = confirm(
            `Negative Stock Warning\n\nItem: ${line.itemName}\nCurrent Stock: ${currentStock}\nSales Qty: ${line.quantity}\nAfter Sale Stock: ${newStock}\n\nDo you want to continue?`
          );
          if (!ok) return;
        }
      }
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      alert(`Save failed. ${msg || "Check backend terminal."}`);
      return;
    }

    const saved = await res.json().catch(() => ({}));
    saveInvoiceMeta(payload, saved?.id || editingId);

    const invoiceNo = payload.invoiceNo || payload.returnNo || form[cfg.noKey] || autoNo;
    setSaveConfirmData({
      total: totalAmount,
      invoiceNo,
      partyName: form[cfg.partyKey] || "Party",
      payload,
    });
    setPaymentSplit(
      getDefaultPaymentSplitForParty(form[cfg.partyKey] || "Party", totalAmount)
    );
    setShowSaveConfirm(true);
    loadAll();
  };

  useEffect(() => {
    saveEntryRef.current = saveEntry;
  });

  const handleSaveConfirm = (shouldPrint: boolean) => {
    const data = saveConfirmData;
    if (!data) return;

    const paymentTotals = getPaymentSplitTotals(data.total);
    if (paymentTotals.isOverLimit) {
      alert(`Received/Paid amount cannot be more than ${formatMoney(data.total)}.`);
      return;
    }

    if (paymentTotals.cashAmount > 0) {
      postCashEntry(data.invoiceNo, data.partyName, paymentTotals.cashAmount);
    }
    if (paymentTotals.bankAmount > 0) {
      postBankEntry(data.invoiceNo, data.partyName, paymentTotals.bankAmount);
    }

    upsertPendingMaster(
      data.invoiceNo,
      data.partyName,
      paymentTotals.pendingAmount,
      data.total,
      paymentTotals.settledAmount,
      data.payload?.dueDate || form.dueDate || ""
    );

    const store = JSON.parse(localStorage.getItem("invoicePaymentStatus") || "{}");
    store[`${cfg.endpoint}:${data.invoiceNo}`] = {
      paidAmount: paymentTotals.settledAmount,
      receivedAmount: paymentTotals.settledAmount,
      cashAmount: paymentTotals.cashAmount,
      bankAmount: paymentTotals.bankAmount,
      pendingAmount: paymentTotals.pendingAmount,
      totalAmount: data.total,
      status: getPaymentStatusLabel(paymentTotals.pendingAmount, paymentTotals.settledAmount),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem("invoicePaymentStatus", JSON.stringify(store));

    setShowSaveConfirm(false);
    setSaveConfirmData(null);
    setPaymentSplit({ cash: "", bank: "" });
    clearForm();

    if (shouldPrint) {
      setTimeout(
        () =>
          printEntry({
            ...data.payload,
            paymentSummary: {
              cashAmount: paymentTotals.cashAmount,
              bankAmount: paymentTotals.bankAmount,
              settledAmount: paymentTotals.settledAmount,
              pendingAmount: paymentTotals.pendingAmount,
              status: getPaymentStatusLabel(paymentTotals.pendingAmount, paymentTotals.settledAmount),
            },
          }),
        150
      );
    }
  };

  const handleInvoiceFile = async (file?: File) => {
    if (!file) return;

    try {
      setShowLiveCamera(false);
      setExtracting(true);

      const formData = new FormData();
      formData.append("invoice", file);
      formData.append("pageType", type);

      const res = await fetch(`${API}/ai/extract-invoice`, {
        method: "POST",
        body: formData,
      });

      const response = await res.json().catch(() => null);

      if (!res.ok || !response?.success) {
        alert(response?.message || "AI extraction failed");
        return;
      }

      const data = response.extracted || {};
      const itemName = data.itemName || data.item || data.description || "";
      const selectedItem = items.find(
        (x: any) => String(x.itemName).toLowerCase() === String(itemName).toLowerCase()
      );

      setForm((prev: any) => ({
        ...prev,
        invoiceNo: data.invoiceNo || prev.invoiceNo,
        returnNo: data.returnNo || prev.returnNo,
        originalInvoiceNo: data.originalInvoiceNo || prev.originalInvoiceNo,
        supplierName:
          type === "purchase" || type === "purchase-return"
            ? data.supplierName || data.partyName || prev.supplierName
            : prev.supplierName,
        partyName:
          type === "sales" || type === "sales-return"
            ? data.partyName || prev.partyName
            : prev.partyName,
        gstNo: data.gstNo || data.gstNumber || data.gstin || prev.gstNo,
        dueDate: data.dueDate || prev.dueDate,
        itemName: selectedItem?.itemName || itemName || prev.itemName,
        quantity: Number(data.quantity || data.qty || prev.quantity || 0),
        rate: Number(data.rate || selectedItem?.salesRate || prev.rate || 0),
        gstRate: Number(data.gstRate || selectedItem?.gstRate || prev.gstRate || 0),
      }));

      if (Array.isArray(data.items) && data.items.length > 0) {
        const structuralLines = data.items.map((lineItem: any) => {
          return calcLine({
            id: Date.now() + Math.floor(Math.random() * 100000),
            itemName: lineItem.itemName || lineItem.description || "Extracted Item",
            quantity: Number(lineItem.quantity || lineItem.qty || 1),
            rate: Number(lineItem.rate || lineItem.price || 0),
            gstRate: Number(lineItem.gstRate || lineItem.gst || 0),
            discountType: "percentage",
            discountValue: 0,
          });
        });
        setInvoiceItems(structuralLines);
      }

      alert("Invoice extracted successfully. Please verify before saving.");
    } catch (err) {
      console.error("AI extraction error:", err);
      alert("AI extraction failed");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setExtracting(false);
    }
  };

  const stopLiveCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  };

  const closeLiveCamera = () => {
    stopLiveCamera();
    setShowLiveCamera(false);
  };

  const openLiveCamera = async () => {
    try {
      setShowLiveCamera(true);

      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Camera is not supported in this browser. Use Upload File.");
        setShowLiveCamera(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      cameraStreamRef.current = stream;

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      console.error("Camera open error:", err);
      alert("Unable to open camera. Please allow camera permission or use Upload File.");
      setShowLiveCamera(false);
    }
  };

  const captureCameraPhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `invoice-camera-${Date.now()}.jpg`, { type: "image/jpeg" });
        closeLiveCamera();
        handleInvoiceFile(file);
      },
      "image/jpeg",
      0.92
    );
  };

  const postCashEntry = (invoiceNo: string, partyName: string, amount: number) => {
    if (amount <= 0) return;
    const oldCash = getStorageArray("cashMaster");
    localStorage.setItem(
      "cashMaster",
      JSON.stringify([
        {
          id: Date.now(),
          date: new Date().toISOString().slice(0, 10),
          invoiceNo,
          amount,
          type: cfg.isIncoming ? "credit" : "debit",
          partyName,
          mode: DEFAULT_CASH_ACCOUNT,
          referenceNo: invoiceNo,
          remarks: cfg.title,
        },
        ...oldCash,
      ])
    );
  };

  const handlePaymentUpdate = () => {
    if (!totalAmount || totalAmount <= 0) {
      alert("Amount is zero. Please enter invoice items first.");
      return;
    }

    const invoiceNo = form[cfg.noKey] || autoNo;
    const partyName = form[cfg.partyKey] || "Party";
    const label = cfg.isIncoming ? "received" : "paid";
    const entered = window.prompt(`Enter amount ${label}:`, String(totalAmount));

    if (entered === null) return;

    const amountNow = Number(String(entered).replace(/,/g, ""));

    if (!amountNow || amountNow <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (amountNow > totalAmount) {
      alert(`Amount cannot be more than ${formatMoney(totalAmount)}.`);
      return;
    }

    const pendingAmount = Math.max(totalAmount - amountNow, 0);
    postCashEntry(invoiceNo, partyName, amountNow);
    upsertPendingMaster(invoiceNo, partyName, pendingAmount, totalAmount, amountNow);

    const store = JSON.parse(localStorage.getItem("invoicePaymentStatus") || "{}");
    store[`${cfg.endpoint}:${invoiceNo}`] = {
      paidAmount: amountNow,
      totalAmount,
      status:
        pendingAmount <= 0
          ? cfg.isIncoming ? "Received" : "Paid"
          : cfg.isIncoming ? "Partial Received" : "Partial Paid",
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem("invoicePaymentStatus", JSON.stringify(store));

    alert(`Cash updated with ${formatMoney(amountNow)}.`);
    setShowPaymentOptions(false);
  };

  const postBankEntry = (invoiceNo: string, partyName: string, amount: number) => {
    if (amount <= 0) return;
    const oldBank = getStorageArray("bankMaster");
    localStorage.setItem(
      "bankMaster",
      JSON.stringify([
        {
          id: Date.now() + Math.floor(Math.random() * 10000),
          date: new Date().toISOString().slice(0, 10),
          invoiceNo,
          amount,
          type: cfg.isIncoming ? "credit" : "debit",
          partyName,
          mode: DEFAULT_BANK_ACCOUNT,
          referenceNo: invoiceNo,
          remarks: cfg.title,
          source: cfg.title,
        },
        ...oldBank,
      ])
    );
  };

  const printEntry = (entry?: any) => {
    const savedCompany = JSON.parse(localStorage.getItem("companySettings") || "{}");
    const companyName = savedCompany?.companyName || company?.companyName || "SJQD SOFTWARE";
    const companyAddress = savedCompany?.address || company?.address || "Company Address";
    const companyGST = savedCompany?.gstNumber || company?.gstNumber || "N/A";
    const companyLogo = savedCompany?.logo || company?.logo || "";
    const signatureImage = savedCompany?.signatureImage || "";
    const invoiceNo = entry?.invoiceNo || entry?.returnNo || form[cfg.noKey] || autoNo;
    const party = entry?.partyName || entry?.supplierName || form[cfg.partyKey] || "Party";
    const lines = entry?.items || activeLines;
    const invoiceDate = entry?.date
      ? new Date(entry.date).toLocaleDateString("en-IN")
      : new Date().toLocaleDateString("en-IN");
    const printGstNo = entry?.gstNo || form.gstNo || "B2C";
    const printPhone = entry?.phone || form.phone || "-";
    const printAddress = entry?.address || form.address || "-";
    const printPincode = entry?.pincode || form.pincode || "";
    const printState = entry?.state || form.state || "";
    const paymentSummary = entry?.paymentSummary || null;
    const paymentLabel = cfg.isIncoming ? "Received" : "Paid";
    const balanceLabel = cfg.isIncoming ? "Receivable" : "Payable";

    const printSubtotal =
      Number(entry?.subtotalAmount) ||
      lines.reduce((sum: number, line: any) => sum + Number(line.subtotalAmount || 0), 0);
    const printDiscount =
      Number(entry?.discountAmount) ||
      lines.reduce((sum: number, line: any) => sum + Number(line.discountAmount || 0), 0);
    const printTaxable =
      Number(entry?.taxableAmount) ||
      lines.reduce((sum: number, line: any) => sum + Number(line.taxableAmount || 0), 0);
    const printCgst =
      Number(entry?.cgst) ||
      lines.reduce((sum: number, line: any) => sum + Number(line.cgst || 0), 0);
    const printSgst =
      Number(entry?.sgst) ||
      lines.reduce((sum: number, line: any) => sum + Number(line.sgst || 0), 0);
    const printIgst =
      Number(entry?.igst) ||
      lines.reduce((sum: number, line: any) => sum + Number(line.igst || 0), 0);
    const printAmountBeforeRound =
      Number(entry?.amountBeforeRound) ||
      lines.reduce((sum: number, line: any) => sum + Number(line.totalAmount || 0), 0);
    const printTotal =
      Number(entry?.totalAmount || entry?.grandTotal) || Math.round(printAmountBeforeRound);
    const printRoundOff = Number(
      entry?.roundOff ?? (Math.round(printAmountBeforeRound) - printAmountBeforeRound).toFixed(2)
    );

    const itemRows = lines
      .map(
        (line: any, idx: number) => `
        <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#fbfaf4"};">
          <td style="text-align:left;padding:8px 10px;border:1px solid #d9c57b;font-weight:600;color:#1f2937;">${line.itemName || "-"}</td>
          <td style="padding:8px 10px;border:1px solid #d9c57b;">${Number(line.quantity || 0)}</td>
          <td style="padding:8px 10px;border:1px solid #d9c57b;">${formatMoneyExact(line.rate || 0)}</td>
          <td style="padding:8px 10px;border:1px solid #d9c57b;">${formatMoneyExact(line.taxableAmount || 0)}</td>
          <td style="padding:8px 10px;border:1px solid #d9c57b;">${Number(line.gstRate || 0)}%</td>
          <td style="padding:8px 10px;border:1px solid #d9c57b;">${formatMoneyExact(line.cgst || 0)}</td>
          <td style="padding:8px 10px;border:1px solid #d9c57b;">${formatMoneyExact(line.sgst || 0)}</td>
          <td style="padding:8px 10px;border:1px solid #d9c57b;">${formatMoneyExact(line.igst || 0)}</td>
          <td style="padding:8px 10px;border:1px solid #d9c57b;font-weight:700;color:#111827;">${formatMoneyExact(line.totalAmount || 0)}</td>
        </tr>`
      )
      .join("");

    const paymentRows = paymentSummary
      ? `
          <div class="sumrow"><span>${DEFAULT_CASH_ACCOUNT} ${paymentLabel}</span><b>${formatMoney(paymentSummary.cashAmount || 0)}</b></div>
          <div class="sumrow"><span>${DEFAULT_BANK_ACCOUNT} ${paymentLabel}</span><b>${formatMoney(paymentSummary.bankAmount || 0)}</b></div>
          <div class="sumrow"><span>Total ${paymentLabel}</span><b>${formatMoney(paymentSummary.settledAmount || 0)}</b></div>
          <div class="sumrow"><span>${balanceLabel}</span><b>${formatMoney(paymentSummary.pendingAmount || 0)}</b></div>
        `
      : "";

    const popup = window.open("", "_blank");
    if (!popup) return;

    popup.document.write(`
      <html>
      <head>
        <title>${cfg.title} - ${invoiceNo}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #efe5b9; font-family: Cambria, Georgia, 'Times New Roman', serif; color: #334155; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 6mm; }
          .page { width: 210mm; min-height: 285mm; margin: 10px auto; background: #ffffff; border: 1px solid #dec97d; border-radius: 8px; padding: 24px 26px; box-shadow: 0 10px 30px rgba(17, 24, 39, 0.08); display: flex; flex-direction: column; gap: 12px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; padding-bottom: 12px; border-bottom: 2px solid #d7bd62; }
          .company-block { display: flex; align-items: center; gap: 14px; }
          .company-name { font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -0.5px; text-transform: uppercase; }
          .muted { color: #6b7280; font-size: 11px; line-height: 1.45; margin-top: 4px; }
          .invoice-box { width: 255px; background: linear-gradient(135deg, #fffdf2, #f2e4ae); border: 1px solid #d9c57b; border-radius: 10px; padding: 12px 14px; }
          .invoice-box h2 { font-size: 18px; font-weight: 900; color: #111827; margin-bottom: 8px; }
          .invoice-box div { font-size: 12px; color: #374151; margin-bottom: 4px; }
          .party-card { border: 1px solid #d9c57b; border-radius: 10px; overflow: hidden; }
          .party-head { background: #111827; color: #ffffff; padding: 7px 14px; font-size: 10px; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase; }
          .party-body { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px 14px; background: #fffef8; }
          .field-label { color: #9ca3af; font-size: 10px; font-weight: 800; text-transform: uppercase; }
          .field-value { color: #1f2937; font-size: 12px; font-weight: 700; margin-top: 2px; }
          .field-value.large { font-size: 15px; font-weight: 900; color: #111827; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f3e8b8; color: #5b4b19; border: 1px solid #d9c57b; padding: 8px 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; }
          td { text-align: center; font-size: 11px; color: #374151; }
          .table-wrap { flex: 1; }
          .footer-grid { display: grid; grid-template-columns: 1fr 0.95fr; gap: 18px; align-items: end; margin-top: auto; }
          .terms-box { min-height: 130px; border: 1px solid #e5dfc4; border-radius: 10px; background: #fffef9; padding: 14px; color: #6b7280; font-size: 11px; line-height: 1.6; display: flex; flex-direction: column; justify-content: flex-end; }
          .terms-box b { display: block; margin-bottom: 6px; color: #111827; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
          .summary-box { border: 1px solid #d9c57b; border-radius: 10px; background: #fffdf2; padding: 12px 14px; }
          .sumrow { display: flex; justify-content: space-between; gap: 14px; padding: 5px 0; border-bottom: 1px dashed #ddd6b5; font-size: 11px; color: #475569; }
          .sumrow:last-of-type { border-bottom: none; }
          .sumrow b { color: #111827; }
          .grand { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding: 9px 10px; border-radius: 8px; background: #111827; color: #ffffff; font-size: 15px; font-weight: 900; }
          .signature-box { margin-top: 18px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
          .signature-line { width: 190px; border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 8px; font-size: 11px; font-weight: 800; color: #111827; }
          .print-btn { position: fixed; bottom: 22px; right: 22px; border: none; border-radius: 999px; background: #111827; color: #ffffff; padding: 12px 22px; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18); }
          @media print { body { background: #ffffff; } .page { width: 100%; min-height: auto; margin: 0; box-shadow: none; } .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="company-block">
              ${companyLogo ? `<img src="${companyLogo}" style="width:58px;height:58px;border-radius:8px;object-fit:cover;" />` : ""}
              <div>
                <div class="company-name">${companyName}</div>
                <div class="muted">${companyAddress}<br /><b>GSTIN:</b> ${companyGST}</div>
              </div>
            </div>
            <div class="invoice-box">
              <h2>${cfg.title}</h2>
              <div><b>Invoice No:</b> ${invoiceNo}</div>
              <div><b>Date:</b> ${invoiceDate}</div>
              ${cfg.isReturn ? `<div><b>Original Invoice:</b> ${entry?.originalInvoiceNo || form.originalInvoiceNo || "-"}</div>` : ""}
            </div>
          </div>

          <div class="party-card">
            <div class="party-head">Bill To</div>
            <div class="party-body">
              <div><div class="field-label">${cfg.partyLabel} Name</div><div class="field-value large">${party}</div></div>
              <div><div class="field-label">GSTIN / Tax ID</div><div class="field-value">${printGstNo}</div></div>
              <div><div class="field-label">Contact Phone</div><div class="field-value">${printPhone}</div></div>
              <div><div class="field-label">Address</div><div class="field-value">${printAddress}${printPincode ? ` - ${printPincode}` : ""}${printState ? `, ${printState}` : ""}</div></div>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="text-align:left;width:30%;">Item Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Taxable</th>
                  <th>GST</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>IGST</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
          </div>

          <div class="footer-grid">
            <div class="terms-box">
              <div>
                <b>Terms & Conditions</b>
                <span>${savedCompany?.terms || "Goods once sold will not be taken back. Subject to local jurisdiction."}</span>
              </div>
            </div>

            <div>
              <div class="summary-box">
                <div class="sumrow"><span>Subtotal</span><b>${formatMoney(printSubtotal)}</b></div>
                <div class="sumrow"><span>Discount</span><b>${formatMoney(printDiscount)}</b></div>
                <div class="sumrow"><span>Taxable Value</span><b>${formatMoney(printTaxable)}</b></div>
                <div class="sumrow"><span>CGST</span><b>${formatMoney(printCgst)}</b></div>
                <div class="sumrow"><span>SGST</span><b>${formatMoney(printSgst)}</b></div>
                <div class="sumrow"><span>IGST</span><b>${formatMoney(printIgst)}</b></div>
                <div class="sumrow"><span>Amount Before Round Off</span><b>${formatMoneyExact(printAmountBeforeRound)}</b></div>
                <div class="sumrow"><span>Round Off</span><b>${printRoundOff >= 0 ? "+" : ""}${formatMoney(printRoundOff)}</b></div>
                ${paymentRows}
                <div class="grand"><span>Grand Total</span><span>${formatMoney(printTotal)}</span></div>
              </div>

              <div class="signature-box">
                ${signatureImage ? `<img src="${signatureImage}" style="max-width:150px;max-height:48px;object-fit:contain;" />` : `<div style="height:48px;"></div>`}
                <div class="signature-line">Authorized Signatory</div>
              </div>
            </div>
          </div>

          <button class="print-btn" onclick="window.print()">Print Invoice</button>
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 300);
          };
          window.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
              event.preventDefault();
              window.print();
            }
          });
        </script>
      </body>
      </html>
    `);

    popup.document.close();
  };

  const filteredParties = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customerOptions;
    return customerOptions.filter((p) => {
      const nameMatch = String(p.partyName || "").toLowerCase().includes(q);
      const gstMatch = String(p.gstNo || "").toLowerCase().includes(q);
      return nameMatch || gstMatch;
    });
  }, [customerOptions, customerSearch]);

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x: any) =>
      String(x.itemName || "").toLowerCase().includes(q) ||
      String(x.barcode || "").toLowerCase().includes(q)
    );
  }, [items, itemSearch]);

  const handleTableKeyNav = (e: React.KeyboardEvent, line: InvoiceLine, idx: number) => {
    if (e.key === "ArrowUp" && idx > 0) {
      const rows = document.querySelectorAll<HTMLTableRowElement>(".invoice-item-row");
      (rows[idx - 1]?.querySelector("button") as HTMLElement)?.focus();
    } else if (e.key === "ArrowDown") {
      const rows = document.querySelectorAll<HTMLTableRowElement>(".invoice-item-row");
      (rows[idx + 1]?.querySelector("button") as HTMLElement)?.focus();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      removeInvoiceItem(line.id);
    }
  };

  const saveConfirmSplit = saveConfirmData
    ? getPaymentSplitTotals(saveConfirmData.total)
    : null;

  const pageStyle = { ...page, padding: isMobile ? 14 : isTablet ? 18 : 28 };
  const shortcutBarStyle = {
    ...shortcutBar,
    flexWrap: "wrap" as const,
    gap: isMobile ? 10 : 18,
    padding: isMobile ? "10px 14px" : isTablet ? "8px 18px" : "8px 28px",
  };
  const heroStyle = {
    ...hero,
    flexDirection: isTablet ? ("column" as const) : ("row" as const),
    alignItems: isTablet ? ("stretch" as const) : ("center" as const),
    gap: isTablet ? 14 : 0,
    padding: isMobile ? 20 : isTablet ? 24 : 32,
  };
  const titleResponsiveStyle = {
    ...titleStyle,
    fontSize: isMobile ? 32 : isTablet ? 36 : 42,
  };
  const dashboardBtnStyle = {
    ...dashboardBtn,
    width: isTablet ? "100%" : undefined,
  };
  const invoiceShellStyle = {
    ...invoiceShell,
    padding: isMobile ? 16 : isTablet ? 20 : 28,
  };
  const invoiceHeaderStyle = {
    ...invoiceHeader,
    gridTemplateColumns: isMobile
      ? "1fr"
      : isTablet
      ? "72px minmax(0,1fr)"
      : "82px 1fr 260px",
    gap: isMobile ? 14 : 20,
  };
  const statusBoxStyle = {
    ...statusBox,
    textAlign: isMobile ? ("left" as const) : ("right" as const),
    gridColumn: isMobile ? "auto" : isTablet ? "1 / -1" : "auto",
  };
  const topGridStyle = {
    ...topGrid,
    gridTemplateColumns: isMobile
      ? "1fr"
      : isTablet
      ? "minmax(0,0.9fr) minmax(0,1.2fr) 58px minmax(0,0.9fr)"
      : "minmax(0,0.9fr) minmax(0,1.5fr) 58px minmax(0,0.9fr)",
    gap: isMobile ? 16 : 24,
  };
  const returnTopGridStyle = {
    ...returnTopGrid,
    gridTemplateColumns: isMobile
      ? "1fr"
      : isTablet
      ? "repeat(2,minmax(0,1fr))"
      : "minmax(0,0.9fr) minmax(0,0.95fr) minmax(0,1.4fr) 58px minmax(0,0.9fr)",
    gap: isMobile ? 14 : 18,
  };
  const barcodeRowStyle = {
    ...barcodeRow,
    gridTemplateColumns: isMobile
      ? "1fr"
      : isTablet
      ? "minmax(0,1fr) 160px 130px"
      : "1fr 170px 130px",
  };
  const itemGridStyle = {
    ...itemGrid,
    gridTemplateColumns: isMobile
      ? "1fr"
      : isTablet
      ? "repeat(2,minmax(0,1fr))"
      : "2fr 2fr 1fr 1fr 1fr 1.1fr 1fr 150px",
  };
  const middleGridStyle = {
    ...middleGrid,
    gridTemplateColumns: isTablet ? "1fr" : "1fr 360px",
  };
  const actionRowStyle = {
    ...actionRow,
    gridTemplateColumns: isMobile
      ? "1fr"
      : isTablet
      ? "repeat(2,minmax(0,1fr))"
      : "2fr 1fr 0.7fr",
  };
  const modalGridStyle = {
    ...modalGrid,
    gridTemplateColumns: isMobile ? "1fr" : "repeat(2,minmax(0,1fr))",
  };
  const modalActionRowStyle = {
    ...modalActionRow,
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
  };
  const extractionGridStyle = {
    ...extractionGrid,
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
  };

  return (
    <AppShell>
      <div style={shortcutBarStyle}>
        <span style={shortcutChip}><kbd style={kbdStyle}>F2</kbd> Save</span>
        <span style={shortcutChip}><kbd style={kbdStyle}>F3</kbd> New {cfg.partyLabel}</span>
        <span style={shortcutChip}><kbd style={kbdStyle}>F4</kbd> New Item</span>
        <span style={shortcutChip}><kbd style={kbdStyle}>F8</kbd> Barcode Focus</span>
        <span style={shortcutChip}><kbd style={kbdStyle}>Del</kbd> Remove Last Item</span>
      </div>

      <main
        style={pageStyle}
        onFocus={(e) => {
          focusZoneRef.current = getZoneForElement(e.target);
        }}
        onMouseDown={(e) => {
          focusZoneRef.current = getZoneForElement(e.target);
        }}
      >
        <section style={heroStyle}>
          <div>
            <h1 style={titleResponsiveStyle}>{cfg.title}</h1>
            <p style={subTitle}>
              Professional GST billing with party master, barcode and multi-item entry.
            </p>
          </div>
          <button style={dashboardBtnStyle} onClick={() => router.push("/dashboard")}>
            Dashboard
          </button>
        </section>

        <section style={invoiceShellStyle}>
          <div style={invoiceHeaderStyle}>
            <div style={logoCircle}>{prefix}</div>
            <div>
              <h2 style={companyName}>{company.companyName || "SJQD SOFTWARE"}</h2>
              <p style={autoText}>Auto Number: {autoNo}</p>
            </div>
            <div style={statusBoxStyle}>
              <span style={statusLabel}>Grand Total</span>
              <b style={statusAmount}>{formatMoney(totalAmount)}</b>
            </div>
          </div>

          <div style={sectionTitle}>Invoice Details</div>

          <div style={cfg.isReturn ? returnTopGridStyle : topGridStyle}>
            <Field
              label={cfg.isReturn ? "Return Number" : "Invoice Number"}
              value={form[cfg.noKey]}
              placeholder={`Leave blank for auto: ${autoNo}`}
              onChange={(v: string) => update(cfg.noKey, v)}
              onKeyDown={(e: any) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (cfg.isReturn) {
                    originalInvoiceRef.current?.focus();
                  } else {
                    focusPartyLookup();
                  }
                }
              }}
            />

            {cfg.isReturn && (
              <Field
                inputRef={originalInvoiceRef}
                label="Original Invoice Number"
                value={form.originalInvoiceNo}
                placeholder="Original invoice number"
                onChange={(v: string) => update("originalInvoiceNo", v)}
                onKeyDown={(e: any) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    focusPartyLookup();
                  }
                }}
              />
            )}

            <label style={fieldWrap}>
              <span style={fieldLabel}>{cfg.partyLabel}</span>
              <div ref={customerDropdownRef} style={{ position: "relative" }}>
                <input
                  ref={customerInputRef}
                  style={fieldInput}
                  placeholder={
                    enableCustomerAccountShortcuts
                      ? `Type ${cfg.partyLabel} name, GSTIN, Cash or Bank A/C...`
                      : `Type ${cfg.partyLabel} name or GSTIN...`
                  }
                  value={customerSearch}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    const exactMatch = findCustomerOption(nextValue);
                    setCustomerSearch(nextValue);
                    setCustomerHighlightIdx(0);
                    setCustomerDropdownOpen(true);
                    setForm((prev: any) => ({
                      ...prev,
                      [cfg.partyKey]: exactMatch?.partyName || nextValue,
                      gstNo: exactMatch?.gstNo || "",
                      phone: exactMatch?.phone || "",
                      state: exactMatch?.state || "",
                      pincode: exactMatch?.pincode || "",
                      address: exactMatch?.address || "",
                      dueDate: exactMatch
                        ? resolveInvoiceDueDate(exactMatch, exactMatch.partyName)
                        : prev.dueDate,
                    }));
                  }}
                  onFocus={() => {
                    focusZoneRef.current = "customer";
                    setCustomerDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setCustomerDropdownOpen(true);
                      setCustomerHighlightIdx((i) => Math.min(i + 1, filteredParties.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setCustomerHighlightIdx((i) => Math.max(i - 1, 0));
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      const typedValue = customerSearch.trim();
                      const exactMatch = findCustomerOption(typedValue);
                      if (!typedValue && filteredParties.length > 0 && customerDropdownOpen) {
                        const chosen = filteredParties[customerHighlightIdx];
                        if (chosen) {
                          selectParty(chosen.partyName);
                          setCustomerDropdownOpen(false);
                        }
                      } else if (exactMatch) {
                        selectParty(exactMatch.partyName);
                        setCustomerDropdownOpen(false);
                      } else if (customerDropdownOpen && filteredParties.length === 1) {
                        selectParty(filteredParties[0].partyName);
                        setCustomerDropdownOpen(false);
                      } else {
                        applyCustomerInput(customerSearch);
                      }
                    } else if (e.key === "Escape") {
                      setCustomerDropdownOpen(false);
                    } else if (e.key === "F4") {
                      e.preventDefault();
                      openPartyPopup();
                    }
                  }}
                />

                {customerDropdownOpen && (
                  <div style={itemDropdownPanel}>
                    <div style={itemDropdownList}>
                      {filteredParties.length === 0 && (
                        <div 
                          style={{...itemDropdownOption, color: "#f59e0b", fontStyle: "italic", fontWeight: "bold"}}
                          onClick={() => {
                            setCustomerDropdownOpen(false);
                            openPartyPopup(customerSearch);
                          }}
                        >
                          "{customerSearch}" not found. Press Enter or click here to create.
                        </div>
                      )}
                      {filteredParties.map((party: PartyRow, idx: number) => (
                        <div
                          key={party.id || party.partyName}
                          style={{
                            ...itemDropdownOption,
                            background: idx === customerHighlightIdx ? "#2563eb" : "transparent",
                            color: idx === customerHighlightIdx ? "white" : positiveText,
                          }}
                          onMouseEnter={() => setCustomerHighlightIdx(idx)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectParty(party.partyName);
                            setCustomerDropdownOpen(false);
                          }}
                        >
                          <span style={{ fontWeight: 800 }}>{party.partyName}</span>
                          {isQuickAccountPartyName(party.partyName) && (
                            <span style={{ fontSize: 12, opacity: 1, marginLeft: 8, background: idx === customerHighlightIdx ? "rgba(255,255,255,0.18)" : "rgba(37,99,235,0.12)", color: idx === customerHighlightIdx ? "white" : "#1d4ed8", padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>
                              B2C Quick
                            </span>
                          )}
                          {party.gstNo && (
                            <span style={{ fontSize: 12, opacity: 1, marginLeft: 8, background: idx === customerHighlightIdx ? "rgba(255,255,255,0.18)" : "rgba(184,134,11,0.16)", color: idx === customerHighlightIdx ? "white" : positiveMuted, padding: "2px 6px", borderRadius: 4 }}>
                              GST: {party.gstNo}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </label>

            <button
              type="button"
              style={addPartyInlineBtn}
              onClick={() => openPartyPopup(customerSearch)}
              title={`Add new ${cfg.partyLabel}`}
            >
              +
            </button>

            <FlexibleDateField
              ref={dueDateFieldRef}
              inputRef={dueDateInputRef}
              label="Due Date"
              value={form.dueDate}
              onChange={(v: string) => update("dueDate", v)}
              onSubmit={focusItemEntryField}
            />
          </div>

          <div style={sectionTitle}>Item Entry</div>

          <div style={barcodeRowStyle}>
            <input
              ref={barcodeRef}
              style={barcodeInput}
              value={barcode}
              placeholder="Scan barcode and press Enter. Same barcode increases quantity."
              onChange={(e) => setBarcode(e.target.value)}
              onFocus={() => { focusZoneRef.current = "item"; }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (barcode.trim()) { addByBarcode(); }
                  else { setItemDropdownOpen(true); setTimeout(() => itemSearchRef.current?.focus(), 60); }
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setItemDropdownOpen(true);
                  setTimeout(() => itemSearchRef.current?.focus(), 60);
                }
              }}
            />
            <button
              type="button"
              style={smallBlueBtn}
              onClick={() => {
                if (barcode.trim()) {
                  addByBarcode();
                } else {
                  barcodeRef.current?.focus();
                  barcodeRef.current?.select();
                }
              }}
            >
              Barcode (F8)
            </button>
            <button
              type="button"
              style={smallGoldBtn}
              onClick={() => {
                setNewItem({ itemName: "", barcode: "", gstRate: "", salesRate: "", purchaseRate: "", openingStock: "" });
                pendingScannedBarcodeRef.current = "";
                setNewItemModalTitle("Add New Item");
                setShowItemModal(true);
              }}
            >
              + New Item
            </button>
          </div>

          <div style={itemGridStyle}>
            <label style={fieldWrap}>
              <span style={fieldLabel}>Item Name</span>
              <div ref={itemDropdownRef} style={{ position: "relative" }}>
                <div
                  style={{
                    ...fieldInput,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onClick={() => {
                    focusZoneRef.current = "item";
                    setItemDropdownOpen((o) => !o);
                    setItemSearch("");
                    setItemHighlightIdx(0);
                    setTimeout(() => itemSearchRef.current?.focus(), 60);
                  }}
                  tabIndex={0}
                  onFocus={() => { focusZoneRef.current = "item"; }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                      e.preventDefault();
                      setItemDropdownOpen(true);
                      setItemSearch("");
                      setItemHighlightIdx(0);
                      setTimeout(() => itemSearchRef.current?.focus(), 60);
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      barcodeRef.current?.focus();
                    }
                  }}
                >
                  <span style={{ color: form.itemName ? positiveText : positiveMuted, fontSize: 14, fontWeight: form.itemName ? 800 : 700 }}>
                    {form.itemName || "Select Item From Item Master"}
                  </span>
                  <span style={{ color: positiveMuted, fontSize: 12 }}>v</span>
                </div>

                {itemDropdownOpen && (
                  <div style={itemDropdownPanel}>
                    <input
                      ref={itemSearchRef}
                      style={itemSearchInput}
                      placeholder="Type to search item..."
                      value={itemSearch}
                      onChange={(e) => { setItemSearch(e.target.value); setItemHighlightIdx(0); }}
                      onFocus={() => { focusZoneRef.current = "item"; }}
                    onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setItemHighlightIdx((i) => {
                      const nextIdx = Math.min(i + 1, filteredItems.length - 1);
                      if (filteredItems[nextIdx]) setItemSearch(filteredItems[nextIdx].itemName);
                      return nextIdx;
                    });
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setItemHighlightIdx((i) => {
                      const prevIdx = Math.max(i - 1, 0);
                      if (filteredItems[prevIdx]) setItemSearch(filteredItems[prevIdx].itemName);
                      return prevIdx;
                    });
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (!itemSearch.trim() && filteredItems.length === items.length) {
                      setItemDropdownOpen(false);
                      saveEntry();
                      return;
                    }
                    const chosen = filteredItems[itemHighlightIdx];
                    if (chosen) { 
                      selectItem(chosen.itemName); 
                      setItemDropdownOpen(false); 
                      setItemSearch(""); 
                      setTimeout(() => quantityRef.current?.focus(), 60);
                    }
                  } else if (e.key === "Escape") {
                    setItemDropdownOpen(false);
                  }
                }}
                    />
                    <div style={itemDropdownList}>
                      {filteredItems.length === 0 && (
                        <div style={itemDropdownEmpty}>No items found</div>
                      )}
                      {filteredItems.map((item: any, idx: number) => (
                        <div
                          key={item.id || item.itemName}
                          style={{
                            ...itemDropdownOption,
                            background: idx === itemHighlightIdx ? "#2563eb" : "transparent",
                            color: idx === itemHighlightIdx ? "white" : positiveText,
                          }}
                          onMouseEnter={() => setItemHighlightIdx(idx)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectItem(item.itemName);
                            setItemDropdownOpen(false);
                            setItemSearch("");
                            setTimeout(() => quantityRef.current?.focus(), 60);
                          }}
                        >
                          <span style={{ fontWeight: 800 }}>{item.itemName}</span>
                          <span style={{ fontSize: 12, opacity: 1, marginLeft: 8, color: idx === itemHighlightIdx ? "white" : positiveMuted }}>
                            Stock: {item.currentStock ?? 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </label>

            <Field
              inputRef={manualItemRef}
              label="Manual Item Name"
              value={form.itemName}
              placeholder="Or type item manually"
              onChange={(v: string) => update("itemName", v)}
              onKeyDown={(e: any) => {
                if (e.key === "Enter") { 
                  e.preventDefault(); 
                  setIsMasterItem(false); 
                  quantityRef.current?.focus(); 
                }
                else if (e.key === "ArrowLeft") { e.preventDefault(); barcodeRef.current?.focus(); }
              }}
              onFocus={() => { focusZoneRef.current = "item"; }}
            />

            <Field
              inputRef={quantityRef}
              label="Quantity"
              type="number"
              value={form.quantity || ""}
              onChange={(v: string) => update("quantity", Number(v))}
              onKeyDown={(e: any) => {
                if (e.key === "Enter") { 
                  e.preventDefault(); 
                  if (isMasterItem) {
                    discountTypeRef.current?.focus();
                  } else {
                    rateRef.current?.focus();
                  }
                }
                else if (e.key === "ArrowLeft") { e.preventDefault(); manualItemRef.current?.focus(); }
                else if (e.key === "ArrowRight") { e.preventDefault(); rateRef.current?.focus(); }
              }}
              onFocus={() => { focusZoneRef.current = "item"; }}
            />

            <Field
              inputRef={rateRef}
              label="Rate"
              type="number"
              value={form.rate || ""}
              onChange={(v: string) => update("rate", Number(v))}
              onKeyDown={(e: any) => {
                if (e.key === "Enter") { e.preventDefault(); gstRateRef.current?.focus(); }
                else if (e.key === "ArrowLeft") { e.preventDefault(); quantityRef.current?.focus(); }
                else if (e.key === "ArrowRight") { e.preventDefault(); gstRateRef.current?.focus(); }
              }}
              onFocus={() => { focusZoneRef.current = "item"; }}
            />

            <Field
              inputRef={gstRateRef}
              label="GST Rate %"
              type="number"
              value={form.gstRate || ""}
              onChange={(v: string) => update("gstRate", Number(v))}
              onKeyDown={(e: any) => {
                if (e.key === "Enter") { e.preventDefault(); discountTypeRef.current?.focus(); }
                else if (e.key === "ArrowLeft") { e.preventDefault(); rateRef.current?.focus(); }
                else if (e.key === "ArrowRight") { e.preventDefault(); discountTypeRef.current?.focus(); }
              }}
              onFocus={() => { focusZoneRef.current = "item"; }}
            />

            <label style={fieldWrap}>
              <span style={fieldLabel}>Discount Type</span>
              <select
                ref={discountTypeRef}
                style={fieldInput}
                value={form.discountType || "percentage"}
                onChange={(e) => update("discountType", e.target.value)}
                onFocus={() => { focusZoneRef.current = "item"; }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); discountValueRef.current?.focus(); }
                  else if (e.key === "ArrowLeft") { 
                    if (isMasterItem) {
                      quantityRef.current?.focus();
                    } else {
                      gstRateRef.current?.focus(); 
                    }
                  }
                  else if (e.key === "ArrowRight") { e.preventDefault(); discountValueRef.current?.focus(); }
                }}
              >
                  <option value="amount">Amount Rs</option>
                  <option value="percentage">Percentage %</option>
              </select>
            </label>

            <Field
              inputRef={discountValueRef}
              label={form.discountType === "percentage" ? "Discount %" : "Discount Rs"}
              type="number"
              value={form.discountValue || ""}
              onChange={(v: string) => update("discountValue", Number(v))}
              onKeyDown={(e: any) => {
                if (e.key === "Enter") { 
                  e.preventDefault(); 
                  addItemToInvoice();
                }
                else if (e.key === "ArrowLeft") { e.preventDefault(); discountTypeRef.current?.focus(); }
              }}
              onFocus={() => { focusZoneRef.current = "item"; }}
            />

            <button
              ref={addLineButtonRef}
              type="button"
              style={addLineBtn}
              onClick={addItemToInvoice}
              onFocus={() => { focusZoneRef.current = "item"; }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addItemToInvoice(); }
              }}
            >
              + Add Item Line
            </button>
          </div>

          <div style={middleGridStyle}>
            <section style={lineCard}>
              <div style={cardTitle}>Invoice Items</div>

              {invoiceItems.length === 0 && !currentLine.itemName ? (
                <p style={mutedText}>
                  No item added yet. Select item or scan barcode and click Add Item Line.
                </p>
              ) : (
                <div style={lineTableWrap}>
                  <table style={lineTable}>
                    <thead>
                      <tr>
                        <th style={lineTh}>Item</th>
                        <th style={lineTh}>Qty</th>
                        <th style={lineTh}>Rate</th>
                        <th style={lineTh}>GST %</th>
                        <th style={lineTh}>Taxable</th>
                        <th style={lineTh}>Total</th>
                        <th style={lineTh}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((line, idx) => (
                        <tr key={line.id} className="invoice-item-row">
                          <td style={lineTd}>{line.itemName}</td>
                          <td style={lineTd}>{line.quantity}</td>
                          <td style={lineTd}>{formatMoney(line.rate)}</td>
                          <td style={lineTd}>{line.gstRate}%</td>
                          <td style={lineTd}>{formatMoney(line.taxableAmount)}</td>
                          <td style={lineTd}>{formatMoney(line.totalAmount)}</td>
                          <td style={lineTd}>
                            <button
                              style={tableEditBtn}
                              onClick={() => loadInvoiceItemForEdit(line)}
                              onFocus={() => { focusZoneRef.current = "item"; }}
                              onKeyDown={(e) => handleTableKeyNav(e, line, idx)}
                            >
                              Edit
                            </button>
                            <button
                              style={tableDeleteBtn}
                              onClick={() => removeInvoiceItem(line.id)}
                              onFocus={() => { focusZoneRef.current = "item"; }}
                              onKeyDown={(e) => handleTableKeyNav(e, line, idx)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}

                      {invoiceItems.length === 0 && currentLine.itemName && (
                        <tr>
                          <td style={lineTd}>{currentLine.itemName}</td>
                          <td style={lineTd}>{currentLine.quantity}</td>
                          <td style={lineTd}>{formatMoney(currentLine.rate)}</td>
                          <td style={lineTd}>{currentLine.gstRate}%</td>
                          <td style={lineTd}>{formatMoney(currentLine.taxableAmount)}</td>
                          <td style={lineTd}>{formatMoney(currentLine.totalAmount)}</td>
                          <td style={lineTd}>Current</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section style={summaryCard}>
              <div style={cardTitle}>Tax Summary</div>
              <SummaryLine label="Subtotal" value={formatMoney(subtotalAmount)} />
              <SummaryLine label="Discount" value={formatMoney(discountAmount)} />
              <SummaryLine label="Taxable" value={formatMoney(taxableAmount)} />
              <SummaryLine label="CGST" value={formatMoney(cgst)} />
              <SummaryLine label="SGST" value={formatMoney(sgst)} />
              <SummaryLine label="IGST" value={formatMoney(igst)} />
              <SummaryLine label="Round Off" value={`${roundOff >= 0 ? "+" : ""}${formatMoney(roundOff)}`} />
              <SummaryLine label="Grand Total" value={formatMoney(totalAmount)} style={{ fontWeight: "900", color: "#f8fafc" }} />
              
              <div style={grandLine}>
                <span>Amt Before Round Off</span>
                <b style={{ fontSize: 18 }}>{formatMoneyExact(amountBeforeRound)}</b>
              </div>
            </section>
          </div>

          <div style={actionRowStyle}>
            <button style={{ ...primaryBtn, background: cfg.color }} onClick={saveEntry}>
              {editingId ? "Update Entry" : cfg.saveText}
            </button>

            <button
              style={aiBtn}
              onClick={() => setShowExtractionModal(true)}
              disabled={extracting}
            >
              {extracting ? "Extracting..." : "Extraction"}
            </button>

            <button style={clearBtn} onClick={clearForm}>
              Clear
            </button>
          </div>
        </section>

        {showPartyModal && (
          <Modal title={`Add New ${cfg.partyLabel}`} onClose={() => setShowPartyModal(false)}>
            <div style={modalGridStyle}>
              <ModalInput label="Name" value={newParty.partyName} onChange={(v: string) => setNewParty((p) => ({ ...p, partyName: v }))} />
              <ModalInput label="GST Number" value={newParty.gstNo} onChange={(v: string) => setNewParty((p) => ({ ...p, gstNo: v }))} />
              <ModalInput label="Phone" value={newParty.phone} onChange={(v: string) => setNewParty((p) => ({ ...p, phone: v }))} />
              <ModalInput label="Default Due Days" type="number" value={newParty.dueDays || ""} onChange={(v: string) => setNewParty((p) => ({ ...p, dueDays: v }))} />
              <ModalInput label="State" value={newParty.state} onChange={(v: string) => setNewParty((p) => ({ ...p, state: v }))} />
              <ModalInput label="Pincode" value={newParty.pincode} onChange={(v: string) => setNewParty((p) => ({ ...p, pincode: v }))} />
              <ModalInput label="Address" value={newParty.address} onChange={(v: string) => setNewParty((p) => ({ ...p, address: v }))} />
            </div>
            <button style={modalSaveBtn} onClick={saveParty}>Save {cfg.partyLabel}</button>
          </Modal>
        )}

        {showItemModal && (
          <Modal title={newItemModalTitle} onClose={() => { pendingScannedBarcodeRef.current = ""; setNewItemModalTitle("Add New Item"); setShowItemModal(false); }}>
            <div style={modalGridStyle}>
              <ModalInput label="Item Name" value={newItem.itemName} onChange={(v: string) => setNewItem((p) => ({ ...p, itemName: v }))} />
              <ModalInput label="Barcode / Item Code" value={newItem.barcode} onChange={(v: string) => setNewItem((p) => ({ ...p, barcode: v }))} />
              <ModalInput label="GST Rate %" type="number" value={newItem.gstRate} onChange={(v: string) => setNewItem((p) => ({ ...p, gstRate: v }))} />
              <ModalInput label="Sales Rate" type="number" value={newItem.salesRate} onChange={(v: string) => setNewItem((p) => ({ ...p, salesRate: v }))} />
              <ModalInput label="Purchase Rate" type="number" value={newItem.purchaseRate} onChange={(v: string) => setNewItem((p) => ({ ...p, purchaseRate: v }))} />
              <ModalInput label="Opening Stock" type="number" value={newItem.openingStock} onChange={(v: string) => setNewItem((p) => ({ ...p, openingStock: v }))} />
            </div>
            <button style={modalSaveBtn} onClick={saveNewItem}>Save Item</button>
          </Modal>
        )}

        {showLiveCamera && (
          <Modal title="Take Photo" onClose={closeLiveCamera}>
            <p style={modalHelp}>Place the invoice clearly in frame, then click Capture & Extract.</p>
            <video ref={videoRef} autoPlay playsInline style={cameraPreview}></video>
            <div style={modalActionRowStyle}>
              <button style={modalSaveBtn} onClick={captureCameraPhoto}>Capture & Extract</button>
              <button style={{ ...modalSaveBtn, background: "#64748b" }} onClick={closeLiveCamera}>Cancel</button>
            </div>
          </Modal>
        )}

        {showPaymentOptions && (
          <Modal title={cfg.isIncoming ? "Receive Payment" : "Make Payment"} onClose={() => setShowPaymentOptions(false)}>
            <p style={modalHelp}>This will update Cash Master and reduce pending amount.</p>
            <button style={modalSaveBtn} onClick={handlePaymentUpdate}>Continue</button>
          </Modal>
        )}

        {showExtractionModal && (
          <Modal title="Extraction" onClose={() => setShowExtractionModal(false)}>
            <p style={modalHelp}>
              Choose how to extract invoice data. Camera captures live photo; Upload accepts image or PDF.
            </p>
            <div style={extractionGridStyle}>
              <button
                style={extractionBtn}
                onClick={() => { setShowExtractionModal(false); openLiveCamera(); }}
              >
                <span style={extractionIcon}>CAM</span>
                <span style={extractionLabel}>Take Photo</span>
                <span style={extractionSub}>Open camera & capture</span>
              </button>
              <button
                style={{ ...extractionBtn, background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}
                onClick={() => { setShowExtractionModal(false); fileInputRef.current?.click(); }}
              >
                <span style={extractionIcon}>FILE</span>
                <span style={extractionLabel}>AI Extract</span>
                <span style={extractionSub}>Upload image or PDF</span>
              </button>
            </div>
          </Modal>
        )}

        {showSaveConfirm && saveConfirmData && saveConfirmSplit && (
          <Modal
            title="Invoice Saved"
            onClose={() => {
              setShowSaveConfirm(false);
              setSaveConfirmData(null);
              setPaymentSplit({ cash: "", bank: "" });
              clearForm();
            }}
          >
            <div style={saveConfirmBody}>
              <div style={saveConfirmTotalBanner}>
                <div>
                  <div style={saveConfirmBannerLabel}>Total Amount</div>
                  <div style={saveConfirmBannerValue}>{formatMoney(saveConfirmData.total)}</div>
                </div>
                <div style={saveConfirmBannerBadge}>Saved</div>
              </div>

              <div style={saveConfirmMeta}>
                <div style={saveConfirmMetaRow}>
                  <span style={saveConfirmMetaLabel}>Invoice No</span>
                  <span style={saveConfirmMetaValue}>{saveConfirmData.invoiceNo}</span>
                </div>
                <div style={saveConfirmMetaRow}>
                  <span style={saveConfirmMetaLabel}>{cfg.partyLabel}</span>
                  <span style={saveConfirmMetaValue}>{saveConfirmData.partyName}</span>
                </div>
              </div>

              <div style={saveConfirmInputWrap}>
                <div style={modalGridStyle}>
                  <label style={fieldWrap}>
                    <span style={{ ...fieldLabel, fontSize: 15 }}>
                      {DEFAULT_CASH_ACCOUNT} {cfg.isIncoming ? "Received" : "Paid"}
                    </span>
                    <input
                      style={saveConfirmInput}
                      type="number"
                      value={paymentSplit.cash}
                      onChange={(e) => updatePaymentSplitAmount("cash", e.target.value)}
                      autoFocus
                      onFocus={(e) => e.target.select()}
                    />
                  </label>

                  <label style={fieldWrap}>
                    <span style={{ ...fieldLabel, fontSize: 15 }}>
                      {DEFAULT_BANK_ACCOUNT} {cfg.isIncoming ? "Received" : "Paid"}
                    </span>
                    <input
                      style={saveConfirmInput}
                      type="number"
                      value={paymentSplit.bank}
                      onChange={(e) => updatePaymentSplitAmount("bank", e.target.value)}
                    />
                  </label>
                </div>

                <div style={saveConfirmPendingNote}>
                  Total {cfg.isIncoming ? "Received" : "Paid"}: {formatMoney(saveConfirmSplit.settledAmount)}
                  {"  "} | {"  "}
                  {cfg.isIncoming ? "Receivable" : "Payable"}: {formatMoney(saveConfirmSplit.pendingAmount)}
                </div>

                {saveConfirmSplit.isOverLimit && (
                  <div style={{ ...saveConfirmPendingNote, color: "#b91c1c" }}>
                    Entered amount is more than invoice total.
                  </div>
                )}
              </div>

              <div style={saveConfirmActions}>
                <button
                  style={saveConfirmBtnClose}
                  onClick={() => handleSaveConfirm(false)}
                >
                  Save & Close (Ctrl+S)
                </button>
                <button
                  style={saveConfirmBtnPrint}
                  onClick={() => handleSaveConfirm(true)}
                >
                  Save & Print (Enter)
                </button>
              </div>
            </div>
          </Modal>
        )}


        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          hidden
          onChange={(e) => {
            handleInvoiceFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </main>
    </AppShell>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", inputRef, onKeyDown, onFocus }: any) {
  return (
    <label style={fieldWrap}>
      <span style={fieldLabel}>{label}</span>
      <input
        style={fieldInput}
        ref={inputRef}
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
      />
    </label>
  );
}

const FlexibleDateField = forwardRef<FlexibleDateFieldHandle, FlexibleDateFieldProps>(
function FlexibleDateField({
  label,
  value,
  onChange,
  inputRef,
  onSubmit,
}, ref) {
  const [typedValue, setTypedValue] = useState(formatDateForTyping(value));

  useEffect(() => {
    setTypedValue(formatDateForTyping(value));
  }, [value]);

  const commitTypedValue = (): string | null => {
    const trimmed = typedValue.trim();

    if (!trimmed) {
      onChange("");
      return "";
    }

    const parsed = resolveFlexibleDueDateInput(trimmed);
    if (!parsed) {
      alert("Use DD/MM/YYYY, YYYY-MM-DD, or type days like 10 for 10 days from today.");
      setTypedValue(formatDateForTyping(value));
      return null;
    }

    onChange(parsed);
    setTypedValue(formatDateForTyping(parsed));
    return parsed;
  };

  useImperativeHandle(ref, () => ({
    commit: commitTypedValue,
  }));

  return (
    <label style={fieldWrap}>
      <span style={fieldLabel}>{label}</span>
      <div style={dateFieldRow}>
        <input
          ref={inputRef}
          style={dateTypingInput}
          type="text"
          value={typedValue}
          placeholder="DD/MM/YYYY, YYYY-MM-DD or 10 = 10 days"
          onChange={(event) => setTypedValue(event.target.value)}
          onBlur={commitTypedValue}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (commitTypedValue() !== null) {
                onSubmit?.();
              }
            }
          }}
        />
        <input
          style={datePickerInput}
          type="date"
          value={value || ""}
          onChange={(event) => {
            onChange(event.target.value);
            setTypedValue(formatDateForTyping(event.target.value));
          }}
        />
      </div>
      <span style={dateHelperText}>Type exact date or days. Example: 10 = today + 10 days.</span>
    </label>
  );
});

function SummaryLine({ label, value, style }: { label: string; value: string; style?: React.CSSProperties }) {
  return (
    <div style={{ ...summaryLine, ...style }}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { 
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose(); 
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [onClose]);

  return (
    <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalBox}>
        <div style={modalHeader}>
          <h2 style={modalTitle}>{title}</h2>
          <button style={modalCloseBtn} onClick={onClose}>X</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalInput({ label, value, onChange, type = "text" }: any) {
  return (
    <label style={fieldWrap}>
      <span style={fieldLabel}>{label}</span>
      <input
        style={fieldInput}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

const getZoneForElement = (el: EventTarget | null): FocusZone => {
  if (!el || !(el instanceof Element)) return "other";
  return "other";
};

// Strict CSS Style Mapping Declarations

const shortcutBar: React.CSSProperties = {
  display: "flex",
  gap: 18,
  alignItems: "center",
  background: "rgba(255,249,228,0.92)",
  borderBottom: "1px solid rgba(184,134,11,0.18)",
  padding: "8px 28px",
  fontSize: 13,
  fontWeight: 800,
  color: positiveMuted,
};

const shortcutChip: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const kbdStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.9)",
  border: "1px solid rgba(184,134,11,0.22)",
  borderRadius: 6,
  padding: "2px 8px",
  fontSize: 12,
  fontFamily: "monospace",
  color: positiveHeading,
  fontWeight: 900,
  boxShadow: "0 2px 0 rgba(184,134,11,0.16)",
};

const page: React.CSSProperties = { ...positivePage, padding: 28, color: positiveText };

const hero: React.CSSProperties = {
  ...positiveHeroCard,
  borderRadius: 28,
  padding: 32,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const titleStyle: React.CSSProperties = { color: positiveHeading, fontSize: 42, fontWeight: 950, margin: 0 };
const subTitle: React.CSSProperties = { color: positiveMuted, marginTop: 8, fontWeight: 700 };

const dashboardBtn: React.CSSProperties = {
  ...paleButton,
  padding: "14px 24px",
};

const invoiceShell: React.CSSProperties = {
  ...positivePanel,
  borderRadius: 28, padding: 28,
};

const invoiceHeader: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "82px 1fr 260px",
  gap: 20, alignItems: "center",
  background: "linear-gradient(135deg,#fffde8,#efe7b0)",
  border: "1px solid #d4af37",
  borderRadius: 22, padding: 20,
  color: "#422f00", marginBottom: 24,
};

const logoCircle: React.CSSProperties = {
  width: 70, height: 70, borderRadius: "50%",
  background: "#f8fafc", display: "flex",
  alignItems: "center", justifyContent: "center",
  fontWeight: 950, fontSize: 22, color: "#7c5a10",
};

const companyName: React.CSSProperties = { margin: 0, fontSize: 32, fontWeight: 950 };
const autoText: React.CSSProperties = { margin: "6px 0 0", fontWeight: 800, color: positiveMuted };

const statusBox: React.CSSProperties = {
  background: "rgba(255,255,255,0.60)", borderRadius: 16,
  padding: 16, textAlign: "right",
};

const statusLabel: React.CSSProperties = { display: "block", color: "#64748b", fontWeight: 900 };
const statusAmount: React.CSSProperties = { fontSize: 28, fontWeight: 950 };

const sectionTitle: React.CSSProperties = {
  margin: "22px 0 12px", fontSize: 20, fontWeight: 950, color: positiveHeading,
};

const topGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.5fr) 58px minmax(0,0.9fr)",
  gap: 24,
  alignItems: "end",
};

const returnTopGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,0.9fr) minmax(0,0.95fr) minmax(0,1.4fr) 58px minmax(0,0.9fr)",
  gap: 18,
  alignItems: "end",
};

const itemGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1.1fr 1fr 150px",
  gap: 14, alignItems: "end",
};

const fieldWrap: React.CSSProperties = { display: "grid", gap: 7 };
const fieldLabel: React.CSSProperties = { color: positiveMuted, fontWeight: 850, fontSize: 14 };

const fieldInput: React.CSSProperties = {
  ...positiveInputStrong,
  width: "100%", height: 48, borderRadius: 12,
  padding: "0 13px", fontSize: 15,
  fontWeight: 750, outline: "none", boxSizing: "border-box",
};

const dateFieldRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) 64px",
  gap: 10,
  alignItems: "center",
};

const dateTypingInput: React.CSSProperties = {
  ...fieldInput,
};

const datePickerInput: React.CSSProperties = {
  ...fieldInput,
  padding: "0 8px",
  textAlign: "center",
  cursor: "pointer",
};

const dateHelperText: React.CSSProperties = {
  color: positiveMuted,
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.4,
};

const addPartyInlineBtn: React.CSSProperties = {
  height: 48,
  alignSelf: "end",
  border: "1px solid rgba(184,134,11,0.22)",
  borderRadius: 12,
  background: "linear-gradient(135deg,#fff8dc,#f3df9d)",
  color: positiveHeading,
  fontWeight: 950,
  fontSize: 24,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(184,134,11,0.14)",
};

const barcodeRow: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 170px 130px", gap: 12, marginBottom: 14,
};

const barcodeInput: React.CSSProperties = { ...fieldInput, height: 52, fontSize: 16 };

const smallBlueBtn: React.CSSProperties = {
  border: "none", borderRadius: 12, background: "#2563eb",
  color: "white", fontWeight: 900, cursor: "pointer",
};

const smallGoldBtn: React.CSSProperties = {
  border: "none", borderRadius: 12, background: "#d4af37",
  color: "#111827", fontWeight: 950, cursor: "pointer",
};

const addLineBtn: React.CSSProperties = {
  height: 48, border: "none", borderRadius: 12,
  background: "linear-gradient(135deg,#16a34a,#22c55e)",
  color: "white", fontWeight: 950, cursor: "pointer",
};

const middleGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 360px", gap: 18, marginTop: 24,
};

const lineCard: React.CSSProperties = {
  ...positivePanelSoft,
  borderRadius: 20,
  padding: 18,
};

const summaryCard: React.CSSProperties = {
  ...positivePanelSoft,
  borderRadius: 20,
  padding: 18,
};

const cardTitle: React.CSSProperties = { fontSize: 20, fontWeight: 950, marginBottom: 14 };
const mutedText: React.CSSProperties = { color: positiveMuted, fontWeight: 800 };
const lineTableWrap: React.CSSProperties = { overflowX: "auto" };

const lineTable: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", minWidth: 900,
};

const lineTh: React.CSSProperties = {
  ...positiveTableHead,
  padding: 12, textAlign: "left", fontWeight: 950,
};

const lineTd: React.CSSProperties = {
  padding: 12, borderBottom: "1px solid rgba(184,134,11,0.16)", fontWeight: 750,
};

const tableEditBtn: React.CSSProperties = {
  border: "none", borderRadius: 9, background: "#2563eb",
  color: "white", padding: "8px 10px", fontWeight: 900, cursor: "pointer", marginRight: 8,
};

const tableDeleteBtn: React.CSSProperties = { ...tableEditBtn, background: "#ef4444", marginRight: 0 };

const summaryLine: React.CSSProperties = {
  display: "flex", justifyContent: "space-between",
  padding: "10px 0", borderBottom: "1px solid rgba(184,134,11,0.16)",
  color: positiveText, fontWeight: 800,
};

const grandLine: React.CSSProperties = {
  display: "flex", justifyContent: "space-between",
  marginTop: 14, padding: 15, borderRadius: 14,
  background: "linear-gradient(135deg,#16a34a,#22c55e)",
  fontSize: 16, fontWeight: 950,
};

const actionRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 0.7fr",
  gap: 12, marginTop: 22,
};

const primaryBtn: React.CSSProperties = {
  border: "none", borderRadius: 14, padding: "15px 18px",
  color: "white", fontWeight: 950, cursor: "pointer", fontSize: 15,
};

const aiBtn: React.CSSProperties = {
  ...primaryBtn, background: "linear-gradient(135deg,#b45309,#f59e0b)",
};

const clearBtn: React.CSSProperties = { ...primaryBtn, background: "linear-gradient(135deg,#fff8dc,#f1d88c)", color: positiveHeading };

const modalOverlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 9999,
  background: "rgba(91,64,0,0.18)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
};

const modalBox: React.CSSProperties = {
  width: "100%", maxWidth: 720, borderRadius: 26, padding: 26,
  background: "linear-gradient(145deg,rgba(255,255,255,0.98),rgba(255,246,214,0.94))",
  color: positiveText, boxShadow: "0 30px 80px rgba(120,83,13,0.22)",
  border: "1px solid rgba(184,134,11,0.18)",
};

const modalHeader: React.CSSProperties = {
  display: "flex", justifyContent: "space-between",
  alignItems: "center", marginBottom: 18,
};

const modalTitle: React.CSSProperties = { margin: 0, fontSize: 26, fontWeight: 950 };

const modalCloseBtn: React.CSSProperties = {
  width: 42, height: 42, borderRadius: 12, border: "none",
  background: "#ef4444", color: "white", fontSize: 26, fontWeight: 950, cursor: "pointer",
};

const modalGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 14,
};

const modalSaveBtn: React.CSSProperties = {
  width: "100%", border: "none", borderRadius: 14, background: "#22c55e",
  color: "white", padding: "15px 18px", marginTop: 16, fontSize: 16, fontWeight: 950, cursor: "pointer",
};

const modalHelp: React.CSSProperties = { color: positiveMuted, fontWeight: 800, lineHeight: 1.6 };

const modalActionRow: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
};

const cameraPreview: React.CSSProperties = {
  width: "100%", maxHeight: 430, objectFit: "cover",
  borderRadius: 18, border: "1px solid rgba(184,134,11,0.20)", background: "#fffdf1",
};

const itemDropdownPanel: React.CSSProperties = {
  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
  zIndex: 2200, background: "rgba(255,252,241,0.98)", border: "1px solid rgba(184,134,11,0.22)",
  borderRadius: 14, boxShadow: "0 16px 40px rgba(120,83,13,0.16)", overflow: "hidden",
};

const itemSearchInput: React.CSSProperties = {
  ...positiveInputStrong,
  width: "100%", height: 42, border: "none", borderBottom: "1px solid rgba(184,134,11,0.18)",
  background: "rgba(255,255,255,0.92)", padding: "0 14px",
  fontSize: 14, fontWeight: 750, outline: "none", boxSizing: "border-box",
};

const itemDropdownList: React.CSSProperties = { maxHeight: 240, overflowY: "auto" };

const itemDropdownOption: React.CSSProperties = {
  padding: "10px 14px", cursor: "pointer", display: "flex",
  alignItems: "center", borderBottom: "1px solid rgba(184,134,11,0.10)",
  fontSize: 14, transition: "background 0.1s",
};

const itemDropdownEmpty: React.CSSProperties = {
  padding: "14px", color: positiveMuted, fontWeight: 800, textAlign: "center",
};

const extractionGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18,
};

const extractionBtn: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", gap: 8, border: "none", borderRadius: 18,
  padding: "28px 16px", background: "linear-gradient(135deg,#15803d,#22c55e)",
  color: "white", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s",
};

const extractionIcon: React.CSSProperties = { fontSize: 40, lineHeight: 1 };
const extractionLabel: React.CSSProperties = { fontSize: 18, fontWeight: 950 };
const extractionSub: React.CSSProperties = { fontSize: 12, fontWeight: 700, opacity: 0.85 };

const saveConfirmBody: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 0 };

const saveConfirmTotalBanner: React.CSSProperties = {
  background: "linear-gradient(135deg,#166534,#22c55e)",
  borderRadius: 18, padding: "20px 24px",
  display: "flex", justifyContent: "space-between",
  alignItems: "center", marginBottom: 16,
};

const saveConfirmBannerLabel: React.CSSProperties = {
  color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 800,
  letterSpacing: 1, textTransform: "uppercase" as const, marginBottom: 4,
};

const saveConfirmBannerValue: React.CSSProperties = {
  color: "white", fontSize: 38, fontWeight: 950, lineHeight: 1,
};

const saveConfirmBannerBadge: React.CSSProperties = {
  background: "rgba(255,255,255,0.2)", borderRadius: 10,
  padding: "8px 14px", fontSize: 14, fontWeight: 900, color: "white",
};

const saveConfirmMeta: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(184,134,11,0.18)",
  borderRadius: 14, padding: "4px 16px", marginBottom: 16,
};

const saveConfirmMetaRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between",
  padding: "10px 0", borderBottom: "1px solid rgba(184,134,11,0.12)",
};

const saveConfirmMetaLabel: React.CSSProperties = {
  color: positiveMuted, fontWeight: 800, fontSize: 13,
};

const saveConfirmMetaValue: React.CSSProperties = {
  color: positiveText, fontWeight: 800, fontSize: 13,
};

const saveConfirmInputWrap: React.CSSProperties = { marginBottom: 4 };

const saveConfirmInput: React.CSSProperties = {
  ...fieldInput, height: 60, fontSize: 26, fontWeight: 950,
  border: "2px solid #22c55e", borderRadius: 14, textAlign: "center",
};

const saveConfirmInputHint: React.CSSProperties = {
  color: positiveMuted, fontWeight: 700, fontSize: 12,
};

const saveConfirmPendingNote: React.CSSProperties = {
  background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)",
  borderRadius: 10, padding: "8px 14px", marginTop: 8,
  color: "#fbbf24", fontWeight: 800, fontSize: 13, textAlign: "center",
};

const saveConfirmActions: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18,
};

const saveConfirmBtnClose: React.CSSProperties = {
  border: "none", borderRadius: 14,
  background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
  color: "white", padding: "15px 18px",
  fontSize: 15, fontWeight: 950, cursor: "pointer",
};

const saveConfirmBtnPrint: React.CSSProperties = {
  border: "none", borderRadius: 14,
  background: "linear-gradient(135deg,#15803d,#22c55e)",
  color: "white", padding: "15px 18px",
  fontSize: 15, fontWeight: 950, cursor: "pointer",
};
  