/**
 * Propósito: Descargar tablas como CSV compatible con Excel.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: ninguna
 *
 * Usa «;» y BOM UTF-8, como espera Excel en configuración chilena.
 */

const SEPARADOR = ";";
const INICIO_FORMULA = /^[=+\-@\t\r]/;

/**
 * Escapa comillas y neutraliza fórmulas (inyección CSV).
 * @param {unknown} valor
 * @returns {string}
 */
export function celdaCsv(valor) {
  let texto = String(valor ?? "").replace(/\r?\n/g, " ");
  if (INICIO_FORMULA.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, "\"\"")}"`;
}

/**
 * @param {string[]} cabecera
 * @param {unknown[][]} filas
 * @param {string} nombre
 * @returns {void}
 */
export function descargarCsv(cabecera, filas, nombre) {
  const lineas = [cabecera, ...filas].map((fila) => {
    return fila.map(celdaCsv).join(SEPARADOR);
  });
  const blob = new Blob(["\uFEFF", lineas.join("\r\n")], {
    type: "text/csv;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
