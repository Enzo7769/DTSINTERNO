/**
 * Propósito: Listado de checklists con filtros.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: constantes, errores, fechas, filtros, logger,
 *   pdf, repositorio, ui
 */

import { ETIQUETA_ESTADO, MSG } from "./constantes.js";
import { mensajeError } from "./errores.js";
import { formatearFecha } from "./fechas.js";
import { aplicarFiltros, ordenarPorSalida } from "./filtros.js";
import { registrarError } from "./logger.js";
import { descargarPdf } from "./pdf.js";
import {
  eliminarChecklist,
  listarChecklists
} from "./repositorio.js";
import { etiquetaTipo, llenarFiltroTipo } from "./tipos-equipo.js";
import { avisar, mostrarVista, porId } from "./ui.js";

const CAMPOS = [
  "filtro-proyecto",
  "filtro-cliente",
  "filtro-tecnico",
  "filtro-serie",
  "filtro-fecha-inspeccion",
  "filtro-fecha-salida",
  "filtro-estado",
  "filtro-tipo"
];

let cache = null;

/**
 * Vacía la caché para releer después de un cambio.
 * @returns {void}
 */
export function invalidarListado() {
  cache = null;
}

/**
 * Conecta filtros y acciones del listado.
 * @returns {void}
 */
export function iniciarListado() {
  llenarFiltroTipo(porId("filtro-tipo"));
  porId("form-filtros").addEventListener("submit", (evento) => {
    evento.preventDefault();
  });
  const alEscribir = () => {
    pintar().catch(fallo);
  };
  CAMPOS.forEach((id) => {
    porId(id).addEventListener("input", alEscribir);
    porId(id).addEventListener("change", alEscribir);
  });
  porId("btn-limpiar-filtros").addEventListener("click", () => {
    CAMPOS.forEach((id) => {
      porId(id).value = "";
    });
    pintar().catch(fallo);
  });
  porId("btn-nuevo").addEventListener("click", () => {
    location.hash = "#/checklist";
  });
  porId("tabla-cuerpo").addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) return;
    const id = boton.getAttribute("data-id");
    const accion = boton.getAttribute("data-accion");
    ejecutar(accion, id).catch(fallo);
  });
}

/**
 * Muestra el listado y carga los registros.
 * @returns {Promise<void>}
 */
export async function mostrarListado() {
  try {
    document.title = MSG.tituloListado;
    mostrarVista("vista-listado");
    porId("estado-listado").textContent = MSG.cargando;
    porId("estado-listado").hidden = false;
    if (!cache) cache = await listarChecklists();
    await pintar();
  } catch (error) {
    registrarError(error, "mostrarListado");
    throw error;
  }
}

/**
 * @returns {Promise<void>}
 */
async function pintar() {
  if (!cache) return;
  const lista = ordenarPorSalida(
    aplicarFiltros(cache, leerFiltros())
  );
  const cuerpo = porId("tabla-cuerpo");
  cuerpo.replaceChildren();
  porId("conteo-registros").textContent =
    `${lista.length} ${MSG.registros}`;
  if (!lista.length) {
    porId("estado-listado").textContent = MSG.sinResultados;
    porId("estado-listado").hidden = false;
    return;
  }
  porId("estado-listado").hidden = true;
  lista.forEach((registro) => {
    cuerpo.append(crearFila(registro));
  });
}

/**
 * @returns {object}
 */
function leerFiltros() {
  return {
    proyecto: porId("filtro-proyecto").value,
    cliente: porId("filtro-cliente").value,
    tecnico: porId("filtro-tecnico").value,
    serie: porId("filtro-serie").value,
    fechaInspeccion: porId("filtro-fecha-inspeccion").value,
    fechaSalida: porId("filtro-fecha-salida").value,
    estado: porId("filtro-estado").value,
    tipoEquipo: porId("filtro-tipo").value
  };
}

/**
 * @param {object} registro
 * @returns {HTMLTableRowElement}
 */
function crearFila(registro) {
  const tr = document.createElement("tr");
  const celdas = [
    textoNumero(registro),
    etiquetaTipo(registro.tipoEquipo),
    formatearFecha(registro.fechaSalida),
    registro.proyecto,
    registro.cliente,
    registro.tecnico,
    registro.numeroSerie,
    registro.mac,
    registro.ip,
    formatearFecha(registro.fechaInspeccion)
  ];
  celdas.forEach((texto, indice) => {
    const td = document.createElement("td");
    td.textContent = texto || "—";
    if (indice === 0) td.className = "numero";
    tr.append(td);
  });
  tr.append(celdaEstado(registro.estado));
  tr.append(celdaAcciones(registro.id));
  return tr;
}

/**
 * @param {object} registro
 * @returns {string}
 */
function textoNumero(registro) {
  const numero = Number(registro.numero);
  if (!Number.isInteger(numero) || numero <= 0) return "—";
  return String(numero);
}

/**
 * @param {string} estado
 * @returns {HTMLTableCellElement}
 */
function celdaEstado(estado) {
  const td = document.createElement("td");
  const pill = document.createElement("span");
  pill.className = `pill pill-${estado || "vacio"}`;
  pill.textContent = ETIQUETA_ESTADO[estado] || "—";
  td.append(pill);
  return td;
}

/**
 * @param {string} id
 * @returns {HTMLTableCellElement}
 */
function celdaAcciones(id) {
  const td = document.createElement("td");
  td.className = "acciones";
  td.append(botonAccion(MSG.abrir, "abrir", id));
  td.append(botonAccion(MSG.pdf, "pdf", id));
  td.append(botonAccion(MSG.eliminar, "eliminar", id));
  return td;
}

/**
 * @param {string} texto
 * @param {string} accion
 * @param {string} id
 * @returns {HTMLButtonElement}
 */
function botonAccion(texto, accion, id) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = accion === "eliminar"
    ? "boton boton-peligro"
    : "boton boton-secundario";
  boton.textContent = texto;
  boton.dataset.accion = accion;
  boton.dataset.id = id;
  return boton;
}

/**
 * @param {string|null} accion
 * @param {string|null} id
 * @returns {Promise<void>}
 */
async function ejecutar(accion, id) {
  if (!id) return;
  if (accion === "abrir") {
    location.hash = `#/checklist?id=${encodeURIComponent(id)}`;
    return;
  }
  const registro = (cache || []).find((item) => item.id === id);
  if (!registro) return;
  if (accion === "pdf") {
    await descargarPdf(registro);
    return;
  }
  if (accion === "eliminar") {
    if (!window.confirm(MSG.confirmarEliminar)) return;
    await eliminarChecklist(id);
    invalidarListado();
    cache = await listarChecklists();
    await pintar();
    avisar(MSG.eliminado, "ok");
  }
}

/**
 * @param {unknown} error
 * @returns {void}
 */
function fallo(error) {
  registrarError(error, "listado");
  porId("estado-listado").hidden = false;
  porId("estado-listado").textContent = mensajeError(error);
  avisar(mensajeError(error), "error");
}
