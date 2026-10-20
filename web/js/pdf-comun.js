/**
 * Propósito: Piezas comunes de los PDF de costos y modelos.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: ninguna
 */

/**
 * @param {string} titulo
 * @param {string} subtitulo
 * @param {string} rotulo
 * @returns {HTMLElement}
 */
export function cabeceraPdf(titulo, subtitulo, rotulo) {
  const tabla = document.createElement("table");
  tabla.className = "pdf-marca evitar-corte";
  const fila = document.createElement("tr");
  const logo = document.createElement("td");
  const img = document.createElement("img");
  img.src = "./assets/logo-dts.png";
  img.alt = "DTS";
  img.className = "pdf-logo";
  logo.append(img);
  const texto = document.createElement("td");
  texto.append(
    div("pdf-titulo", titulo),
    div("pdf-sub", subtitulo),
    div("pdf-num", rotulo)
  );
  fila.append(logo, texto);
  tabla.append(fila);
  return tabla;
}

/**
 * Tabla de pares rótulo / valor, de a dos por fila.
 * @param {[string, string][]} pares
 * @returns {HTMLTableElement}
 */
export function tablaPares(pares) {
  const tabla = document.createElement("table");
  tabla.className = "pdf-tabla pdf-ficha";
  for (let i = 0; i < pares.length; i += 2) {
    const tr = document.createElement("tr");
    tr.className = "evitar-corte";
    [pares[i], pares[i + 1] || ["", ""]].forEach(([rotulo, valor]) => {
      const th = document.createElement("th");
      th.textContent = rotulo;
      const td = document.createElement("td");
      td.textContent = valor || (rotulo ? "—" : "");
      tr.append(th, td);
    });
    tabla.append(tr);
  }
  return tabla;
}

/**
 * @param {string[]} cabecera
 * @param {string[][]} filas
 * @param {Set<number>} [derecha] índices alineados a la derecha
 * @returns {HTMLTableElement}
 */
export function tablaDatos(cabecera, filas, derecha) {
  const tabla = document.createElement("table");
  tabla.className = "pdf-tabla";
  const cabeza = document.createElement("tr");
  cabecera.forEach((texto) => {
    const th = document.createElement("th");
    th.className = "pdf-col";
    th.textContent = texto;
    cabeza.append(th);
  });
  tabla.append(cabeza);
  filas.forEach((fila) => {
    const tr = document.createElement("tr");
    tr.className = "evitar-corte";
    fila.forEach((texto, indice) => {
      const td = document.createElement("td");
      td.textContent = texto || "—";
      if (derecha && derecha.has(indice)) td.className = "pdf-derecha";
      tr.append(td);
    });
    tabla.append(tr);
  });
  return tabla;
}

/**
 * @param {string} clase
 * @param {string} texto
 * @returns {HTMLElement}
 */
export function div(clase, texto) {
  const nodo = document.createElement("div");
  nodo.className = clase;
  nodo.textContent = texto;
  return nodo;
}

/**
 * @param {string} texto
 * @returns {HTMLElement}
 */
export function subtitulo(texto) {
  const h2 = document.createElement("h2");
  h2.textContent = texto;
  return h2;
}

/**
 * Nombre de archivo seguro.
 * @param {string} prefijo
 * @param {unknown} nombre
 * @param {number} [numero]
 * @returns {string}
 */
export function archivoPdf(prefijo, nombre, numero) {
  const base = String(nombre || "sin-nombre")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 50);
  const n = numero ? `N${numero}_` : "";
  return `${prefijo}_${n}${base}.pdf`;
}
