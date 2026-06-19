import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getTipoHarina } from "./data";

function buildRows(blocks) {
  const rows = [];
  blocks.forEach((b) => {
    if (b.secciones.length === 0) {
      rows.push({
        Bloque: `#${b.id}`,
        Harina: "—",
        "Big Bags": 0,
        Tarimas: 0,
        Toneladas: 0,
        Lote: "—",
        Actualizado: "—",
      });
      return;
    }
    b.secciones.forEach((s) => {
      const tipo = getTipoHarina(s.harina);
      const ton = (Number(s.bigBags || 0) * tipo.kgPorBigBag) / 1000;
      rows.push({
        Bloque: `#${b.id}`,
        Harina: s.harina,
        "Big Bags": s.bigBags,
        Tarimas: s.tarimas,
        Toneladas: ton.toFixed(1),
        Lote: s.lote || "—",
        Actualizado: s.actualizado,
      });
    });
  });
  return rows;
}

export function exportToExcel(blocks) {
  const rows = buildRows(blocks);
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 8 }, { wch: 28 }, { wch: 10 }, { wch: 10 }, { wch: 11 }, { wch: 16 }, { wch: 13 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventario");
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `inventario-bodega-${fecha}.xlsx`);
}

export function exportToPDF(blocks) {
  const rows = buildRows(blocks);
  const doc = new jsPDF();
  const fecha = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });

  doc.setFontSize(16);
  doc.setTextColor(26, 26, 26);
  doc.text("Aniprotein — Reporte de Inventario", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generado el ${fecha}`, 14, 25);

  const totalBigBags = rows.reduce((s, r) => s + Number(r["Big Bags"] || 0), 0);
  const totalTarimas = rows.reduce((s, r) => s + Number(r["Tarimas"] || 0), 0);
  const totalTon = rows.reduce((s, r) => s + Number(r["Toneladas"] || 0), 0);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Totales: ${totalBigBags} Big Bags · ${totalTarimas} Tarimas · ${totalTon.toFixed(1)} Toneladas`, 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [["Bloque", "Harina", "Big Bags", "Tarimas", "Toneladas", "Lote", "Actualizado"]],
    body: rows.map((r) => [r.Bloque, r.Harina, r["Big Bags"], r.Tarimas, r.Toneladas, r.Lote, r.Actualizado]),
    headStyles: { fillColor: [62, 180, 226], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [246, 248, 249] },
  });

  const fechaArchivo = new Date().toISOString().slice(0, 10);
  doc.save(`inventario-bodega-${fechaArchivo}.pdf`);
}
