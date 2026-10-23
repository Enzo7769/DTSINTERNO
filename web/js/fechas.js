/**
 * Propósito: Fechas de inspección y salida en formato ISO.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: ninguna
 */

/**
 * Valida una fecha YYYY-MM-DD de calendario.
 * @param {unknown} valor
 * @returns {boolean}
 */
export function fechaValida(valor) {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    String(valor || "")
  );
  if (!coincidencia) return false;
  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.getFullYear() === anio
    && fecha.getMonth() === mes - 1
    && fecha.getDate() === dia;
}

/**
 * Presenta una fecha ISO como DD/MM/AAAA.
 * @param {unknown} valor
 * @returns {string}
 */
export function formatearFecha(valor) {
  if (!fechaValida(valor)) return "";
  const [anio, mes, dia] = String(valor).split("-");
  return `${dia}/${mes}/${anio}`;
}

/**
 * Fecha local de hoy en YYYY-MM-DD.
 * @returns {string}
 */
export function hoyIso() {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/**
 * Fecha y hora local para el pie del PDF.
 * @returns {string}
 */
export function ahoraLegible() {
  return new Date().toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

/**
 * Milisegundos de un Timestamp de Firestore o de un número.
 * @param {unknown} valor
 * @returns {number}
 */
export function aMillis(valor) {
  if (valor && typeof valor === "object" && "toMillis" in valor) {
    const fn = valor.toMillis;
    if (typeof fn === "function") return fn.call(valor);
  }
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }
  return 0;
}

/**
 * Fecha y hora para tablas de fichas enviadas.
 * @param {unknown} valor
 * @returns {string}
 */
export function formatearFechaHora(valor) {
  const ms = millisDe(valor);
  if (!ms) return "";
  return new Date(ms).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

/**
 * @param {unknown} valor
 * @returns {number}
 */
export function millisDe(valor) {
  const directo = aMillis(valor);
  if (directo) return directo;
  if (valor && typeof valor === "object") {
    const seg = Number(valor.seconds);
    if (Number.isFinite(seg) && seg > 0) return seg * 1000;
  }
  if (typeof valor === "string" && valor) {
    const ms = Date.parse(valor);
    return Number.isFinite(ms) ? ms : 0;
  }
  return 0;
}
