"use client";

import AppShell from "../components/AppShell";
import { useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  RefObject,
} from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../lib/api";
import {
  paleButton,
  positiveHeading,
  positiveHeroCard,
  positiveInputStrong,
  positiveMuted,
  positivePage,
  positiveTableHead,
  positiveText,
  successButton,
} from "../components/positiveTheme";
import {
  asExcelText,
  downloadExcelTemplate,
  getExcelValue,
  readExcelRows,
} from "../components/excelUtils";

const API = API_BASE_URL;

type Item = {
  id: number;
  barcode?: string;
  itemName: string;
  gstRate: number;
  salesRate: number;
  purchaseRate: number;
  currentStock: number;
};

type FormState = {
  barcode: string;
  itemName: string;
  gstRate: string;
  salesRate: string;
  purchaseRate: string;
};

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  active?: boolean;
};

type Notice = {
  tone: "success" | "error";
  text: string;
};

type FocusTarget =
  | "barcode"
  | "itemName"
  | "gstRate"
  | "salesRate"
  | "purchaseRate"
  | "submit";

const emptyForm: FormState = {
  barcode: "",
  itemName: "",
  gstRate: "",
  salesRate: "",
  purchaseRate: "",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function ItemsPage() {
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [barcodeReady, setBarcodeReady] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const gstRef = useRef<HTMLInputElement>(null);
  const salesRef = useRef<HTMLInputElement>(null);
  const purchaseRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const totalItems = items.length;

  const totalStock = items.reduce(
    (sum, item) => sum + Number(item.currentStock || 0),
    0
  );

  const averageSalesRate = items.length
    ? items.reduce((sum, item) => sum + Number(item.salesRate || 0), 0) /
      items.length
    : 0;

  const barcodedItems = items.filter((item) =>
    (item.barcode || "").trim()
  ).length;

  const generatedAt = new Date().toLocaleString("en-IN");

  const focusField = (target: FocusTarget) => {
    window.requestAnimationFrame(() => {
      if (target === "barcode") {
        barcodeRef.current?.focus();
        barcodeRef.current?.select();
        return;
      }

      if (target === "itemName") {
        nameRef.current?.focus();
        nameRef.current?.select();
        return;
      }

      if (target === "gstRate") {
        gstRef.current?.focus();
        gstRef.current?.select();
        return;
      }

      if (target === "salesRate") {
        salesRef.current?.focus();
        salesRef.current?.select();
        return;
      }

      if (target === "purchaseRate") {
        purchaseRef.current?.focus();
        purchaseRef.current?.select();
        return;
      }

      submitBtnRef.current?.focus();
    });
  };

  const activateBarcodeInput = () => {
    setBarcodeReady(true);
    focusField("barcode");
  };

  const loadItems = async () => {
    try {
      const res = await fetch(`${API}/items`);

      if (!res.ok) {
        throw new Error("Unable to load items");
      }

      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setNotice({
        tone: "error",
        text: "Items could not be loaded. Please check your API connection.",
      });
    }
  };

  const resetForm = (shouldFocusBarcode = true) => {
    setEditingId(null);
    setForm(emptyForm);

    if (shouldFocusBarcode) {
      activateBarcodeInput();
    }
  };

  const updateForm = (key: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleEnterNavigation = (
    event: ReactKeyboardEvent<HTMLInputElement>,
    nextTarget: FocusTarget
  ) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    focusField(nextTarget);
  };

  const saveItem = async () => {
    if (saving) return;

    if (!form.itemName.trim()) {
      setNotice({
        tone: "error",
        text: "Item name is required before saving.",
      });
      focusField("itemName");
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const payload = {
        barcode: form.barcode.trim(),
        itemName: form.itemName.trim(),
        gstRate: Number(form.gstRate || 0),
        salesRate: Number(form.salesRate || 0),
        purchaseRate: Number(form.purchaseRate || 0),
      };

      const url = editingId ? `${API}/items/${editingId}` : `${API}/items`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Item save failed");
      }

      setNotice({
        tone: "success",
        text: editingId
          ? "Item updated successfully."
          : "Item added successfully. Ready for the next barcode.",
      });

      setEditingId(null);
      setForm(emptyForm);
      await loadItems();
      activateBarcodeInput();
    } catch (error) {
      console.error(error);
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? `Item save failed: ${error.message}`
            : "Item save failed.",
      });
    } finally {
      setSaving(false);
    }
  };

  const editItem = (item: Item) => {
    setEditingId(item.id);
    setForm({
      barcode: item.barcode || "",
      itemName: item.itemName || "",
      gstRate: String(item.gstRate || ""),
      salesRate: String(item.salesRate || ""),
      purchaseRate: String(item.purchaseRate || ""),
    });

    setNotice({
      tone: "success",
      text: "Edit mode enabled for the selected item.",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
    activateBarcodeInput();
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Delete this item?")) return;

    try {
      const res = await fetch(`${API}/items/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      setNotice({
        tone: "success",
        text: "Item deleted successfully.",
      });

      await loadItems();
      activateBarcodeInput();
    } catch (error) {
      console.error(error);
      setNotice({
        tone: "error",
        text: "Delete failed. Please try again.",
      });
    }
  };

  const downloadSampleFormat = () => {
    downloadExcelTemplate("Item_Master_Sample.xlsx", "Items", [
      {
        "Barcode No": "CD-3200BT",
        "Item Name": "REGUEK 2D BARCODE SCANNER",
        "GST Rate %": 18,
        "Sales Rate": 5000,
        "Purchase Rate": 3500,
        "Opening Stock": 25,
      },
    ]);
  };

  const importExcel = async (file?: File) => {
    if (!file) return;

    setImporting(true);
    setNotice(null);

    try {
      const rows = await readExcelRows(file);
      const nextLocalItems = [...items];
      let importedCount = 0;

      for (const row of rows) {
        const payload = {
          barcode: asExcelText(
            getExcelValue(row, ["Barcode No", "Barcode", "Item Code", "Code"]),
          ),
          itemName: asExcelText(
            getExcelValue(row, ["Item Name", "Name", "Product Name"]),
          ),
          gstRate: Number(
            getExcelValue(row, ["GST Rate %", "GST Rate", "GST %", "GST"]) || 0,
          ),
          salesRate: Number(
            getExcelValue(row, ["Sales Rate", "Sale Rate", "Selling Rate"]) || 0,
          ),
          purchaseRate: Number(
            getExcelValue(row, ["Purchase Rate", "Buy Rate", "Cost Rate"]) || 0,
          ),
          currentStock: Number(
            getExcelValue(row, ["Opening Stock", "Current Stock", "Stock"]) || 0,
          ),
          openingStock: Number(
            getExcelValue(row, ["Opening Stock", "Current Stock", "Stock"]) || 0,
          ),
        };

        if (!payload.itemName) {
          continue;
        }

        const existingItem =
          nextLocalItems.find(
            (item) =>
              String(item.itemName || "").trim().toLowerCase() ===
                payload.itemName.toLowerCase() ||
              (payload.barcode &&
                String(item.barcode || "").trim().toLowerCase() ===
                  payload.barcode.toLowerCase()),
          ) || null;

        let savedItem: any = null;

        try {
          const targetUrl = existingItem?.id
            ? `${API}/items/${existingItem.id}`
            : `${API}/items`;
          const method = existingItem?.id ? "PUT" : "POST";
          const res = await fetch(targetUrl, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            savedItem = await res.json().catch(() => null);
          }
        } catch (error) {
          console.error("Item import API fallback:", error);
        }

        const mergedItem = {
          ...(existingItem || {}),
          ...payload,
          ...(savedItem || {}),
          id: savedItem?.id || existingItem?.id || Date.now() + importedCount,
        };

        const existingIndex = nextLocalItems.findIndex(
          (item) => Number(item.id) === Number(existingItem?.id),
        );

        if (existingIndex >= 0) {
          nextLocalItems[existingIndex] = mergedItem;
        } else {
          nextLocalItems.unshift(mergedItem);
        }

        importedCount += 1;
      }

      if (!importedCount) {
        throw new Error("No valid item rows found. Please use the sample format.");
      }

      localStorage.setItem("items", JSON.stringify(nextLocalItems));
      await loadItems();
      activateBarcodeInput();
      setNotice({
        tone: "success",
        text: `Imported ${importedCount} item row(s) successfully.`,
      });
    } catch (error) {
      console.error(error);
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Excel import failed. Please use the sample format.",
      });
    } finally {
      setImporting(false);
      if (excelInputRef.current) {
        excelInputRef.current.value = "";
      }
    }
  };

  const handleSubmitButtonKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>
  ) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    void saveItem();
  };

  useEffect(() => {
    void loadItems();
    activateBarcodeInput();
  }, []);

  useEffect(() => {
    const handlePageShortcut = (event: KeyboardEvent) => {
      if (event.key !== "F8") return;

      event.preventDefault();
      activateBarcodeInput();
    };

    window.addEventListener("keydown", handlePageShortcut);

    return () => {
      window.removeEventListener("keydown", handlePageShortcut);
    };
  }, []);

  return (
    <AppShell>
      <>
        <style jsx global>{`
          .page-shell {
            min-height: 100vh;
          }

          .items-head {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            align-items: flex-start;
            margin-bottom: 24px;
            padding-right: 140px;
          }

          .quick-tools {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
          }

          .items-form-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 18px;
          }

          .items-button-row {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 18px;
            margin-top: 24px;
          }

          .table-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 18px;
            margin-bottom: 18px;
          }

          .format-strip {
            display: grid;
            gap: 8px;
            padding: 16px 18px;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.82);
            border: 1px solid rgba(184, 134, 11, 0.18);
            margin-bottom: 22px;
          }

          .format-title {
            font-size: 14px;
            font-weight: 900;
            color: #5b4300;
          }

          .format-order {
            color: #3f2a00;
            font-weight: 800;
            line-height: 1.7;
            word-break: break-word;
          }

          .format-help {
            color: #7c6530;
            font-weight: 700;
            font-size: 13px;
          }

          .summary-pills {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }

          .summary-pill {
            padding: 10px 14px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.84);
            border: 1px solid rgba(184, 134, 11, 0.2);
            color: #5b4300;
            font-weight: 800;
            font-size: 13px;
          }

          .screen-table-wrap {
            overflow-x: auto;
          }

          .print-root {
            display: none;
          }

          .print-sheet {
            background: white;
            color: #111827;
            border: 1px solid #e7d69b;
            border-radius: 18px;
            overflow: hidden;
          }

          .print-header {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            padding: 18px 22px;
            background: linear-gradient(90deg, #fdf6d6, #efd579);
            border-bottom: 3px solid #c7a635;
          }

          .print-brand {
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 0.04em;
          }

          .print-caption {
            font-size: 13px;
            color: #5b4b19;
            margin-top: 6px;
            font-weight: 700;
          }

          .print-meta {
            text-align: right;
            font-size: 12px;
            color: #5b4b19;
            font-weight: 700;
          }

          .print-summary {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            padding: 14px 18px;
            background: #fffdf3;
            border-bottom: 1px solid #eadcae;
          }

          .print-summary-card {
            background: #ffffff;
            border: 1px solid #eadcae;
            border-radius: 12px;
            padding: 12px 14px;
          }

          .print-summary-label {
            font-size: 11px;
            color: #7a6a32;
            font-weight: 800;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }

          .print-summary-value {
            font-size: 28px;
            color: #111827;
            font-weight: 900;
          }

          .print-table-wrap {
            padding: 10px 12px 16px;
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }

          .print-table thead tr {
            background: #f5f1de;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #d7c78a;
            padding: 8px 10px;
            text-align: left;
          }

          .print-table td:nth-child(1),
          .print-table td:nth-child(4),
          .print-table td:nth-child(7) {
            text-align: center;
          }

          .print-table tbody tr:nth-child(even) {
            background: #fffaf0;
          }

          .print-footer {
            padding: 10px 18px 18px;
            color: #6b7280;
            font-size: 11px;
            font-weight: 700;
          }

          @media (max-width: 1280px) {
            .items-form-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 900px) {
            .items-head {
              flex-direction: column;
              padding-right: 0;
            }

            .items-button-row {
              grid-template-columns: 1fr;
            }

            .table-toolbar {
              flex-direction: column;
              align-items: flex-start;
            }
          }

          @media (max-width: 640px) {
            .items-form-grid {
              grid-template-columns: 1fr;
            }

            .quick-tools {
              width: 100%;
            }

            .quick-tools button {
              flex: 1;
            }

            .print-summary {
              grid-template-columns: 1fr;
            }
          }

          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }

            html,
            body {
              background: white !important;
            }

            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .no-print {
              display: none !important;
            }

            .page-shell {
              padding: 0 !important;
              color: #111827 !important;
            }

            .page-shell > section:not(.print-root) {
              display: none !important;
            }

            .print-root {
              display: block !important;
            }

            .print-sheet {
              border-radius: 0;
              border: none;
            }

            .print-table thead {
              display: table-header-group;
            }

            .print-table tr {
              page-break-inside: avoid;
            }
          }
        `}</style>

        <main style={page} className="page-shell">
          <section style={{ ...card, position: "relative" }}>
            <button
              className="no-print"
              onClick={() => router.push("/dashboard")}
              style={dashboardBtn}
            >
              Dashboard
            </button>

            <div className="items-head">
              <div>
                <h1 style={title}>Item Master</h1>
                <p style={subTitle}>
                  Add items with barcode support, quick Enter navigation and
                  page-only F8 scanner focus.
                </p>
              </div>

              <div className="quick-tools no-print">
                <button
                  type="button"
                  style={importBtn}
                  onClick={() => excelInputRef.current?.click()}
                  disabled={importing}
                >
                  {importing ? "Importing..." : "Import Excel"}
                </button>

                <button
                  type="button"
                  style={sampleBtn}
                  onClick={downloadSampleFormat}
                >
                  Sample Format
                </button>

                <button
                  type="button"
                  style={barcodeBtn}
                  onClick={activateBarcodeInput}
                >
                  Barcode (F8)
                </button>

                <button
                  type="button"
                  style={printBtn}
                  onClick={() => window.print()}
                >
                  Print
                </button>
              </div>
            </div>

            {notice ? (
              <div
                style={{
                  ...noticeBox,
                  ...(notice.tone === "success"
                    ? successNotice
                    : errorNotice),
                }}
              >
                {notice.text}
              </div>
            ) : null}

            <div className="format-strip no-print">
              <div className="format-title">Excel Column Order</div>
              <div className="format-order">
                Barcode No | Item Name | GST Rate % | Sales Rate | Purchase Rate | Opening Stock
              </div>
              <div className="format-help">
                Download the sample file and keep the same column names for fast item import.
              </div>
            </div>

            <div className="items-form-grid">
              <Field
                label="Barcode No"
                value={form.barcode}
                onChange={(value) => updateForm("barcode", value)}
                placeholder="Scan or type barcode"
                inputRef={barcodeRef}
                onFocus={() => setBarcodeReady(true)}
                onBlur={() => setBarcodeReady(false)}
                onKeyDown={(event) => handleEnterNavigation(event, "itemName")}
                active={barcodeReady}
              />

              <Field
                label="Item Name"
                value={form.itemName}
                onChange={(value) => updateForm("itemName", value)}
                inputRef={nameRef}
                onKeyDown={(event) => handleEnterNavigation(event, "gstRate")}
              />

              <Field
                label="GST Rate %"
                type="number"
                value={form.gstRate}
                onChange={(value) => updateForm("gstRate", value)}
                inputRef={gstRef}
                onKeyDown={(event) => handleEnterNavigation(event, "salesRate")}
              />

              <Field
                label="Sales Rate"
                type="number"
                value={form.salesRate}
                onChange={(value) => updateForm("salesRate", value)}
                inputRef={salesRef}
                onKeyDown={(event) =>
                  handleEnterNavigation(event, "purchaseRate")
                }
              />

              <Field
                label="Purchase Rate"
                type="number"
                value={form.purchaseRate}
                onChange={(value) => updateForm("purchaseRate", value)}
                inputRef={purchaseRef}
                onKeyDown={(event) => handleEnterNavigation(event, "submit")}
              />
            </div>

            <div className="items-button-row no-print">
              <button
                ref={submitBtnRef}
                type="button"
                style={saveBtn}
                onClick={() => void saveItem()}
                onKeyDown={handleSubmitButtonKeyDown}
                disabled={saving}
              >
                {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
              </button>

              <button
                type="button"
                style={clearBtn}
                onClick={() => {
                  setNotice(null);
                  resetForm(true);
                }}
              >
                Clear
              </button>
            </div>
          </section>

          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={(event) => void importExcel(event.target.files?.[0])}
          />

          <section style={tableCard}>
            <div className="table-toolbar">
              <h2 style={tableTitle}>All Items</h2>

              <div className="summary-pills">
                <span className="summary-pill">Total Items: {totalItems}</span>
                <span className="summary-pill">
                  With Barcode: {barcodedItems}
                </span>
                <span className="summary-pill">Stock: {totalStock}</span>
              </div>
            </div>

            <div className="screen-table-wrap">
              <table style={table}>
                <thead>
                  <tr style={thead}>
                    <th style={th}>Barcode</th>
                    <th style={th}>Item Name</th>
                    <th style={th}>GST %</th>
                    <th style={th}>Sales Rate</th>
                    <th style={th}>Purchase Rate</th>
                    <th style={th}>Current Stock</th>
                    <th style={th}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {items.length === 0 ? (
                    <tr style={tr}>
                      <td style={emptyTd} colSpan={7}>
                        No items added yet.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} style={tr}>
                        <td style={td}>{item.barcode || "-"}</td>
                        <td style={td}>{item.itemName}</td>
                        <td style={td}>{item.gstRate}%</td>
                        <td style={td}>{formatMoney(item.salesRate)}</td>
                        <td style={td}>{formatMoney(item.purchaseRate)}</td>
                        <td style={td}>{item.currentStock}</td>
                        <td style={td}>
                          <button
                            type="button"
                            style={editBtn}
                            onClick={() => editItem(item)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            style={deleteBtn}
                            onClick={() => void deleteItem(item.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="print-root">
            <div className="print-sheet">
              <div className="print-header">
                <div>
                  <div className="print-brand">ITEM MASTER REPORT</div>
                  <div className="print-caption">
                    Barcode-enabled product list for quick item entry and
                    reference
                  </div>
                </div>

                <div className="print-meta">
                  <div>Generated</div>
                  <strong>{generatedAt}</strong>
                </div>
              </div>

              <div className="print-summary">
                <div className="print-summary-card">
                  <div className="print-summary-label">Total Items</div>
                  <div className="print-summary-value">{totalItems}</div>
                </div>

                <div className="print-summary-card">
                  <div className="print-summary-label">Items With Barcode</div>
                  <div className="print-summary-value">{barcodedItems}</div>
                </div>

                <div className="print-summary-card">
                  <div className="print-summary-label">Average Sales Rate</div>
                  <div className="print-summary-value">
                    {formatMoney(averageSalesRate)}
                  </div>
                </div>
              </div>

              <div className="print-table-wrap">
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Barcode</th>
                      <th>Item Name</th>
                      <th>GST %</th>
                      <th>Sales Rate</th>
                      <th>Purchase Rate</th>
                      <th>Stock</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center" }}>
                          No item data available
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={`print-${item.id}`}>
                          <td>{index + 1}</td>
                          <td>{item.barcode || "-"}</td>
                          <td>{item.itemName}</td>
                          <td>{item.gstRate}%</td>
                          <td>{formatMoney(item.salesRate)}</td>
                          <td>{formatMoney(item.purchaseRate)}</td>
                          <td>{item.currentStock}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="print-footer">
                Generated from Item Master. Use F8 on the Item Master page to
                focus the barcode input quickly.
              </div>
            </div>
          </section>
        </main>
      </>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputRef,
  onKeyDown,
  onFocus,
  onBlur,
  active = false,
}: FieldProps) {
  return (
    <label style={fieldWrap}>
      <span style={labelStyle}>{label}</span>
      <input
        ref={inputRef}
        style={{
          ...input,
          ...(active ? activeInput : null),
        }}
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder || label}
        autoComplete="off"
      />
    </label>
  );
}

const page: CSSProperties = {
  ...positivePage,
  minHeight: "100vh",
  padding: "32px",
  color: positiveText,
};

const card: CSSProperties = {
  ...positiveHeroCard,
  borderRadius: 28,
  padding: 34,
  marginBottom: 28,
};

const dashboardBtn: CSSProperties = {
  position: "absolute",
  top: 30,
  right: 30,
  ...paleButton,
  padding: "14px 22px",
  fontSize: 15,
  zIndex: 10,
};

const title: CSSProperties = {
  fontSize: 42,
  fontWeight: 950,
  margin: 0,
  color: positiveHeading,
};

const subTitle: CSSProperties = {
  color: positiveMuted,
  marginTop: 10,
  marginBottom: 0,
  maxWidth: 680,
};

const noticeBox: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 14,
  fontWeight: 800,
  marginBottom: 20,
  border: "1px solid transparent",
};

const successNotice: CSSProperties = {
  background: "rgba(34,197,94,0.15)",
  borderColor: "rgba(34,197,94,0.35)",
  color: "#166534",
};

const errorNotice: CSSProperties = {
  background: "rgba(239,68,68,0.15)",
  borderColor: "rgba(239,68,68,0.35)",
  color: "#991b1b",
};

const fieldWrap: CSSProperties = {
  display: "grid",
  gap: 8,
};

const labelStyle: CSSProperties = {
  fontWeight: 900,
  color: positiveMuted,
};

const input: CSSProperties = {
  ...positiveInputStrong,
  height: 56,
  borderRadius: 14,
  padding: "0 16px",
  fontWeight: 800,
  outline: "none",
};

const activeInput: CSSProperties = {
  border: "1px solid #facc15",
  boxShadow: "0 0 0 3px rgba(250, 204, 21, 0.18)",
};

const barcodeBtn: CSSProperties = {
  border: "1px solid rgba(250,204,21,0.35)",
  borderRadius: 14,
  background: "linear-gradient(135deg, #facc15, #eab308)",
  color: "#111827",
  padding: "14px 18px",
  fontWeight: 950,
  cursor: "pointer",
};

const importBtn: CSSProperties = {
  ...successButton,
  padding: "14px 18px",
};

const sampleBtn: CSSProperties = {
  ...paleButton,
  padding: "14px 18px",
};

const printBtn: CSSProperties = {
  border: "1px solid rgba(251,191,36,0.28)",
  borderRadius: 14,
  background: "#fff7d6",
  color: "#7c5b00",
  padding: "14px 18px",
  fontWeight: 950,
  cursor: "pointer",
};

const saveBtn: CSSProperties = {
  ...successButton,
  padding: 18,
};

const clearBtn: CSSProperties = {
  ...paleButton,
  padding: 18,
};

const tableCard: CSSProperties = {
  ...positiveHeroCard,
  borderRadius: 28,
  padding: 34,
};

const tableTitle: CSSProperties = {
  fontSize: 30,
  fontWeight: 950,
  margin: 0,
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 980,
};

const thead: CSSProperties = {
  ...positiveTableHead,
};

const th: CSSProperties = {
  padding: 16,
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tr: CSSProperties = {
  borderBottom: "1px solid rgba(184,134,11,0.16)",
};

const td: CSSProperties = {
  padding: 16,
  whiteSpace: "nowrap",
};

const emptyTd: CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: positiveMuted,
  fontWeight: 700,
};

const editBtn: CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 900,
  marginRight: 8,
  cursor: "pointer",
};

const deleteBtn: CSSProperties = {
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 900,
  cursor: "pointer",
};
