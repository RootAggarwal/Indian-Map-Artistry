(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/client/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "api",
    ()=>api
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/client/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_BASE = ("TURBOPACK compile-time value", "http://localhost:4000/api") || "http://localhost:4000/api";
async function request(path, options) {
    const res = await fetch("".concat(API_BASE).concat(path), {
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    });
    if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(body.error || "Request failed: ".concat(res.status));
    }
    return res.json();
}
const api = {
    get: (path)=>request(path),
    post: (path, body)=>request(path, {
            method: "POST",
            body: JSON.stringify(body)
        }),
    del: (path, body)=>request(path, {
            method: "DELETE",
            body: body ? JSON.stringify(body) : undefined
        }),
    put: (path, body)=>request(path, {
            method: "PUT",
            body: JSON.stringify(body)
        })
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/client/lib/seismic.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "counts",
    ()=>counts,
    "deleteSurvey",
    ()=>deleteSurvey,
    "fetchAuditLogs",
    ()=>fetchAuditLogs,
    "fetchReports",
    ()=>fetchReports,
    "fetchSurveys",
    ()=>fetchSurveys,
    "logAudit",
    ()=>logAudit,
    "rollbackSurveys",
    ()=>rollbackSurveys,
    "saveSurveys",
    ()=>saveSurveys,
    "surveyLabel",
    ()=>surveyLabel,
    "updateSurvey",
    ()=>updateSurvey
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/lib/api.ts [app-client] (ecmascript)");
;
async function fetchSurveys() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].get("/surveys");
}
async function fetchReports() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].get("/reports");
}
async function fetchAuditLogs(basin) {
    const params = basin ? "?basin=".concat(encodeURIComponent(basin)) : "";
    return __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].get("/audit-logs".concat(params));
}
async function saveSurveys(drafts) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].post("/surveys", {
        drafts
    });
}
async function rollbackSurveys(projectIds) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].del("/surveys/rollback", projectIds);
}
async function deleteSurvey(id) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].del("/surveys/".concat(id));
}
async function updateSurvey(id, data) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].put("/surveys/".concat(id), data);
}
let sessionId = null;
function getSession() {
    if (sessionId) return sessionId;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const stored = window.sessionStorage.getItem("geopic-session");
    sessionId = stored !== null && stored !== void 0 ? stored : "sess-".concat(Math.random().toString(36).slice(2, 10));
    window.sessionStorage.setItem("geopic-session", sessionId);
    return sessionId;
}
async function logAudit(action) {
    let payload = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    try {
        var _payload_project_id, _payload_si_code, _payload_basin, _payload_details;
        await __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].post("/audit-logs", {
            user_session: getSession(),
            action,
            project_id: (_payload_project_id = payload.project_id) !== null && _payload_project_id !== void 0 ? _payload_project_id : null,
            si_code: (_payload_si_code = payload.si_code) !== null && _payload_si_code !== void 0 ? _payload_si_code : null,
            basin: (_payload_basin = payload.basin) !== null && _payload_basin !== void 0 ? _payload_basin : null,
            details: (_payload_details = payload.details) !== null && _payload_details !== void 0 ? _payload_details : {}
        });
    } catch (err) {
        console.warn("audit log failed", err);
    }
}
function surveyLabel(rec) {
    var _rec_projects;
    var _rec_projects_project_name;
    return (_rec_projects_project_name = (_rec_projects = rec.projects) === null || _rec_projects === void 0 ? void 0 : _rec_projects.project_name) !== null && _rec_projects_project_name !== void 0 ? _rec_projects_project_name : "Project ".concat(rec.project_id);
}
function counts(values) {
    const map = new Map();
    for (const value of values){
        const key = (value !== null && value !== void 0 ? value : "Unspecified").trim() || "Unspecified";
        var _map_get;
        map.set(key, ((_map_get = map.get(key)) !== null && _map_get !== void 0 ? _map_get : 0) + 1);
    }
    return [
        ...map.entries()
    ].sort((a, b)=>b[1] - a[1] || a[0].localeCompare(b[0]));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/client/lib/report-pdf.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildProjectReport",
    ()=>buildProjectReport
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$jspdf$2f$dist$2f$jspdf$2e$es$2e$min$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/jspdf/dist/jspdf.es.min.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$jspdf$2d$autotable$2f$dist$2f$jspdf$2e$plugin$2e$autotable$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.mjs [app-client] (ecmascript)");
;
;
const INK = "#12181f";
const OCHRE = "#c98a2e";
function buildProjectReport(rec, reports, audit) {
    var _rec_projects_project_name, _rec_projects, _rec_projects1, _rec_projects2, _rec_projects3, _rec_projects4, _rec_centroid_lon;
    const doc = new __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$jspdf$2f$dist$2f$jspdf$2e$es$2e$min$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]({
        unit: "pt",
        format: "a4"
    });
    const safe = (_rec_projects = rec.projects) === null || _rec_projects === void 0 ? void 0 : (_rec_projects_project_name = _rec_projects.project_name) === null || _rec_projects_project_name === void 0 ? void 0 : _rec_projects_project_name.replace(/[^a-zA-Z0-9_\- ]/g, "").slice(0, 60);
    // Title header
    doc.setFillColor(INK);
    doc.rect(0, 0, doc.internal.pageSize.width, 100, "F");
    doc.setTextColor(OCHRE);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("GEOPIC · Seismic Dossier", 40, 44);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#efede8");
    var _rec_si_code;
    doc.text("".concat(safe || "Project ".concat(rec.project_id), "  ·  ").concat((_rec_si_code = rec.si_code) !== null && _rec_si_code !== void 0 ? _rec_si_code : "—"), 40, 66);
    doc.setDrawColor(OCHRE);
    doc.setLineWidth(0.6);
    doc.line(40, 78, doc.internal.pageSize.width - 40, 78);
    var _rec_si_code1, _rec_projects_project_name1, _rec_projects_basin, _rec_projects_project_type, _rec_projects_data_dimension, _rec_project_year, _rec_type_of_processing, _rec_processing_bin, _rec_record_length, _rec_sampling_interval, _rec_fold, _rec_azimuth, _rec_spheroid, _rec_utm_zone, _rec_projection, _rec_project_timeline, _rec_geometry_status;
    // Project details
    const kv = {
        "Project ID": "".concat(rec.project_id),
        "SI Code": (_rec_si_code1 = rec.si_code) !== null && _rec_si_code1 !== void 0 ? _rec_si_code1 : "—",
        "Project Name": (_rec_projects_project_name1 = (_rec_projects1 = rec.projects) === null || _rec_projects1 === void 0 ? void 0 : _rec_projects1.project_name) !== null && _rec_projects_project_name1 !== void 0 ? _rec_projects_project_name1 : "—",
        "Basin": (_rec_projects_basin = (_rec_projects2 = rec.projects) === null || _rec_projects2 === void 0 ? void 0 : _rec_projects2.basin) !== null && _rec_projects_basin !== void 0 ? _rec_projects_basin : "—",
        "Project Type": (_rec_projects_project_type = (_rec_projects3 = rec.projects) === null || _rec_projects3 === void 0 ? void 0 : _rec_projects3.project_type) !== null && _rec_projects_project_type !== void 0 ? _rec_projects_project_type : "—",
        "Data Dimension": (_rec_projects_data_dimension = (_rec_projects4 = rec.projects) === null || _rec_projects4 === void 0 ? void 0 : _rec_projects4.data_dimension) !== null && _rec_projects_data_dimension !== void 0 ? _rec_projects_data_dimension : "—",
        "Year of Processing": (_rec_project_year = rec.project_year) !== null && _rec_project_year !== void 0 ? _rec_project_year : "—",
        "Type of Processing": (_rec_type_of_processing = rec.type_of_processing) !== null && _rec_type_of_processing !== void 0 ? _rec_type_of_processing : "—",
        "Quantum (SKM)": rec.quantum_skm != null ? "".concat(rec.quantum_skm) : "—",
        "Quantum (SLKM)": rec.quantum_slkm != null ? "".concat(rec.quantum_slkm) : "—",
        "Processing Bin": (_rec_processing_bin = rec.processing_bin) !== null && _rec_processing_bin !== void 0 ? _rec_processing_bin : "—",
        "Record Length": (_rec_record_length = rec.record_length) !== null && _rec_record_length !== void 0 ? _rec_record_length : "—",
        "Sampling Interval": (_rec_sampling_interval = rec.sampling_interval) !== null && _rec_sampling_interval !== void 0 ? _rec_sampling_interval : "—",
        "Fold": (_rec_fold = rec.fold) !== null && _rec_fold !== void 0 ? _rec_fold : "—",
        "Azimuth": (_rec_azimuth = rec.azimuth) !== null && _rec_azimuth !== void 0 ? _rec_azimuth : "—",
        "Spheroid": (_rec_spheroid = rec.spheroid) !== null && _rec_spheroid !== void 0 ? _rec_spheroid : "—",
        "UTM Zone": (_rec_utm_zone = rec.utm_zone) !== null && _rec_utm_zone !== void 0 ? _rec_utm_zone : "—",
        "Projection": (_rec_projection = rec.projection) !== null && _rec_projection !== void 0 ? _rec_projection : "—",
        "Timeline": (_rec_project_timeline = rec.project_timeline) !== null && _rec_project_timeline !== void 0 ? _rec_project_timeline : "—",
        "Geometry Status": (_rec_geometry_status = rec.geometry_status) !== null && _rec_geometry_status !== void 0 ? _rec_geometry_status : "—",
        "Mapped": rec.is_mapped ? "Yes" : "No",
        "Flagged": rec.flagged_for_review ? "Yes" : "No",
        "Centroid": rec.centroid_lat != null ? "".concat(rec.centroid_lat.toFixed(4), ", ").concat((_rec_centroid_lon = rec.centroid_lon) === null || _rec_centroid_lon === void 0 ? void 0 : _rec_centroid_lon.toFixed(4)) : "—"
    };
    doc.setFontSize(9);
    doc.setTextColor("#12181f");
    const body = Object.entries(kv).map((param)=>{
        let [k, v] = param;
        return [
            k,
            v
        ];
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$jspdf$2d$autotable$2f$dist$2f$jspdf$2e$plugin$2e$autotable$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(doc, {
        head: [
            [
                "Attribute",
                "Value"
            ]
        ],
        body,
        startY: 120,
        styles: {
            fontSize: 8,
            cellPadding: 3
        },
        headStyles: {
            fillColor: INK,
            textColor: OCHRE,
            fontStyle: "bold"
        },
        alternateRowStyles: {
            fillColor: "#f4f3ef"
        }
    });
    var _rec_corners;
    // Corner geometry
    const corners = ((_rec_corners = rec.corners) !== null && _rec_corners !== void 0 ? _rec_corners : []).map((c, i)=>{
        var _c_lat, _c_lon;
        var _c_corner, _c_lat_toFixed, _c_lon_toFixed;
        return [
            "G".concat((_c_corner = c.corner) !== null && _c_corner !== void 0 ? _c_corner : i + 1),
            (_c_lat_toFixed = (_c_lat = c.lat) === null || _c_lat === void 0 ? void 0 : _c_lat.toFixed(4)) !== null && _c_lat_toFixed !== void 0 ? _c_lat_toFixed : "—",
            (_c_lon_toFixed = (_c_lon = c.lon) === null || _c_lon === void 0 ? void 0 : _c_lon.toFixed(4)) !== null && _c_lon_toFixed !== void 0 ? _c_lon_toFixed : "—",
            c.il != null ? "".concat(c.il) : "—",
            c.xl != null ? "".concat(c.xl) : "—",
            c.easting != null ? "".concat(c.easting) : "—",
            c.northing != null ? "".concat(c.northing) : "—",
            c.is_assumed ? "assumed" : "surveyed"
        ];
    });
    if (corners.length) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$jspdf$2d$autotable$2f$dist$2f$jspdf$2e$plugin$2e$autotable$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(doc, {
            head: [
                [
                    "Corner",
                    "Lat",
                    "Lon",
                    "IL",
                    "XL",
                    "Easting",
                    "Northing",
                    "Source"
                ]
            ],
            body: corners,
            startY: doc.lastAutoTable.finalY + 14,
            styles: {
                fontSize: 7.5,
                cellPadding: 2
            },
            headStyles: {
                fillColor: INK,
                textColor: OCHRE,
                fontStyle: "bold"
            },
            alternateRowStyles: {
                fillColor: "#f4f3ef"
            }
        });
    }
    var _rec_geometry_notes;
    // Cartographic notes
    const notes = (_rec_geometry_notes = rec.geometry_notes) !== null && _rec_geometry_notes !== void 0 ? _rec_geometry_notes : [];
    if (notes.length) {
        const y = doc.lastAutoTable.finalY + 16;
        doc.setFontSize(8);
        doc.setTextColor(INK);
        doc.setFont("helvetica", "bold");
        doc.text("Cartographic notes", 40, y);
        doc.setFont("helvetica", "normal");
        notes.forEach((n, i)=>doc.text("  ".concat(i + 1, ". ").concat(n), 40, y + 12 + i * 10));
    }
    // Linked reports
    const linked = reports.filter((r)=>r.project_id === rec.project_id);
    if (linked.length) {
        const y = doc.lastAutoTable.finalY + 16 + (notes.length ? notes.length * 10 + 6 : 0);
        doc.setFontSize(8);
        doc.setTextColor(INK);
        doc.setFont("helvetica", "bold");
        doc.text("Linked reports", 40, y);
        doc.setFont("helvetica", "normal");
        linked.forEach((r, i)=>{
            var _r_report_type;
            return doc.text("  ".concat(i + 1, ". ").concat(r.file_name, " (").concat((_r_report_type = r.report_type) !== null && _r_report_type !== void 0 ? _r_report_type : "—", ")"), 40, y + 12 + i * 10);
        });
    }
    // Basin audit log
    const auditRows = audit.slice(0, 30).map((a)=>{
        var _a_created_at;
        var _a_created_at_replace_slice, _a_si_code;
        return [
            (_a_created_at_replace_slice = (_a_created_at = a.created_at) === null || _a_created_at === void 0 ? void 0 : _a_created_at.replace("T", " ").slice(0, 19)) !== null && _a_created_at_replace_slice !== void 0 ? _a_created_at_replace_slice : "—",
            a.action,
            (_a_si_code = a.si_code) !== null && _a_si_code !== void 0 ? _a_si_code : "—"
        ];
    });
    if (auditRows.length) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$jspdf$2d$autotable$2f$dist$2f$jspdf$2e$plugin$2e$autotable$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(doc, {
            head: [
                [
                    "Timestamp",
                    "Action",
                    "SI Code"
                ]
            ],
            body: auditRows,
            startY: Math.max(doc.lastAutoTable.finalY + 14, 200),
            styles: {
                fontSize: 7,
                cellPadding: 2
            },
            headStyles: {
                fillColor: INK,
                textColor: OCHRE,
                fontStyle: "bold"
            },
            alternateRowStyles: {
                fillColor: "#f4f3ef"
            }
        });
    }
    doc.save("seismic-dossier-".concat(safe || rec.project_id, ".pdf"));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/client/components/seismic/FilterRail.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FilterRail",
    ()=>FilterRail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function FilterRail(param) {
    let { facets, selected, toggle, clear, total, shown } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
        className: "flex h-full min-h-0 flex-col border-r border-border bg-surface",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-baseline justify-between gap-2 border-b border-border px-4 py-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "rail-label",
                                children: "Filters"
                            }, void 0, false, {
                                fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                lineNumber: 32,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "slab truncate text-lg text-foreground",
                                children: [
                                    shown,
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-muted-foreground",
                                        children: [
                                            "/",
                                            total
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                        lineNumber: 35,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                lineNumber: 33,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/components/seismic/FilterRail.tsx",
                        lineNumber: 31,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: clear,
                        className: "rail-label shrink-0 border border-border px-2 py-1 transition-colors hover:border-rust hover:text-rust",
                        children: "Reset"
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/FilterRail.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/components/seismic/FilterRail.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "min-h-0 flex-1 overflow-y-auto",
                children: facets.map((facet)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FacetBlock, {
                        facet: facet,
                        selected: selected[facet.key],
                        toggle: toggle
                    }, facet.key, false, {
                        fileName: "[project]/client/components/seismic/FilterRail.tsx",
                        lineNumber: 48,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/client/components/seismic/FilterRail.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/client/components/seismic/FilterRail.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, this);
}
_c = FilterRail;
function FacetBlock(param) {
    let { facet, selected, toggle } = param;
    _s();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [q, setQ] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const max = Math.max(...facet.options.map((param)=>{
        let [, c] = param;
        return c;
    }), 1);
    const options = q.trim() ? facet.options.filter((param)=>{
        let [v] = param;
        return v.toLowerCase().includes(q.trim().toLowerCase());
    }) : facet.options;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "border-b border-border",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setOpen((o)=>!o),
                className: "flex w-full items-center justify-between gap-2 bg-ink px-4 py-2 text-left",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "slab text-[0.72rem] uppercase tracking-[0.18em] text-foreground",
                        children: facet.label
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/FilterRail.tsx",
                        lineNumber: 82,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "flex items-center gap-2",
                        children: [
                            selected.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "data-cell rounded-full bg-ochre px-1.5 text-primary-foreground",
                                children: selected.length
                            }, void 0, false, {
                                fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                lineNumber: 87,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                className: "h-3.5 w-3.5 text-muted-foreground transition-transform ".concat(open ? "" : "-rotate-90")
                            }, void 0, false, {
                                fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                lineNumber: 91,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/components/seismic/FilterRail.tsx",
                        lineNumber: 85,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/components/seismic/FilterRail.tsx",
                lineNumber: 78,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative border-b border-border/60 px-3 py-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                className: "pointer-events-none absolute left-5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground"
                            }, void 0, false, {
                                fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                lineNumber: 100,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                value: q,
                                onChange: (e)=>setQ(e.target.value),
                                placeholder: "Search ".concat(facet.label.toLowerCase()),
                                "aria-label": "Search ".concat(facet.label),
                                className: "w-full border border-border bg-ink py-1 pl-6 pr-2 text-[0.72rem] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ochre"
                            }, void 0, false, {
                                fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                lineNumber: 101,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/components/seismic/FilterRail.tsx",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "max-h-52 overflow-y-auto py-1",
                        children: [
                            options.map((param)=>{
                                let [value, count] = param;
                                const on = selected.includes(value);
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>toggle(facet.key, value),
                                        className: "group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 py-1.5 text-left transition-colors hover:bg-surface-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "grid h-3.5 w-3.5 shrink-0 place-items-center border ".concat(on ? "border-ochre bg-ochre" : "border-border"),
                                                children: on && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "block h-1.5 w-1.5 bg-primary-foreground"
                                                }, void 0, false, {
                                                    fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                                    lineNumber: 123,
                                                    columnNumber: 28
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                                lineNumber: 118,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "min-w-0",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "block truncate text-[0.76rem] ".concat(on ? "text-ochre" : "text-foreground/85"),
                                                        children: value
                                                    }, void 0, false, {
                                                        fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                                        lineNumber: 126,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "mt-1 block h-[3px] w-full bg-border",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "block h-full bg-seismic-soft/70 transition-all",
                                                            style: {
                                                                width: "".concat(count / max * 100, "%")
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                                            lineNumber: 132,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                                        lineNumber: 131,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                                lineNumber: 125,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "data-cell shrink-0 text-muted-foreground",
                                                children: count
                                            }, void 0, false, {
                                                fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                                lineNumber: 138,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                        lineNumber: 114,
                                        columnNumber: 17
                                    }, this)
                                }, value, false, {
                                    fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                    lineNumber: 113,
                                    columnNumber: 15
                                }, this);
                            }),
                            options.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                className: "px-4 py-2 text-[0.72rem] text-muted-foreground",
                                children: "No matches."
                            }, void 0, false, {
                                fileName: "[project]/client/components/seismic/FilterRail.tsx",
                                lineNumber: 144,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/components/seismic/FilterRail.tsx",
                        lineNumber: 109,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/client/components/seismic/FilterRail.tsx",
        lineNumber: 77,
        columnNumber: 5
    }, this);
}
_s(FacetBlock, "ZbvPqleF5GaFu55i/puFuDB4cm4=");
_c1 = FacetBlock;
var _c, _c1;
__turbopack_context__.k.register(_c, "FilterRail");
__turbopack_context__.k.register(_c1, "FacetBlock");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/client/components/seismic/MapCanvas.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MapCanvas",
    ()=>MapCanvas
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
/* Equirectangular projection tuned to the Indian national extent. */ const LON0 = 67.5;
const LON1 = 98.0;
const LAT0 = 5.5;
const LAT1 = 38.0;
const K = 40; // px per degree of longitude
const KX = K;
const KY = K * 1.08;
const VIEW_W = (LON1 - LON0) * KX;
const VIEW_H = (LAT1 - LAT0) * KY;
const px = (lon)=>(lon - LON0) * KX;
const py = (lat)=>(LAT1 - lat) * KY;
function MapCanvas(param) {
    let { surveys, selectedId, onSelect, tool, zoomSignal, resetSignal, yearFilterActive } = param;
    var _hover_projects, _hover_projects1;
    _s();
    const [boundary, setBoundary] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        x: 0,
        y: 0,
        w: VIEW_W,
        h: VIEW_H
    });
    const [drag, setDrag] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [box, setBox] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [hover, setHover] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const svgRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MapCanvas.useEffect": ()=>{
            fetch("/data/india-boundary.json").then({
                "MapCanvas.useEffect": (r)=>r.json()
            }["MapCanvas.useEffect"]).then(setBoundary).catch({
                "MapCanvas.useEffect": ()=>setBoundary(null)
            }["MapCanvas.useEffect"]);
        }
    }["MapCanvas.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MapCanvas.useEffect": ()=>{
            if (!zoomSignal) return;
            setView({
                "MapCanvas.useEffect": (v)=>{
                    const factor = zoomSignal.dir > 0 ? 0.72 : 1 / 0.72;
                    const w = Math.min(VIEW_W * 1.2, Math.max(VIEW_W * 0.06, v.w * factor));
                    const h = w * (VIEW_H / VIEW_W);
                    return {
                        x: v.x + (v.w - w) / 2,
                        y: v.y + (v.h - h) / 2,
                        w,
                        h
                    };
                }
            }["MapCanvas.useEffect"]);
        }
    }["MapCanvas.useEffect"], [
        zoomSignal
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MapCanvas.useEffect": ()=>{
            if (resetSignal) setView({
                x: 0,
                y: 0,
                w: VIEW_W,
                h: VIEW_H
            });
        }
    }["MapCanvas.useEffect"], [
        resetSignal
    ]);
    const paths = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MapCanvas.useMemo[paths]": ()=>{
            if (!boundary) return [];
            return boundary.coordinates.map({
                "MapCanvas.useMemo[paths]": (poly)=>poly.map({
                        "MapCanvas.useMemo[paths]": (ring)=>ring.map({
                                "MapCanvas.useMemo[paths]": (param, i)=>{
                                    let [lon, lat] = param;
                                    return "".concat(i ? "L" : "M").concat(px(lon).toFixed(1), ",").concat(py(lat).toFixed(1));
                                }
                            }["MapCanvas.useMemo[paths]"]).join("") + "Z"
                    }["MapCanvas.useMemo[paths]"]).join(" ")
            }["MapCanvas.useMemo[paths]"]);
        }
    }["MapCanvas.useMemo[paths]"], [
        boundary
    ]);
    const mapped = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MapCanvas.useMemo[mapped]": ()=>surveys.filter({
                "MapCanvas.useMemo[mapped]": (s)=>s.is_mapped && s.bbox_min_lon != null
            }["MapCanvas.useMemo[mapped]"])
    }["MapCanvas.useMemo[mapped]"], [
        surveys
    ]);
    function toLocal(e) {
        const svg = svgRef.current;
        if (!svg) return {
            x: 0,
            y: 0
        };
        const rect = svg.getBoundingClientRect();
        return {
            x: view.x + (e.clientX - rect.left) / rect.width * view.w,
            y: view.y + (e.clientY - rect.top) / rect.height * view.h
        };
    }
    function onDown(e) {
        const p = toLocal(e);
        if (tool === "box") setBox({
            x1: p.x,
            y1: p.y,
            x2: p.x,
            y2: p.y
        });
        else if (tool === "pan") setDrag({
            sx: e.clientX,
            sy: e.clientY,
            view
        });
    }
    function onMove(e) {
        if (box) {
            const p = toLocal(e);
            setBox((b)=>b ? {
                    ...b,
                    x2: p.x,
                    y2: p.y
                } : b);
            return;
        }
        if (drag && svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            const dx = (e.clientX - drag.sx) / rect.width * drag.view.w;
            const dy = (e.clientY - drag.sy) / rect.height * drag.view.h;
            setView({
                ...drag.view,
                x: drag.view.x - dx,
                y: drag.view.y - dy
            });
        }
    }
    function onUp() {
        if (box) {
            const w = Math.abs(box.x2 - box.x1);
            const h = Math.abs(box.y2 - box.y1);
            if (w > 12 && h > 12) {
                const nw = Math.max(w, h * (VIEW_W / VIEW_H));
                setView({
                    x: Math.min(box.x1, box.x2) - (nw - w) / 2,
                    y: Math.min(box.y1, box.y2) - (nw * (VIEW_H / VIEW_W) - h) / 2,
                    w: nw,
                    h: nw * (VIEW_H / VIEW_W)
                });
            }
            setBox(null);
        }
        setDrag(null);
    }
    const cursor = tool === "pan" ? drag ? "grabbing" : "grab" : tool === "box" ? "crosshair" : "pointer";
    const strokeScale = view.w / VIEW_W;
    var _hover_si_code;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative h-full w-full overflow-hidden bg-ink survey-grid grain",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                ref: svgRef,
                viewBox: "".concat(view.x, " ").concat(view.y, " ").concat(view.w, " ").concat(view.h),
                className: "h-full w-full select-none",
                style: {
                    cursor
                },
                onMouseDown: onDown,
                onMouseMove: onMove,
                onMouseUp: onUp,
                onMouseLeave: onUp,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                            id: "landfill",
                            x1: "0",
                            y1: "0",
                            x2: "0",
                            y2: "1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "0%",
                                    stopColor: "oklch(0.34 0.03 250)"
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/MapCanvas.tsx",
                                    lineNumber: 149,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "100%",
                                    stopColor: "oklch(0.27 0.028 250)"
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/MapCanvas.tsx",
                                    lineNumber: 150,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/components/seismic/MapCanvas.tsx",
                            lineNumber: 148,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/MapCanvas.tsx",
                        lineNumber: 147,
                        columnNumber: 9
                    }, this),
                    paths.map((d, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            d: d,
                            fill: "url(#landfill)",
                            stroke: "oklch(0.62 0.05 240)",
                            strokeWidth: 0.9 * strokeScale,
                            strokeLinejoin: "round"
                        }, i, false, {
                            fileName: "[project]/client/components/seismic/MapCanvas.tsx",
                            lineNumber: 155,
                            columnNumber: 11
                        }, this)),
                    mapped.map((s)=>{
                        const x = px(s.bbox_min_lon);
                        const y = py(s.bbox_max_lat);
                        const w = px(s.bbox_max_lon) - x;
                        const h = py(s.bbox_min_lat) - y;
                        const active = s.id === selectedId;
                        const dim = yearFilterActive != null && s.project_year !== yearFilterActive;
                        const suspect = s.bbox_max_lon - s.bbox_min_lon > 6 || s.bbox_max_lat - s.bbox_min_lat > 6;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                            x: x,
                            y: y,
                            width: Math.max(w, 1.4),
                            height: Math.max(h, 1.4),
                            rx: 0.6,
                            fill: suspect ? "transparent" : active ? "oklch(0.78 0.152 74 / 0.5)" : "oklch(0.72 0.121 190 / 0.32)",
                            stroke: suspect ? "oklch(0.66 0.17 30)" : active ? "oklch(0.86 0.16 78)" : "oklch(0.75 0.12 190)",
                            strokeDasharray: suspect ? "".concat(5 * strokeScale, " ").concat(4 * strokeScale) : undefined,
                            strokeWidth: (active ? 2.1 : suspect ? 1.2 : 0.9) * strokeScale,
                            opacity: dim ? 0.14 : 1,
                            className: "transition-opacity duration-300",
                            onMouseEnter: ()=>setHover(s),
                            onMouseLeave: ()=>setHover((h2)=>(h2 === null || h2 === void 0 ? void 0 : h2.id) === s.id ? null : h2),
                            onClick: (e)=>{
                                e.stopPropagation();
                                onSelect(s);
                            },
                            style: {
                                cursor: "pointer"
                            }
                        }, s.id, false, {
                            fileName: "[project]/client/components/seismic/MapCanvas.tsx",
                            lineNumber: 176,
                            columnNumber: 13
                        }, this);
                    }),
                    box && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                        x: Math.min(box.x1, box.x2),
                        y: Math.min(box.y1, box.y2),
                        width: Math.abs(box.x2 - box.x1),
                        height: Math.abs(box.y2 - box.y1),
                        fill: "oklch(0.78 0.152 74 / 0.12)",
                        stroke: "oklch(0.86 0.16 78)",
                        strokeDasharray: "".concat(4 * strokeScale, " ").concat(3 * strokeScale),
                        strokeWidth: 1.4 * strokeScale
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/MapCanvas.tsx",
                        lineNumber: 213,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/components/seismic/MapCanvas.tsx",
                lineNumber: 137,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute left-3 bottom-3 rail-label bg-ink/80 px-2 py-1",
                children: [
                    mapped.length,
                    " footprints · clipped to Indian extent"
                ]
            }, void 0, true, {
                fileName: "[project]/client/components/seismic/MapCanvas.tsx",
                lineNumber: 226,
                columnNumber: 7
            }, this),
            hover && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute right-3 top-3 max-w-[16rem] border border-border bg-popover/95 p-2 backdrop-blur",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "rail-label",
                        children: (_hover_si_code = hover.si_code) !== null && _hover_si_code !== void 0 ? _hover_si_code : "SIG —"
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/MapCanvas.tsx",
                        lineNumber: 232,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-1 text-[0.72rem] leading-snug text-foreground",
                        children: (_hover_projects = hover.projects) === null || _hover_projects === void 0 ? void 0 : _hover_projects.project_name
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/MapCanvas.tsx",
                        lineNumber: 233,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "data-cell mt-1 text-seismic",
                        children: [
                            (_hover_projects1 = hover.projects) === null || _hover_projects1 === void 0 ? void 0 : _hover_projects1.basin,
                            " · ",
                            hover.project_year
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/components/seismic/MapCanvas.tsx",
                        lineNumber: 236,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/components/seismic/MapCanvas.tsx",
                lineNumber: 231,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/client/components/seismic/MapCanvas.tsx",
        lineNumber: 136,
        columnNumber: 5
    }, this);
}
_s(MapCanvas, "zzC9vREWk0fvgQdz3dSEQTQYlMo=");
_c = MapCanvas;
var _c;
__turbopack_context__.k.register(_c, "MapCanvas");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/client/components/seismic/RibbonBar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RibbonBar",
    ()=>RibbonBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$hand$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Hand$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/hand.js [app-client] (ecmascript) <export default as Hand>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/square.js [app-client] (ecmascript) <export default as Square>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mouse$2d$pointer$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MousePointer2$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/mouse-pointer-2.js [app-client] (ecmascript) <export default as MousePointer2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$in$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomIn$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/zoom-in.js [app-client] (ecmascript) <export default as ZoomIn>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomOut$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/zoom-out.js [app-client] (ecmascript) <export default as ZoomOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize2$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/maximize-2.js [app-client] (ecmascript) <export default as Maximize2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$printer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Printer$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/printer.js [app-client] (ecmascript) <export default as Printer>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/play.js [app-client] (ecmascript) <export default as Play>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pause$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pause$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/pause.js [app-client] (ecmascript) <export default as Pause>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const toolBtn = "grid h-8 w-8 shrink-0 place-items-center border border-border text-muted-foreground transition-colors hover:border-ochre hover:text-ochre";
function RibbonBar(param) {
    let { tool, setTool, onZoom, onReset, onPrint, years, yearIndex, setYearIndex, playing, togglePlay, query, setQuery, matches, onAdd } = param;
    _s();
    const active = "border-ochre bg-ochre/15 text-ochre";
    const [findOpen, setFindOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const findRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RibbonBar.useEffect": ()=>{
            var _findRef_current;
            if (findOpen) (_findRef_current = findRef.current) === null || _findRef_current === void 0 ? void 0 : _findRef_current.focus();
        }
    }["RibbonBar.useEffect"], [
        findOpen
    ]);
    var _years_yearIndex;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-wrap items-center gap-2 border-b border-border bg-surface-2/60 px-3 py-2 backdrop-blur",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "".concat(toolBtn, " ").concat(tool === "pan" ? active : ""),
                        onClick: ()=>setTool("pan"),
                        title: "Hand — drag to pan",
                        "aria-label": "Hand tool",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$hand$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Hand$3e$__["Hand"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                            lineNumber: 71,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "".concat(toolBtn, " ").concat(tool === "box" ? active : ""),
                        onClick: ()=>setTool("box"),
                        title: "Draw box — drag a rectangle to zoom",
                        "aria-label": "Draw box tool",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__["Square"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                            lineNumber: 79,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                        lineNumber: 73,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "".concat(toolBtn, " ").concat(tool === "inspect" ? active : ""),
                        onClick: ()=>setTool("inspect"),
                        title: "Inspect — click a footprint",
                        "aria-label": "Inspect tool",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mouse$2d$pointer$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MousePointer2$3e$__["MousePointer2"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                            lineNumber: 87,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                        lineNumber: 81,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "h-6 w-px bg-border"
            }, void 0, false, {
                fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: toolBtn,
                        onClick: ()=>onZoom(1),
                        title: "Zoom in",
                        "aria-label": "Zoom in",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$in$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomIn$3e$__["ZoomIn"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                            lineNumber: 95,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                        lineNumber: 94,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: toolBtn,
                        onClick: ()=>onZoom(-1),
                        title: "Zoom out",
                        "aria-label": "Zoom out",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomOut$3e$__["ZoomOut"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                            lineNumber: 98,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                        lineNumber: 97,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: toolBtn,
                        onClick: onReset,
                        title: "Fit India",
                        "aria-label": "Fit to India",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize2$3e$__["Maximize2"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                            lineNumber: 101,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                        lineNumber: 100,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                lineNumber: 93,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "h-6 w-px bg-border"
            }, void 0, false, {
                fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                lineNumber: 105,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "".concat(toolBtn, " ").concat(findOpen ? active : ""),
                        onClick: ()=>{
                            if (findOpen) setQuery("");
                            setFindOpen((o)=>!o);
                        },
                        title: "Find — project, processing, SI code",
                        "aria-label": "Find",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                            lineNumber: 117,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                        lineNumber: 108,
                        columnNumber: 9
                    }, this),
                    findOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex h-8 items-center gap-2 border border-ochre/50 bg-ink px-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                ref: findRef,
                                value: query,
                                onChange: (e)=>setQuery(e.target.value),
                                onKeyDown: (e)=>{
                                    if (e.key === "Escape") {
                                        setQuery("");
                                        setFindOpen(false);
                                    }
                                },
                                placeholder: "Project · processing · SI code",
                                "aria-label": "Find surveys",
                                className: "w-48 bg-transparent text-[0.75rem] text-foreground outline-none placeholder:text-muted-foreground/60"
                            }, void 0, false, {
                                fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                                lineNumber: 121,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "data-cell shrink-0 text-ochre",
                                children: matches
                            }, void 0, false, {
                                fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                                lineNumber: 135,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    setQuery("");
                                    setFindOpen(false);
                                },
                                className: "text-muted-foreground transition-colors hover:text-rust",
                                "aria-label": "Clear search",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    className: "h-3.5 w-3.5"
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                                    lineNumber: 144,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                                lineNumber: 136,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                        lineNumber: 120,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                lineNumber: 107,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "h-6 w-px bg-border"
            }, void 0, false, {
                fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                lineNumber: 150,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "flex h-8 items-center gap-2 border border-seismic/50 bg-seismic/10 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-seismic transition-colors hover:bg-seismic hover:text-primary-foreground",
                onClick: onAdd,
                title: "Add or import a project / survey",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                        className: "h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                        lineNumber: 157,
                        columnNumber: 9
                    }, this),
                    "Add"
                ]
            }, void 0, true, {
                fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                lineNumber: 152,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "flex h-8 items-center gap-2 border border-ochre/50 bg-ochre/10 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ochre transition-colors hover:bg-ochre hover:text-primary-foreground",
                onClick: onPrint,
                title: "Print / download dossier",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$printer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Printer$3e$__["Printer"], {
                        className: "h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                        lineNumber: 166,
                        columnNumber: 9
                    }, this),
                    "Print"
                ]
            }, void 0, true, {
                fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                lineNumber: 161,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "h-6 w-px bg-border"
            }, void 0, false, {
                fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                lineNumber: 170,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex min-w-0 flex-1 items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: toolBtn,
                        onClick: togglePlay,
                        title: "Play timeline",
                        "aria-label": "Play timeline",
                        children: playing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pause$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pause$3e$__["Pause"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                            lineNumber: 174,
                            columnNumber: 22
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                            lineNumber: 174,
                            columnNumber: 54
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                        lineNumber: 173,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "range",
                        min: 0,
                        max: Math.max(years.length - 1, 0),
                        value: yearIndex,
                        onChange: (e)=>setYearIndex(Number(e.target.value)),
                        className: "h-1 min-w-24 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-ochre",
                        "aria-label": "Project year timeline"
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                        lineNumber: 176,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "data-cell shrink-0 border border-border bg-ink px-2 py-1 text-ochre",
                        children: (_years_yearIndex = years[yearIndex]) !== null && _years_yearIndex !== void 0 ? _years_yearIndex : "ALL"
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                        lineNumber: 185,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/components/seismic/RibbonBar.tsx",
                lineNumber: 172,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/client/components/seismic/RibbonBar.tsx",
        lineNumber: 63,
        columnNumber: 5
    }, this);
}
_s(RibbonBar, "njPr6FvFWlbzAR20d80FJU0XEzk=");
_c = RibbonBar;
var _c;
__turbopack_context__.k.register(_c, "RibbonBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/client/components/seismic/EntityPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EntityPanel",
    ()=>EntityPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/file-text.js [app-client] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$printer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Printer$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/printer.js [app-client] (ecmascript) <export default as Printer>");
"use client";
;
;
function v(x) {
    if (x === null || x === undefined || x === "") return "—";
    return String(x);
}
function EntityPanel(param) {
    let { rec, reports, onPrint, onOpenDetails } = param;
    var _rec_projects, _rec_projects1, _rec_projects2, _rec_projects3, _rec_geometry_notes;
    if (!rec) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
            className: "grid h-full place-items-center border-l border-border bg-surface p-6 text-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "rail-label",
                children: "Select a footprint to load its dossier"
            }, void 0, false, {
                fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                lineNumber: 21,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/client/components/seismic/EntityPanel.tsx",
            lineNumber: 20,
            columnNumber: 7
        }, this);
    }
    const linked = reports.filter((r)=>r.project_id === rec.project_id);
    var _rec_type_of_processing;
    const rows = [
        [
            "Project Year",
            v(rec.project_year)
        ],
        [
            "Project Name",
            v((_rec_projects = rec.projects) === null || _rec_projects === void 0 ? void 0 : _rec_projects.project_name)
        ],
        [
            "Investigation Details",
            v(rec.si_code)
        ],
        [
            "Data Type (2D/3D/4D)",
            v((_rec_projects1 = rec.projects) === null || _rec_projects1 === void 0 ? void 0 : _rec_projects1.data_dimension)
        ],
        [
            "Data Type (New/Reprocessed)",
            /reprocess/i.test((_rec_type_of_processing = rec.type_of_processing) !== null && _rec_type_of_processing !== void 0 ? _rec_type_of_processing : "") ? "Reprocessed" : "New"
        ],
        [
            "Basin",
            v((_rec_projects2 = rec.projects) === null || _rec_projects2 === void 0 ? void 0 : _rec_projects2.basin)
        ],
        [
            "Project Type",
            v(rec.type_of_processing)
        ],
        [
            "Planned Area (LKM/SKM)",
            v(rec.quantum_skm)
        ],
        [
            "Planned Area (Eq. SLKM)",
            v(rec.quantum_slkm)
        ],
        [
            "Processed Area (LKM/SKM)",
            v(rec.quantum_skm)
        ],
        [
            "Processed Area (Eq. SLKM)",
            v(rec.quantum_slkm)
        ],
        [
            "Processing Bin Details",
            v(rec.processing_bin)
        ],
        [
            "Record Length",
            v(rec.record_length)
        ],
        [
            "Sampling Interval",
            v(rec.sampling_interval)
        ],
        [
            "Fold",
            v(rec.fold)
        ],
        [
            "Planned Timeline",
            v(rec.project_timeline)
        ],
        [
            "Actual Timeline",
            v(rec.project_timeline)
        ],
        [
            "Spheroid / Projection",
            "".concat(v(rec.spheroid), " · ").concat(v(rec.projection))
        ],
        [
            "Azimuth",
            v(rec.azimuth)
        ]
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
        className: "flex h-full min-h-0 flex-col border-l border-border bg-surface",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border bg-ink px-4 py-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "rail-label",
                                children: "Entity / Details"
                            }, void 0, false, {
                                fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                lineNumber: 53,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "slab mt-1 line-clamp-2 text-[0.95rem] leading-tight text-foreground",
                                children: (_rec_projects3 = rec.projects) === null || _rec_projects3 === void 0 ? void 0 : _rec_projects3.project_name
                            }, void 0, false, {
                                fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                lineNumber: 54,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                        lineNumber: 52,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onPrint,
                        className: "grid h-8 w-8 shrink-0 place-items-center border border-ochre/50 text-ochre transition-colors hover:bg-ochre hover:text-primary-foreground",
                        title: "Download dossier PDF",
                        "aria-label": "Download dossier PDF",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$printer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Printer$3e$__["Printer"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                            lineNumber: 64,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                lineNumber: 51,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "min-h-0 flex-1 overflow-y-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        className: "w-full table-fixed",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: [
                                rows.map((param, i)=>{
                                    let [label, value] = param;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "border-b border-border/70 ".concat(i % 2 ? "bg-surface-2/40" : ""),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "w-[48%] px-3 py-1.5 text-left align-top text-[0.7rem] font-medium text-muted-foreground",
                                                children: label
                                            }, void 0, false, {
                                                fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                                lineNumber: 76,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "data-cell px-3 py-1.5 align-top break-words text-seismic",
                                                children: value
                                            }, void 0, false, {
                                                fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                                lineNumber: 79,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, label, true, {
                                        fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                        lineNumber: 72,
                                        columnNumber: 15
                                    }, this);
                                }),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: "border-b border-border/70",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "px-3 py-1.5 text-left align-top text-[0.7rem] font-medium text-muted-foreground",
                                            children: "Reports"
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                            lineNumber: 83,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-3 py-1.5 align-top",
                                            children: linked.length ? linked.map((r)=>{
                                                var _r_report_path;
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "data-cell block break-all text-ochre underline decoration-dotted",
                                                    title: (_r_report_path = r.report_path) !== null && _r_report_path !== void 0 ? _r_report_path : "",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"], {
                                                            className: "mr-1 inline h-3 w-3"
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                                            lineNumber: 94,
                                                            columnNumber: 23
                                                        }, this),
                                                        r.file_name
                                                    ]
                                                }, r.id, true, {
                                                    fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                                    lineNumber: 89,
                                                    columnNumber: 21
                                                }, this);
                                            }) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "data-cell text-muted-foreground",
                                                children: "No report on file"
                                            }, void 0, false, {
                                                fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                                lineNumber: 99,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                            lineNumber: 86,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                    lineNumber: 82,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                            lineNumber: 70,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this),
                    ((_rec_geometry_notes = rec.geometry_notes) === null || _rec_geometry_notes === void 0 ? void 0 : _rec_geometry_notes.length) > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "m-3 border border-rust/40 bg-rust/10 p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "rail-label flex items-center gap-1.5 text-rust",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                                        className: "h-3.5 w-3.5"
                                    }, void 0, false, {
                                        fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                        lineNumber: 109,
                                        columnNumber: 15
                                    }, this),
                                    " Cartographic note"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                lineNumber: 108,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "mt-2 space-y-1.5",
                                children: rec.geometry_notes.map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        className: "text-[0.72rem] leading-snug text-foreground/85",
                                        children: n
                                    }, n, false, {
                                        fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                        lineNumber: 113,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                                lineNumber: 111,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                        lineNumber: 107,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: onOpenDetails,
                className: "hairline-top bg-ink px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ochre transition-colors hover:bg-ochre hover:text-primary-foreground",
                children: "More details + audit trail"
            }, void 0, false, {
                fileName: "[project]/client/components/seismic/EntityPanel.tsx",
                lineNumber: 122,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/client/components/seismic/EntityPanel.tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this);
}
_c = EntityPanel;
var _c;
__turbopack_context__.k.register(_c, "EntityPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/client/components/seismic/BottomBar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BottomBar",
    ()=>BottomBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/arrow-up-right.js [app-client] (ecmascript) <export default as ArrowUpRight>");
"use client";
;
;
function summary(rec) {
    var _rec_projects;
    const bits = [
        (_rec_projects = rec.projects) === null || _rec_projects === void 0 ? void 0 : _rec_projects.data_dimension,
        rec.type_of_processing,
        rec.quantum_skm != null ? "".concat(rec.quantum_skm, " SKM") : null,
        rec.processing_bin ? "bin ".concat(rec.processing_bin) : null
    ].filter(Boolean);
    return bits.join(" · ") || "No summary recorded";
}
function BottomBar(param) {
    let { rows, selectedId, onSelect, onMore } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "flex h-full min-h-0 flex-col border-t border-border bg-surface",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex items-center justify-between gap-3 border-b border-border bg-ink px-4 py-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "rail-label",
                        children: "Project Year / Project Name / Details / Summary"
                    }, void 0, false, {
                        fileName: "[project]/client/components/seismic/BottomBar.tsx",
                        lineNumber: 26,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "data-cell shrink-0 text-muted-foreground",
                        children: [
                            rows.length,
                            " records"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/components/seismic/BottomBar.tsx",
                        lineNumber: 27,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/components/seismic/BottomBar.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "min-h-0 flex-1 overflow-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "w-full min-w-[46rem] border-collapse",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            className: "sticky top-0 z-10 bg-surface-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: [
                                    "Year",
                                    "Project name",
                                    "Details",
                                    "Summary",
                                    ""
                                ].map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "rail-label border-b border-border px-3 py-2 text-left font-normal",
                                        children: h
                                    }, h, false, {
                                        fileName: "[project]/client/components/seismic/BottomBar.tsx",
                                        lineNumber: 35,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/client/components/seismic/BottomBar.tsx",
                                lineNumber: 33,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/client/components/seismic/BottomBar.tsx",
                            lineNumber: 32,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: [
                                rows.map((rec)=>{
                                    var _rec_projects;
                                    const active = rec.id === selectedId;
                                    var _rec_project_year, _rec_si_code;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        onClick: ()=>onSelect(rec),
                                        className: "cursor-pointer border-b border-border/60 transition-colors ".concat(active ? "bg-ochre/12" : "hover:bg-surface-2/60"),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "data-cell whitespace-nowrap px-3 py-2 text-ochre",
                                                children: (_rec_project_year = rec.project_year) !== null && _rec_project_year !== void 0 ? _rec_project_year : "—"
                                            }, void 0, false, {
                                                fileName: "[project]/client/components/seismic/BottomBar.tsx",
                                                lineNumber: 55,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "max-w-[22rem] px-3 py-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "block truncate text-[0.78rem] text-foreground",
                                                    children: (_rec_projects = rec.projects) === null || _rec_projects === void 0 ? void 0 : _rec_projects.project_name
                                                }, void 0, false, {
                                                    fileName: "[project]/client/components/seismic/BottomBar.tsx",
                                                    lineNumber: 59,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/client/components/seismic/BottomBar.tsx",
                                                lineNumber: 58,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "data-cell whitespace-nowrap px-3 py-2 text-seismic",
                                                children: (_rec_si_code = rec.si_code) !== null && _rec_si_code !== void 0 ? _rec_si_code : "—"
                                            }, void 0, false, {
                                                fileName: "[project]/client/components/seismic/BottomBar.tsx",
                                                lineNumber: 63,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "max-w-[24rem] px-3 py-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "block truncate text-[0.74rem] text-muted-foreground",
                                                    children: summary(rec)
                                                }, void 0, false, {
                                                    fileName: "[project]/client/components/seismic/BottomBar.tsx",
                                                    lineNumber: 67,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/client/components/seismic/BottomBar.tsx",
                                                lineNumber: 66,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-3 py-2 text-right",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: (e)=>{
                                                        e.stopPropagation();
                                                        onMore(rec);
                                                    },
                                                    className: "rail-label inline-flex items-center gap-1 text-ochre transition-colors hover:text-foreground",
                                                    children: [
                                                        "More details ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__["ArrowUpRight"], {
                                                            className: "h-3 w-3"
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/BottomBar.tsx",
                                                            lineNumber: 79,
                                                            columnNumber: 36
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/client/components/seismic/BottomBar.tsx",
                                                    lineNumber: 72,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/client/components/seismic/BottomBar.tsx",
                                                lineNumber: 71,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, rec.id, true, {
                                        fileName: "[project]/client/components/seismic/BottomBar.tsx",
                                        lineNumber: 48,
                                        columnNumber: 17
                                    }, this);
                                }),
                                rows.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        colSpan: 5,
                                        className: "px-3 py-8 text-center text-[0.8rem] text-muted-foreground",
                                        children: "No projects match the current filters."
                                    }, void 0, false, {
                                        fileName: "[project]/client/components/seismic/BottomBar.tsx",
                                        lineNumber: 87,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/BottomBar.tsx",
                                    lineNumber: 86,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/components/seismic/BottomBar.tsx",
                            lineNumber: 44,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/client/components/seismic/BottomBar.tsx",
                    lineNumber: 31,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/client/components/seismic/BottomBar.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/client/components/seismic/BottomBar.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
_c = BottomBar;
var _c;
__turbopack_context__.k.register(_c, "BottomBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/client/components/seismic/DetailsDialog.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DetailsDialog",
    ()=>DetailsDialog
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$printer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Printer$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/printer.js [app-client] (ecmascript) <export default as Printer>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/lib/seismic.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function DetailsDialog(param) {
    let { rec, reports, onClose, onPrint } = param;
    var _rec_projects, _rec_projects1, _rec_projects2;
    _s();
    const [audit, setAudit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DetailsDialog.useEffect": ()=>{
            var _rec_projects;
            if (!rec) return;
            let alive = true;
            var _rec_projects_basin;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchAuditLogs"])((_rec_projects_basin = (_rec_projects = rec.projects) === null || _rec_projects === void 0 ? void 0 : _rec_projects.basin) !== null && _rec_projects_basin !== void 0 ? _rec_projects_basin : null).then({
                "DetailsDialog.useEffect": (rows)=>alive && setAudit(rows)
            }["DetailsDialog.useEffect"]).catch({
                "DetailsDialog.useEffect": ()=>alive && setAudit([])
            }["DetailsDialog.useEffect"]);
            return ({
                "DetailsDialog.useEffect": ()=>{
                    alive = false;
                }
            })["DetailsDialog.useEffect"];
        }
    }["DetailsDialog.useEffect"], [
        rec
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DetailsDialog.useEffect": ()=>{
            const onKey = {
                "DetailsDialog.useEffect.onKey": (e)=>e.key === "Escape" && onClose()
            }["DetailsDialog.useEffect.onKey"];
            window.addEventListener("keydown", onKey);
            return ({
                "DetailsDialog.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["DetailsDialog.useEffect"];
        }
    }["DetailsDialog.useEffect"], [
        onClose
    ]);
    if (!rec) return null;
    const linked = reports.filter((r)=>r.project_id === rec.project_id);
    var _rec_si_code, _rec_corners, _rec_corners1, _rec_projects_basin;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/80 p-0 backdrop-blur-sm sm:items-center sm:p-6",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "panel grain flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border bg-ink px-5 py-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "min-w-0",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "rail-label",
                                    children: [
                                        "Dossier · ",
                                        (_rec_si_code = rec.si_code) !== null && _rec_si_code !== void 0 ? _rec_si_code : "—"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                    lineNumber: 41,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "slab mt-1 truncate text-xl text-foreground",
                                    children: (_rec_projects = rec.projects) === null || _rec_projects === void 0 ? void 0 : _rec_projects.project_name
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                    lineNumber: 42,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "data-cell mt-1 text-seismic",
                                    children: [
                                        (_rec_projects1 = rec.projects) === null || _rec_projects1 === void 0 ? void 0 : _rec_projects1.basin,
                                        " · ",
                                        rec.project_year,
                                        " · ",
                                        rec.type_of_processing
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                    lineNumber: 45,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                            lineNumber: 40,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex shrink-0 items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>onPrint(rec),
                                    className: "flex h-8 items-center gap-2 border border-ochre/50 bg-ochre/10 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ochre transition-colors hover:bg-ochre hover:text-primary-foreground",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$printer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Printer$3e$__["Printer"], {
                                            className: "h-4 w-4"
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                            lineNumber: 54,
                                            columnNumber: 15
                                        }, this),
                                        " Print"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                    lineNumber: 50,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: onClose,
                                    className: "grid h-8 w-8 place-items-center border border-border text-muted-foreground hover:border-rust hover:text-rust",
                                    "aria-label": "Close",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                        lineNumber: 61,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                    lineNumber: 56,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                            lineNumber: 49,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                    lineNumber: 39,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "min-h-0 flex-1 overflow-y-auto p-5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "rail-label",
                                    children: "Corner geometry"
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                    lineNumber: 68,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                    className: "mt-2 w-full border-collapse",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                children: [
                                                    "Corner",
                                                    "Easting",
                                                    "Northing",
                                                    "IL",
                                                    "XL",
                                                    "Lat",
                                                    "Lon",
                                                    "Source"
                                                ].map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                        className: "rail-label border-b border-border px-2 py-1 text-left font-normal",
                                                        children: h
                                                    }, h, false, {
                                                        fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                        lineNumber: 73,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                lineNumber: 71,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                            lineNumber: 70,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                            children: [
                                                ((_rec_corners = rec.corners) !== null && _rec_corners !== void 0 ? _rec_corners : []).map((c, i)=>{
                                                    var _c_lat, _c_lon;
                                                    var _c_corner, _c_easting, _c_northing, _c_il, _c_xl, _c_lat_toFixed, _c_lon_toFixed;
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        className: "border-b border-border/50",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "data-cell px-2 py-1 text-ochre",
                                                                children: [
                                                                    "G",
                                                                    (_c_corner = c.corner) !== null && _c_corner !== void 0 ? _c_corner : i + 1
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                                lineNumber: 85,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "data-cell px-2 py-1",
                                                                children: (_c_easting = c.easting) !== null && _c_easting !== void 0 ? _c_easting : "—"
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                                lineNumber: 86,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "data-cell px-2 py-1",
                                                                children: (_c_northing = c.northing) !== null && _c_northing !== void 0 ? _c_northing : "—"
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                                lineNumber: 87,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "data-cell px-2 py-1",
                                                                children: (_c_il = c.il) !== null && _c_il !== void 0 ? _c_il : "—"
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                                lineNumber: 88,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "data-cell px-2 py-1",
                                                                children: (_c_xl = c.xl) !== null && _c_xl !== void 0 ? _c_xl : "—"
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                                lineNumber: 89,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "data-cell px-2 py-1 text-seismic",
                                                                children: (_c_lat_toFixed = (_c_lat = c.lat) === null || _c_lat === void 0 ? void 0 : _c_lat.toFixed(4)) !== null && _c_lat_toFixed !== void 0 ? _c_lat_toFixed : "—"
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                                lineNumber: 90,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "data-cell px-2 py-1 text-seismic",
                                                                children: (_c_lon_toFixed = (_c_lon = c.lon) === null || _c_lon === void 0 ? void 0 : _c_lon.toFixed(4)) !== null && _c_lon_toFixed !== void 0 ? _c_lon_toFixed : "—"
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                                lineNumber: 91,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "data-cell px-2 py-1 text-muted-foreground",
                                                                children: c.is_assumed ? "assumed" : "surveyed"
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                                lineNumber: 92,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, i, true, {
                                                        fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                        lineNumber: 84,
                                                        columnNumber: 19
                                                    }, this);
                                                }),
                                                ((_rec_corners1 = rec.corners) !== null && _rec_corners1 !== void 0 ? _rec_corners1 : []).length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        colSpan: 8,
                                                        className: "px-2 py-4 text-center text-[0.78rem] text-muted-foreground",
                                                        children: "No corner geometry captured for this survey."
                                                    }, void 0, false, {
                                                        fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                        lineNumber: 99,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                    lineNumber: 98,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                            lineNumber: 82,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                    lineNumber: 69,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                            lineNumber: 67,
                            columnNumber: 11
                        }, this),
                        linked.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: "mt-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "rail-label",
                                    children: "Linked reports"
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                    lineNumber: 110,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    className: "mt-2 space-y-1",
                                    children: linked.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "data-cell break-all text-ochre",
                                            children: [
                                                r.file_name,
                                                " ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-muted-foreground",
                                                    children: [
                                                        "· ",
                                                        r.report_type
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                    lineNumber: 114,
                                                    columnNumber: 35
                                                }, this)
                                            ]
                                        }, r.id, true, {
                                            fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                            lineNumber: 113,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                    lineNumber: 111,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                            lineNumber: 109,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: "mt-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "rail-label",
                                    children: [
                                        "Basin audit log · ",
                                        (_rec_projects_basin = (_rec_projects2 = rec.projects) === null || _rec_projects2 === void 0 ? void 0 : _rec_projects2.basin) !== null && _rec_projects_basin !== void 0 ? _rec_projects_basin : "—"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                    lineNumber: 122,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    className: "mt-2 divide-y divide-border/60 border border-border",
                                    children: [
                                        audit.slice(0, 40).map((a)=>{
                                            var _a_si_code;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                className: "grid grid-cols-[auto_minmax(0,1fr)] gap-3 px-3 py-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "data-cell shrink-0 text-muted-foreground",
                                                        children: a.created_at.replace("T", " ").slice(0, 19)
                                                    }, void 0, false, {
                                                        fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                        lineNumber: 126,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "min-w-0",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "data-cell text-ochre",
                                                                children: a.action
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                                lineNumber: 130,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "data-cell ml-2 break-all text-muted-foreground",
                                                                children: (_a_si_code = a.si_code) !== null && _a_si_code !== void 0 ? _a_si_code : ""
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                                lineNumber: 131,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                        lineNumber: 129,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, a.id, true, {
                                                fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                                lineNumber: 125,
                                                columnNumber: 17
                                            }, this);
                                        }),
                                        audit.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "px-3 py-4 text-center text-[0.78rem] text-muted-foreground",
                                            children: "No audit entries recorded for this basin yet."
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                            lineNumber: 138,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                                    lineNumber: 123,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                            lineNumber: 121,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
                    lineNumber: 66,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
            lineNumber: 38,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/client/components/seismic/DetailsDialog.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
}
_s(DetailsDialog, "3mppQDnl4bVfW1fQ2u2zFs/v3W4=");
_c = DetailsDialog;
var _c;
__turbopack_context__.k.register(_c, "DetailsDialog");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/client/components/seismic/AddSurveyDialog.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AddSurveyDialog",
    ()=>AddSurveyDialog
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/upload.js [app-client] (ecmascript) <export default as Upload>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$spreadsheet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSpreadsheet$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/file-spreadsheet.js [app-client] (ecmascript) <export default as FileSpreadsheet>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/pencil.js [app-client] (ecmascript) <export default as Pencil>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const field = "w-full border border-border bg-ink px-2 py-1.5 text-[0.78rem] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ochre";
const EMPTY = {
    project_name: "",
    basin: "",
    project_type: "",
    data_dimension: "3D",
    si_code: "",
    project_year: "",
    type_of_processing: "",
    processing_bin: "",
    utm_zone: "",
    quantum_skm: null,
    quantum_slkm: null,
    min_lon: null,
    min_lat: null,
    max_lon: null,
    max_lat: null
};
const num = (v)=>{
    const n = typeof v === "number" ? v : parseFloat(String(v !== null && v !== void 0 ? v : "").replace(/[^\d.\-+eE]/g, ""));
    return Number.isFinite(n) ? n : null;
};
const str = (v)=>v == null ? "" : String(v).trim();
const KEY = (k)=>k.toLowerCase().replace(/[^a-z0-9]/g, "");
_c = KEY;
function pick(row) {
    for(var _len = arguments.length, names = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
        names[_key - 1] = arguments[_key];
    }
    for (const [k, v] of Object.entries(row)){
        const nk = KEY(k);
        if (names.some((n)=>nk === KEY(n) || nk.includes(KEY(n)))) return v;
    }
    return undefined;
}
function rowToDraft(row) {
    const name = str(pick(row, "project_name", "projectname", "name", "project"));
    if (!name) return null;
    return {
        project_name: name.slice(0, 200),
        basin: str(pick(row, "basin")),
        project_type: str(pick(row, "project_type", "type_of_project")),
        data_dimension: str(pick(row, "data_dimension", "dimension", "dim")) || null,
        si_code: str(pick(row, "si_code", "sicode", "details_code", "code")),
        project_year: str(pick(row, "project_year", "year")),
        type_of_processing: str(pick(row, "type_of_processing", "processing_type", "processing")),
        processing_bin: str(pick(row, "processing_bin", "bin")),
        utm_zone: str(pick(row, "utm_zone", "utm")),
        quantum_skm: num(pick(row, "quantum_skm", "skm")),
        quantum_slkm: num(pick(row, "quantum_slkm", "slkm")),
        min_lon: num(pick(row, "min_lon", "minlon", "west", "lon1", "x1")),
        min_lat: num(pick(row, "min_lat", "minlat", "south", "lat1", "y1")),
        max_lon: num(pick(row, "max_lon", "maxlon", "east", "lon2", "x2")),
        max_lat: num(pick(row, "max_lat", "maxlat", "north", "lat2", "y2"))
    };
}
function AddSurveyDialog(param) {
    let { open, onClose, onSubmit, onDelete, onUpdate, surveys, basins } = param;
    _s();
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("manual");
    const [draft, setDraft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(EMPTY);
    const [queued, setQueued] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [dragging, setDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [manageQuery, setManageQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [editingId, setEditingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editData, setEditData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [deletingId, setDeletingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const set = (k, v)=>setDraft((d)=>({
                ...d,
                [k]: v
            }));
    const ingestFiles = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddSurveyDialog.useCallback[ingestFiles]": async (files)=>{
            setBusy(true);
            setMessage(null);
            const found = [];
            try {
                for (const file of files){
                    var _file_name_split_pop;
                    const ext = (_file_name_split_pop = file.name.split(".").pop()) === null || _file_name_split_pop === void 0 ? void 0 : _file_name_split_pop.toLowerCase();
                    if (ext === "csv" || ext === "xlsx" || ext === "xls") {
                        const XLSX = await __turbopack_context__.A("[project]/client/node_modules/xlsx/xlsx.mjs [app-client] (ecmascript, async loader)");
                        const wb = XLSX.read(await file.arrayBuffer(), {
                            type: "array"
                        });
                        for (const sheet of wb.SheetNames){
                            const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
                            rows.forEach({
                                "AddSurveyDialog.useCallback[ingestFiles]": (r)=>{
                                    const d = rowToDraft(r);
                                    if (d) found.push(d);
                                }
                            }["AddSurveyDialog.useCallback[ingestFiles]"]);
                        }
                    } else if (ext === "shp" || ext === "zip" || ext === "shx" || ext === "dbf") {
                        if (ext === "shx" || ext === "dbf") continue; // sidecars — read with the .shp
                        const shp = (await __turbopack_context__.A("[project]/client/node_modules/shpjs/lib/index.js [app-client] (ecmascript, async loader)")).default;
                        const fc = await shp(await file.arrayBuffer());
                        const collections = Array.isArray(fc) ? fc : [
                            fc
                        ];
                        for (const col of collections){
                            var _col_features;
                            for (const feat of (_col_features = col.features) !== null && _col_features !== void 0 ? _col_features : []){
                                var _f_geometry;
                                const f = feat;
                                var _f_properties, _rowToDraft;
                                const base = (_rowToDraft = rowToDraft((_f_properties = f.properties) !== null && _f_properties !== void 0 ? _f_properties : {})) !== null && _rowToDraft !== void 0 ? _rowToDraft : {
                                    ...EMPTY,
                                    project_name: file.name.replace(/\.[^.]+$/, "")
                                };
                                const coords = [];
                                const walk = {
                                    "AddSurveyDialog.useCallback[ingestFiles].walk": (v)=>{
                                        if (Array.isArray(v) && typeof v[0] === "number") coords.push(v);
                                        else if (Array.isArray(v)) v.forEach(walk);
                                    }
                                }["AddSurveyDialog.useCallback[ingestFiles].walk"];
                                walk((_f_geometry = f.geometry) === null || _f_geometry === void 0 ? void 0 : _f_geometry.coordinates);
                                if (coords.length) {
                                    const lons = coords.map({
                                        "AddSurveyDialog.useCallback[ingestFiles].lons": (c)=>c[0]
                                    }["AddSurveyDialog.useCallback[ingestFiles].lons"]);
                                    const lats = coords.map({
                                        "AddSurveyDialog.useCallback[ingestFiles].lats": (c)=>c[1]
                                    }["AddSurveyDialog.useCallback[ingestFiles].lats"]);
                                    base.min_lon = Math.min(...lons);
                                    base.max_lon = Math.max(...lons);
                                    base.min_lat = Math.min(...lats);
                                    base.max_lat = Math.max(...lats);
                                }
                                found.push(base);
                            }
                        }
                    } else {
                        setMessage("Unsupported file: ".concat(file.name));
                    }
                }
                setQueued({
                    "AddSurveyDialog.useCallback[ingestFiles]": (q)=>[
                            ...q,
                            ...found
                        ]
                }["AddSurveyDialog.useCallback[ingestFiles]"]);
                setMessage(found.length ? "".concat(found.length, " record(s) parsed and ready.") : "No usable rows found.");
            } catch (err) {
                setMessage(err instanceof Error ? err.message : "Could not parse that file.");
            } finally{
                setBusy(false);
            }
        }
    }["AddSurveyDialog.useCallback[ingestFiles]"], []);
    if (!open) return null;
    const submit = async (drafts)=>{
        if (!drafts.length) return;
        setBusy(true);
        try {
            await onSubmit(drafts);
            setDraft(EMPTY);
            setQueued([]);
            setMessage(null);
            onClose();
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Save failed.");
        } finally{
            setBusy(false);
        }
    };
    var _draft_basin, _draft_si_code, _draft_project_year, _draft_type_of_processing, _draft_processing_bin, _draft_utm_zone, _draft_quantum_skm, _draft_quantum_slkm;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4 backdrop-blur-sm",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex max-h-[88vh] w-full max-w-3xl flex-col border border-border bg-surface shadow-2xl",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "flex items-center justify-between gap-3 border-b border-border bg-ink px-4 py-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "rail-label",
                                    children: "Register"
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 175,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "slab text-lg text-foreground",
                                    children: "Add project / survey"
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 176,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                            lineNumber: 174,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "grid h-8 w-8 place-items-center border border-border text-muted-foreground transition-colors hover:border-rust hover:text-rust",
                            "aria-label": "Close",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "h-4 w-4"
                            }, void 0, false, {
                                fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                lineNumber: 183,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                            lineNumber: 178,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                    lineNumber: 173,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex gap-1 border-b border-border bg-surface-2/60 px-4 py-2",
                    children: [
                        "manual",
                        "import",
                        "manage"
                    ].map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setMode(m),
                            className: "rail-label border px-3 py-1.5 transition-colors ".concat(mode === m ? "border-ochre bg-ochre/15 text-ochre" : "border-border text-muted-foreground hover:text-foreground"),
                            children: m === "manual" ? "Manual entry" : m === "import" ? "Import files" : "Manage records"
                        }, m, false, {
                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                            lineNumber: 189,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                    lineNumber: 187,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "min-h-0 flex-1 overflow-y-auto px-4 py-4",
                    children: [
                        mode === "manual" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid gap-3 sm:grid-cols-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                    label: "Project name *",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: field,
                                        value: draft.project_name,
                                        onChange: (e)=>set("project_name", e.target.value),
                                        placeholder: "e.g. Kaveri Offshore 3D"
                                    }, void 0, false, {
                                        fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                        lineNumber: 207,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 206,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                    label: "Basin",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: field,
                                            list: "basin-options",
                                            value: (_draft_basin = draft.basin) !== null && _draft_basin !== void 0 ? _draft_basin : "",
                                            onChange: (e)=>set("basin", e.target.value)
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                            lineNumber: 215,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("datalist", {
                                            id: "basin-options",
                                            children: basins.map((b)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: b
                                                }, b, false, {
                                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                    lineNumber: 223,
                                                    columnNumber: 21
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                            lineNumber: 221,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 214,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                    label: "Data dimension",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-2",
                                        children: [
                                            "2D",
                                            "3D"
                                        ].map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>set("data_dimension", d),
                                                className: "rail-label flex-1 border px-3 py-1.5 transition-colors ".concat(draft.data_dimension === d ? "border-ochre bg-ochre/15 text-ochre" : "border-border text-muted-foreground hover:text-foreground"),
                                                children: d
                                            }, d, false, {
                                                fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                lineNumber: 230,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                        lineNumber: 228,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 227,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                    label: "SI / details code",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: field,
                                        value: (_draft_si_code = draft.si_code) !== null && _draft_si_code !== void 0 ? _draft_si_code : "",
                                        onChange: (e)=>set("si_code", e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                        lineNumber: 245,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 244,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                    label: "Project year",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: field,
                                        value: (_draft_project_year = draft.project_year) !== null && _draft_project_year !== void 0 ? _draft_project_year : "",
                                        onChange: (e)=>set("project_year", e.target.value),
                                        placeholder: "2026"
                                    }, void 0, false, {
                                        fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                        lineNumber: 252,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 251,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                    label: "Type of processing",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: field,
                                        value: (_draft_type_of_processing = draft.type_of_processing) !== null && _draft_type_of_processing !== void 0 ? _draft_type_of_processing : "",
                                        onChange: (e)=>set("type_of_processing", e.target.value),
                                        placeholder: "PSTM / PSDM"
                                    }, void 0, false, {
                                        fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                        lineNumber: 260,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 259,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                    label: "Processing bin",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: field,
                                        value: (_draft_processing_bin = draft.processing_bin) !== null && _draft_processing_bin !== void 0 ? _draft_processing_bin : "",
                                        onChange: (e)=>set("processing_bin", e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                        lineNumber: 268,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 267,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                    label: "UTM zone",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: field,
                                        value: (_draft_utm_zone = draft.utm_zone) !== null && _draft_utm_zone !== void 0 ? _draft_utm_zone : "",
                                        onChange: (e)=>set("utm_zone", e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                        lineNumber: 275,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 274,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                    label: "Quantum SKM",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: field,
                                        inputMode: "decimal",
                                        value: (_draft_quantum_skm = draft.quantum_skm) !== null && _draft_quantum_skm !== void 0 ? _draft_quantum_skm : "",
                                        onChange: (e)=>set("quantum_skm", num(e.target.value))
                                    }, void 0, false, {
                                        fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                        lineNumber: 282,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 281,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                    label: "Quantum SLKM",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: field,
                                        inputMode: "decimal",
                                        value: (_draft_quantum_slkm = draft.quantum_slkm) !== null && _draft_quantum_slkm !== void 0 ? _draft_quantum_slkm : "",
                                        onChange: (e)=>set("quantum_slkm", num(e.target.value))
                                    }, void 0, false, {
                                        fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                        lineNumber: 290,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 289,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "sm:col-span-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "rail-label mb-2",
                                            children: "Footprint box (decimal degrees — clipped to India automatically)"
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                            lineNumber: 299,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
                                            children: [
                                                [
                                                    "min_lon",
                                                    "West lon"
                                                ],
                                                [
                                                    "min_lat",
                                                    "South lat"
                                                ],
                                                [
                                                    "max_lon",
                                                    "East lon"
                                                ],
                                                [
                                                    "max_lat",
                                                    "North lat"
                                                ]
                                            ].map((param)=>{
                                                let [k, label] = param;
                                                var _ref;
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                                    label: label,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        className: field,
                                                        inputMode: "decimal",
                                                        value: (_ref = draft[k]) !== null && _ref !== void 0 ? _ref : "",
                                                        onChange: (e)=>set(k, num(e.target.value))
                                                    }, void 0, false, {
                                                        fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                        lineNumber: 312,
                                                        columnNumber: 23
                                                    }, this)
                                                }, String(k), false, {
                                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                    lineNumber: 311,
                                                    columnNumber: 21
                                                }, this);
                                            })
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                            lineNumber: 302,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 298,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                            lineNumber: 205,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    onDragOver: (e)=>{
                                        e.preventDefault();
                                        setDragging(true);
                                    },
                                    onDragLeave: ()=>setDragging(false),
                                    onDrop: (e)=>{
                                        e.preventDefault();
                                        setDragging(false);
                                        void ingestFiles([
                                            ...e.dataTransfer.files
                                        ]);
                                    },
                                    onClick: ()=>{
                                        var _inputRef_current;
                                        return (_inputRef_current = inputRef.current) === null || _inputRef_current === void 0 ? void 0 : _inputRef_current.click();
                                    },
                                    className: "grid cursor-pointer place-items-center gap-2 border border-dashed px-6 py-12 text-center transition-colors ".concat(dragging ? "border-ochre bg-ochre/10" : "border-border hover:border-ochre/60"),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                            className: "h-6 w-6 text-ochre"
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                            lineNumber: 341,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "slab text-sm text-foreground",
                                            children: "Drop survey files here"
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                            lineNumber: 342,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[0.74rem] text-muted-foreground",
                                            children: ".csv · .xlsx · .shp (with .shx/.dbf zipped) — or click to browse"
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                            lineNumber: 343,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ref: inputRef,
                                            type: "file",
                                            multiple: true,
                                            accept: ".csv,.xlsx,.xls,.shp,.shx,.dbf,.zip",
                                            className: "hidden",
                                            onChange: (e)=>{
                                                var _e_target_files;
                                                return void ingestFiles([
                                                    ...(_e_target_files = e.target.files) !== null && _e_target_files !== void 0 ? _e_target_files : []
                                                ]);
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                            lineNumber: 346,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 325,
                                    columnNumber: 15
                                }, this),
                                queued.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    className: "mt-3 max-h-56 divide-y divide-border overflow-y-auto border border-border",
                                    children: queued.map((q, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "flex items-center gap-2 px-3 py-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$spreadsheet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSpreadsheet$3e$__["FileSpreadsheet"], {
                                                    className: "h-3.5 w-3.5 shrink-0 text-seismic"
                                                }, void 0, false, {
                                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                    lineNumber: 360,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "min-w-0 flex-1 truncate text-[0.78rem] text-foreground",
                                                    children: q.project_name
                                                }, void 0, false, {
                                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                    lineNumber: 361,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "data-cell shrink-0 text-muted-foreground",
                                                    children: [
                                                        q.project_year || "—",
                                                        " · ",
                                                        q.basin || "no basin"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                    lineNumber: 364,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setQueued((list)=>list.filter((_, j)=>j !== i)),
                                                    className: "text-muted-foreground transition-colors hover:text-rust",
                                                    "aria-label": "Remove",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                        className: "h-3.5 w-3.5"
                                                    }, void 0, false, {
                                                        fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                        lineNumber: 372,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                    lineNumber: 367,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, i, true, {
                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                            lineNumber: 359,
                                            columnNumber: 21
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 357,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                            lineNumber: 324,
                            columnNumber: 13
                        }, this),
                        mode === "manage" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    value: manageQuery,
                                    onChange: (e)=>setManageQuery(e.target.value),
                                    placeholder: "Search by name, basin, year, SI code…",
                                    className: "mb-3 w-full border border-border bg-ink px-3 py-2 text-[0.78rem] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ochre"
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 383,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "max-h-[28rem] overflow-y-auto border border-border",
                                    children: [
                                        surveys.filter((s)=>{
                                            var _s_projects, _s_projects1;
                                            const q = manageQuery.toLowerCase();
                                            if (!q) return true;
                                            return [
                                                (_s_projects = s.projects) === null || _s_projects === void 0 ? void 0 : _s_projects.project_name,
                                                (_s_projects1 = s.projects) === null || _s_projects1 === void 0 ? void 0 : _s_projects1.basin,
                                                s.project_year,
                                                s.si_code
                                            ].filter(Boolean).some((v)=>String(v).toLowerCase().includes(q));
                                        }).map((s)=>{
                                            var _s_projects, _s_projects1, _s_projects2, _s_projects3, _s_projects4;
                                            var _editData_project_name, _ref, _editData_basin, _ref1, _editData_si_code, _ref2, _editData_project_year, _ref3, _editData_type_of_processing, _ref4, _editData_processing_bin, _ref5, _editData_quantum_skm, _ref6, _editData_quantum_slkm, _ref7, _s_project_year, _s_projects_basin, _s_si_code;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "border-b border-border last:border-0",
                                                children: editingId === s.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "grid gap-2 p-3 sm:grid-cols-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                                            label: "Project name",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                className: field,
                                                                value: (_ref = (_editData_project_name = editData.project_name) !== null && _editData_project_name !== void 0 ? _editData_project_name : (_s_projects = s.projects) === null || _s_projects === void 0 ? void 0 : _s_projects.project_name) !== null && _ref !== void 0 ? _ref : "",
                                                                onChange: (e)=>setEditData((d)=>({
                                                                            ...d,
                                                                            project_name: e.target.value
                                                                        }))
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                                lineNumber: 403,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 402,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                                            label: "Basin",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                className: field,
                                                                value: (_ref1 = (_editData_basin = editData.basin) !== null && _editData_basin !== void 0 ? _editData_basin : (_s_projects1 = s.projects) === null || _s_projects1 === void 0 ? void 0 : _s_projects1.basin) !== null && _ref1 !== void 0 ? _ref1 : "",
                                                                onChange: (e)=>setEditData((d)=>({
                                                                            ...d,
                                                                            basin: e.target.value || null
                                                                        }))
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                                lineNumber: 406,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 405,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                                            label: "SI code",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                className: field,
                                                                value: (_ref2 = (_editData_si_code = editData.si_code) !== null && _editData_si_code !== void 0 ? _editData_si_code : s.si_code) !== null && _ref2 !== void 0 ? _ref2 : "",
                                                                onChange: (e)=>setEditData((d)=>({
                                                                            ...d,
                                                                            si_code: e.target.value || null
                                                                        }))
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                                lineNumber: 409,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 408,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                                            label: "Year",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                className: field,
                                                                value: (_ref3 = (_editData_project_year = editData.project_year) !== null && _editData_project_year !== void 0 ? _editData_project_year : s.project_year) !== null && _ref3 !== void 0 ? _ref3 : "",
                                                                onChange: (e)=>setEditData((d)=>({
                                                                            ...d,
                                                                            project_year: e.target.value || null
                                                                        }))
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                                lineNumber: 412,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 411,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                                            label: "Processing type",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                className: field,
                                                                value: (_ref4 = (_editData_type_of_processing = editData.type_of_processing) !== null && _editData_type_of_processing !== void 0 ? _editData_type_of_processing : s.type_of_processing) !== null && _ref4 !== void 0 ? _ref4 : "",
                                                                onChange: (e)=>setEditData((d)=>({
                                                                            ...d,
                                                                            type_of_processing: e.target.value || null
                                                                        }))
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                                lineNumber: 415,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 414,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                                            label: "Processing bin",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                className: field,
                                                                value: (_ref5 = (_editData_processing_bin = editData.processing_bin) !== null && _editData_processing_bin !== void 0 ? _editData_processing_bin : s.processing_bin) !== null && _ref5 !== void 0 ? _ref5 : "",
                                                                onChange: (e)=>setEditData((d)=>({
                                                                            ...d,
                                                                            processing_bin: e.target.value || null
                                                                        }))
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                                lineNumber: 418,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 417,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                                            label: "SKM",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                className: field,
                                                                inputMode: "decimal",
                                                                value: (_ref6 = (_editData_quantum_skm = editData.quantum_skm) !== null && _editData_quantum_skm !== void 0 ? _editData_quantum_skm : s.quantum_skm) !== null && _ref6 !== void 0 ? _ref6 : "",
                                                                onChange: (e)=>setEditData((d)=>({
                                                                            ...d,
                                                                            quantum_skm: parseFloat(e.target.value) || null
                                                                        }))
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                                lineNumber: 421,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 420,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Labeled, {
                                                            label: "SLKM",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                className: field,
                                                                inputMode: "decimal",
                                                                value: (_ref7 = (_editData_quantum_slkm = editData.quantum_slkm) !== null && _editData_quantum_slkm !== void 0 ? _editData_quantum_slkm : s.quantum_slkm) !== null && _ref7 !== void 0 ? _ref7 : "",
                                                                onChange: (e)=>setEditData((d)=>({
                                                                            ...d,
                                                                            quantum_slkm: parseFloat(e.target.value) || null
                                                                        }))
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                                lineNumber: 424,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 423,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-end gap-2 sm:col-span-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: async ()=>{
                                                                        await onUpdate(s.id, editData);
                                                                        setEditingId(null);
                                                                        setEditData({});
                                                                    },
                                                                    className: "flex items-center gap-1 border border-seismic bg-seismic px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                                                            className: "h-3.5 w-3.5"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                                            lineNumber: 435,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        " Save"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                                    lineNumber: 427,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>{
                                                                        setEditingId(null);
                                                                        setEditData({});
                                                                    },
                                                                    className: "rail-label border border-border px-3 py-1.5",
                                                                    children: "Cancel"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                                    lineNumber: 437,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 426,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                    lineNumber: 401,
                                                    columnNumber: 25
                                                }, this) : deletingId === s.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-3 bg-rust/10 px-4 py-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                            className: "h-4 w-4 shrink-0 text-rust"
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 447,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "flex-1 text-[0.78rem] text-foreground/90",
                                                            children: [
                                                                "Delete ",
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "font-semibold text-rust",
                                                                    children: (_s_projects2 = s.projects) === null || _s_projects2 === void 0 ? void 0 : _s_projects2.project_name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                                    lineNumber: 449,
                                                                    columnNumber: 36
                                                                }, this),
                                                                "? This cannot be undone."
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 448,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: async ()=>{
                                                                await onDelete(s.id);
                                                                setDeletingId(null);
                                                            },
                                                            className: "rail-label border border-rust bg-rust px-3 py-1 text-primary-foreground",
                                                            children: "Yes, delete"
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 451,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>setDeletingId(null),
                                                            className: "rail-label border border-border px-3 py-1",
                                                            children: "Cancel"
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 460,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                    lineNumber: 446,
                                                    columnNumber: 25
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-3 px-4 py-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "data-cell w-20 shrink-0 text-ochre",
                                                            children: (_s_project_year = s.project_year) !== null && _s_project_year !== void 0 ? _s_project_year : "—"
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 469,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "min-w-0 flex-1 truncate text-[0.78rem] text-foreground",
                                                            children: (_s_projects3 = s.projects) === null || _s_projects3 === void 0 ? void 0 : _s_projects3.project_name
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 470,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "data-cell hidden w-24 shrink-0 truncate text-muted-foreground sm:block",
                                                            children: (_s_projects_basin = (_s_projects4 = s.projects) === null || _s_projects4 === void 0 ? void 0 : _s_projects4.basin) !== null && _s_projects_basin !== void 0 ? _s_projects_basin : "—"
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 471,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "data-cell hidden w-24 shrink-0 truncate text-muted-foreground md:block",
                                                            children: (_s_si_code = s.si_code) !== null && _s_si_code !== void 0 ? _s_si_code : "—"
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 472,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>{
                                                                setEditingId(s.id);
                                                                setEditData({});
                                                                setDeletingId(null);
                                                            },
                                                            className: "grid h-7 w-7 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-seismic",
                                                            "aria-label": "Edit",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__["Pencil"], {
                                                                className: "h-3.5 w-3.5"
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                                lineNumber: 478,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 473,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>{
                                                                setDeletingId(s.id);
                                                                setEditingId(null);
                                                            },
                                                            className: "grid h-7 w-7 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-rust",
                                                            "aria-label": "Delete",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                                className: "h-3.5 w-3.5"
                                                            }, void 0, false, {
                                                                fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                                lineNumber: 485,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                            lineNumber: 480,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                    lineNumber: 468,
                                                    columnNumber: 25
                                                }, this)
                                            }, s.id, false, {
                                                fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                                lineNumber: 399,
                                                columnNumber: 21
                                            }, this);
                                        }),
                                        surveys.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "px-4 py-8 text-center text-[0.78rem] text-muted-foreground",
                                            children: "No surveys loaded."
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                            lineNumber: 492,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 389,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                            lineNumber: 382,
                            columnNumber: 13
                        }, this),
                        message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-3 border border-border bg-ink px-3 py-2 text-[0.75rem] text-foreground/85",
                            children: message
                        }, void 0, false, {
                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                            lineNumber: 499,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                    lineNumber: 203,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                    className: "flex items-center justify-between gap-3 border-t border-border bg-ink px-4 py-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[0.72rem] text-muted-foreground",
                            children: "Saved records appear on the map and tables immediately."
                        }, void 0, false, {
                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                            lineNumber: 506,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: onClose,
                                    className: "rail-label border border-border px-3 py-2",
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 510,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    disabled: busy || (mode === "manual" ? draft.project_name.trim().length < 2 : !queued.length),
                                    onClick: ()=>void submit(mode === "manual" ? [
                                            draft
                                        ] : queued),
                                    className: "flex items-center gap-2 border border-ochre bg-ochre px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-opacity disabled:opacity-40",
                                    children: [
                                        busy ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                            className: "h-3.5 w-3.5 animate-spin"
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                            lineNumber: 518,
                                            columnNumber: 23
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                            className: "h-3.5 w-3.5"
                                        }, void 0, false, {
                                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                            lineNumber: 518,
                                            columnNumber: 74
                                        }, this),
                                        mode === "manual" ? "Add survey" : "Import ".concat(queued.length || "")
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                                    lineNumber: 513,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                            lineNumber: 509,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                    lineNumber: 505,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
            lineNumber: 172,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
        lineNumber: 171,
        columnNumber: 5
    }, this);
}
_s(AddSurveyDialog, "FP1YbwW3QJGXceMrb3AydoL35jU=");
_c1 = AddSurveyDialog;
function Labeled(param) {
    let { label, children } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "block",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "rail-label mb-1 block",
                children: label
            }, void 0, false, {
                fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
                lineNumber: 531,
                columnNumber: 7
            }, this),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/client/components/seismic/AddSurveyDialog.tsx",
        lineNumber: 530,
        columnNumber: 5
    }, this);
}
_c2 = Labeled;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "KEY");
__turbopack_context__.k.register(_c1, "AddSurveyDialog");
__turbopack_context__.k.register(_c2, "Labeled");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/client/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Dashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/activity.js [app-client] (ecmascript) <export default as Activity>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/info.js [app-client] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-client] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/client/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/lib/seismic.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$report$2d$pdf$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/lib/report-pdf.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$components$2f$seismic$2f$FilterRail$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/components/seismic/FilterRail.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$components$2f$seismic$2f$MapCanvas$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/components/seismic/MapCanvas.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$components$2f$seismic$2f$RibbonBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/components/seismic/RibbonBar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$components$2f$seismic$2f$EntityPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/components/seismic/EntityPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$components$2f$seismic$2f$BottomBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/components/seismic/BottomBar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$components$2f$seismic$2f$DetailsDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/components/seismic/DetailsDialog.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$components$2f$seismic$2f$AddSurveyDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/components/seismic/AddSurveyDialog.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
const EMPTY = {
    basin: [],
    area: [],
    data_dimension: [],
    project_year: [],
    type_of_processing: []
};
function facetValue(rec, key) {
    var _rec_projects, _rec_projects1;
    var _rec_projects_basin;
    if (key === "basin") return (_rec_projects_basin = (_rec_projects = rec.projects) === null || _rec_projects === void 0 ? void 0 : _rec_projects.basin) !== null && _rec_projects_basin !== void 0 ? _rec_projects_basin : "Unspecified";
    if (key === "area") return rec.utm_zone ? "UTM ".concat(rec.utm_zone) : "Unspecified";
    var _rec_projects_data_dimension;
    if (key === "data_dimension") return ((_rec_projects_data_dimension = (_rec_projects1 = rec.projects) === null || _rec_projects1 === void 0 ? void 0 : _rec_projects1.data_dimension) !== null && _rec_projects_data_dimension !== void 0 ? _rec_projects_data_dimension : "Unspecified").toUpperCase();
    var _rec_project_year;
    if (key === "project_year") return (_rec_project_year = rec.project_year) !== null && _rec_project_year !== void 0 ? _rec_project_year : "Unspecified";
    var _rec_type_of_processing;
    return (_rec_type_of_processing = rec.type_of_processing) !== null && _rec_type_of_processing !== void 0 ? _rec_type_of_processing : "Unspecified";
}
function Dashboard() {
    _s();
    const queryClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"])();
    const surveys = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "surveys"
        ],
        queryFn: __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchSurveys"]
    });
    const reports = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "reports"
        ],
        queryFn: __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchReports"]
    });
    const [selected, setSelected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(EMPTY);
    const [activeId, setActiveId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [dialogRec, setDialogRec] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [tool, setTool] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("pan");
    const [zoomSignal, setZoomSignal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [resetSignal, setResetSignal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [yearIndex, setYearIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [playing, setPlaying] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [query, setQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [addOpen, setAddOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [lastImport, setLastImport] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const nonce = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    var _surveys_data;
    const all = (_surveys_data = surveys.data) !== null && _surveys_data !== void 0 ? _surveys_data : [];
    const years = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Dashboard.useMemo[years]": ()=>[
                "ALL",
                ...[
                    ...new Set(all.map({
                        "Dashboard.useMemo[years]": (s)=>s.project_year
                    }["Dashboard.useMemo[years]"]).filter(Boolean))
                ].sort()
            ]
    }["Dashboard.useMemo[years]"], [
        all
    ]);
    var _years_yearIndex;
    const timelineYear = years[yearIndex] === "ALL" ? null : (_years_yearIndex = years[yearIndex]) !== null && _years_yearIndex !== void 0 ? _years_yearIndex : null;
    const filtered = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Dashboard.useMemo[filtered]": ()=>{
            const q = query.trim().toLowerCase();
            return all.filter({
                "Dashboard.useMemo[filtered]": (rec)=>{
                    var _rec_projects, _rec_projects1;
                    const facetOk = Object.keys(selected).every({
                        "Dashboard.useMemo[filtered].facetOk": (key)=>{
                            const picks = selected[key];
                            return picks.length === 0 || picks.includes(facetValue(rec, key));
                        }
                    }["Dashboard.useMemo[filtered].facetOk"]);
                    if (!facetOk) return false;
                    if (!q) return true;
                    return [
                        (_rec_projects = rec.projects) === null || _rec_projects === void 0 ? void 0 : _rec_projects.project_name,
                        rec.type_of_processing,
                        rec.si_code,
                        (_rec_projects1 = rec.projects) === null || _rec_projects1 === void 0 ? void 0 : _rec_projects1.basin,
                        rec.project_year
                    ].filter(Boolean).some({
                        "Dashboard.useMemo[filtered]": (v)=>String(v).toLowerCase().includes(q)
                    }["Dashboard.useMemo[filtered]"]);
                }
            }["Dashboard.useMemo[filtered]"]);
        }
    }["Dashboard.useMemo[filtered]"], [
        all,
        selected,
        query
    ]);
    const facets = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Dashboard.useMemo[facets]": ()=>[
                [
                    "basin",
                    "Basin"
                ],
                [
                    "area",
                    "Area (UTM zone)"
                ],
                [
                    "data_dimension",
                    "Data Dimension"
                ],
                [
                    "project_year",
                    "Year of Processing"
                ],
                [
                    "type_of_processing",
                    "Type of Processing"
                ]
            ].map({
                "Dashboard.useMemo[facets]": (param)=>{
                    let [key, label] = param;
                    return {
                        key,
                        label,
                        options: (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["counts"])(all.map({
                            "Dashboard.useMemo[facets]": (rec)=>facetValue(rec, key)
                        }["Dashboard.useMemo[facets]"]))
                    };
                }
            }["Dashboard.useMemo[facets]"])
    }["Dashboard.useMemo[facets]"], [
        all
    ]);
    const activeRec = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Dashboard.useMemo[activeRec]": ()=>{
            var _filtered_find, _ref;
            return (_ref = (_filtered_find = filtered.find({
                "Dashboard.useMemo[activeRec]": (r)=>r.id === activeId
            }["Dashboard.useMemo[activeRec]"])) !== null && _filtered_find !== void 0 ? _filtered_find : all.find({
                "Dashboard.useMemo[activeRec]": (r)=>r.id === activeId
            }["Dashboard.useMemo[activeRec]"])) !== null && _ref !== void 0 ? _ref : null;
        }
    }["Dashboard.useMemo[activeRec]"], [
        filtered,
        all,
        activeId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Dashboard.useEffect": ()=>{
            if (!playing) return;
            const t = setInterval({
                "Dashboard.useEffect.t": ()=>setYearIndex({
                        "Dashboard.useEffect.t": (i)=>i + 1 >= years.length ? 0 : i + 1
                    }["Dashboard.useEffect.t"])
            }["Dashboard.useEffect.t"], 1200);
            return ({
                "Dashboard.useEffect": ()=>clearInterval(t)
            })["Dashboard.useEffect"];
        }
    }["Dashboard.useEffect"], [
        playing,
        years.length
    ]);
    function selectRec(rec) {
        var _rec_projects, _rec_projects1;
        setActiveId(rec.id);
        var _rec_projects_basin;
        void (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logAudit"])("PROJECT_VIEWED", {
            project_id: rec.project_id,
            si_code: rec.si_code,
            basin: (_rec_projects_basin = (_rec_projects = rec.projects) === null || _rec_projects === void 0 ? void 0 : _rec_projects.basin) !== null && _rec_projects_basin !== void 0 ? _rec_projects_basin : null,
            details: {
                project_name: (_rec_projects1 = rec.projects) === null || _rec_projects1 === void 0 ? void 0 : _rec_projects1.project_name
            }
        });
    }
    function toggleFacet(key, value) {
        setSelected((prev)=>{
            const on = prev[key].includes(value);
            const next = {
                ...prev,
                [key]: on ? prev[key].filter((v)=>v !== value) : [
                    ...prev[key],
                    value
                ]
            };
            void (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logAudit"])("FILTER_APPLIED", {
                details: {
                    facet: key,
                    value,
                    active: !on
                }
            });
            return next;
        });
    }
    async function printReport(rec) {
        var _rec_projects, _rec_projects1;
        if (!rec) return;
        var _rec_projects_basin;
        const audit = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchAuditLogs"])((_rec_projects_basin = (_rec_projects = rec.projects) === null || _rec_projects === void 0 ? void 0 : _rec_projects.basin) !== null && _rec_projects_basin !== void 0 ? _rec_projects_basin : null).catch(()=>[]);
        var _reports_data;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$report$2d$pdf$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildProjectReport"])(rec, (_reports_data = reports.data) !== null && _reports_data !== void 0 ? _reports_data : [], audit);
        var _rec_projects_basin1;
        void (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logAudit"])("REPORT_EXPORTED", {
            project_id: rec.project_id,
            si_code: rec.si_code,
            basin: (_rec_projects_basin1 = (_rec_projects1 = rec.projects) === null || _rec_projects1 === void 0 ? void 0 : _rec_projects1.basin) !== null && _rec_projects_basin1 !== void 0 ? _rec_projects_basin1 : null,
            details: {
                format: "pdf"
            }
        });
    }
    async function handleAdd(drafts) {
        var _result_project_ids;
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["saveSurveys"])(drafts);
        await queryClient.invalidateQueries({
            queryKey: [
                "surveys"
            ]
        });
        void (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logAudit"])("PROJECT_VIEWED", {
            details: {
                created: drafts.length,
                source: drafts.length > 1 ? "import" : "manual"
            }
        });
        if ((_result_project_ids = result.project_ids) === null || _result_project_ids === void 0 ? void 0 : _result_project_ids.length) {
            setLastImport({
                project_ids: result.project_ids,
                count: result.project_ids.length,
                mapped: result.mapped
            });
        }
    }
    async function handleRollback() {
        if (!lastImport) return;
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rollbackSurveys"])(lastImport.project_ids);
        await queryClient.invalidateQueries({
            queryKey: [
                "surveys"
            ]
        });
        setLastImport(null);
    }
    const mappedCount = filtered.filter((s)=>s.is_mapped).length;
    const adjusted = filtered.filter((s)=>{
        var _s_geometry_notes;
        var _s_geometry_notes_length;
        return ((_s_geometry_notes_length = (_s_geometry_notes = s.geometry_notes) === null || _s_geometry_notes === void 0 ? void 0 : _s_geometry_notes.length) !== null && _s_geometry_notes_length !== void 0 ? _s_geometry_notes_length : 0) > 0;
    }).length;
    var _years_yearIndex1, _reports_data, _reports_data1;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "flex h-screen min-h-0 flex-col bg-background text-foreground",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-ink px-4 py-3 sm:px-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex min-w-0 items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "grid h-9 w-9 shrink-0 place-items-center border border-ochre/60 bg-ochre/10",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__["Activity"], {
                                    className: "h-4 w-4 text-ochre"
                                }, void 0, false, {
                                    fileName: "[project]/client/app/page.tsx",
                                    lineNumber: 186,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/client/app/page.tsx",
                                lineNumber: 185,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "slab truncate text-lg leading-none text-foreground sm:text-xl",
                                        children: "Seismic Data Processing"
                                    }, void 0, false, {
                                        fileName: "[project]/client/app/page.tsx",
                                        lineNumber: 189,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "rail-label mt-1 truncate",
                                        children: [
                                            "GEOPIC · India survey atlas · ",
                                            all.length,
                                            " records"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/client/app/page.tsx",
                                        lineNumber: 192,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/client/app/page.tsx",
                                lineNumber: 188,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/app/page.tsx",
                        lineNumber: 184,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden shrink-0 items-center gap-4 md:flex",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                                label: "Mapped",
                                value: "".concat(mappedCount)
                            }, void 0, false, {
                                fileName: "[project]/client/app/page.tsx",
                                lineNumber: 198,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                                label: "Adjusted",
                                value: "".concat(adjusted)
                            }, void 0, false, {
                                fileName: "[project]/client/app/page.tsx",
                                lineNumber: 199,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                                label: "Timeline",
                                value: (_years_yearIndex1 = years[yearIndex]) !== null && _years_yearIndex1 !== void 0 ? _years_yearIndex1 : "ALL"
                            }, void 0, false, {
                                fileName: "[project]/client/app/page.tsx",
                                lineNumber: 200,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/app/page.tsx",
                        lineNumber: 197,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/app/page.tsx",
                lineNumber: 183,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid min-h-0 flex-1 grid-rows-[1fr_auto] lg:grid-rows-[minmax(0,1.45fr)_minmax(0,1fr)]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid min-h-0 grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)_20rem]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "hidden min-h-0 lg:block",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$components$2f$seismic$2f$FilterRail$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FilterRail"], {
                                    facets: facets,
                                    selected: selected,
                                    toggle: toggleFacet,
                                    clear: ()=>{
                                        setSelected(EMPTY);
                                        void (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logAudit"])("FILTER_CLEARED");
                                    },
                                    total: all.length,
                                    shown: filtered.length
                                }, void 0, false, {
                                    fileName: "[project]/client/app/page.tsx",
                                    lineNumber: 207,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/client/app/page.tsx",
                                lineNumber: 206,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "flex min-h-0 min-w-0 flex-col",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$components$2f$seismic$2f$RibbonBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RibbonBar"], {
                                        tool: tool,
                                        setTool: (t)=>{
                                            setTool(t);
                                            void (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logAudit"])("MAP_TOOL_USED", {
                                                details: {
                                                    tool: t
                                                }
                                            });
                                        },
                                        onZoom: (dir)=>{
                                            nonce.current += 1;
                                            setZoomSignal({
                                                dir,
                                                nonce: nonce.current
                                            });
                                        },
                                        onReset: ()=>setResetSignal((v)=>v + 1),
                                        onPrint: ()=>{
                                            var _ref;
                                            return void printReport((_ref = activeRec !== null && activeRec !== void 0 ? activeRec : filtered[0]) !== null && _ref !== void 0 ? _ref : null);
                                        },
                                        years: years,
                                        yearIndex: yearIndex,
                                        setYearIndex: setYearIndex,
                                        playing: playing,
                                        togglePlay: ()=>{
                                            setPlaying((p)=>!p);
                                            void (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logAudit"])("TIMELINE_PLAYED");
                                        },
                                        query: query,
                                        setQuery: setQuery,
                                        matches: filtered.length,
                                        onAdd: ()=>setAddOpen(true)
                                    }, void 0, false, {
                                        fileName: "[project]/client/app/page.tsx",
                                        lineNumber: 221,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "min-h-[18rem] flex-1",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$components$2f$seismic$2f$MapCanvas$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MapCanvas"], {
                                            surveys: filtered,
                                            selectedId: activeId,
                                            onSelect: selectRec,
                                            tool: tool,
                                            zoomSignal: zoomSignal,
                                            resetSignal: resetSignal,
                                            yearFilterActive: timelineYear
                                        }, void 0, false, {
                                            fileName: "[project]/client/app/page.tsx",
                                            lineNumber: 247,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/client/app/page.tsx",
                                        lineNumber: 246,
                                        columnNumber: 13
                                    }, this),
                                    adjusted > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "flex items-start gap-2 border-t border-border bg-rust/10 px-3 py-2 text-[0.7rem] leading-snug text-foreground/85",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {
                                                className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-rust"
                                            }, void 0, false, {
                                                fileName: "[project]/client/app/page.tsx",
                                                lineNumber: 259,
                                                columnNumber: 17
                                            }, this),
                                            adjusted,
                                            " footprint",
                                            adjusted > 1 ? "s" : "",
                                            " in view carry a cartographic note — squared to an axis-aligned box and/or clipped to the Indian boundary. Footprints outlined in dashed rust have an implausibly large extent in the source data and should be verified."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/client/app/page.tsx",
                                        lineNumber: 258,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/client/app/page.tsx",
                                lineNumber: 220,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "hidden min-h-0 lg:block",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$components$2f$seismic$2f$EntityPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EntityPanel"], {
                                    rec: activeRec,
                                    reports: (_reports_data = reports.data) !== null && _reports_data !== void 0 ? _reports_data : [],
                                    onPrint: ()=>void printReport(activeRec),
                                    onOpenDetails: ()=>{
                                        setDialogRec(activeRec);
                                        var _activeRec_project_id;
                                        void (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logAudit"])("DETAILS_OPENED", {
                                            project_id: (_activeRec_project_id = activeRec === null || activeRec === void 0 ? void 0 : activeRec.project_id) !== null && _activeRec_project_id !== void 0 ? _activeRec_project_id : null
                                        });
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/client/app/page.tsx",
                                    lineNumber: 268,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/client/app/page.tsx",
                                lineNumber: 267,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/app/page.tsx",
                        lineNumber: 205,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "min-h-[13rem] lg:min-h-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$components$2f$seismic$2f$BottomBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BottomBar"], {
                            rows: filtered,
                            selectedId: activeId,
                            onSelect: selectRec,
                            onMore: (rec)=>{
                                selectRec(rec);
                                setDialogRec(rec);
                            }
                        }, void 0, false, {
                            fileName: "[project]/client/app/page.tsx",
                            lineNumber: 281,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/client/app/page.tsx",
                        lineNumber: 280,
                        columnNumber: 9
                    }, this),
                    lastImport && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3 border-t border-seismic/40 bg-seismic/10 px-4 py-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                className: "h-4 w-4 shrink-0 text-seismic"
                            }, void 0, false, {
                                fileName: "[project]/client/app/page.tsx",
                                lineNumber: 294,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "min-w-0 flex-1 truncate text-[0.75rem] text-foreground/90",
                                children: [
                                    "Imported ",
                                    lastImport.count,
                                    " survey",
                                    lastImport.count > 1 ? "s" : "",
                                    lastImport.mapped > 0 ? " · ".concat(lastImport.mapped, " with geometry") : ""
                                ]
                            }, void 0, true, {
                                fileName: "[project]/client/app/page.tsx",
                                lineNumber: 295,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleRollback,
                                className: "rail-label shrink-0 border border-seismic/60 px-3 py-1 text-seismic transition-colors hover:bg-seismic hover:text-primary-foreground",
                                children: "Undo"
                            }, void 0, false, {
                                fileName: "[project]/client/app/page.tsx",
                                lineNumber: 299,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setLastImport(null),
                                className: "grid h-6 w-6 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-rust",
                                "aria-label": "Dismiss",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    className: "h-3.5 w-3.5"
                                }, void 0, false, {
                                    fileName: "[project]/client/app/page.tsx",
                                    lineNumber: 310,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/client/app/page.tsx",
                                lineNumber: 305,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/app/page.tsx",
                        lineNumber: 293,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/app/page.tsx",
                lineNumber: 204,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$components$2f$seismic$2f$AddSurveyDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AddSurveyDialog"], {
                open: addOpen,
                onClose: ()=>setAddOpen(false),
                onSubmit: handleAdd,
                onDelete: async (id)=>{
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deleteSurvey"])(id);
                    await queryClient.invalidateQueries({
                        queryKey: [
                            "surveys"
                        ]
                    });
                },
                onUpdate: async (id, data)=>{
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$seismic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updateSurvey"])(id, data);
                    await queryClient.invalidateQueries({
                        queryKey: [
                            "surveys"
                        ]
                    });
                },
                surveys: all,
                basins: [
                    ...new Set(all.map((r)=>{
                        var _r_projects;
                        return (_r_projects = r.projects) === null || _r_projects === void 0 ? void 0 : _r_projects.basin;
                    }).filter(Boolean))
                ].sort()
            }, void 0, false, {
                fileName: "[project]/client/app/page.tsx",
                lineNumber: 316,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$components$2f$seismic$2f$DetailsDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DetailsDialog"], {
                rec: dialogRec,
                reports: (_reports_data1 = reports.data) !== null && _reports_data1 !== void 0 ? _reports_data1 : [],
                onClose: ()=>setDialogRec(null),
                onPrint: (rec)=>void printReport(rec)
            }, void 0, false, {
                fileName: "[project]/client/app/page.tsx",
                lineNumber: 332,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/client/app/page.tsx",
        lineNumber: 182,
        columnNumber: 5
    }, this);
}
_s(Dashboard, "66WDUWxEAGe3+oo2JjV8z6Gh2K4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"],
        __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"],
        __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
_c = Dashboard;
function Stat(param) {
    let { label, value } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-right",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "rail-label",
                children: label
            }, void 0, false, {
                fileName: "[project]/client/app/page.tsx",
                lineNumber: 345,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "slab text-base text-ochre",
                children: value
            }, void 0, false, {
                fileName: "[project]/client/app/page.tsx",
                lineNumber: 346,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/client/app/page.tsx",
        lineNumber: 344,
        columnNumber: 5
    }, this);
}
_c1 = Stat;
var _c, _c1;
__turbopack_context__.k.register(_c, "Dashboard");
__turbopack_context__.k.register(_c1, "Stat");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=client_3d52c9e1._.js.map