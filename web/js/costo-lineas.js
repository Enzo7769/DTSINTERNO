/**
 * Propósito: Filas de componentes de la hoja de costeo (del catálogo
 *   o manuales), lectura, subtotales, resumen y guía en pantalla.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: costeo, costo-textos, costo-validacion, hw-catalogo, ui
 */

import {
  conceptoDe,
  linkSeguro,
  parUsdClp,
  resumenCategorias,
  textoUsdYClp
} from "./costeo.js";
import { AYUDA_COSTEO, CT, textoLote } from "./costo-textos.js";
import { LIMITES_COSTO, normalizarCosto } from "./costo-validacion.js";
import { MONEDAS, decimalesDe, formatoMonto } from "./hw-catalogo.js";
import { porId } from "./ui.js";

/** Moneda sugerida para un componente nuevo: casi todo se cotiza así. */
const MONEDA_LINEA = "CLP";
const SELECTOR_FILA = "tr.costeo-fila";

/**
 * Número con formato chileno, sin prefijo de moneda.
 * @param {number} valor
 * @param {number} decimales
 * @param {boolean} [fijo] siempre muestra todos los decimales
 * @returns {string}
 */
export function numeroVisible(valor, decimales, fijo) {
  return (Number(valor) || 0).toLocaleString("es-CL", {
    minimumFractionDigits: fijo ? decimales : 0,
    maximumFractionDigits: decimales
  });
}

/**
 * @param {string} valor
 * @returns {string}
 */
export function normalizarBusqueda(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * @returns {void}
 */
export function pintarAyudaCosteo() {
  porId("costo-ayuda-titulo").textContent = CT.comoUsar;
  porId("costo-ayuda-lista").replaceChildren(...AYUDA_COSTEO.map((paso) => {
    const li = document.createElement("li");
    const titulo = document.createElement("strong");
    titulo.textContent = paso.titulo;
    li.append(titulo, document.createTextNode(` ${paso.texto}`));
    return li;
  }));
}

/**
 * Fila de un componente del catálogo; el concepto no se edita.
 * @param {string} categoria
 * @param {string[]} item [tipo, componente, descripción]
 * @param {object|null} linea datos guardados, si estaba incluido
 * @returns {HTMLTableRowElement}
 */
export function filaCatalogo(categoria, item, linea) {
  const [, componente, descripcion] = item;
  const porConjunto = categoria === "ferreteria" && descripcion;
  const celda = document.createElement("td");
  celda.className = "costeo-concepto";
  const nombre = document.createElement("strong");
  nombre.textContent = porConjunto ? descripcion : componente;
  celda.append(nombre);
  if (descripcion && !porConjunto) {
    const detalle = document.createElement("small");
    detalle.textContent = descripcion;
    celda.append(detalle);
  }
  const tr = filaBase(categoria, "catalogo", celda,
    linea ? { ...linea, incluido: true } : {});
  tr.dataset.concepto = conceptoDe(categoria, item);
  tr.dataset.busqueda = normalizarBusqueda(item.join(" "));
  return tr;
}

/**
 * Fila escrita a mano; nace incluida.
 * @param {string} categoria
 * @param {object} linea
 * @returns {HTMLTableRowElement}
 */
export function filaManual(categoria, linea) {
  const celda = celdaInput("concepto", linea.concepto || "",
    LIMITES_COSTO.concepto, CT.conceptoManual);
  celda.classList.add("costeo-concepto");
  const tr = filaBase(categoria, "manual", celda,
    { ...linea, incluido: true });
  const quitar = document.createElement("button");
  quitar.type = "button";
  quitar.className = "boton boton-secundario";
  quitar.dataset.quitarLinea = "1";
  quitar.textContent = CT.quitar;
  tr.lastElementChild.append(quitar);
  return tr;
}

/**
 * @param {string} categoria
 * @param {string} origen «catalogo» o «manual»
 * @param {HTMLTableCellElement} celdaConcepto
 * @param {object} linea
 * @returns {HTMLTableRowElement}
 */
function filaBase(categoria, origen, celdaConcepto, linea) {
  const tr = document.createElement("tr");
  tr.className = "costeo-fila";
  tr.dataset.categoria = categoria;
  tr.dataset.origen = origen;
  const moneda = linea.moneda || MONEDA_LINEA;
  const valor = linea.valor
    ? numeroVisible(linea.valor, decimalesDe(moneda), true)
    : "";
  const marca = document.createElement("td");
  const casilla = document.createElement("input");
  casilla.type = "checkbox";
  casilla.dataset.k = "incluir";
  casilla.checked = Boolean(linea.incluido);
  casilla.title = CT.incluirTitulo;
  casilla.setAttribute("aria-label", CT.incluir);
  marca.append(casilla);
  const subtotal = document.createElement("td");
  subtotal.className = "subtotal-linea";
  tr.append(
    marca,
    celdaConcepto,
    celdaInput("cantidad", numeroVisible(linea.cantidad || 1, 3), 8),
    celdaSelect("moneda", MONEDAS, moneda),
    celdaInput("valor", valor, 16),
    celdaInput("fabricante", linea.fabricante || "",
      LIMITES_COSTO.fabricante),
    celdaLink(linea.link || ""),
    subtotal,
    document.createElement("td")
  );
  marcarIncluida(tr);
  actualizarLink(tr);
  return tr;
}

/**
 * @param {string} clave
 * @param {{id: string, etiqueta: string}[]} opciones
 * @param {string} valor
 * @returns {HTMLTableCellElement}
 */
function celdaSelect(clave, opciones, valor) {
  const td = document.createElement("td");
  const select = document.createElement("select");
  select.className = "entrada-linea";
  select.dataset.k = clave;
  opciones.forEach((item) => {
    const opcion = document.createElement("option");
    opcion.value = item.id;
    opcion.textContent = item.etiqueta;
    select.append(opcion);
  });
  select.value = valor;
  td.append(select);
  return td;
}

/**
 * @param {string} clave
 * @param {string} valor
 * @param {number} max
 * @param {string} [ejemplo]
 * @returns {HTMLTableCellElement}
 */
function celdaInput(clave, valor, max, ejemplo) {
  const td = document.createElement("td");
  const input = document.createElement("input");
  input.className = "entrada-linea";
  input.maxLength = max;
  input.autocomplete = "off";
  input.inputMode = ["cantidad", "valor"].includes(clave)
    ? "decimal"
    : "text";
  input.dataset.k = clave;
  input.value = valor;
  if (ejemplo) input.placeholder = ejemplo;
  td.append(input);
  return td;
}

/**
 * @param {string} valor
 * @returns {HTMLTableCellElement}
 */
function celdaLink(valor) {
  const td = celdaInput("link", valor, LIMITES_COSTO.link, CT.linkEjemplo);
  td.className = "costeo-link";
  td.firstElementChild.type = "url";
  const abrir = document.createElement("a");
  abrir.className = "costeo-abrir";
  abrir.target = "_blank";
  abrir.rel = "noopener noreferrer";
  abrir.textContent = CT.abrirLink;
  abrir.title = CT.abrirLinkTitulo;
  abrir.hidden = true;
  td.append(abrir);
  return td;
}

/**
 * Muestra «Abrir» solo si el link es seguro y marca el inválido.
 * @param {HTMLTableRowElement} tr
 * @returns {void}
 */
export function actualizarLink(tr) {
  const input = tr.querySelector('[data-k="link"]');
  const abrir = tr.querySelector(".costeo-abrir");
  const seguro = linkSeguro(input.value, LIMITES_COSTO.link);
  input.classList.toggle("entrada-invalida",
    Boolean(input.value.trim()) && !seguro);
  abrir.hidden = !seguro;
  if (seguro) abrir.href = seguro;
  else abrir.removeAttribute("href");
}

/**
 * @param {HTMLTableRowElement} tr
 * @returns {void}
 */
export function marcarIncluida(tr) {
  tr.classList.toggle("incluida", incluida(tr));
}

/**
 * @param {HTMLTableRowElement} tr
 * @returns {boolean}
 */
export function incluida(tr) {
  const casilla = tr.querySelector('[data-k="incluir"]');
  return Boolean(casilla && casilla.checked);
}

/**
 * @param {HTMLTableRowElement} tr
 * @param {string} clave
 * @returns {string}
 */
export function valorDe(tr, clave) {
  const campo = tr.querySelector(`[data-k="${clave}"]`);
  return campo ? campo.value : "";
}

/**
 * @param {HTMLTableRowElement} tr
 * @returns {object}
 */
function leerFila(tr) {
  return {
    categoria: tr.dataset.categoria,
    concepto: tr.dataset.origen === "manual"
      ? valorDe(tr, "concepto")
      : (tr.dataset.concepto || valorDe(tr, "concepto")),
    cantidad: valorDe(tr, "cantidad"),
    moneda: valorDe(tr, "moneda"),
    valor: valorDe(tr, "valor"),
    fabricante: valorDe(tr, "fabricante"),
    link: valorDe(tr, "link")
  };
}

/**
 * @returns {object[]} solo las filas incluidas, tal como están escritas
 */
export function leerLineas() {
  return [...porId("costo-lineas").querySelectorAll(SELECTOR_FILA)]
    .filter(incluida)
    .map(leerFila);
}

/**
 * Subtotal por fila incluida (en la moneda del costo y, si difiere,
 * en la cotizada) y totales por categoría para las pestañas.
 * @param {object} crudo datos del formulario sin normalizar
 * @param {{usd: number, uf: number}} cambio tipos ya numéricos
 * @returns {Map<string, {n: number, total: number}>}
 */
export function pintarSubtotales(crudo, cambio) {
  const totales = new Map();
  porId("costo-lineas").querySelectorAll(SELECTOR_FILA).forEach((tr) => {
    const celda = tr.querySelector(".subtotal-linea");
    if (!incluida(tr)) {
      if (celda) celda.textContent = "—";
      return;
    }
    const [linea] = normalizarCosto({
      ...crudo,
      lineas: [{ ...leerFila(tr), concepto: "x" }]
    }).lineas;
    if (!linea) return;
    if (celda) {
      pintarMontoPar(
        celda,
        linea.subtotalCosto,
        crudo.moneda,
        cambio
      );
    }
    const previo = totales.get(tr.dataset.categoria) || { n: 0, total: 0 };
    totales.set(tr.dataset.categoria, {
      n: previo.n + 1,
      total: previo.total + linea.subtotalCosto
    });
  });
  return totales;
}

/**
 * @param {object} limpio costo normalizado
 * @returns {void}
 */
export function pintarResumen(limpio) {
  const filas = resumenCategorias(limpio.lineas, limpio.moneda);
  const tabla = porId("costo-resumen");
  tabla.hidden = filas.length === 0;
  porId("costo-resumen-vacio").hidden = filas.length > 0;
  tabla.tBodies[0].replaceChildren(...filas.map((fila) => {
    const tr = document.createElement("tr");
    [
      fila.etiqueta,
      String(fila.items),
      "",
      `${numeroVisible(fila.porcentaje, 1, true)} %`
    ].forEach((texto, indice) => {
      const td = document.createElement("td");
      if (indice === 2) {
        pintarMontoPar(
          td,
          fila.subtotal,
          limpio.moneda,
          limpio.tipoCambio
        );
      } else {
        td.textContent = texto;
      }
      tr.append(td);
    });
    return tr;
  }));
  porId("costo-lote-titulo").textContent =
    `${CT.costoLote} (${textoLote(limpio.cantidadEquipos)})`;
  pintarMontoPar(
    porId("costo-total"),
    limpio.costoLote,
    limpio.moneda,
    limpio.tipoCambio
  );
  porId("costo-equivale").textContent = limpio.costo > 0
    ? textoUsdYClp(limpio.costo, limpio.moneda, limpio.tipoCambio)
    : "";
}

/**
 * Monto en dólares y, debajo, en pesos.
 * @param {HTMLElement} caja
 * @param {number} valor
 * @param {string} moneda
 * @param {{usd: number, uf: number}} cambio
 * @returns {void}
 */
function pintarMontoPar(caja, valor, moneda, cambio) {
  const pares = parUsdClp(valor, moneda, cambio);
  const lista = pares.length
    ? pares
    : [{ moneda, valor: Number(valor) || 0 }];
  caja.replaceChildren(...lista.map((item, indice) => {
    const nodo = document.createElement("span");
    if (indice > 0) nodo.className = "monto-par";
    nodo.textContent = formatoMonto(item.valor, item.moneda);
    return nodo;
  }));
}
