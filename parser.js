/*
 * Lector de la hoja "Gantt Control" (formato Constructora Londres).
 * Convierte la planilla semanal en el archivo data/avance.json que usa el dashboard.
 * Funciona en el navegador (window.GanttParser) y en Node (module.exports).
 *
 * Estructura esperada de "Gantt Control" (igual en todas las semanas):
 *   Fila 3 : fechas de inicio de cada semana (columna U, Z, AE, ... cada 5 columnas)
 *   Fila 5 : encabezados ("AV. REAL" en T, "AV. PROGRAMADO" en V, ...)
 *   F3 = cantidad de viviendas · F4 = fecha de control · E7 = nombre obra · I7 = término obra
 *   Desde fila 7: A=Resumen(Sí/No) B=Nivel D=Ítem E=Partida H=Inicio I=Término Q=Unidad R=Incidencia
 *   Bloque semanal (5 columnas desde T): real acumulado, real parcial, prog. acumulado, prog. parcial
 *   Filas resumen al final: OBRA, OBRAS PREVIAS, VIVIENDAS, URBANIZACIÓN, EQUIPAMIENTO (peso en columna G)
 */
(function (root) {
  "use strict";
  var COL = { A: 0, B: 1, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, Q: 16, R: 17, T: 19 };
  var STRIDE = 5;
  var MACROS = ["OBRAS PREVIAS", "VIVIENDAS", "URBANIZACIÓN", "EQUIPAMIENTO"];

  function serialToISO(v) {
    if (typeof v !== "number" || !isFinite(v) || v < 20000 || v > 80000) return null;
    var d = new Date(Math.round((v - 25569) * 86400000));
    return d.toISOString().slice(0, 10);
  }
  function num(v) { return (typeof v === "number" && isFinite(v)) ? v : 0; }
  function round(v) { return Math.round(v * 1e6) / 1e6; }
  function txt(v) { return v === null || v === undefined ? "" : String(v).trim(); }

  function parseGrid(grid, fuente) {
    var cell = function (r, c) { var row = grid[r]; return row ? (row[c] === undefined ? null : row[c]) : null; };
    // --- validaciones de estructura ---
    if (txt(cell(4, COL.T)) !== "AV. REAL") {
      throw new Error("La hoja no tiene el formato esperado: falta 'AV. REAL' en la celda T5 de 'Gantt Control'.");
    }
    var fechaControl = serialToISO(cell(3, COL.F));
    if (!fechaControl) throw new Error("No se encontró la FECHA CONTROL en la celda F4.");
    // --- semanas ---
    var semanas = [];
    for (var c = COL.T; ; c += STRIDE) {
      if (txt(cell(4, c)) !== "AV. REAL") break;
      var iso = serialToISO(cell(2, c + 1));
      if (!iso) break;
      semanas.push(iso);
    }
    if (semanas.length < 2) throw new Error("No se encontraron las semanas (fila 3) en 'Gantt Control'.");
    var nw = semanas.length;
    function series(r, offset) {
      var out = new Array(nw);
      for (var j = 0; j < nw; j++) out[j] = round(num(cell(r, COL.T + STRIDE * j + offset)));
      return out;
    }
    // --- filas ---
    var filas = [], resumen = {}, filaObra = -1;
    for (var r = 6; r < grid.length; r++) {
      var partida = txt(cell(r, COL.E));
      if (!partida) continue;
      if (partida === "OBRA" && filaObra < 0 && cell(r, COL.B) === null) { filaObra = r; }
      if (filaObra >= 0) {
        if (partida === "OBRA" || MACROS.indexOf(partida) >= 0) {
          resumen[partida] = { peso: partida === "OBRA" ? 1 : round(num(cell(r, COL.G))), real: series(r, 0), prog: series(r, 2) };
        }
        continue;
      }
      var nivel = cell(r, COL.B);
      var esHoja = txt(cell(r, COL.A)) === "No" && typeof cell(r, COL.R) === "number";
      var f = {
        fila: r + 1,
        nivel: typeof nivel === "number" ? nivel : null,
        item: txt(cell(r, COL.D)),
        partida: partida,
        hoja: esHoja
      };
      if (esHoja) {
        f.inicio = serialToISO(cell(r, COL.H));
        f.termino = serialToISO(cell(r, COL.I));
        f.unidad = txt(cell(r, COL.Q)) || "Global";
        f.incid = Math.round(num(cell(r, COL.R)) * 1e6) / 1e6;
        f.real = series(r, 0);
        f.prog = series(r, 2);
      }
      filas.push(f);
    }
    if (filaObra < 0 || !resumen.OBRA) throw new Error("No se encontró la fila resumen 'OBRA' al final de 'Gantt Control'.");
    MACROS.forEach(function (m) { if (!resumen[m]) throw new Error("Falta la fila resumen '" + m + "'."); });
    return {
      version: 1,
      fuente: fuente || "",
      generado: new Date().toISOString(),
      obra: txt(cell(6, COL.E)),
      casas: num(cell(2, COL.F)),
      fechaControl: fechaControl,
      inicioObra: serialToISO(cell(6, COL.H)),
      terminoObra: serialToISO(cell(6, COL.I)),
      semanas: semanas,
      resumen: resumen,
      filas: filas
    };
  }

  function parseWorkbook(XLSX, data, fuente) {
    var wb = XLSX.read(data, { type: "array", sheets: ["Gantt Control"], cellFormula: false, cellHTML: false, cellText: false, cellStyles: false });
    var ws = wb.Sheets["Gantt Control"];
    if (!ws) throw new Error("El archivo no tiene la hoja 'Gantt Control'.");
    var rg = XLSX.utils.decode_range(ws["!ref"]);
    rg.s.r = 0; rg.s.c = 0;               // leer siempre desde A1 para conservar filas/columnas
    ws["!ref"] = XLSX.utils.encode_range(rg);
    var grid = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: true });
    return parseGrid(grid, fuente);
  }

  var api = { parseGrid: parseGrid, parseWorkbook: parseWorkbook };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.GanttParser = api;
})(this);
