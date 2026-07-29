module.exports = [
"[project]/client/node_modules/shpjs/lib/index.js [app-ssr] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/1e749_e0ac8a90._.js",
  "server/chunks/ssr/[root-of-the-server]__9f9b4669._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/client/node_modules/shpjs/lib/index.js [app-ssr] (ecmascript)");
    });
});
}),
"[project]/client/node_modules/xlsx/xlsx.mjs [app-ssr] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/1e749_xlsx_xlsx_mjs_ba12a971._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/client/node_modules/xlsx/xlsx.mjs [app-ssr] (ecmascript)");
    });
});
}),
];