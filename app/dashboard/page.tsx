"use client";

import AppShell from "../components/AppShell";
import { useResponsive } from "../components/useResponsive";
import { API_BASE_URL } from "../lib/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  positiveMuted,
  positivePage,
  positivePanel,
  positiveTableHead,
  positiveText,
} from "../components/positiveTheme";

const API = API_BASE_URL;

type TrendType =
  | "sales"
  | "purchase"
  | "purchaseReturn"
  | "salesReturn"
  | "profit"
  | "receivable"
  | "payable"
  | "cash"
  | "bank"
  | "extraction"; // Added extraction as an interactive item type

type FilterType = "date" | "month" | "year" | "all";
type ViewMode = "list" | "trend";
type DocType = "purchase" | "sales-return";

type DueRow = {
  type: "Receivable" | "Payable";
  date: string;
  party: string;
  invoiceNo: string;
  amount: number;
  status: "Due Today" | "Overdue";
};

export default function DashboardPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const alertShown = useRef(false);

  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [cashEntries, setCashEntries] = useState<any[]>([]);
  const [receivableRows, setReceivableRows] = useState<any[]>([]);
  const [paymentRows, setPaymentRows] = useState<any[]>([]);

  const [selectedTrend, setSelectedTrend] = useState<TrendType>("sales");
  const [viewMode, setViewMode] = useState<ViewMode>("trend");
  const [filterType, setFilterType] = useState<FilterType>("date");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // AI Extraction State Variables
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocType | "">("");
  const [extractMode, setExtractMode] = useState<"camera" | "upload" | "">("");
  const [extracting, setExtracting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Keyboard navigation focus tracking index
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const interactiveCards: TrendType[] = useMemo(() => [
    "sales", "purchase", "purchaseReturn", "salesReturn", 
    "profit", "receivable", "payable", "cash", "bank", "extraction"
  ], []);

  useEffect(() => {
    const today = new Date();
    setSelectedDate(today.toISOString().slice(0, 10));
    setSelectedMonth(today.toISOString().slice(0, 7));
    setSelectedYear(String(today.getFullYear()));
    fetchAll();
  }, []);

  // Keyboard navigation directional hook implementation
  useEffect(() => {
    const handleKeyboardGridNav = (e: KeyboardEvent) => {
      if (showExtractionModal) return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, interactiveCards.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const targetedType = interactiveCards[focusedIndex];
        if (targetedType === "extraction") {
          setShowExtractionModal(true);
        } else {
          handleCardClick(targetedType);
        }
      }
    };
    window.addEventListener("keydown", handleKeyboardGridNav);
    return () => window.removeEventListener("keydown", handleKeyboardGridNav);
  }, [focusedIndex, interactiveCards, showExtractionModal, selectedTrend, viewMode]);

  const getStorageArray = (key: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const fetchJson = async (url: string, fallbackKey: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return getStorageArray(fallbackKey);
    }
  };

  const buildReceivables = (salesRows: any[], purchaseReturnRows: any[]) => {
    const manual = getStorageArray("receivableMaster");

    const fromInvoices = [...salesRows, ...purchaseReturnRows]
      .map((x: any) => {
        const invoiceAmount = Number(x.totalAmount || x.grandTotal || 0);
        const receivedAmount = Number(x.receivedAmount || 0);
        const pendingAmount = Math.max(invoiceAmount - receivedAmount, 0);
        return {
          id: x.id || `${x.invoiceNo || x.returnNo}-${invoiceAmount}`,
          date: x.date || x.createdAt || new Date().toISOString().slice(0, 10),
          dueDate: x.dueDate || "",
          party: x.partyName || x.customerName || x.supplierName || "Customer",
          invoiceNo: x.invoiceNo || x.returnNo || "-",
          invoiceAmount,
          receivedAmount,
          pendingAmount,
          source: x.returnNo ? "Purchase Return" : "Sales",
        };
      })
      .filter((x) => x.pendingAmount > 0);

    const fromManual = manual
      .map((x: any) => {
        const invoiceAmount = Number(x.totalAmount || x.amount || 0);
        const receivedAmount = Number(x.receivedAmount || x.received || 0);
        const pendingAmount = Number(
          x.pendingAmount ||
            x.balance ||
            Math.max(invoiceAmount - receivedAmount, 0),
        );
        return {
          id: `manual-${x.id || x.invoiceNo}`,
          date: x.date || new Date().toISOString().slice(0, 10),
          dueDate: x.dueDate || "",
          party: x.customerName || x.partyName || "Customer",
          invoiceNo: x.invoiceNo || x.referenceNo || "-",
          invoiceAmount,
          receivedAmount,
          pendingAmount,
          source: "Manual",
        };
      })
      .filter((x) => x.pendingAmount > 0);

    return [...fromInvoices, ...fromManual];
  };

  const buildPayments = (purchaseRows: any[], salesReturnRows: any[]) => {
    const manual = getStorageArray("paymentMaster");

    const fromInvoices = [...purchaseRows, ...salesReturnRows]
      .map((x: any) => {
        const invoiceAmount = Number(x.totalAmount || x.grandTotal || 0);
        const paidAmount = Number(x.paidAmount || 0);
        const pendingAmount = Math.max(invoiceAmount - paidAmount, 0);
        return {
          id: x.id || `${x.invoiceNo || x.returnNo}-${invoiceAmount}`,
          date: x.date || x.createdAt || new Date().toISOString().slice(0, 10),
          dueDate: x.dueDate || "",
          party: x.supplierName || x.partyName || "Supplier",
          invoiceNo: x.invoiceNo || x.returnNo || "-",
          invoiceAmount,
          paidAmount,
          pendingAmount,
          source: x.returnNo ? "Sales Return" : "Purchase",
        };
      })
      .filter((x) => x.pendingAmount > 0);

    const fromManual = manual
      .map((x: any) => {
        const invoiceAmount = Number(x.totalAmount || x.amount || 0);
        const paidAmount = Number(x.paidAmount || 0);
        const pendingAmount = Number(
          x.pendingAmount ||
            x.balance ||
            Math.max(invoiceAmount - paidAmount, 0),
        );
        return {
          id: `manual-${x.id || x.invoiceNo}`,
          date: x.date || new Date().toISOString().slice(0, 10),
          dueDate: x.dueDate || "",
          party: x.supplierName || x.partyName || "Supplier",
          invoiceNo: x.invoiceNo || x.referenceNo || "-",
          invoiceAmount,
          paidAmount,
          pendingAmount,
          source: "Manual",
        };
      })
      .filter((x) => x.pendingAmount > 0);

    return [...fromInvoices, ...fromManual];
  };

  const fetchAll = async () => {
    const [s, p, pr, sr, it] = await Promise.all([
      fetchJson(`${API}/sales`, "sales"),
      fetchJson(`${API}/purchase`, "purchase"),
      fetchJson(`${API}/purchase-return`, "purchase-return"),
      fetchJson(`${API}/sales-return`, "sales-return"),
      fetchJson(`${API}/items`, "items"),
    ]);

    setSales(s);
    setPurchases(p);
    setPurchaseReturns(pr);
    setSalesReturns(sr);
    setItems(it);
    setCashEntries(getStorageArray("cashMaster"));
    setReceivableRows(buildReceivables(s, pr));
    setPaymentRows(buildPayments(p, sr));
  };

  const money = (value: any) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const rowDate = (row: any) => {
    const raw = row.date || row.createdAt || "";
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const isInFilter = (row: any) => {
    if (filterType === "all") return true;
    const d = rowDate(row);
    if (!d) return true;

    const isoDate = d.toISOString().slice(0, 10);
    const isoMonth = d.toISOString().slice(0, 7);
    const year = String(d.getFullYear());

    if (filterType === "date") return isoDate === selectedDate;
    if (filterType === "month") return isoMonth === selectedMonth;
    if (filterType === "year") return year === selectedYear;
    return true;
  };

  const filteredSales = sales.filter(isInFilter);
  const filteredPurchases = purchases.filter(isInFilter);
  const filteredPurchaseReturns = purchaseReturns.filter(isInFilter);
  const filteredSalesReturns = salesReturns.filter(isInFilter);

  const totalSales = filteredSales.reduce((s, x) => s + Number(x.totalAmount || 0), 0);
  const totalPurchase = filteredPurchases.reduce((s, x) => s + Number(x.totalAmount || 0), 0);
  const totalPurchaseReturn = filteredPurchaseReturns.reduce((s, x) => s + Number(x.totalAmount || 0), 0);
  const totalSalesReturn = filteredSalesReturns.reduce((s, x) => s + Number(x.totalAmount || 0), 0);
  const cogsProfit = filteredSales.reduce((s, x) => s + Number(x.profit || x.totalAmount || 0), 0) - totalPurchase;

  const totalReceivable = receivableRows.reduce((s, x) => s + Number(x.pendingAmount || 0), 0);
  const totalPayable = paymentRows.reduce((s, x) => s + Number(x.pendingAmount || 0), 0);
  const cashBalance = cashEntries.reduce((s, x) => {
    const amount = Number(x.amount || 0);
    return x.type === "debit" ? s - amount : s + amount;
  }, 0);

  const bankBalance = useMemo(() => {
    try {
      const settings = JSON.parse(localStorage.getItem("companySettings") || "{}");
      const profile = JSON.parse(localStorage.getItem("companyProfile") || "{}");
      const bankEntries = getStorageArray("bankMaster");
      const opening = Number(settings.bankBalance || profile.bankBalance || 0);
      return bankEntries.reduce((s: number, x: any) => {
        const amount = Number(x.amount || 0);
        return x.type === "debit" ? s - amount : s + amount;
      }, opening);
    } catch {
      return 0;
    }
  }, [cashEntries]);

  // Split and process receivables vs payables due today arrays separately
  const bifurcatedDues = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const makeDue = (rows: any[], type: "Receivable" | "Payable") =>
      rows
        .filter((x) => x.dueDate)
        .map((x) => {
          const d = new Date(x.dueDate);
          d.setHours(0, 0, 0, 0);
          const status =
            d.getTime() < today.getTime()
              ? "Overdue"
              : d.getTime() === today.getTime()
                ? "Due Today"
                : "";
          if (!status) return null;
          return {
            type,
            date: x.dueDate,
            party: x.party,
            invoiceNo: x.invoiceNo,
            amount: Number(x.pendingAmount || 0),
            status: status as "Due Today" | "Overdue",
          };
        })
        .filter(Boolean) as DueRow[];

    const receivables = makeDue(receivableRows, "Receivable");
    const payables = makeDue(paymentRows, "Payable");

    return { receivables, payables, totalCount: receivables.length + payables.length };
  }, [receivableRows, paymentRows]);

  useEffect(() => {
    if (!alertShown.current && bifurcatedDues.totalCount > 0) {
      alertShown.current = true;
      alert(`Due Alert: ${bifurcatedDues.totalCount} total tracking entries due or overdue.`);
    }
  }, [bifurcatedDues]);

  const lowStock = items
    .filter((x) => Number(x.currentStock || 0) <= Number(x.minStock || 0))
    .slice(0, 10);
    
  // Fixed sorting parameters logic ensuring it pulls the exact top 5 newest rows
  const recentSalesList = useMemo(() => {
    return [...sales]
      .sort((a, b) => {
        const dA = a.createdAt || a.date || "";
        const dB = b.createdAt || b.date || "";
        return new Date(dB).getTime() - new Date(dA).getTime();
      })
      .slice(0, 5);
  }, [sales]);

  const getBaseTitle = () => {
    const titles: Record<TrendType, string> = {
      sales: "Sales",
      purchase: "Purchase",
      purchaseReturn: "Purchase Return",
      salesReturn: "Sales Return",
      profit: "COGS Profit",
      receivable: "Receivable",
      payable: "Payable",
      cash: "Cash Balance",
      bank: "Bank Balance",
      extraction: "AI Extraction Hub"
    };
    return titles[selectedTrend];
  };

  const getTitle = () => {
    const base = getBaseTitle();
    if (viewMode === "list") return `${base} List`;
    return `${base} Trend`;
  };

  const getInvoiceReportRoute = () => {
    const tabs: Record<TrendType, string> = {
      sales: "sales",
      purchase: "purchase",
      purchaseReturn: "purchase-return",
      salesReturn: "sales-return",
      profit: "all",
      receivable: "all",
      payable: "all",
      cash: "all",
      bank: "all",
      extraction: "all"
    };
    return `/all-invoice-report?tab=${tabs[selectedTrend] || "all"}`;
  };

  const chartRows = () => {
    if (selectedTrend === "sales") return filteredSales.map((x) => ({ ...x, amount: Number(x.totalAmount || 0) }));
    if (selectedTrend === "purchase") return filteredPurchases.map((x) => ({ ...x, amount: Number(x.totalAmount || 0) }));
    if (selectedTrend === "purchaseReturn") return filteredPurchaseReturns.map((x) => ({ ...x, amount: Number(x.totalAmount || 0) }));
    if (selectedTrend === "salesReturn") return filteredSalesReturns.map((x) => ({ ...x, amount: Number(x.totalAmount || 0) }));
    if (selectedTrend === "profit") return filteredSales.map((x) => ({ ...x, amount: Number(x.profit || x.totalAmount || 0) }));
    if (selectedTrend === "receivable") return receivableRows.map((x) => ({ ...x, amount: Number(x.pendingAmount || 0), createdAt: x.date }));
    if (selectedTrend === "payable") return paymentRows.map((x) => ({ ...x, amount: Number(x.pendingAmount || 0), createdAt: x.date }));
    if (selectedTrend === "cash") return cashEntries.map((x) => ({ ...x, amount: x.type === "debit" ? -Number(x.amount || 0) : Number(x.amount || 0), createdAt: x.date }));
    return [{ id: "bank", amount: bankBalance, createdAt: new Date().toISOString(), invoiceNo: "BANK" }];
  };

  const listRows = () => {
    if (selectedTrend === "sales") return filteredSales.map((x) => ({ ...x, source: "Sales", amount: Number(x.totalAmount || 0) }));
    if (selectedTrend === "purchase") return filteredPurchases.map((x) => ({ ...x, source: "Purchase", amount: Number(x.totalAmount || 0) }));
    if (selectedTrend === "purchaseReturn") return filteredPurchaseReturns.map((x) => ({ ...x, source: "Purchase Return", amount: Number(x.totalAmount || 0) }));
    if (selectedTrend === "salesReturn") return filteredSalesReturns.map((x) => ({ ...x, source: "Sales Return", amount: Number(x.totalAmount || 0) }));
    if (selectedTrend === "profit") return filteredSales.map((x) => ({ ...x, source: "COGS Profit", amount: Number(x.profit || x.totalAmount || 0) }));
    if (selectedTrend === "receivable") return receivableRows.map((x) => ({ ...x, source: x.source || "Receivable", amount: Number(x.pendingAmount || 0) }));
    if (selectedTrend === "payable") return paymentRows.map((x) => ({ ...x, source: x.source || "Payable", amount: Number(x.pendingAmount || 0) }));
    if (selectedTrend === "cash") return cashEntries.map((x) => ({ ...x, source: x.type === "debit" ? "Cash Debit" : "Cash Credit", amount: Number(x.amount || 0), party: x.partyName || x.party || "-", invoiceNo: x.invoiceNo || x.referenceNo || "-" }));
    return [{ id: "bank", source: "Bank", invoiceNo: "BANK", party: "Bank", amount: bankBalance, date: new Date().toISOString().slice(0, 10) }];
  };

  const trendData = chartRows().map((x, index) => {
    const d = rowDate(x);
    const label =
      filterType === "date"
        ? d?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) || String(index + 1)
        : d?.toLocaleDateString("en-IN") || String(index + 1);
    return { label, amount: Number(x.amount || 0) };
  });

  const maxAmount = Math.max(...trendData.map((x) => Math.abs(x.amount)), 1);

  const handleCardClick = (type: TrendType) => {
    const routes: Record<string, string> = {
      sales: "/sales",
      purchase: "/purchase",
      purchaseReturn: "/purchase-return",
      salesReturn: "/sales-return",
      receivable: "/receivable",
      payable: "/payment",
      cash: "/cash",
      bank: "/cash",
      profit: "/dashboard",
    };

    if (selectedTrend === type && viewMode === "trend") {
      router.push(routes[type] || "/dashboard");
      return;
    }

    setSelectedTrend(type);
    setViewMode("trend");
  };

  const closeExtractionModal = () => {
    stopCamera();
    setShowExtractionModal(false);
    setSelectedDocType("");
    setExtractMode("");
    setExtracting(false);
  };

  // Close dashboard popup/modal with ESC key
  useEffect(() => {
    const handleEscClose = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showExtractionModal) {
          event.preventDefault();
          closeExtractionModal();
        }
      }
    };

    window.addEventListener("keydown", handleEscClose);
    return () => window.removeEventListener("keydown", handleEscClose);
  }, [showExtractionModal]);

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  };

  const startCameraInput = async () => {
    try {
      setExtractMode("camera");
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
      }, 150);
    } catch (err) {
      alert("Unable to reach device video media matrix streams driver.");
      setExtractMode("");
    }
  };

  const processFileExtraction = async (file: File) => {
    if (!selectedDocType) return;
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("invoice", file);
      formData.append("pageType", selectedDocType);

      const res = await fetch(`${API}/ai/extract-invoice`, { method: "POST", body: formData });
      const payload = await res.json().catch(() => null);

      if (res.ok && payload?.success) {
        sessionStorage.setItem("ai_extracted_buffer", JSON.stringify(payload.extracted));
        router.push(`/${selectedDocType}?extract_buffer_hook=true`);
        closeExtractionModal();
      } else {
        alert(payload?.message || "AI extraction failed code profile matrix check.");
      }
    } catch {
      alert("AI pipeline gateway parsing returned internal workflow loops timeout.");
    } finally {
      setExtracting(false);
    }
  };

  const capturePhotoBytes = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `snap-${Date.now()}.jpg`, { type: "image/jpeg" });
        stopCamera();
        processFileExtraction(file);
      }
    }, "image/jpeg", 0.92);
  };

  const pageStyle = { ...page, padding: isMobile ? "14px" : isTablet ? "18px" : "24px" };
  const heroStyle = {
    ...hero,
    flexDirection: isTablet ? ("column" as const) : ("row" as const),
    alignItems: isTablet ? ("stretch" as const) : ("center" as const),
    gap: isTablet ? 14 : 0,
    padding: isMobile ? "24px 20px" : isTablet ? "30px 28px" : "45px 48px",
  };
  const heroTitleStyle = { ...heroTitle, fontSize: isMobile ? 30 : isTablet ? 34 : 42 };
  const dateBoxStyle = { ...dateBox, width: isTablet ? "100%" : "auto" };
  const cardsStyle = {
    ...cards,
    gridTemplateColumns: isMobile
      ? "1fr"
      : isTablet
      ? "repeat(2,minmax(0,1fr))"
      : "repeat(5,1fr)",
  };
  const trendCardStyle = { ...trendCard, padding: isMobile ? 18 : isTablet ? 22 : 30 };
  const trendHeaderStyle = {
    ...trendHeader,
    flexDirection: isTablet ? ("column" as const) : ("row" as const),
    alignItems: isTablet ? ("stretch" as const) : ("center" as const),
  };
  const duesSectionStyle = {
    ...duesSectionSplitRowWrapper,
    gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr",
  };
  const bottomGridStyle = {
    ...bottomGrid,
    gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr",
  };

  return (
    <AppShell>
      <main style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <h1 style={heroTitleStyle}>DASHBOARD</h1>
            <p style={heroSub}>GST Billing & Inventory Management</p>
          </div>
          <div style={dateBoxStyle}>
            <small>Today</small>
            <b>
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </b>
          </div>
        </section>

        <section style={cardsStyle}>
          <Card title="SALES" value={money(totalSales)} color="#22c55e" active={selectedTrend === "sales" && focusedIndex === 0} onClick={() => handleCardClick("sales")} />
          <Card title="PURCHASE" value={money(totalPurchase)} color="#f59e0b" active={selectedTrend === "purchase" && focusedIndex === 1} onClick={() => handleCardClick("purchase")} />
          <Card title="PURCHASE RETURN" value={money(totalPurchaseReturn)} color="#3b82f6" active={selectedTrend === "purchaseReturn" && focusedIndex === 2} onClick={() => handleCardClick("purchaseReturn")} />
          <Card title="SALES RETURN" value={money(totalSalesReturn)} color="#ec4899" active={selectedTrend === "salesReturn" && focusedIndex === 3} onClick={() => handleCardClick("salesReturn")} />
          <Card title="COGS PROFIT" value={money(cogsProfit)} color={cogsProfit < 0 ? "#ef4444" : "#a16207"} active={selectedTrend === "profit" && focusedIndex === 4} onClick={() => handleCardClick("profit")} />
          <Card title="RECEIVABLE" value={money(totalReceivable)} color="#ef4444" active={selectedTrend === "receivable" && focusedIndex === 5} onClick={() => handleCardClick("receivable")} />
          <Card title="PAYABLE" value={money(totalPayable)} color="#f97316" active={selectedTrend === "payable" && focusedIndex === 6} onClick={() => handleCardClick("payable")} />
          <Card title="CASH BALANCE" value={money(cashBalance)} color="#16a34a" active={selectedTrend === "cash" && focusedIndex === 7} onClick={() => handleCardClick("cash")} />
          <Card title="BANK BALANCE" value={money(bankBalance)} color="#0ea5e9" active={selectedTrend === "bank" && focusedIndex === 8} onClick={() => handleCardClick("bank")} />
          <Card title="✨ AI EXTRACTION" value="Universal AI" color="#eab308" active={focusedIndex === 9} onClick={() => setShowExtractionModal(true)} />
        </section>

        <section style={trendCardStyle}>
          <div style={trendHeaderStyle}>
            <div>
              <h2 style={trendTitle}>{getTitle()}</h2>
              <p style={hint}>
                1st click = list below cards. 2nd click = trend. Click again to toggle list/trend.
              </p>
            </div>
            
<div style={controls}>
  <button
    className="royal-hover"
    onClick={() => router.push(getInvoiceReportRoute())}
    style={reportBtn}
  >
    Invoice Report
  </button>

  <button className="royal-hover" onClick={fetchAll} style={refreshBtn}>
    Refresh
  </button>

  <select value={filterType} onChange={(e) => setFilterType(e.target.value as FilterType)} style={select}>
                <option value="date">Date</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
                <option value="all">All</option>
              </select>
              {filterType === "date" && (
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={select} />
              )}
              {filterType === "month" && (
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={select} />
              )}
              {filterType === "year" && (
                <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={select} />
              )}
            </div>
          </div>

          {viewMode === "list" ? (
            <ListReport title={getBaseTitle()} rows={listRows()} money={money} />
          ) : (
            <TrendChart trendData={trendData} maxAmount={maxAmount} money={money} />
          )}
        </section>

        {/* Side-by-Side Split Due Matrix Accounts Settlement Blocks Panel layout row map lists view metrics */}
        <section style={duesSectionStyle}>
          <div style={duesBoxColumnWrapperCard}>
            <div style={{ ...notificationHead, marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950 }}>Receivables Due Today (From Debtors)</h3>
              <span style={{ ...dueCount, background: "#ef4444" }}>{bifurcatedDues.receivables.length} Due</span>
            </div>
            {bifurcatedDues.receivables.length === 0 ? (
              <p style={muted}>No receivable balance payments due today from clients.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {bifurcatedDues.receivables.map((d, i) => (
                  <div key={i} style={innerSplitDueBoxRow}>
                    <div>
                      <b style={{ color: "white", display: "block" }}>{d.party}</b>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>Ref: {d.invoiceNo} — <span style={{ color: "#f87171", fontWeight: 800 }}>{d.status}</span></span>
                    </div>
                    <strong style={{ color: "#ef4444", fontSize: 15 }}>{money(d.amount)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={duesBoxColumnWrapperCard}>
            <div style={{ ...notificationHead, marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950 }}>Payables Due Today (To Suppliers)</h3>
              <span style={{ ...dueCount, background: "#f97316" }}>{bifurcatedDues.payables.length} Due</span>
            </div>
            {bifurcatedDues.payables.length === 0 ? (
              <p style={muted}>No pending vendor liability settlements tracked for current day.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {bifurcatedDues.payables.map((d, i) => (
                  <div key={i} style={innerSplitDueBoxRow}>
                    <div>
                      <b style={{ color: "white", display: "block" }}>{d.party}</b>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>Ref: {d.invoiceNo} — <span style={{ color: "#fb923c", fontWeight: 800 }}>{d.status}</span></span>
                    </div>
                    <strong style={{ color: "#f97316", fontSize: 15 }}>{money(d.amount)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section style={bottomGridStyle}>
          <div style={infoCard}>
            <h2 style={infoTitle}>Recent Sales</h2>
            {recentSalesList.length === 0 ? (
              <p style={muted}>No recent sales</p>
            ) : (
              recentSalesList.map((s) => (
                <div key={s.id || s.invoiceNo} style={listRow}>
                  <b>{s.partyName || "B2C Customer"}</b>
                  <span style={{ color: "#16a34a", fontWeight: 900 }}>{money(s.totalAmount)}</span>
                </div>
              ))
            )}
          </div>

          <div style={infoCard}>
            <h2 style={infoTitle}>Low Stock Alert</h2>
            {lowStock.length === 0 ? (
              <p style={muted}>No low stock items</p>
            ) : (
              lowStock.map((i) => (
                <div key={i.id || i.itemName} style={listRow}>
                  <b>{i.itemName}</b>
                  <span style={{ color: "#ef4444", fontWeight: 900 }}>{i.currentStock}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Global Floating Actions Extraction Hub Overlay Pipeline Wrapper Elements */}
        {showExtractionModal && (
          <div style={modalOverlayStyle}>
            <div style={modalBoxStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(184,134,11,0.18)", paddingBottom: 12, marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: "#3f2a00" }}>Universal AI Extraction Hub</h3>
                <button onClick={closeExtractionModal} style={{ background: "none", border: "none", color: "#6b5b20", fontSize: 24, cursor: "pointer" }}>×</button>
              </div>

              {extracting ? (
                <div style={{ padding: "30px 0", textAlign: "center" }}>
                  <div style={loadingSpinnerElement}></div>
                  <p style={{ marginTop: 14, fontWeight: 800, color: "#6b5b20" }}>Deep-learning structural vector maps parsing contextual elements layout values... Please wait...</p>
                </div>
              ) : !selectedDocType ? (
                <div>
                  <p style={{ fontSize: 13, color: "#6b5b20", fontWeight: 700, marginBottom: 12 }}>Select module layout mapping route destination:</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                    <button style={modalWorkflowBigActionBtn} onClick={() => setSelectedDocType("purchase")}>
                      <span style={modalActionIcon}>📦</span>
                      <b>Purchase Asset Form</b>
                      <small style={modalActionSub}>Extract supplier bill data and auto-fill purchase entry.</small>
                    </button>
                    <button style={modalWorkflowBigActionBtn} onClick={() => setSelectedDocType("sales-return")}>
                      <span style={modalActionIcon}>🔄</span>
                      <b>Sales Return Sheet</b>
                      <small style={modalActionSub}>Sales Return extraction is available in Feature Roadmap and enabled for return invoice processing.</small>
                    </button>
                  </div>
                </div>
              ) : !extractMode ? (
                <div>
                  <p style={{ fontSize: 13, color: "#6b5b20", fontWeight: 700, marginBottom: 12 }}>Target Assigned: <span style={{ color: "#b45309" }}>{selectedDocType.toUpperCase()}</span>. Choose hardware feed option parameter vector:</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <button style={{ ...modalWorkflowActionTriggerBtn, background: "#16a34a" }} onClick={startCameraInput}>📷 Live Camera Frame Capture</button>
                    <button style={{ ...modalWorkflowActionTriggerBtn, background: "#2563eb" }} onClick={() => fileInputRef.current?.click()}>📂 Upload Image or PDF File</button>
                  </div>
                </div>
              ) : extractMode === "camera" ? (
                <div>
                  <video ref={videoRef} style={{ width: "100%", height: 280, objectFit: "cover", borderRadius: 12, background: "#000", marginBottom: 14 }} autoPlay playsInline></video>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <button style={{ ...modalWorkflowActionTriggerBtn, background: "#16a34a", textAlign: "center" }} onClick={capturePhotoBytes}>📸 Snap & Extract</button>
                    <button style={{ ...modalWorkflowActionTriggerBtn, background: "#475569", textAlign: "center" }} onClick={() => { stopCamera(); setExtractMode(""); }}>Cancel</button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFileExtraction(file);
            e.target.value = "";
          }}
        />
      </main>
    </AppShell>
  );
}

function Card({
  title,
  value,
  color,
  active,
  onClick,
}: any) {
  const [hover, setHover] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isHighlighted = active || hover;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...card,
borderTopWidth: "5px",
borderTopStyle: "solid",
borderTopColor: color,
borderWidth: "1px",
borderStyle: "solid",
borderColor: isHighlighted ? "#d4af37" : "rgba(255,255,255,0.9)",
        background: isHighlighted
          ? "linear-gradient(145deg, rgba(255,252,232,0.98), rgba(250,204,21,0.34), rgba(184,134,11,0.18))"
          : "rgba(255,255,255,0.68)",
        outline: active ? "3px solid #d4af37" : "none",
        transform: isHighlighted
          ? "translateY(-7px) scale(1.018)"
          : "translateY(0) scale(1)",
        boxShadow: isHighlighted
          ? "0 24px 52px rgba(120,72,0,0.22), 0 0 0 1px rgba(212,175,55,0.45), inset 0 1px 0 rgba(255,255,255,0.80)"
          : "0 14px 28px rgba(0,0,0,0.10)",
      }}
    >
      <p
        style={{
          ...cardTitle,
          color: isHighlighted ? "#5b3500" : "#4a3500",
        }}
      >
        {title}
      </p>

      <h2
        style={{
          ...cardValue,
          color: isHighlighted ? "#2b1800" : "#1f1700",
        }}
      >
        {mounted ? value : ""}
      </h2>
    </button>
  );
}

function TrendChart({ trendData, maxAmount, money }: any) {
  return (
    <div style={chartArea}>
      {trendData.length === 0 ? (
        <div style={empty}>No data available for selected filter</div>
      ) : (
        <div style={bars}>
          {trendData.map((item: any, index: number) => {
            const height = Math.max(
              (Math.abs(item.amount) / maxAmount) * 260,
              35,
            );
            return (
              <div key={index} style={barWrap}>
                <div style={barValue}>{money(item.amount)}</div>
                <div
                  style={{
                    ...bar,
                    height,
                    background:
                      item.amount < 0
                        ? "linear-gradient(180deg,#ef4444,#991b1b)"
                        : "linear-gradient(180deg,#facc15,#b8860b)",
                  }}
                />
                <div style={barLabel}>{item.label}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ListReport({ title, rows, money }: any) {
  const { isMobile } = useResponsive();

  return (
    <div style={tableWrap}>
      <div
        style={{
          ...summaryHead,
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 8 : 0,
        }}
      >
        <h3 style={summaryTitle}>{title} List</h3>
        <span style={summaryCount}>Records: {rows.length}</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={table}>
          <thead>
            <tr style={thead}>
              <th style={th}>Source</th>
              <th style={th}>Invoice No</th>
              <th style={th}>Party/Supplier</th>
              <th style={th}>Item</th>
              <th style={th}>Amount</th>
              <th style={th}>Date</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={td}>No records found</td>
              </tr>
            ) : (
              rows.map((r: any, i: number) => {
                const status =
                  r.pendingAmount > 0
                    ? r.receivedAmount > 0 || r.paidAmount > 0
                      ? "Partial"
                      : "Pending"
                    : r.paymentStatus || "-";

                return (
                  <tr key={`${r.id || i}-${r.invoiceNo || r.returnNo}`} style={tr}>
                    <td style={td}>{r.source || "-"}</td>
                    <td style={td}>{r.invoiceNo || r.returnNo || r.referenceNo || "-"}</td>
                    <td style={td}>{r.partyName || r.supplierName || r.party || r.customerName || "-"}</td>
                    <td style={td}>{r.itemName || "-"}</td>
                    <td style={td}>{money(r.amount || r.totalAmount || r.pendingAmount || 0)}</td>
                    <td style={td}>{r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : r.date || "-"}</td>
                    <td style={td}>{status}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Shared Compact Custom Dashboard Layout Styles Mapping Extensions ──

const page: React.CSSProperties = { ...positivePage, padding: "24px", color: positiveText };
const hero: React.CSSProperties = { background: "linear-gradient(135deg,rgba(255,255,255,0.86),rgba(255,239,174,0.75))", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 22, padding: "45px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 16px 36px rgba(0,0,0,0.10)", marginBottom: 22 };
const heroTitle: React.CSSProperties = { margin: 0, fontSize: 42, fontWeight: 950, letterSpacing: 1 };
const heroSub: React.CSSProperties = { marginTop: 14, fontWeight: 800 };
const dateBox: React.CSSProperties = { background: "rgba(255,255,255,0.7)", border: "1px solid #c59d00", borderRadius: 14, padding: "16px 22px", display: "grid", gap: 4 };

// Grid expanded to a clean 5-column double row structure to handle the extra action card symmetrically
const cards: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 22 };

const card: React.CSSProperties = { textAlign: "left", background: "rgba(255,255,255,0.68)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 18, padding: "20px 18px", minHeight: 120, boxShadow: "0 14px 28px rgba(0,0,0,0.10)", cursor: "pointer", transition: "all 0.28s ease", color: "#4a3500" };
const cardTitle: React.CSSProperties = { margin: 0, fontWeight: 950, fontSize: 13 };
const cardValue: React.CSSProperties = { margin: "16px 0 0", fontSize: 24, fontWeight: 950, color: "#1f1700" };
const trendCard: React.CSSProperties = { background: "linear-gradient(135deg,rgba(255,255,255,0.76),rgba(255,225,121,0.48))", border: "1px solid rgba(255,255,255,0.95)", borderRadius: 22, padding: 30, boxShadow: "0 16px 36px rgba(0,0,0,0.12)", marginBottom: 22, transition: "all 0.25s ease" };
const trendHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, marginBottom: 24 };
const trendTitle: React.CSSProperties = { margin: 0, fontSize: 30, fontWeight: 950 };
const hint: React.CSSProperties = { margin: "6px 0 0", fontSize: 13, fontWeight: 800, color: "#7c6a35" };
const controls: React.CSSProperties = { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" };
const reportBtn: React.CSSProperties = { background: "#2563eb", color: "white", border: "none", borderRadius: 12, padding: "14px 22px", fontWeight: 950, cursor: "pointer" };
const refreshBtn: React.CSSProperties = { border: "none", borderRadius: 14, padding: "14px 20px", background: "linear-gradient(135deg,#b45309,#f59e0b)", color: "white", fontSize: 15, fontWeight: 950, cursor: "pointer" };
const select: React.CSSProperties = { height: 50, minWidth: 150, borderRadius: 12, border: "1px solid #c59d00", background: "rgba(255,255,255,0.88)", padding: "0 16px", fontWeight: 900, color: "#3b2a00" };
const chartArea: React.CSSProperties = { minHeight: 310, borderBottom: "1px solid rgba(0,0,0,0.20)", borderLeft: "1px solid rgba(0,0,0,0.20)", padding: "18px 0 0 20px", overflowX: "auto" };
const bars: React.CSSProperties = { display: "flex", alignItems: "flex-end", gap: 28, minHeight: 300 };
const barWrap: React.CSSProperties = { minWidth: 70, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" };
const bar: React.CSSProperties = { width: 46, borderRadius: "12px 12px 0 0", boxShadow: "0 8px 18px rgba(0,0,0,0.18)" };
const barValue: React.CSSProperties = { fontSize: 13, fontWeight: 950, marginBottom: 8, whiteSpace: "nowrap" };
const barLabel: React.CSSProperties = { marginTop: 10, fontSize: 12, fontWeight: 900, whiteSpace: "nowrap" };
const empty: React.CSSProperties = { height: 280, display: "grid", placeItems: "center", fontWeight: 950, color: "#7c6a35" };

// Split Dues row metrics layout cards
const duesSectionSplitRowWrapper: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 22 };
const duesBoxColumnWrapperCard: React.CSSProperties = { background: "rgba(31,41,55,0.94)", color: "white", borderRadius: 22, padding: 24, boxShadow: "0 16px 36px rgba(0,0,0,0.12)" };
const innerSplitDueBoxRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 16px" };

const dueCount: React.CSSProperties = { color: "white", padding: "6px 12px", borderRadius: 999, fontWeight: 950, fontSize: 12 };
const bottomGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 };
const infoCard: React.CSSProperties = { background: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 22, padding: 28, boxShadow: "0 16px 36px rgba(0,0,0,0.12)", transition: "all 0.25s ease" };
const infoTitle: React.CSSProperties = { margin: 0, fontSize: 26, fontWeight: 950 };
const listRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(0,0,0,0.12)", fontWeight: 800 };
const muted: React.CSSProperties = { color: positiveMuted, fontWeight: 800, padding: "10px 0" };
const tableWrap: React.CSSProperties = { ...positivePanel, borderRadius: 18, padding: 20, color: positiveText };
const summaryHead: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 };
const summaryTitle: React.CSSProperties = { margin: 0, fontSize: 22, fontWeight: 950 };
const summaryCount: React.CSSProperties = { fontWeight: 900, color: positiveMuted };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", minWidth: 850 };
const thead: React.CSSProperties = positiveTableHead;
const th: React.CSSProperties = { padding: 14, textAlign: "left", fontWeight: 950 };
const tr: React.CSSProperties = { borderBottom: "1px solid rgba(184,134,11,0.16)" };
const td: React.CSSProperties = { padding: 14, fontWeight: 700 };

// Modal & Spinner Element Styles
const modalOverlayStyle: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 99999, background: "rgba(91,64,0,0.16)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const modalBoxStyle: React.CSSProperties = { ...positivePanel, width: "100%", maxWidth: 720, borderRadius: 28, padding: 30, boxShadow: "0 28px 75px rgba(120,83,13,0.22)" };
const modalWorkflowActionTriggerBtn: React.CSSProperties = { background: "rgba(255,255,255,0.82)", border: "1px solid rgba(184,134,11,0.22)", color: positiveText, padding: "14px", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", textAlign: "left" };
const modalWorkflowBigActionBtn: React.CSSProperties = { background: "linear-gradient(145deg,rgba(255,255,255,0.94),rgba(255,244,202,0.90))", border: "1px solid rgba(184,134,11,0.22)", color: positiveText, padding: "24px 22px", borderRadius: 20, fontSize: 16, fontWeight: 900, cursor: "pointer", textAlign: "left", minHeight: 150, display: "grid", gap: 10, boxShadow: "0 16px 34px rgba(120,83,13,0.16)", transition: "all 0.2s ease" };
const modalActionIcon: React.CSSProperties = { fontSize: 30, lineHeight: 1 };
const modalActionSub: React.CSSProperties = { display: "block", color: positiveMuted, fontSize: 12, lineHeight: 1.5, fontWeight: 700 };
const modalComingSoonBtn: React.CSSProperties = { ...modalWorkflowActionTriggerBtn, opacity: 0.68, cursor: "not-allowed", background: "rgba(255,255,255,0.68)" };
const modalComingSoonText: React.CSSProperties = { display: "block", marginTop: 6, color: "#b45309", fontWeight: 900 };
const loadingSpinnerElement: React.CSSProperties = { width: 40, height: 40, border: "4px solid rgba(255,255,255,0.1)", borderTopColor: "#eab308", borderRadius: "50%", margin: "0 auto", animation: "spin 0.8s linear infinite" };
const notificationHead: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 };
