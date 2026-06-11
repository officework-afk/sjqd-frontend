import * as XLSX from "xlsx";

const cleanKey = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

export const readExcelRows = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) return [];

  const sheet = workbook.Sheets[firstSheet];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
};

export const getExcelValue = (
  row: Record<string, unknown>,
  aliases: string[],
) => {
  const wanted = aliases.map(cleanKey);

  for (const [key, value] of Object.entries(row || {})) {
    if (wanted.includes(cleanKey(key))) {
      return value;
    }
  }

  return "";
};

export const asExcelText = (value: unknown) => String(value ?? "").trim();

export const asExcelNumber = (value: unknown) => {
  const cleaned = String(value ?? "").replace(/,/g, "").trim();
  const parsed = Number(cleaned || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const downloadExcelTemplate = (
  filename: string,
  sheetName: string,
  rows: Record<string, unknown>[],
) => {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  XLSX.writeFile(workbook, filename);
};
