/**
 * Propósito: Barra de pestañas (2 visibles + ver otros).
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-15
 * Dependencias: ninguna
 */

export const TOPE_PESTANAS = 2;

const TXT = {
  listo: "Listo",
  falta: "Pendiente"
};

/**
 * Los 2 primeros y, si el activo es otro, también ese.
 * @param {number} total
 * @param {number} activo
 * @returns {number[]}
 */
export function indicesBarra(total, activo) {
  const vis = [];
  const n = Math.min(TOPE_PESTANAS, total);
  for (let i = 0; i < n; i += 1) vis.push(i);
  if (activo >= n && activo < total) vis.push(activo);
  return vis;
}

/**
 * @param {{
 *   items: {titulo: string, listo?: boolean}[],
 *   activo: number,
 *   otrosAbiertos?: boolean,
 *   prefijo: string,
 *   txtOtros: string,
 *   txtOcultar: string,
 *   txtListo?: string,
 *   txtFalta?: string
 * }} ops
 * @returns {HTMLElement}
 */
export function crearBarraPestanas(ops) {
  const items = ops.items || [];
  const activo = Number(ops.activo);
  const abiertos = ops.otrosAbiertos === true;
  const prefijo = ops.prefijo;
  const labels = {
    listo: ops.txtListo || TXT.listo,
    falta: ops.txtFalta || TXT.falta
  };
  const caja = document.createElement("div");
  caja.className = "ficha-totem-caja";
  const barra = document.createElement("div");
  barra.className = "ficha-totem-barra";
  const lista = document.createElement("div");
  lista.className = "ficha-totem-lista";
  indicesBarra(items.length, activo).forEach((i) => {
    lista.append(
      itemPestana(items[i], i, i === activo, prefijo, labels)
    );
  });
  barra.append(lista);
  if (items.length > TOPE_PESTANAS) {
    barra.append(botonOtros(abiertos, prefijo, ops));
  }
  caja.append(barra);
  if (abiertos && items.length > TOPE_PESTANAS) {
    caja.append(listaOtros(items, activo, prefijo, labels));
  }
  return caja;
}

/**
 * @param {boolean} abiertos
 * @param {string} prefijo
 * @param {{txtOtros: string, txtOcultar: string}} ops
 * @returns {HTMLButtonElement}
 */
function botonOtros(abiertos, prefijo, ops) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ficha-totem-otros-btn";
  btn.dataset.accion = abiertos
    ? `${prefijo}:ocultarOtros`
    : `${prefijo}:verOtros`;
  btn.textContent = abiertos ? ops.txtOcultar : ops.txtOtros;
  return btn;
}

/**
 * @param {object[]} items
 * @param {number} activo
 * @param {string} prefijo
 * @param {{listo: string, falta: string}} labels
 * @returns {HTMLElement}
 */
function listaOtros(items, activo, prefijo, labels) {
  const extra = document.createElement("div");
  extra.className = "ficha-totem-otros";
  for (let i = TOPE_PESTANAS; i < items.length; i += 1) {
    extra.append(
      itemPestana(items[i], i, i === activo, prefijo, labels)
    );
  }
  return extra;
}

/**
 * @param {{titulo?: string, listo?: boolean}} item
 * @param {number} i
 * @param {boolean} activo
 * @param {string} prefijo
 * @param {{listo: string, falta: string}} labels
 * @returns {HTMLButtonElement}
 */
function itemPestana(item, i, activo, prefijo, labels) {
  const fila = item || {};
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ficha-totem-item";
  if (activo) btn.classList.add("es-activo");
  if (fila.listo) btn.classList.add("es-listo");
  btn.dataset.accion = `${prefijo}:elegir:${i}`;
  const nro = document.createElement("span");
  nro.className = "ficha-totem-nro";
  nro.textContent = String(i + 1).padStart(2, "0");
  const check = document.createElement("span");
  check.className = "ficha-totem-check";
  check.setAttribute("aria-hidden", "true");
  check.textContent = fila.listo ? "✓" : "";
  const nom = document.createElement("span");
  nom.className = "ficha-totem-nombre";
  nom.textContent = fila.titulo || String(i + 1);
  const est = document.createElement("span");
  est.className = "ficha-totem-estado";
  est.textContent = fila.listo ? labels.listo : labels.falta;
  btn.append(nro, check, nom, est);
  return btn;
}
