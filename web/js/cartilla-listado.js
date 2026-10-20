/**
 * Propósito: Listado de cartillas de ruta con filtros.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: cartilla-pdf, cartilla-repositorio,
 *   cartilla-textos, constantes, errores, logger, ui
 */

import { descargarCartillaPdf } from "./cartilla-pdf.js";
import {
  eliminarCartilla,
  listarCartillas
} from "./cartilla-repositorio.js";
import { TXT } from "./cartilla-textos.js";
import { MSG } from "./constantes.js";
import { mensajeError } from "./errores.js";
import { registrarError } from "./logger.js";
import { etiquetaTipo, llenarFiltroTipo } from "./tipos-equipo.js";
import { avisar, mostrarVista, porId } from "./ui.js";

const FILTROS = {
  cliente: "cf-cliente",
  modelo: "cf-modelo",
  numeroSerie: "cf-serie",
  creadaPorNombre: "cf-creada"
};

let cache = null;

/**
 * @returns {void}
 */
export function invalidarCartillas() {
  cache = null;
}

/**
 * Conecta filtros y acciones del listado.
 * @returns {void}
 */
export function iniciarListadoCartillas() {
  llenarFiltroTipo(porId("cf-tipo"));
  porId("form-filtros-cartilla").addEventListener("submit", (evento) => {
    evento.preventDefault();
  });
  Object.values(FILTROS).forEach((id) => {
    porId(id).addEventListener("input", pintar);
  });
  porId("cf-tipo").addEventListener("change", pintar);
  porId("btn-cartilla-limpiar-filtros").addEventListener("click", () => {
    Object.values(FILTROS).forEach((id) => {
      porId(id).value = "";
    });
    porId("cf-tipo").value = "";
    pintar();
  });
  porId("btn-cartilla-nueva").addEventListener("click", () => {
    location.hash = "#/cartilla";
  });
  porId("cartilla-tabla").addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) return;
    ejecutar(boton.dataset.accion, boton.dataset.id).catch(fallo);
  });
}

/**
 * @returns {Promise<void>}
 */
export async function mostrarListadoCartillas() {
  document.title = TXT.tituloListado;
  mostrarVista("vista-cartillas");
  const estado = porId("cartilla-estado");
  estado.textContent = TXT.cargando;
  estado.hidden = false;
  try {
    if (!cache) cache = await listarCartillas();
    pintar();
  } catch (error) {
    fallo(error);
  }
}

/**
 * @returns {void}
 */
function pintar() {
  if (!cache) return;
  const consulta = {};
  Object.entries(FILTROS).forEach(([clave, id]) => {
    consulta[clave] = porId(id).value.trim().toLowerCase();
  });
  const tipo = porId("cf-tipo").value;
  const lista = cache
    .filter((registro) => Object.entries(consulta).every(
      ([clave, q]) => !q
        || String(registro[clave] || "").toLowerCase().includes(q)
    ))
    .filter((registro) => !tipo || registro.tipoEquipo === tipo)
    .sort((a, b) => (Number(b.numero) || 0) - (Number(a.numero) || 0));
  const cuerpo = porId("cartilla-tabla");
  cuerpo.replaceChildren();
  porId("cartilla-conteo").textContent =
    `${lista.length} ${TXT.registros}`;
  const estado = porId("cartilla-estado");
  estado.hidden = lista.length > 0;
  estado.textContent = TXT.sinResultados;
  lista.forEach((registro) => cuerpo.append(crearFila(registro)));
}

/**
 * @param {object} registro
 * @returns {HTMLTableRowElement}
 */
function crearFila(registro) {
  const tr = document.createElement("tr");
  [
    registro.numero,
    etiquetaTipo(registro.tipoEquipo),
    registro.cliente,
    registro.modelo,
    registro.numeroSerie,
    registro.numeroParte,
    registro.creadaPorNombre,
    registro.aprobadaPorNombre
  ].forEach((valor, indice) => {
    const td = document.createElement("td");
    td.textContent = valor ? String(valor) : "—";
    if (indice === 0) td.className = "numero";
    tr.append(td);
  });
  const acciones = document.createElement("td");
  acciones.className = "acciones";
  acciones.append(
    boton(MSG.abrir, "abrir", registro.id),
    boton(MSG.pdf, "pdf", registro.id),
    boton(MSG.eliminar, "eliminar", registro.id)
  );
  tr.append(acciones);
  return tr;
}

/**
 * @param {string} texto
 * @param {string} accion
 * @param {string} id
 * @returns {HTMLButtonElement}
 */
function boton(texto, accion, id) {
  const nodo = document.createElement("button");
  nodo.type = "button";
  nodo.className = accion === "eliminar"
    ? "boton boton-peligro"
    : "boton boton-secundario";
  nodo.textContent = texto;
  nodo.dataset.accion = accion;
  nodo.dataset.id = id;
  return nodo;
}

/**
 * @param {string} accion
 * @param {string} id
 * @returns {Promise<void>}
 */
async function ejecutar(accion, id) {
  if (!id) return;
  if (accion === "abrir") {
    location.hash = `#/cartilla?id=${encodeURIComponent(id)}`;
    return;
  }
  const registro = (cache || []).find((item) => item.id === id);
  if (!registro) return;
  if (accion === "pdf") {
    await descargarCartillaPdf(registro);
    return;
  }
  if (accion === "eliminar") {
    if (!window.confirm(TXT.confirmarEliminar)) return;
    await eliminarCartilla(id);
    cache = await listarCartillas();
    pintar();
    avisar(TXT.eliminada, "ok");
  }
}

/**
 * @param {unknown} error
 * @returns {void}
 */
function fallo(error) {
  registrarError(error, "cartillas");
  porId("cartilla-estado").hidden = false;
  porId("cartilla-estado").textContent = mensajeError(error);
  avisar(mensajeError(error), "error");
}
