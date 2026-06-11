"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { handleEnterAdvance } from "./useEnterAdvance";
import { API_BASE_URL } from "../lib/api";

const API = API_BASE_URL;

type PageType = "sales" | "purchase" | "purchase-return" | "sales-return";

type Props = {
  type: PageType;
};

export default function GstEntryPage({ type }: Props) {
  const router = useRouter();

  const config = {
    sales: {
      title: "GST Sales Entry",
      billTitle: "TAX INVOICE",
      subtitle: "Manual entry and Excel import",
      endpoint: "sales",
      nameLabel: "Party Name",
      saveText: "Save GST Sales Entry",
      tableTitle: "All GST Sales Entries",
      color: "#16a34a",
      invoicePlaceholder: "Invoice Number - leave blank for auto",
      returnMode: false,
    },
    purchase: {
      title: "GST Purchase Entry",
      billTitle: "PURCHASE VOUCHER",
      subtitle: "Manual entry and Excel import",
      endpoint: "purchase",
      nameLabel: "Supplier Name",
      saveText: "Save GST Purchase Entry",
      tableTitle: "All GST Purchase Entries",
      color: "#d97706",
      invoicePlaceholder: "Invoice Number - leave blank for auto",
      returnMode: false,
    },
    "purchase-return": {
      title: "Purchase Return Entry",
      billTitle: "DEBIT NOTE",
      subtitle: "Manual entry and Excel import",
      endpoint: "purchase-return",
      nameLabel: "Supplier Name",
      saveText: "Save Purchase Return Entry",
      tableTitle: "All Purchase Return Entries",
      color: "#2563eb",
      invoicePlaceholder: "Return Number",
      returnMode: true,
    },
    "sales-return": {
      title: "Sales Return Entry",
      billTitle: "CREDIT NOTE",
      subtitle: "Manual entry and Excel import",
      endpoint: "sales-return",
      nameLabel: "Party Name",
      saveText: "Save Sales Return Entry",
      tableTitle: "All Sales Return Entries",
      color: "#db2777",
      invoicePlaceholder: "Return Number",
      returnMode: true,
    },
  }[type];

  const [rows, setRows] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);

  const [form, setForm] = useState<any>({
    invoiceNo: "",
    returnNo: "",
    originalInvoiceNo: "",
    partyName: "",
    supplierName: "",
    itemName: "",
    quantity: "",
    rate: "",
    gstNo: "",
    gstRate: "",
    taxableAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalAmount: 0,
  });

  const endpoint = `${API}/${config.endpoint}`;

  useEffect(() => {
    fetchRows();
    fetchItems();
  }, [type]);

  useEffect(() => {
    autoCalculateGst();
  }, [form.quantity, form.rate, form.gstRate]);

  const fetchRows = async () => {
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API}/items`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
  };

  const getAvailableStock = () => {
    const item = items.find(
      (i) => i.itemName?.toLowerCase() === form.itemName?.toLowerCase()
    );
    return item ? Number(item.currentStock || 0) : 0;
  };

  const autoCalculateGst = () => {
    const qty = Number(form.quantity || 0);
    const rate = Number(form.rate || 0);
    const gstRate = Number(form.gstRate || 0);

    const taxable = qty * rate;
    const gstAmount = (taxable * gstRate) / 100;

    setForm((prev: any) => ({
      ...prev,
      taxableAmount: taxable,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      totalAmount: taxable + gstAmount,
    }));
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const clearForm = () => {
    setEditingId(null);
    setForm({
      invoiceNo: "",
      returnNo: "",
      originalInvoiceNo: "",
      partyName: "",
      supplierName: "",
      itemName: "",
      quantity: "",
      rate: "",
      gstNo: "",
      gstRate: "",
      taxableAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalAmount: 0,
    });
  };

  const buildPayload = () => {
    const common = {
      itemName: form.itemName,
      quantity: Number(form.quantity || 0),
      rate: Number(form.rate || 0),
      gstNo: form.gstNo || "B2C",
      gstRate: Number(form.gstRate || 0),
      taxableAmount: Number(form.taxableAmount || 0),
      cgst: Number(form.cgst || 0),
      sgst: Number(form.sgst || 0),
      igst: Number(form.igst || 0),
      totalAmount: Number(form.totalAmount || 0),
    };

    if (type === "purchase") {
      return { ...common, invoiceNo: form.invoiceNo || undefined, supplierName: form.supplierName };
    }

    if (type === "sales") {
      return { ...common, invoiceNo: form.invoiceNo || undefined, partyName: form.partyName };
    }

    if (type === "purchase-return") {
      return {
        ...common,
        returnNo: form.returnNo,
        originalInvoiceNo: form.originalInvoiceNo,
        supplierName: form.supplierName,
      };
    }

    return {
      ...common,
      returnNo: form.returnNo,
      originalInvoiceNo: form.originalInvoiceNo,
      partyName: form.partyName,
    };
  };

  const saveEntry = async () => {
    if (!form.itemName || !form.quantity || !form.rate) {
      alert("Item name, quantity and rate are required");
      return;
    }

    if ((type === "sales" || type === "purchase-return") && !editingId) {
      const availableStock = getAvailableStock();
      const enteredQty = Number(form.quantity || 0);

      if (availableStock <= 0) {
        alert(`Item "${form.itemName}" is out of stock.`);
        return;
      }

      if (enteredQty > availableStock) {
        alert(
          `Insufficient stock.\n\nItem: ${form.itemName}\nAvailable Stock: ${availableStock}\nEntered Quantity: ${enteredQty}`
        );
        return;
      }
    }

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${endpoint}/${editingId}` : endpoint;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Save failed");
        return;
      }

      alert(data.message || "Saved successfully");
      clearForm();
      fetchRows();
      fetchItems();
    } catch {
      alert("Server error");
    }
  };

  const editEntry = (row: any) => {
    setEditingId(row.id);
    setForm({
      invoiceNo: row.invoiceNo || "",
      returnNo: row.returnNo || "",
      originalInvoiceNo: row.originalInvoiceNo || "",
      partyName: row.partyName || "",
      supplierName: row.supplierName || "",
      itemName: row.itemName || "",
      quantity: row.quantity || "",
      rate: row.rate || "",
      gstNo: row.gstNo || "",
      gstRate: row.gstRate || "",
      taxableAmount: row.taxableAmount || 0,
      cgst: row.cgst || 0,
      sgst: row.sgst || 0,
      igst: row.igst || 0,
      totalAmount: row.totalAmount || 0,
    });
  };

  const deleteEntry = async (id: number) => {
    if (!confirm("Delete this entry?")) return;

    const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Delete failed");
      return;
    }

    alert(data.message || "Deleted");
    fetchRows();
    fetchItems();
  };

  const exportExcel = () => {
    const data = rows.map((r) => ({
      "Invoice No": r.invoiceNo || r.returnNo || "",
      "Original Invoice": r.originalInvoiceNo || "",
      "Party/Supplier": r.partyName || r.supplierName || "",
      Item: r.itemName || "",
      Quantity: r.quantity || 0,
      Rate: r.rate || 0,
      "GST No": r.gstNo || "B2C",
      Taxable: r.taxableAmount || 0,
      "GST %": r.gstRate || 0,
      CGST: r.cgst || 0,
      SGST: r.sgst || 0,
      IGST: r.igst || 0,
      Total: r.totalAmount || 0,
      "Created At": r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.title);
    XLSX.writeFile(wb, `${config.endpoint}.xlsx`);
  };

  const downloadTemplate = () => {
    const template = [
      {
        invoiceNo: "",
        returnNo: "",
        originalInvoiceNo: "",
        partyName: "",
        supplierName: "",
        itemName: "",
        quantity: "",
        rate: "",
        gstNo: "",
        gstRate: "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${config.endpoint}-template.xlsx`);
  };

  const importExcel = async () => {
    if (!excelFile) {
      alert("Please choose Excel file");
      return;
    }
    alert("Excel import will be improved in next phase.");
  };

  const money = (n: any) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const printInvoice = (row: any) => {
    const savedProfile = localStorage.getItem("companyProfile");
    const profile = savedProfile ? JSON.parse(savedProfile) : {};

    const companyName = profile.companyName || "SAMUEL PRAKASH";
    const gstNumber = profile.gstNumber || profile.gstNo || "";
    const phone = profile.phone || "";
    const address = profile.address || profile.placeOfBusiness || "";
    const logo = profile.photo || "/software-logo.png";

    const invoiceNo = row.invoiceNo || row.returnNo || "-";
    const partyName = row.partyName || row.supplierName || "-";
    const date = row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN");

    const html = `
      <html>
        <head>
          <title>${config.billTitle} - ${invoiceNo}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Cambria, Georgia, 'Times New Roman', serif; margin: 0; color: #111827; background: white; }
            .invoice { width: 210mm; min-height: 297mm; padding: 18mm; margin: auto; }
            .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #b8860b; padding-bottom: 14px; }
            .company { display: flex; gap: 14px; align-items: center; }
            .logo { width: 78px; height: 78px; border-radius: 50%; object-fit: cover; border: 2px solid #e5e7eb; }
            h1 { margin: 0; font-size: 26px; color: #6b4300; }
            .muted { color: #6b7280; font-size: 13px; margin-top: 5px; line-height: 1.5; }
            .bill-title { text-align: right; }
            .bill-title h2 { margin: 0; font-size: 24px; color: #111827; }
            .box-area { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 22px; }
            .box { border: 1px solid #d1d5db; border-radius: 10px; padding: 14px; min-height: 100px; }
            .box h3 { margin: 0 0 10px; font-size: 15px; color: #6b4300; }
            .line { font-size: 14px; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th { background: #6b4300; color: white; padding: 10px; font-size: 13px; text-align: left; border: 1px solid #6b4300; }
            td { padding: 10px; font-size: 13px; border: 1px solid #d1d5db; }
            .right { text-align: right; }
            .summary { width: 45%; margin-left: auto; margin-top: 22px; border: 1px solid #d1d5db; border-radius: 10px; overflow: hidden; }
            .summary-row { display: flex; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            .summary-row:last-child { border-bottom: none; background: #fff7d6; font-weight: 800; font-size: 16px; }
            .footer { margin-top: 45px; display: flex; justify-content: space-between; align-items: flex-end; }
            .terms { font-size: 12px; color: #4b5563; line-height: 1.6; width: 55%; }
            .sign { text-align: center; width: 220px; border-top: 1px solid #111827; padding-top: 8px; font-weight: 700; }
            .actions { text-align: center; padding: 15px; }
            .btn { background: #16a34a; color: white; border: none; padding: 12px 22px; border-radius: 8px; font-weight: 700; cursor: pointer; margin: 5px; }
            @media print {
              .actions { display: none; }
              body { margin: 0; }
              .invoice { margin: 0; width: auto; min-height: auto; }
            }
          </style>
        </head>
        <body>
          <div class="actions">
            <button class="btn" onclick="window.print()">Print / Save PDF</button>
            <button class="btn" onclick="window.close()" style="background:#334155">Close</button>
          </div>

          <div class="invoice">
            <div class="top">
              <div class="company">
                <img class="logo" src="${logo}" />
                <div>
                  <h1>${companyName}</h1>
                  <div class="muted">
                    ${address ? address + "<br/>" : ""}
                    ${gstNumber ? "GSTIN: " + gstNumber + "<br/>" : ""}
                    ${phone ? "Phone: " + phone : ""}
                  </div>
                </div>
              </div>

              <div class="bill-title">
                <h2>${config.billTitle}</h2>
                <div class="muted">
                  Invoice No: <b>${invoiceNo}</b><br/>
                  Date: <b>${date}</b>
                </div>
              </div>
            </div>

            <div class="box-area">
              <div class="box">
                <h3>Bill To / From</h3>
                <div class="line"><b>Name:</b> ${partyName}</div>
                <div class="line"><b>GST No:</b> ${row.gstNo || "B2C"}</div>
                ${row.originalInvoiceNo ? `<div class="line"><b>Original Invoice:</b> ${row.originalInvoiceNo}</div>` : ""}
              </div>

              <div class="box">
                <h3>Invoice Details</h3>
                <div class="line"><b>Invoice Type:</b> ${config.billTitle}</div>
                <div class="line"><b>Place of Supply:</b> Gujarat</div>
                <div class="line"><b>Reverse Charge:</b> No</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Sr</th>
                  <th>Item</th>
                  <th class="right">Qty</th>
                  <th class="right">Rate</th>
                  <th class="right">Taxable</th>
                  <th class="right">GST %</th>
                  <th class="right">CGST</th>
                  <th class="right">SGST</th>
                  <th class="right">IGST</th>
                  <th class="right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>${row.itemName || "-"}</td>
                  <td class="right">${row.quantity || 0}</td>
                  <td class="right">${money(row.rate)}</td>
                  <td class="right">${money(row.taxableAmount)}</td>
                  <td class="right">${row.gstRate || 0}%</td>
                  <td class="right">${money(row.cgst)}</td>
                  <td class="right">${money(row.sgst)}</td>
                  <td class="right">${money(row.igst)}</td>
                  <td class="right">${money(row.totalAmount)}</td>
                </tr>
              </tbody>
            </table>

            <div class="summary">
              <div class="summary-row"><span>Taxable Amount</span><b>${money(row.taxableAmount)}</b></div>
              <div class="summary-row"><span>CGST</span><b>${money(row.cgst)}</b></div>
              <div class="summary-row"><span>SGST</span><b>${money(row.sgst)}</b></div>
              <div class="summary-row"><span>IGST</span><b>${money(row.igst)}</b></div>
              <div class="summary-row"><span>Grand Total</span><b>${money(row.totalAmount)}</b></div>
            </div>

            <div class="footer">
              <div class="terms">
                <b>Terms & Conditions</b><br/>
                1. Goods once sold will not be taken back unless agreed.<br/>
                2. Subject to local jurisdiction.<br/>
                3. This is a computer generated invoice.
              </div>
              <div class="sign">
                Authorised Signature
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1000,height=800");
    if (!printWindow) {
      alert("Popup blocked. Please allow popups.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const tableRows = useMemo(() => rows, [rows]);
  const availableStock = getAvailableStock();

  return (
    <main style={page}>
      <section style={formCard} onKeyDown={handleEnterAdvance}>
        <div style={topBar}>
          <div>
            <h1 style={title}>{config.title}</h1>
            <p style={subtitle}>{config.subtitle}</p>
          </div>

          <div style={topActions}>
            <button onClick={exportExcel} style={greenBtn}>Export Excel</button>
            <button onClick={downloadTemplate} style={purpleBtn}>Download Excel Template</button>
            <button onClick={() => router.push("/dashboard")} style={darkBtn}>Back to Dashboard</button>
          </div>
        </div>

        <div style={importRow}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
            style={fileInput}
          />
          <button onClick={importExcel} style={importBtn}>Import Excel</button>
        </div>

        {(type === "sales" || type === "purchase-return") && form.itemName && (
          <div style={stockAlert}>
            Available Stock for <b>{form.itemName}</b>:{" "}
            <b style={{ color: availableStock > 0 ? "#22c55e" : "#ef4444" }}>
              {availableStock}
            </b>
          </div>
        )}

        <div style={grid}>
          <input
            placeholder={config.invoicePlaceholder}
            value={config.returnMode ? form.returnNo : form.invoiceNo}
            onChange={(e) =>
              config.returnMode
                ? handleChange("returnNo", e.target.value)
                : handleChange("invoiceNo", e.target.value)
            }
            style={input}
          />

          {config.returnMode && (
            <input
              placeholder="Original Invoice Number"
              value={form.originalInvoiceNo}
              onChange={(e) => handleChange("originalInvoiceNo", e.target.value)}
              style={input}
            />
          )}

          <input
            placeholder={config.nameLabel}
            value={type === "purchase" || type === "purchase-return" ? form.supplierName : form.partyName}
            onChange={(e) =>
              type === "purchase" || type === "purchase-return"
                ? handleChange("supplierName", e.target.value)
                : handleChange("partyName", e.target.value)
            }
            style={input}
          />

          <input
            list="item-list"
            placeholder="Item Name"
            value={form.itemName}
            onChange={(e) => handleChange("itemName", e.target.value)}
            style={input}
          />

          <datalist id="item-list">
            {items.map((item) => (
              <option key={item.id} value={item.itemName} />
            ))}
          </datalist>

          <input placeholder="GST Number optional - blank for B2C" value={form.gstNo} onChange={(e) => handleChange("gstNo", e.target.value)} style={input} />
          <input placeholder="Quantity" value={form.quantity} onChange={(e) => handleChange("quantity", e.target.value)} style={input} />
          <input placeholder="Rate" value={form.rate} onChange={(e) => handleChange("rate", e.target.value)} style={input} />
          <input placeholder="GST Rate %" value={form.gstRate} onChange={(e) => handleChange("gstRate", e.target.value)} style={input} />

          <input readOnly value={form.taxableAmount} style={readonlyInput} />
          <input readOnly value={form.cgst} style={readonlyInput} />
          <input readOnly value={form.sgst} style={readonlyInput} />
          <input readOnly value={form.igst} style={readonlyInput} />
          <input readOnly value={form.totalAmount} style={readonlyInput} />
        </div>

        <div style={buttonRow}>
          <button onClick={saveEntry} style={{ ...saveBtn, background: config.color }}>
            {editingId ? "Update Entry" : config.saveText}
          </button>
          <button onClick={clearForm} style={clearBtn}>Clear</button>
        </div>
      </section>

      <section style={tableCard}>
        <h2 style={tableTitle}>{config.tableTitle}</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr style={thead}>
                <th style={th}>Invoice No</th>
                <th style={th}>Original Invoice</th>
                <th style={th}>Party/Supplier</th>
                <th style={th}>Item</th>
                <th style={th}>Qty</th>
                <th style={th}>Rate</th>
                <th style={th}>GST No</th>
                <th style={th}>Taxable</th>
                <th style={th}>GST %</th>
                <th style={th}>CGST</th>
                <th style={th}>SGST</th>
                <th style={th}>IGST</th>
                <th style={th}>Total</th>
                <th style={th}>Created At</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={15} style={empty}>No records found</td>
                </tr>
              ) : (
                tableRows.map((r) => (
                  <tr key={r.id} style={tr}>
                    <td style={td}>{r.invoiceNo || r.returnNo || "-"}</td>
                    <td style={td}>{r.originalInvoiceNo || "-"}</td>
                    <td style={td}>{r.partyName || r.supplierName || "-"}</td>
                    <td style={td}>{r.itemName}</td>
                    <td style={td}>{r.quantity}</td>
                    <td style={td}>{money(r.rate)}</td>
                    <td style={td}>{r.gstNo || "B2C"}</td>
                    <td style={td}>{money(r.taxableAmount)}</td>
                    <td style={td}>{r.gstRate}%</td>
                    <td style={td}>{money(r.cgst)}</td>
                    <td style={td}>{money(r.sgst)}</td>
                    <td style={td}>{money(r.igst)}</td>
                    <td style={td}>{money(r.totalAmount)}</td>
                    <td style={td}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
                    <td style={td}>
                      <button onClick={() => printInvoice(r)} style={printBtn}>Print / PDF</button>
                      <button onClick={() => editEntry(r)} style={editBtn}>Edit</button>
                      <button onClick={() => deleteEntry(r.id)} style={deleteBtn}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  padding: "30px",
  background: "linear-gradient(135deg,#0f172a,#111827,#1e293b)",
  color: "white",
};

const formCard: React.CSSProperties = {
  maxWidth: "1250px",
  margin: "0 auto 26px",
  padding: "30px",
  borderRadius: "24px",
  background: "linear-gradient(135deg,#1f2937,#2d3748)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const topBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "22px",
};

const title: React.CSSProperties = { margin: 0, fontSize: "22px", fontWeight: 900 };
const subtitle: React.CSSProperties = { marginTop: "8px", color: "#b6c2d9" };
const topActions: React.CSSProperties = { display: "flex", gap: "12px", flexWrap: "wrap" };

const greenBtn: React.CSSProperties = {
  border: "none", borderRadius: "12px", padding: "14px 20px",
  background: "#4f9f69", color: "white", fontWeight: 900, cursor: "pointer",
};

const purpleBtn: React.CSSProperties = {
  border: "none", borderRadius: "12px", padding: "14px 20px",
  background: "#7c3aed", color: "white", fontWeight: 900, cursor: "pointer",
};

const darkBtn: React.CSSProperties = {
  border: "none", borderRadius: "12px", padding: "14px 20px",
  background: "#334155", color: "white", fontWeight: 900, cursor: "pointer",
};

const importRow: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 120px", gap: "14px", marginBottom: "18px",
};

const fileInput: React.CSSProperties = {
  background: "#111827", color: "white", padding: "18px",
  borderRadius: "12px", border: "1px solid #374151",
};

const importBtn: React.CSSProperties = {
  border: "none", borderRadius: "12px", background: "#4f9f69",
  color: "white", fontWeight: 900, cursor: "pointer",
};

const stockAlert: React.CSSProperties = {
  marginBottom: "18px", padding: "14px 18px", borderRadius: "12px",
  background: "#111827", border: "1px solid #374151", color: "#e5e7eb", fontWeight: 700,
};

const grid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px",
};

const input: React.CSSProperties = {
  background: "#111827", color: "white", padding: "17px",
  borderRadius: "12px", border: "1px solid #374151", fontSize: "15px", outline: "none",
};

const readonlyInput: React.CSSProperties = { ...input, background: "#1f2937" };

const buttonRow: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "18px",
};

const saveBtn: React.CSSProperties = {
  border: "none", borderRadius: "12px", color: "white",
  padding: "17px", fontWeight: 900, cursor: "pointer",
};

const clearBtn: React.CSSProperties = {
  border: "none", borderRadius: "12px", background: "#718096",
  color: "white", padding: "17px", fontWeight: 900, cursor: "pointer",
};

const tableCard: React.CSSProperties = {
  maxWidth: "1250px", margin: "0 auto", padding: "30px",
  borderRadius: "24px", background: "linear-gradient(135deg,#1f2937,#2d3748)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const tableTitle: React.CSSProperties = { marginTop: 0, fontSize: "20px" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", minWidth: "1500px" };
const thead: React.CSSProperties = { background: "#4b5563" };
const th: React.CSSProperties = { padding: "14px", textAlign: "left", fontSize: "14px" };
const tr: React.CSSProperties = { borderBottom: "1px solid rgba(255,255,255,0.08)" };
const td: React.CSSProperties = { padding: "14px", fontSize: "14px" };
const empty: React.CSSProperties = { padding: "20px", color: "#cbd5e1" };

const printBtn: React.CSSProperties = {
  marginRight: "8px", background: "#16a34a", color: "white",
  border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer",
};

const editBtn: React.CSSProperties = {
  marginRight: "8px", background: "#2563eb", color: "white",
  border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer",
};

const deleteBtn: React.CSSProperties = {
  background: "#dc2626", color: "white",
  border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer",
};
