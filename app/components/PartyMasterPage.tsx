"use client";

import AppShell from "./AppShell";
import { useEffect, useMemo, useRef, useState } from "react";
import { useResponsive } from "./useResponsive";
import { handleEnterAdvance } from "./useEnterAdvance";
import {
  dangerButton,
  infoButton,
  paleButton,
  positiveHeading,
  positiveHeroCard,
  positiveInput,
  positiveMuted,
  positivePage,
  positivePanel,
  positiveTableHead,
  positiveText,
  successButton,
} from "./positiveTheme";
import {
  asExcelText,
  downloadExcelTemplate,
  getExcelValue,
  readExcelRows,
} from "./excelUtils";

type Party = {
  id: number;
  name: string;
  gstNo: string;
  phone: string;
  address: string;
  state: string;
  pincode: string;
  remarks: string;
  dueDays: string;
};

type Notice = {
  tone: "success" | "error";
  text: string;
};

const sortPartyRows = (rows: Party[]) =>
  [...rows].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), undefined, {
      sensitivity: "base",
    }),
  );

const toPositiveNumberText = (value: unknown, fallback: string) => {
  const text = String(value ?? "").trim();
  if (!text) return fallback;

  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;

  return String(parsed);
};

const templateRows = [
  {
    "Party Name": "PRATIK MEHTA",
    "GST Number": "24AAACR5055K1ZD",
    Phone: "6235417894",
    State: "Gujarat",
    Pincode: "563241",
    "Due Days": 15,
    Remarks: "Preferred party",
    Address: "Gujarat, India",
  },
];

export default function PartyMasterPage({
  MASTER_TYPE,
}: {
  MASTER_TYPE: "supplier" | "buyer";
}) {
  const { isMobile, isTablet } = useResponsive();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const storageKey =
    MASTER_TYPE === "supplier" ? "supplierMaster" : "buyerMaster";
  const title = MASTER_TYPE === "supplier" ? "Supplier Master" : "Buyer Master";
  const defaultDueDays = MASTER_TYPE === "supplier" ? "30" : "15";

  const createEmptyForm = (): Party => ({
    id: 0,
    name: "",
    gstNo: "",
    phone: "",
    address: "",
    state: "",
    pincode: "",
    remarks: "",
    dueDays: defaultDueDays,
  });

  const normalizeParty = (raw: any): Party => ({
    id: Number(raw?.id || Date.now()),
    name: asExcelText(raw?.name || raw?.partyName),
    gstNo: asExcelText(raw?.gstNo || raw?.gstNumber).toUpperCase(),
    phone: asExcelText(raw?.phone),
    address: asExcelText(raw?.address),
    state: asExcelText(raw?.state),
    pincode: asExcelText(raw?.pincode),
    remarks: asExcelText(raw?.remarks),
    dueDays: toPositiveNumberText(raw?.dueDays ?? raw?.creditDays, defaultDueDays),
  });

  const toStorageParty = (party: Party) => ({
    ...party,
    name: party.name.trim(),
    partyName: party.name.trim(),
    gstNo: party.gstNo.trim().toUpperCase(),
    gstNumber: party.gstNo.trim().toUpperCase(),
    dueDays: toPositiveNumberText(party.dueDays, defaultDueDays),
    creditDays: toPositiveNumberText(party.dueDays, defaultDueDays),
  });

  const [rows, setRows] = useState<Party[]>([]);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState<Party>(createEmptyForm);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    const saved = localStorage.getItem(storageKey);
    const parsed = saved ? JSON.parse(saved) : [];
    const normalized = Array.isArray(parsed)
      ? sortPartyRows(parsed.map(normalizeParty))
      : [];
    setRows(normalized);
  };

  const saveStorage = (data: Party[]) => {
    const sortedData = sortPartyRows(data).map((party) =>
      normalizeParty({
        ...party,
        dueDays: toPositiveNumberText(party.dueDays, defaultDueDays),
      }),
    );

    setRows(sortedData);
    localStorage.setItem(
      storageKey,
      JSON.stringify(sortedData.map(toStorageParty)),
    );
  };

  const clear = () => {
    setForm(createEmptyForm());
  };

  const save = () => {
    const cleanForm = normalizeParty(form);

    if (!cleanForm.name.trim()) {
      alert("Party name required");
      return;
    }

    const duplicate = rows.find(
      (r) =>
        r.gstNo &&
        cleanForm.gstNo &&
        r.gstNo.toLowerCase() === cleanForm.gstNo.toLowerCase() &&
        r.id !== cleanForm.id,
    );

    if (duplicate) {
      alert("This GST number already exists");
      return;
    }

    if (cleanForm.id) {
      const updated = rows.map((r) => (r.id === cleanForm.id ? cleanForm : r));
      saveStorage(updated);
      setNotice({
        tone: "success",
        text: `${cleanForm.name} updated with ${cleanForm.dueDays} due day(s).`,
      });
    } else {
      saveStorage([{ ...cleanForm, id: Date.now() }, ...rows]);
      setNotice({
        tone: "success",
        text: `${cleanForm.name} saved with ${cleanForm.dueDays} due day(s).`,
      });
    }

    clear();
  };

  const edit = (row: Party) => {
    setForm(normalizeParty(row));
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = (id: number) => {
    if (!confirm("Delete this party?")) return;
    saveStorage(rows.filter((r) => r.id !== id));
    setNotice({
      tone: "success",
      text: "Party removed successfully.",
    });
  };

  const downloadTemplate = () => {
    downloadExcelTemplate(
      `${title.replace(/\s+/g, "_")}_Sample.xlsx`,
      MASTER_TYPE === "supplier" ? "Suppliers" : "Buyers",
      templateRows,
    );
  };

  const importExcel = async (file?: File) => {
    if (!file) return;

    try {
      const importedRows = await readExcelRows(file);

      const nextRows = [...rows];
      let importedCount = 0;

      importedRows.forEach((row, index) => {
        const mappedRow = normalizeParty({
          id: Date.now() + index,
          name: getExcelValue(row, ["Party Name", "Name", "Customer Name", "Supplier Name"]),
          gstNo: getExcelValue(row, ["GST Number", "GST No", "GSTIN", "GST"]),
          phone: getExcelValue(row, ["Phone", "Mobile", "Contact No"]),
          state: getExcelValue(row, ["State"]),
          pincode: getExcelValue(row, ["Pincode", "Pin Code"]),
          dueDays: getExcelValue(row, ["Due Days", "Credit Days", "Default Due Days"]),
          remarks: getExcelValue(row, ["Remarks", "Note"]),
          address: getExcelValue(row, ["Address"]),
        });

        if (!mappedRow.name) {
          return;
        }

        const existingIndex = nextRows.findIndex(
          (party) =>
            (party.gstNo &&
              mappedRow.gstNo &&
              party.gstNo.toLowerCase() === mappedRow.gstNo.toLowerCase()) ||
            party.name.toLowerCase() === mappedRow.name.toLowerCase(),
        );

        if (existingIndex >= 0) {
          nextRows[existingIndex] = {
            ...nextRows[existingIndex],
            ...mappedRow,
            id: nextRows[existingIndex].id,
          };
        } else {
          nextRows.unshift(mappedRow);
        }

        importedCount += 1;
      });

      if (!importedCount) {
        throw new Error("No valid rows found in the Excel file.");
      }

      saveStorage(nextRows);
      clear();
      setNotice({
        tone: "success",
        text: `Imported ${importedCount} party row(s) into ${title}.`,
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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return rows.filter((r) => {
      const name = String(r.name || "").toLowerCase();
      const gstNo = String(r.gstNo || "").toLowerCase();
      const phone = String(r.phone || "").toLowerCase();
      const state = String(r.state || "").toLowerCase();
      const dueDays = String(r.dueDays || "").toLowerCase();

      return (
        name.includes(q) ||
        gstNo.includes(q) ||
        phone.includes(q) ||
        state.includes(q) ||
        dueDays.includes(q)
      );
    });
  }, [rows, search]);

  const heroActionWrapStyle = {
    ...heroActionWrap,
    flexDirection: isMobile ? ("column" as const) : ("row" as const),
    width: isMobile ? "100%" : "auto",
  };

  const actionBtnStyle = {
    ...heroActionBtn,
    width: isMobile ? "100%" : "auto",
  };

  return (
    <AppShell>
      <main style={{ ...page, padding: isMobile ? 14 : isTablet ? 18 : 24 }}>
        <section style={{ ...hero, padding: isMobile ? 24 : 36 }}>
          <div>
            <h1 style={{ ...titleStyle, fontSize: isMobile ? 34 : 42 }}>{title}</h1>
            <p style={sub}>
              Save GST number, name, address and default due days once.
            </p>
          </div>

          <div style={heroActionWrapStyle}>
            <button
              type="button"
              style={actionBtnStyle}
              onClick={() => fileInputRef.current?.click()}
            >
              Import Excel
            </button>
            <button type="button" style={sampleBtn} onClick={downloadTemplate}>
              Sample Format
            </button>
          </div>
        </section>

        <section style={{ ...formatCard, padding: isMobile ? 18 : 22 }}>
          <div style={formatTitle}>Excel Column Order</div>
          <div style={formatText}>
            Party Name | GST Number | Phone | State | Pincode | Due Days | Remarks | Address
          </div>
          <div style={formatHint}>
            Download the sample file and keep the same column names for quick import.
          </div>
        </section>

        {notice ? (
          <section
            style={{
              ...noticeBox,
              ...(notice.tone === "success" ? successNotice : errorNotice),
            }}
          >
            {notice.text}
          </section>
        ) : null}

        <section
          style={{ ...card, padding: isMobile ? 18 : 28 }}
          onKeyDown={handleEnterAdvance}
        >
          <h2 style={sectionTitle}>Add / Edit {title}</h2>

          <div
            style={{
              ...grid,
              gridTemplateColumns: isMobile
                ? "1fr"
                : isTablet
                  ? "repeat(2,minmax(0,1fr))"
                  : "repeat(4,minmax(0,1fr))",
            }}
          >
            <input
              style={input}
              placeholder="Party Name"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              style={input}
              placeholder="GST Number"
              value={form.gstNo || ""}
              onChange={(e) =>
                setForm({ ...form, gstNo: e.target.value.toUpperCase() })
              }
            />
            <input
              style={input}
              placeholder="Phone"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              style={input}
              type="number"
              min="0"
              placeholder="Due Days"
              value={form.dueDays || ""}
              onChange={(e) => setForm({ ...form, dueDays: e.target.value })}
            />
            <input
              style={input}
              placeholder="State"
              value={form.state || ""}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
            <input
              style={input}
              placeholder="Pincode"
              value={form.pincode || ""}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
            />
            <input
              style={input}
              placeholder="Remarks"
              value={form.remarks || ""}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>

          <textarea
            style={textarea}
            placeholder="Address"
            value={form.address || ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <div style={btnRow}>
            <button style={saveBtn} onClick={save}>
              Save
            </button>
            <button
              style={clearBtn}
              onClick={() => {
                setNotice(null);
                clear();
              }}
            >
              Clear
            </button>
          </div>
        </section>

        <section style={{ ...card, padding: isMobile ? 18 : 28 }}>
          <div
            style={{
              ...topRow,
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
            }}
          >
            <h2 style={sectionTitle}>{title} List</h2>
            <input
              style={{
                ...searchBox,
                width: isMobile ? "100%" : isTablet ? 280 : 360,
              }}
              placeholder="Search name / GST / phone / state / due"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr style={thead}>
                  <th style={th}>Name</th>
                  <th style={th}>GST No</th>
                  <th style={th}>Phone</th>
                  <th style={th}>State</th>
                  <th style={th}>Pincode</th>
                  <th style={th}>Due Days</th>
                  <th style={th}>Remarks</th>
                  <th style={th}>Address</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={9}>
                      No records found
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} style={tr}>
                      <td style={td}>{r.name}</td>
                      <td style={td}>{r.gstNo || "-"}</td>
                      <td style={td}>{r.phone || "-"}</td>
                      <td style={td}>{r.state || "-"}</td>
                      <td style={td}>{r.pincode || "-"}</td>
                      <td style={td}>{r.dueDays || "0"}</td>
                      <td style={td}>{r.remarks || "-"}</td>
                      <td style={td}>{r.address || "-"}</td>
                      <td style={td}>
                        <button style={editBtn} onClick={() => edit(r)}>
                          Edit
                        </button>{" "}
                        <button style={deleteBtn} onClick={() => remove(r.id)}>
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

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          onChange={(e) => void importExcel(e.target.files?.[0])}
        />
      </main>
    </AppShell>
  );
}

const page: React.CSSProperties = {
  ...positivePage,
  padding: 24,
  color: positiveText,
};

const hero: React.CSSProperties = {
  ...positiveHeroCard,
  borderRadius: 24,
  padding: 36,
  marginBottom: 24,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 42,
  fontWeight: 950,
  color: positiveHeading,
};

const sub: React.CSSProperties = {
  color: positiveMuted,
  fontWeight: 700,
};

const heroActionWrap: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "stretch",
};

const heroActionBtn: React.CSSProperties = {
  ...successButton,
  padding: "14px 20px",
};

const sampleBtn: React.CSSProperties = {
  ...paleButton,
  padding: "14px 20px",
};

const formatCard: React.CSSProperties = {
  ...positivePanel,
  borderRadius: 20,
  padding: 22,
  marginBottom: 20,
};

const formatTitle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 950,
  color: positiveHeading,
  marginBottom: 8,
};

const formatText: React.CSSProperties = {
  color: positiveText,
  fontWeight: 800,
  lineHeight: 1.7,
  wordBreak: "break-word",
};

const formatHint: React.CSSProperties = {
  color: positiveMuted,
  fontWeight: 700,
  marginTop: 8,
};

const noticeBox: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 14,
  fontWeight: 800,
  marginBottom: 20,
  border: "1px solid transparent",
};

const successNotice: React.CSSProperties = {
  background: "rgba(34,197,94,0.15)",
  borderColor: "rgba(34,197,94,0.35)",
  color: "#166534",
};

const errorNotice: React.CSSProperties = {
  background: "rgba(239,68,68,0.15)",
  borderColor: "rgba(239,68,68,0.35)",
  color: "#991b1b",
};

const card: React.CSSProperties = {
  ...positivePanel,
  borderRadius: 24,
  padding: 28,
  marginBottom: 24,
};

const sectionTitle: React.CSSProperties = {
  marginTop: 0,
  fontSize: 28,
  fontWeight: 950,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4,1fr)",
  gap: 16,
};

const input: React.CSSProperties = {
  ...positiveInput,
  height: 52,
  borderRadius: 12,
  padding: "0 14px",
  fontWeight: 800,
};

const textarea: React.CSSProperties = {
  ...input,
  width: "100%",
  height: 90,
  marginTop: 16,
  paddingTop: 14,
};

const btnRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  marginTop: 18,
};

const saveBtn: React.CSSProperties = {
  ...successButton,
  padding: 16,
};

const clearBtn: React.CSSProperties = {
  ...paleButton,
  padding: 16,
};

const topRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
};

const searchBox: React.CSSProperties = {
  ...input,
  width: 360,
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1300,
};

const thead: React.CSSProperties = positiveTableHead;

const th: React.CSSProperties = {
  padding: 14,
  textAlign: "left",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const tr: React.CSSProperties = {
  borderBottom: "1px solid rgba(184,134,11,0.16)",
};

const td: React.CSSProperties = {
  padding: 14,
  fontWeight: 700,
  verticalAlign: "top",
};

const editBtn: React.CSSProperties = {
  ...infoButton,
  borderRadius: 8,
  padding: "8px 12px",
};

const deleteBtn: React.CSSProperties = {
  ...dangerButton,
  borderRadius: 8,
  padding: "8px 12px",
};
