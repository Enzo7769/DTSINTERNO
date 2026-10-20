/**
 * Propósito: Tabla de mano de obra de la pestaña HH. Calcula
 *   el costo como la hoja HH del Excel: horas × valor UF × 1,2.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-06
 * Dependencias: costeo, costo-lineas, costo-textos, hh-tareas,
 *   hw-catalogo, ui
 */

import { redondear } from "./costeo.js";
import {
  marcarIncluida,
  normalizarBusqueda,
  numeroVisible
} from "./costo-lineas.js";
import {
  CT,
  textoHhPorEquipo,
  textoHhValorLote
} from "./costo-textos.js";
import {
  TAREAS_HH,
  RECARGO_HH,
  conceptoHh,
  montoTareaUf
} from "./hh-tareas.js";
import { decimalesDe, leerMonto } from "./hw-catalogo.js";

/**
 * Arma la pestaña HH. Si el costo ya tenía estas tareas, quedan
 * activas; si no, el paquete parte apagado y las horas en 0.
 * @param {object[]} lineas líneas guardadas de mano de obra
 * @returns {HTMLElement}
 */
export function pintarPanelHh(lineas) {
  const guardadas = new Map();
  (lineas || []).forEach((linea) => {
    guardadas.set(normalizarBusqueda(linea.concepto), linea);
  });
  const caja = document.createElement("section");
  caja.id = "panel-manoObra";
  caja.className = "costeo-panel";
  caja.dataset.categoria = "manoObra";
  caja.setAttribute("role", "tabpanel");
  caja.setAttribute("aria-labelledby", "pestana-manoObra");
  caja.hidden = true;
  const tabla = document.createElement("table");
  tabla.className = "tabla-lineas costeo-tabla tabla-hh";
  const cuerpo = document.createElement("tbody");
  TAREAS_HH.forEach((tarea) => {
    const clave = normalizarBusqueda(conceptoHh(tarea));
    cuerpo.append(filaTarea(
      tarea,
      guardadas.get(clave) || null,
      guardadas.size > 0
    ));
    guardadas.delete(clave);
  });
  guardadas.forEach((linea) => cuerpo.append(filaDirecta(linea)));
  tabla.append(cabezaHh(), cuerpo, pieTabla());
  const envoltura = document.createElement("div");
  envoltura.className = "tabla-wrap";
  envoltura.append(tabla);
  const vacio = document.createElement("p");
  vacio.className = "ayuda costeo-vacio";
  vacio.hidden = true;
  const pie = document.createElement("p");
  pie.className = "costeo-pie";
  pie.dataset.pie = "manoObra";
  caja.append(introHh(lineas && lineas.length > 0), envoltura, vacio, pie);
  return caja;
}

/**
 * Enciende o apaga el paquete HH, como el 1 de la planilla.
 * @param {boolean} activo
 * @returns {void}
 */
export function fijarPaqueteHh(activo) {
  const casilla = document.getElementById("hh-paquete");
  if (!casilla) return;
  casilla.checked = Boolean(activo);
}

/**
 * @returns {boolean} si el paquete HH está encendido
 */
export function paqueteHhActivo() {
  return Boolean(document.getElementById("hh-paquete")?.checked);
}

/**
 * Escribe horas, valores ocultos y totales antes de leer el costo.
 * @returns {void}
 */
export function refrescarHh() {
  const caja = document.getElementById("panel-manoObra");
  if (!caja) return;
  const paquete = Boolean(
    document.getElementById("hh-paquete")?.checked
  );
  const equipos = equiposActuales();
  titular(equipos);
  const suma = { horas: 0, horasLote: 0, uf: 0, ufLote: 0 };
  caja.querySelectorAll("tr.costeo-fila").forEach((tr) => {
    const entra = paquete && activada(tr);
    const parcial = tr.dataset.directo === "1"
      ? aplicarDirecta(tr, entra, equipos)
      : aplicarTarea(tr, entra, equipos);
    suma.horas += parcial.horas;
    suma.horasLote += parcial.horasLote;
    suma.uf += parcial.uf;
    suma.ufLote += parcial.ufLote;
  });
  ponerTotal(suma);
}

/**
 * @param {boolean} activo
 * @returns {HTMLElement}
 */
function introHh(activo) {
  const caja = document.createElement("div");
  caja.className = "hh-intro";
  const etiqueta = document.createElement("label");
  etiqueta.className = "costeo-solo";
  const casilla = document.createElement("input");
  casilla.type = "checkbox";
  casilla.id = "hh-paquete";
  casilla.dataset.hhPaquete = "1";
  casilla.checked = activo;
  etiqueta.append(
    casilla,
    document.createTextNode(` ${CT.hhIncluir}`)
  );
  const ayuda = document.createElement("p");
  ayuda.className = "ayuda";
  ayuda.textContent = CT.hhAyuda;
  caja.append(etiqueta, ayuda);
  return caja;
}

/**
 * @returns {HTMLTableSectionElement}
 */
function cabezaHh() {
  const thead = document.createElement("thead");
  const tr = document.createElement("tr");
  columnasHh().forEach((columna) => {
    const th = document.createElement("th");
    th.textContent = columna.texto;
    if (columna.titulo) th.dataset.hhTitulo = columna.titulo;
    if (columna.numero) th.className = "hh-num";
    tr.append(th);
  });
  thead.append(tr);
  return thead;
}

/**
 * @returns {{texto: string, titulo: string, numero: boolean}[]}
 */
function columnasHh() {
  return [
    { texto: CT.hhActivar, titulo: "", numero: false },
    { texto: CT.hhTipo, titulo: "", numero: false },
    { texto: CT.hhComponente, titulo: "", numero: false },
    { texto: CT.hhDescripcion, titulo: "", numero: false },
    { texto: CT.hhPorEquipo, titulo: "", numero: true },
    { texto: textoHhPorEquipo(1), titulo: "lote", numero: true },
    { texto: CT.hhValorUf, titulo: "", numero: true },
    { texto: CT.hhValorEquipo, titulo: "", numero: true },
    {
      texto: textoHhValorLote(1),
      titulo: "valor-lote",
      numero: true
    }
  ];
}

/**
 * @param {object} tarea
 * @param {object|null} previa
 * @param {boolean} hayGuardadas
 * @returns {HTMLTableRowElement}
 */
function filaTarea(tarea, previa, hayGuardadas) {
  const tr = baseFila(conceptoHh(tarea), tarea.horas);
  tr.dataset.busqueda = normalizarBusqueda(
    `${tarea.tipo} ${tarea.componente} ${tarea.descripcion}`
  );
  tr.append(
    celdaActivar(hayGuardadas ? Boolean(previa) : true),
    celdaTexto(tarea.tipo),
    celdaTexto(tarea.componente),
    celdaTexto(tarea.descripcion),
    celdaNum("horas"),
    celdaNum("horas-lote"),
    celdaValorUf(valorInicial(tarea, previa)),
    celdaNum("uf"),
    celdaNum("uf-lote")
  );
  return tr;
}

/**
 * Línea de HH que no está en la tabla fija: se conserva tal cual.
 * @param {object} linea
 * @returns {HTMLTableRowElement}
 */
function filaDirecta(linea) {
  const horas = leerMonto(linea.cantidad, 2);
  const tr = baseFila(linea.concepto || "", horas);
  tr.dataset.directo = "1";
  tr.dataset.monedaGuardada = linea.moneda || "UF";
  tr.dataset.valorGuardado = numeroVisible(
    Number(linea.valor) || 0,
    decimalesDe(linea.moneda || "UF"),
    true
  );
  tr.dataset.busqueda = normalizarBusqueda(linea.concepto || "");
  const valor = document.createElement("td");
  valor.className = "hh-num";
  valor.textContent =
    `${tr.dataset.valorGuardado} ${tr.dataset.monedaGuardada}`;
  tr.append(
    celdaActivar(true),
    celdaTexto(CT.hhOtras),
    celdaTexto(""),
    celdaTexto(linea.concepto || ""),
    celdaNum("horas"),
    celdaNum("horas-lote"),
    valor,
    celdaNum("uf"),
    celdaNum("uf-lote")
  );
  return tr;
}

/**
 * @param {string} concepto
 * @param {number} horas
 * @returns {HTMLTableRowElement}
 */
function baseFila(concepto, horas) {
  const tr = document.createElement("tr");
  tr.className = "costeo-fila";
  tr.dataset.categoria = "manoObra";
  tr.dataset.origen = "hh";
  tr.dataset.concepto = String(concepto || "").slice(0, 160);
  tr.dataset.horas = String(horas);
  return tr;
}

/**
 * @param {boolean} activa
 * @returns {HTMLTableCellElement}
 */
function celdaActivar(activa) {
  const td = document.createElement("td");
  td.append(
    casilla("activar", CT.hhActivar, activa),
    oculto("incluir"),
    oculto("cantidad"),
    oculto("moneda"),
    oculto("valor")
  );
  return td;
}

/**
 * @param {string} clave
 * @param {string} etiqueta
 * @param {boolean} activo
 * @returns {HTMLInputElement}
 */
function casilla(clave, etiqueta, activo) {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.dataset.k = clave;
  input.checked = activo;
  input.setAttribute("aria-label", etiqueta);
  return input;
}

/**
 * @param {string} clave
 * @returns {HTMLInputElement}
 */
function oculto(clave) {
  const input = document.createElement("input");
  input.dataset.k = clave;
  if (clave === "incluir") {
    input.type = "checkbox";
    input.hidden = true;
  } else {
    input.type = "hidden";
    input.value = clave === "moneda" ? "UF" : "";
  }
  return input;
}

/**
 * @param {number} valor
 * @returns {HTMLTableCellElement}
 */
function celdaValorUf(valor) {
  const td = document.createElement("td");
  const input = document.createElement("input");
  input.className = "entrada-linea hh-uf";
  input.inputMode = "decimal";
  input.maxLength = 8;
  input.autocomplete = "off";
  input.dataset.k = "valor-uf";
  input.setAttribute("aria-label", CT.hhValorUf);
  input.value = numeroVisible(valor, 2, true);
  td.append(input);
  return td;
}

/**
 * @param {string} valor
 * @returns {HTMLTableCellElement}
 */
function celdaTexto(valor) {
  const td = document.createElement("td");
  td.textContent = valor;
  return td;
}

/**
 * @param {string} clave
 * @returns {HTMLTableCellElement}
 */
function celdaNum(clave) {
  const td = document.createElement("td");
  td.className = "hh-num";
  td.dataset.hh = clave;
  td.textContent = "0,00";
  return td;
}

/**
 * @returns {HTMLTableSectionElement}
 */
function pieTabla() {
  const tfoot = document.createElement("tfoot");
  const tr = document.createElement("tr");
  tr.className = "hh-total";
  const claves = {
    4: "horas",
    5: "horas-lote",
    7: "uf",
    8: "uf-lote"
  };
  for (let i = 0; i < 9; i += 1) {
    const td = document.createElement("td");
    if (i === 3) td.textContent = CT.hhTotal;
    if (claves[i]) {
      td.className = "hh-num";
      td.dataset.hhTotal = claves[i];
    }
    tr.append(td);
  }
  tfoot.append(tr);
  return tfoot;
}

/**
 * @param {object} tarea
 * @param {object|null} previa
 * @returns {number}
 */
function valorInicial(tarea, previa) {
  if (!previa || previa.moneda !== "UF") return tarea.valorUf;
  const bruto = Number(previa.valor) || 0;
  if (!(bruto > 0)) return tarea.valorUf;
  return Math.round((bruto / RECARGO_HH) * 100) / 100;
}

/**
 * @param {HTMLTableRowElement} tr
 * @returns {boolean}
 */
function activada(tr) {
  const casilla = tr.querySelector('[data-k="activar"]');
  return Boolean(casilla && casilla.checked);
}

/**
 * @param {HTMLTableRowElement} tr
 * @param {boolean} entra
 * @param {number} equipos
 * @returns {{horas: number, horasLote: number, uf: number,
 *   ufLote: number}}
 */
function aplicarTarea(tr, entra, equipos) {
  const base = Number(tr.dataset.horas) || 0;
  const horas = entra ? base : 0;
  const valorUf = leerMonto(valorUfDe(tr), 2);
  const uf = montoTareaUf(horas, valorUf, true);
  escribirOcultos(tr, horas, numeroVisible(valorUf * RECARGO_HH, 2, true),
    "UF");
  const horasLote = horas * equipos;
  poner(tr, "horas", numeroVisible(horas, 2, true));
  poner(tr, "horas-lote", numeroVisible(horasLote, 2, true));
  poner(tr, "uf", textoUf(uf));
  poner(tr, "uf-lote", textoUf(uf * equipos));
  return { horas, horasLote, uf, ufLote: uf * equipos };
}

/**
 * @param {HTMLTableRowElement} tr
 * @param {boolean} entra
 * @param {number} equipos
 * @returns {{horas: number, horasLote: number, uf: number,
 *   ufLote: number}}
 */
function aplicarDirecta(tr, entra, equipos) {
  const horas = entra ? Number(tr.dataset.horas) || 0 : 0;
  escribirOcultos(
    tr,
    horas,
    tr.dataset.valorGuardado || "",
    tr.dataset.monedaGuardada || "UF"
  );
  const horasLote = horas * equipos;
  poner(tr, "horas", numeroVisible(horas, 2, true));
  poner(tr, "horas-lote", numeroVisible(horasLote, 2, true));
  poner(tr, "uf", "—");
  poner(tr, "uf-lote", "—");
  return { horas, horasLote, uf: 0, ufLote: 0 };
}

/**
 * @param {HTMLTableRowElement} tr
 * @param {number} horas
 * @param {string} valor
 * @param {string} moneda
 * @returns {void}
 */
function escribirOcultos(tr, horas, valor, moneda) {
  const incluir = tr.querySelector('[data-k="incluir"]');
  incluir.checked = horas > 0;
  marcarIncluida(tr);
  tr.querySelector('[data-k="cantidad"]').value =
    numeroVisible(horas, 2, true);
  tr.querySelector('[data-k="valor"]').value = valor;
  tr.querySelector('[data-k="moneda"]').value = moneda;
}

/**
 * @param {HTMLTableRowElement} tr
 * @returns {string}
 */
function valorUfDe(tr) {
  const campo = tr.querySelector('[data-k="valor-uf"]');
  return campo ? campo.value : "";
}

/**
 * @param {number} equipos
 * @returns {void}
 */
function titular(equipos) {
  const caja = document.getElementById("panel-manoObra");
  const lote = caja.querySelector("[data-hh-titulo='lote']");
  const valor = caja.querySelector("[data-hh-titulo='valor-lote']");
  if (lote) lote.textContent = textoHhPorEquipo(equipos);
  if (valor) valor.textContent = textoHhValorLote(equipos);
}

/**
 * @param {{horas: number, horasLote: number, uf: number,
 *   ufLote: number}} suma
 * @returns {void}
 */
function ponerTotal(suma) {
  const caja = document.getElementById("panel-manoObra");
  const textos = {
    horas: numeroVisible(redondear(suma.horas, 2), 2, true),
    "horas-lote": numeroVisible(redondear(suma.horasLote, 2), 2, true),
    uf: textoUf(redondear(suma.uf, 4)),
    "uf-lote": textoUf(redondear(suma.ufLote, 4))
  };
  Object.entries(textos).forEach(([clave, texto]) => {
    const celda = caja.querySelector(`[data-hh-total="${clave}"]`);
    if (celda) celda.textContent = texto;
  });
}

/**
 * @param {HTMLTableRowElement} tr
 * @param {string} clave
 * @param {string} texto
 * @returns {void}
 */
function poner(tr, clave, texto) {
  const celda = tr.querySelector(`[data-hh="${clave}"]`);
  if (celda) celda.textContent = texto;
}

/**
 * @param {number} valor
 * @returns {string}
 */
function textoUf(valor) {
  return (Number(valor) || 0).toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });
}

/**
 * @returns {number}
 */
function equiposActuales() {
  const campo = document.getElementById("k-equipos");
  const n = leerMonto(campo ? campo.value : "1", 0);
  return n > 0 ? n : 1;
}
