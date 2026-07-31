import { convertSurvey, haversineKm } from "../src/lib/crs.js"
import type { SurveyInput } from "../src/lib/crs.js"

const g = (rows: Array<[number | null, number | null]>) =>
  rows.map(([x, y], i) => ({ x, y, il: null, xl: null, corner: i + 1 }))

const cases: Array<{ name: string; input: SurveyInput; expect: [number, number] }> = [
  { name: "D1 Mumbai (feet, zone 42)", input: { g: g([[731780.7384, 2101410.868], [671149.8464, 2078051.8107], [755139.7957, 2040779.976], [694508.9037, 2017420.9187]]), utmZone: "UTM zone 43", projection: "UTM 43N", spheroid: "WGS 84", basin: "B&S Asset", siCode: "D1" }, expect: [19.0, 72.3] },
  { name: "R62-R70 Jaisalmer (feet, zone 42)", input: { g: g([[578211.5, 3026521.16], [599821.03, 3071588.11], [644887.98, 3049978.6], [623278.48, 3004911.66]]), utmZone: "UTM zone 42", projection: "UTM 42N", spheroid: "WGS-84", basin: "WON", siCode: "R62,R63,R64,R65,R66,R67,R68,R69,R0" }, expect: [27.4, 71.8] },
  { name: "CY-UDWHP Cauvery (zone 44, metre eastings)", input: { g: g([[382921, 1222120], [588529, 1291116.69], [588529, 1435430], [516949, 1504427.16]]), utmZone: "UTM zone 44", projection: "UTM 44N", spheroid: "WGS 84", basin: "CAUVERY", siCode: "CY-UDWHP-2021/1" }, expect: [12.3, 81.2] },
  { name: "KG-DWN-98/2 (zone 43 mislabeled 44)", input: { g: g([[605978.14734, 1745913.07348], [670466.441869, 1784155.857031], [638593.20422, 1837903.27049], [574104.910432, 1799660.486676]]), utmZone: "UTM zone 44", projection: "UTM 44N", spheroid: "WGS 84", basin: "KG BASIN", siCode: "KG-DWN-98/2" }, expect: [16.3, 81.9] },
  { name: "TR80 Tripura (Kalianpur IIb)", input: { g: g([[2939685.76905, 707464.6137], [2938840.5875, 721318.8574], [2958384.254, 722511.12358], [2959229.43557, 708656.8799]]), utmZone: "UTM zone 46", projection: "LAMBERT SINGLE PARALLEL", spheroid: "WGS 84", basin: "A&AA", siCode: "TR80" }, expect: [23.6, 91.6] },
  { name: "G485 Gujarat (Kalianpur IIa)", input: { g: g([[2567807.31383, 602392.24561], [2590363.09787, 610592.03868], [2582163.3048, 633147.82272], [2559607.52076, 624948.02965]]), utmZone: "UTM zone 46", projection: "LAMBERT 2A", spheroid: "EVEREST", basin: "WON", siCode: "G485" }, expect: [23.4, 72.3] },
  { name: "WB153 (Kalianpur IIb)", input: { g: g([[2591565.75, 611267.25], [2635138.96, 586785.1], [2586174.65, 499638.68], [2542601.44, 524120.83]]), utmZone: "UTM zone 46", projection: "LAMBERT-IIB", spheroid: "EVEREST 1830", basin: "MBA", siCode: "WB153,WB154" }, expect: [23.2, 88.4] },
  { name: "MP40A (swapped xy, zone 43)", input: { g: g([[2638774.3, 351734.1], [2655042, 337670.8], [2638774.3, 351734.1], [2655042, 337670.8]]), utmZone: "UTM zone 44", projection: "UTM 44N", spheroid: "WGS 84", basin: "NULL0", siCode: "MP40A" }, expect: [23.8, 79.5] },
  { name: "A308 North Barack (digit fix, IIb)", input: { g: g([[29980000, 793000], [3020472.421663, 783590.132128], [2989932.411487, 794705.786786], [2995917.763995, 811150.40765]]), utmZone: "UTM zone 46", projection: "UTM 43N", spheroid: "WGS 84", basin: "A&AA", siCode: "A308" }, expect: [24.9, 92.7] },
  { name: "MB-OSHP-2018/1 (digit fix y, zone 43)", input: { g: g([[127779.67, 23130808.25], [173344.67, 23120535.83], [126984.4, 2275041.58], [172549.4, 2274087.15]]), utmZone: "UTM zone 42", projection: "NULL3", spheroid: "NULL3", basin: "WOB", siCode: "MB-OSHP-2018/1" }, expect: [20.7, 71.9] },
  { name: "B170,B55 (feet easting)", input: { g: g([[781765.04, 2250586.14], [881750.62, 2252284.48], [783887.96, 2125604.17], [883873.54, 2127302.51]]), utmZone: "UTM zone 42", projection: "UTM 42N", spheroid: "WGS-1984", basin: "WOB", siCode: "B170,B55" }, expect: [20.3, 72.5] },
  { name: "JK17 Poonch (zone 42)", input: { g: g([[422624.01, 3714597.83], [434021.6, 3722285.33], [null, null], [null, null]]), utmZone: "UTM zone 43", projection: "UTM", spheroid: "EVEREST 1830", basin: "FRONTIER", siCode: "JK17" }, expect: [33.4, 74.2] },
  { name: "HP44 Kangra (zone 42)", input: { g: g([[648229.26, 3542258.08], [672054.64, 3509893.58], [null, null], [null, null]]), utmZone: "UTM zone 43", projection: "UTM 43N", spheroid: "WGS 84", basin: "FRONTIER", siCode: "HP44" }, expect: [31.8, 76.4] },
  { name: "G375 Gandhar (zone 42, Everest)", input: { g: g([[255607.21, 2418716.95], [252724.48809, 2438467.68453], [282390.17052, 2442797.54438], [285272.89242, 2423046.80985]]), utmZone: "UTM zone 43", projection: "LAMBERT III-A", spheroid: "EVEREST", basin: "CAMBAY", siCode: "G375" }, expect: [21.9, 72.8] },
  { name: "CB-ONN-2010/9 (digit fix g3x)", input: { g: g([[219859.516, 2523912.75], [236751.69, 2527408.27], [21449.375, 2550059], [214449.375, 2550059]]), utmZone: "UTM zone 43", projection: "UTM 43N", spheroid: "WGS 84", basin: "CGS", siCode: "CB-ONN-2010/9" }, expect: [23.0, 72.6] },
]

let failures = 0
for (const c of cases) {
  const r = convertSurvey(c.input)
  const dist = r.centroid ? haversineKm(r.centroid.lat, r.centroid.lon, c.expect[0], c.expect[1]) : Infinity
  const ok = dist < 120
  if (!ok) failures++
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name}`)
  console.log(`      status=${r.status} crs=${r.crs.label} centroid=${r.centroid ? `${r.centroid.lat.toFixed(3)},${r.centroid.lon.toFixed(3)}` : "none"} dist=${dist.toFixed(0)}km`)
  for (const i of r.issues) console.log(`      issue: ${i}`)
  for (const co of r.corrections) console.log(`      fix: ${co}`)
}
console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`)
