import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { AuditRow, ReportRow, SurveyRecord } from "./seismic"

const INK = "#12181f"
const OCHRE = "#c98a2e"

export function buildProjectReport(rec: SurveyRecord, reports: ReportRow[], audit: AuditRow[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const safe = rec.projects?.project_name?.replace(/[^a-zA-Z0-9_\- ]/g, "").slice(0, 60)

  // Title header
  doc.setFillColor(INK)
  doc.rect(0, 0, doc.internal.pageSize.width, 100, "F")
  doc.setTextColor(OCHRE)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("GEOPIC · Seismic Dossier", 40, 44)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor("#efede8")
  doc.text(`${safe || `Project ${rec.project_id}`}  ·  ${rec.si_code ?? "—"}`, 40, 66)
  doc.setDrawColor(OCHRE)
  doc.setLineWidth(0.6)
  doc.line(40, 78, doc.internal.pageSize.width - 40, 78)

  // Project details
  const kv: Record<string, string> = {
    "Project ID": `${rec.project_id}`,
    "SI Code": rec.si_code ?? "—",
    "Project Name": rec.projects?.project_name ?? "—",
    "Basin": rec.projects?.basin ?? "—",
    "Project Type": rec.projects?.project_type ?? "—",
    "Data Dimension": rec.projects?.data_dimension ?? "—",
    "Year of Processing": rec.project_year ?? "—",
    "Type of Processing": rec.type_of_processing ?? "—",
    "Quantum (SKM)": rec.quantum_skm != null ? `${rec.quantum_skm}` : "—",
    "Quantum (SLKM)": rec.quantum_slkm != null ? `${rec.quantum_slkm}` : "—",
    "Processing Bin": rec.processing_bin ?? "—",
    "Record Length": rec.record_length ?? "—",
    "Sampling Interval": rec.sampling_interval ?? "—",
    "Fold": rec.fold ?? "—",
    "Azimuth": rec.azimuth ?? "—",
    "Spheroid": rec.spheroid ?? "—",
    "UTM Zone": rec.utm_zone ?? "—",
    "Projection": rec.projection ?? "—",
    "Timeline": rec.project_timeline ?? "—",
    "Geometry Status": rec.geometry_status ?? "—",
    "Mapped": rec.is_mapped ? "Yes" : "No",
    "Flagged": rec.flagged_for_review ? "Yes" : "No",
    "Centroid": rec.centroid_lat != null ? `${rec.centroid_lat.toFixed(4)}, ${rec.centroid_lon?.toFixed(4)}` : "—",
  }

  doc.setFontSize(9)
  doc.setTextColor("#12181f")
  const body = Object.entries(kv).map(([k, v]) => [k, v])
  autoTable(doc, {
    head: [["Attribute", "Value"]],
    body,
    startY: 120,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: INK, textColor: OCHRE, fontStyle: "bold" },
    alternateRowStyles: { fillColor: "#f4f3ef" },
  })

  // Corner geometry
  const corners = (rec.corners ?? []).map((c, i) => [
    `G${c.corner ?? i + 1}`,
    c.lat?.toFixed(4) ?? "—",
    c.lon?.toFixed(4) ?? "—",
    c.il != null ? `${c.il}` : "—",
    c.xl != null ? `${c.xl}` : "—",
    c.easting != null ? `${c.easting}` : "—",
    c.northing != null ? `${c.northing}` : "—",
    c.is_assumed ? "assumed" : "surveyed",
  ])
  if (corners.length) {
    autoTable(doc, {
      head: [["Corner", "Lat", "Lon", "IL", "XL", "Easting", "Northing", "Source"]],
      body: corners,
      startY: (doc as any).lastAutoTable.finalY + 14,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: INK, textColor: OCHRE, fontStyle: "bold" },
      alternateRowStyles: { fillColor: "#f4f3ef" },
    })
  }

  // Cartographic notes
  const notes = rec.geometry_notes ?? []
  if (notes.length) {
    const y = (doc as any).lastAutoTable.finalY + 16
    doc.setFontSize(8)
    doc.setTextColor(INK)
    doc.setFont("helvetica", "bold")
    doc.text("Cartographic notes", 40, y)
    doc.setFont("helvetica", "normal")
    notes.forEach((n, i) => doc.text(`  ${i + 1}. ${n}`, 40, y + 12 + i * 10))
  }

  // Linked reports
  const linked = reports.filter((r) => r.project_id === rec.project_id)
  if (linked.length) {
    const y = (doc as any).lastAutoTable.finalY + 16 + (notes.length ? notes.length * 10 + 6 : 0)
    doc.setFontSize(8)
    doc.setTextColor(INK)
    doc.setFont("helvetica", "bold")
    doc.text("Linked reports", 40, y)
    doc.setFont("helvetica", "normal")
    linked.forEach((r, i) => doc.text(`  ${i + 1}. ${r.file_name} (${r.report_type ?? "—"})`, 40, y + 12 + i * 10))
  }

  // Basin audit log
  const auditRows = audit.slice(0, 30).map((a) => [
    a.created_at?.replace("T", " ").slice(0, 19) ?? "—",
    a.action,
    a.si_code ?? "—",
  ])
  if (auditRows.length) {
    autoTable(doc, {
      head: [["Timestamp", "Action", "SI Code"]],
      body: auditRows,
      startY: Math.max((doc as any).lastAutoTable.finalY + 14, 200),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: INK, textColor: OCHRE, fontStyle: "bold" },
      alternateRowStyles: { fillColor: "#f4f3ef" },
    })
  }

  doc.save(`seismic-dossier-${safe || rec.project_id}.pdf`)
}
