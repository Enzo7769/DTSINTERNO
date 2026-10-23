/**
 * Propósito: Catálogo de modelos en tarjetas, con filtros.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: constantes, errores, espec-listado, hw-catalogo,
 *   logger, modelo-costos, modelo-pdf, modelo-repositorio,
 *   modelo-textos,
 *   planilla-importar, tipos-equipo, ui
 */

import { MSG } from "./constantes.js";
import { mensajeError } from "./errores.js";
import { invalidarEspecs } from "./espec-listado.js";
import {
  ESTADOS_MODELO,
  TIPOS_MODELO,
  etiquetaDe
} from "./hw-catalogo.js";
import { registrarError } from "./logger.js";
import { costosDelModelo } from "./modelo-costos.js";
import {
  descargarCatalogoModelosPdf,
  descargarModeloPdf
} from "./modelo-pdf.js";
import { eliminarModelo, listarModelos } from "./modelo-repositorio.js";
import {
  MT,
  textoClientesMas,
  textoEliminarConCostos,
  textoModelosImportados
} from "./modelo-textos.js";
import { importarModelos } from "./planilla-importar.js";
import { llenarFiltroTipo } from "./tipos-equipo.js";
import { avisar, mostrarVista, porId } from "./ui.js";

const ORDEN_TIPO = new Map(TIPOS_MODELO.map((tipo, i) => [tipo.id, i]));
const CLIENTES_VISIBLES = 2;

let cache = null;
let autor = { uid: "", email: "" };
let importando = false;

/**
 * @returns {void}
 */
export function invalidarModelos() {
  cache = null;
}

/**
 * @param {{uid: string, email: string}} sesion
 * @returns {void}
 */
export function definirAutorListadoModelos(sesion) {
  autor = sesion;
}

/**
 * @returns {void}
 */
export function iniciarListadoModelos() {
  llenarFiltroTipo(porId("mf-tipo"), TIPOS_MODELO);
  llenarFiltroTipo(porId("mf-estado"), ESTADOS_MODELO);
  porId("form-filtros-modelo").addEventListener("submit", (evento) => {
    evento.preventDefault();
  });
  porId("mf-texto").addEventListener("input", pintar);
  porId("mf-tipo").addEventListener("change", pintar);
  porId("mf-estado").addEventListener("change", pintar);
  porId("btn-modelo-limpiar").addEventListener("click", () => {
    ["mf-texto", "mf-tipo", "mf-estado"].forEach((id) => {
      porId(id).value = "";
    });
    pintar();
  });
  porId("btn-modelo-nuevo").addEventListener("click", () => {
    location.hash = "#/modelo";
  });
  porId("btn-modelo-todo").addEventListener("click", () => {
    exportarTodo().catch(fallo);
  });
  porId("btn-modelo-importar").addEventListener("click", () => {
    importar().catch(fallo);
  });
  porId("modelo-grid").addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) return;
    ejecutar(boton.dataset.accion, boton.dataset.id).catch(fallo);
  });
}

/**
 * @returns {Promise<void>}
 */
export async function mostrarListadoModelos() {
  document.title = MT.tituloListado;
  mostrarVista("vista-modelos");
  const estado = porId("modelo-estado");
  estado.textContent = MT.cargando;
  estado.hidden = false;
  try {
    if (!cache) cache = await listarModelos();
    pintar();
  } catch (error) {
    fallo(error);
  }
}

/**
 * @returns {object[]}
 */
function filtrados() {
  if (!cache) return [];
  const q = porId("mf-texto").value.trim().toLowerCase();
  const tipo = porId("mf-tipo").value;
  const estado = porId("mf-estado").value;
  return cache
    .filter((modelo) => !tipo || modelo.tipo === tipo)
    .filter((modelo) => !estado || modelo.estado === estado)
    .filter((modelo) => !q || [
      modelo.nombre, modelo.otroNombre, ...(modelo.clientes || [])
    ].some((valor) => String(valor || "").toLowerCase().includes(q)))
    .sort((a, b) => {
      const tipoOrden = (ORDEN_TIPO.get(a.tipo) ?? 9)
        - (ORDEN_TIPO.get(b.tipo) ?? 9);
      return tipoOrden || String(a.nombre).localeCompare(b.nombre, "es");
    });
}

/**
 * @returns {void}
 */
function pintar() {
  if (!cache) return;
  const lista = filtrados();
  const grid = porId("modelo-grid");
  grid.replaceChildren();
  porId("modelo-conteo").textContent = `${lista.length} ${MT.registros}`;
  porId("modelo-vacio").hidden = cache.length > 0;
  const estado = porId("modelo-estado");
  estado.hidden = lista.length > 0 || cache.length === 0;
  estado.textContent = MT.sinResultados;
  lista.forEach((modelo) => grid.append(tarjeta(modelo)));
}

/**
 * @param {object} modelo
 * @returns {HTMLElement}
 */
function tarjeta(modelo) {
  const caja = document.createElement("article");
  caja.className = "modelo-tarjeta";
  caja.append(portada(modelo));
  const cuerpo = document.createElement("div");
  cuerpo.className = "modelo-cuerpo";
  const fila = document.createElement("div");
  fila.className = "modelo-pills";
  const tipo = document.createElement("span");
  tipo.className = "modelo-tipo";
  tipo.textContent = etiquetaDe(TIPOS_MODELO, modelo.tipo);
  fila.append(tipo);
  if (modelo.estado === "descontinuado") {
    fila.append(pill(
      etiquetaDe(ESTADOS_MODELO, modelo.estado),
      "pill-rechazado"
    ));
  }
  const titulo = document.createElement("h3");
  titulo.textContent = modelo.nombre;
  const clientes = parrafo(
    textoClientes(modelo.clientes || []),
    "modelo-clientes"
  );
  clientes.title = (modelo.clientes || []).join(", ");
  cuerpo.append(fila, titulo, clientes);
  const acciones = document.createElement("div");
  acciones.className = "modelo-acciones";
  acciones.append(
    boton(MSG.abrir, "abrir", modelo.id),
    boton(MSG.pdf, "pdf", modelo.id),
    boton(MSG.eliminar, "eliminar", modelo.id)
  );
  caja.append(cuerpo, acciones);
  return caja;
}

/**
 * PDF con portada, índice y una página por modelo filtrado.
 * @returns {Promise<void>}
 */
async function exportarTodo() {
  const lista = filtrados();
  if (!lista.length) {
    avisar(MT.sinModelosPdf, "aviso");
    return;
  }
  const boton = porId("btn-modelo-todo");
  boton.disabled = true;
  boton.textContent = MT.generandoTodo;
  try {
    await descargarCatalogoModelosPdf(lista);
  } finally {
    boton.disabled = false;
    boton.textContent = MT.exportarTodo;
  }
}

/**
 * @param {object} modelo
 * @returns {HTMLElement}
 */
function portada(modelo) {
  const marco = document.createElement("div");
  marco.className = "modelo-portada";
  if (modelo.imagen) {
    const img = document.createElement("img");
    img.src = modelo.imagen;
    img.alt = modelo.nombre;
    img.loading = "lazy";
    marco.append(img);
  } else {
    const vacia = document.createElement("span");
    vacia.textContent = MT.sinImagen;
    marco.append(vacia);
  }
  return marco;
}

/**
 * @param {string[]} clientes
 * @returns {string}
 */
function textoClientes(clientes) {
  if (!clientes.length) return MT.sinClientes;
  const primeros = clientes.slice(0, CLIENTES_VISIBLES).join(", ");
  const resto = clientes.length - CLIENTES_VISIBLES;
  return resto > 0 ? textoClientesMas(primeros, resto) : primeros;
}

/**
 * @param {string} texto
 * @param {string} clase
 * @returns {HTMLElement}
 */
function pill(texto, clase) {
  const nodo = document.createElement("span");
  nodo.className = `pill ${clase}`;
  nodo.textContent = texto;
  return nodo;
}

/**
 * @param {string} texto
 * @param {string} clase
 * @returns {HTMLParagraphElement}
 */
function parrafo(texto, clase) {
  const nodo = document.createElement("p");
  nodo.className = clase;
  nodo.textContent = texto;
  return nodo;
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
    location.hash = `#/modelo?id=${encodeURIComponent(id)}`;
    return;
  }
  const modelo = (cache || []).find((item) => item.id === id);
  if (!modelo) return;
  if (accion === "pdf") {
    await descargarModeloPdf(modelo);
    return;
  }
  if (accion === "eliminar") {
    const costos = await costosDelModelo(modelo.nombreClave);
    const aviso = costos.length
      ? textoEliminarConCostos(costos.length)
      : MT.confirmarEliminar;
    if (!window.confirm(aviso)) return;
    await eliminarModelo(id);
    invalidarEspecs();
    cache = await listarModelos();
    pintar();
    avisar(MT.eliminado, "ok");
  }
}

/**
 * Solo se ofrece con el catálogo vacío, para no duplicar.
 * @returns {Promise<void>}
 */
async function importar() {
  if (importando || (cache && cache.length)) return;
  if (!window.confirm(MT.confirmarImportar)) return;
  const boton = porId("btn-modelo-importar");
  importando = true;
  boton.disabled = true;
  boton.textContent = MT.importando;
  try {
    const total = await importarModelos(autor);
    cache = await listarModelos();
    pintar();
    avisar(textoModelosImportados(total), "ok");
  } finally {
    importando = false;
    boton.disabled = false;
    boton.textContent = MT.importar;
  }
}

/**
 * @param {unknown} error
 * @returns {void}
 */
function fallo(error) {
  registrarError(error, "modelos");
  porId("modelo-estado").hidden = false;
  porId("modelo-estado").textContent = mensajeError(error);
  avisar(mensajeError(error), "error");
}
