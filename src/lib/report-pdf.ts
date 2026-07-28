import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AuditRow, ReportRow, SurveyRecord } from "./seismic";

const INK = "#12181f";
const OCHRE = "#c98a2e";

function val(v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

export function buildProjectReport(
  rec: SurveyRecord,
  reports: ReportRow[],
  audit: AuditRow[],
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const name = rec.projects?.project_name ?? `Project ${rec.project_id}`;

  doc.setFillColor(INK);
  doc.rect(0, 0, W, 92, "F");
  doc.setTextColor("#f4efe6");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SEISMIC DATA PROCESSING", 40, 40);
  doc.setFontSize(9);
  doc.setTextColor(OCHRE);
  doc.setFont("courier", "normal");
  doc.text("GEOPIC · PROJECT DOSSIER + BASIN AUDIT TRAIL", 40, 58);
  doc.setTextColor("#c9d1d9");
  doc.text(`GENERATED ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`, 40, 74);

  doc.setTextColor(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const title = doc.splitTextToSize(name, W - 80) as string[];
  doc.text(title, 40, 122);

  const startY = 122 + title.length * 16 + 8;

  autoTable(doc, {
    startY,
    head: [["Entity", "Details"]],
    body: [
      ["Project Year", val(rec.project_year)],
      ["Project Name", val(name)],
      ["Investigation Details (SIG)", val(rec.si_code)],
      ["Data Type (2D/3D/4D)", val(rec.projects?.data_dimension)],
      ["Type of Processing", val(rec.type_of_processing)],
      ["Basin", val(rec.projects?.basin)],
      ["Project Type", val(rec.projects?.project_type)],
      ["Planned Area (LKM/SKM)", val(rec.quantum_skm)],
      ["Planned Area (Eq. SLKM)", val(rec.quantum_slkm)],
      ["Processed Area (LKM/SKM)", val(rec.quantum_skm)],
      ["Processed Area (Eq. SLKM)", val(rec.quantum_slkm)],
      ["Processing Bin Details", val(rec.processing_bin)],
      ["Record Length", val(rec.record_length)],
      ["Sampling Interval", val(rec.sampling_interval)],
      ["Fold", val(rec.fold)],
      ["Spheroid / Projection", `${val(rec.spheroid)} · ${val(rec.projection)}`],
      ["UTM Zone", val(rec.utm_zone)],
      ["Azimuth", val(rec.azimuth)],
      ["Planned Timeline", val(rec.project_timeline)],
      ["Actual Timeline", val(rec.project_timeline)],
      ["Geometry Status", val(rec.geometry_status)],
      ["Mapped on India Extent", rec.is_mapped ? "Yes" : "No"],
    ],
    theme: "grid",
    headStyles: { fillColor: INK, textColor: "#f4efe6", fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 170, fontStyle: "bold" } },
  });

  const cornerBody = (rec.corners ?? []).map((c) => [
    `G${val(c.corner)}`,
    val(c.easting),
    val(c.northing),
    val(c.il),
    val(c.xl),
    c.lat != null ? c.lat.toFixed(5) : "—",
    c.lon != null ? c.lon.toFixed(5) : "—",
    c.is_assumed ? "assumed" : "surveyed",
  ]);

  autoTable(doc, {
    head: [["Corner", "Easting", "Northing", "IL", "XL", "Lat", "Lon", "Source"]],
    body: cornerBody.length ? cornerBody : [["—", "—", "—", "—", "—", "—", "—", "—"]],
    theme: "striped",
    headStyles: { fillColor: "#2b3a45", textColor: "#f4efe6" },
    styles: { fontSize: 8, cellPadding: 3 },
  });

  const notes = rec.geometry_notes ?? [];
  autoTable(doc, {
    head: [["Cartographic notes"]],
    body: notes.length
      ? notes.map((n) => [n])
      : [["Footprint drawn as surveyed; no adjustment required."]],
    theme: "plain",
    headStyles: { fillColor: OCHRE, textColor: INK, fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 4, textColor: "#33414c" },
  });

  const linked = reports.filter((r) => r.project_id === rec.project_id);
  autoTable(doc, {
    head: [["Linked report", "Type", "Path"]],
    body: linked.length
      ? linked.map((r) => [val(r.file_name), val(r.report_type), val(r.report_path)])
      : [["No report on file", "—", "—"]],
    theme: "grid",
    headStyles: { fillColor: "#2b3a45", textColor: "#f4efe6" },
    styles: { fontSize: 7.5, cellPadding: 3, overflow: "linebreak" },
  });

  doc.addPage();
  doc.setFillColor(INK);
  doc.rect(0, 0, W, 56, "F");
  doc.setTextColor("#f4efe6");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`BASIN AUDIT LOG · ${val(rec.projects?.basin)}`, 40, 35);

  autoTable(doc, {
    startY: 76,
    head: [["Timestamp (UTC)", "Action", "Project", "SIG", "Session", "Details"]],
    body: audit.length
      ? audit
          .slice(0, 60)
          .map((a) => [
            a.created_at.replace("T", " ").slice(0, 19),
            a.action,
            val(a.project_id),
            val(a.si_code),
            val(a.user_session),
            JSON.stringify(a.details).slice(0, 90),
          ])
      : [["—", "No audit entries for this basin", "—", "—", "—", "—"]],
    theme: "grid",
    headStyles: { fillColor: INK, textColor: "#f4efe6" },
    styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
  });

  const safe = name.replace(/[^a-z0-9]+/gi, "-").slice(0, 60).toLowerCase();
  doc.save(`seismic-dossier-${safe || rec.project_id}.pdf`);
}
