/**
 * Propósito: Galería de fichas. La foto muestra los datos al pasar
 *   el mouse.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: errores, espec-textos, hw-catalogo, logger,
 *   modelo-pdf, modelo-repositorio, tipos-equipo, ui
 */

import { mensajeError } from "./errores.js";
import {
  ET,
  FILAS_VISTA,
  textoAvance,
  textoClientes,
  textoFoto
} from "./espec-textos.js";
import { TIPOS_MODELO, avanceFicha, etiquetaDe } from "./hw-catalogo.js";
import { registrarError } from "./logger.js";
import {
  descargarCatalogoEspecPdf,
  descargarEspecPdf
} from "./modelo-pdf.js";
import { listarModelos } from "./modelo-repositorio.js";
import { llenarFiltroTipo } from "./tipos-equipo.js";
import { avisar, mostrarVista, porId } from "./ui.js";

const ORDEN_TIPO = new Map(TIPOS_MODELO.map((tipo, i) => [tipo.id, i]));
const DEMORA_CIERRE = 140;
const CLIENTES_VISIBLES = 2;

let cache = null;
let ancla = null;
let cierre = 0;

/**
 * @returns {void}
 */
export function invalidarEspecs() {
  cache = null;
}

/**
 * @returns {void}
 */
export function iniciarListadoEspecs() {
  const popover = porId("espec-popover");
  llenarFiltroTipo(porId("ef-tipo"), TIPOS_MODELO);
  porId("form-filtros-espec").addEventListener("submit", (evento) => {
    evento.preventDefault();
  });
  porId("ef-texto").addEventListener("input", pintar);
  porId("ef-tipo").addEventListener("change", pintar);
  porId("ef-avance").addEventListener("change", pintar);
  porId("btn-espec-limpiar").addEventListener("click", () => {
    ["ef-texto", "ef-tipo", "ef-avance"].forEach((id) => {
      porId(id).value = "";
    });
    pintar();
  });
  porId("btn-espec-modelos").addEventListener("click", () => {
    location.hash = "#/modelos";
  });
  porId("btn-espec-todo").addEventListener("click", () => {
    exportarTodo().catch(fallo);
  });
  const grid = porId("espec-grid");
  grid.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) return;
    ejecutar(boton.dataset.accion, boton.dataset.id).catch(fallo);
  });
  grid.addEventListener("mouseover", (evento) => {
    const foto = evento.target.closest(".ref-foto");
    if (foto) mostrarDatos(foto);
  });
  grid.addEventListener("mouseout", (evento) => {
    if (evento.target.closest(".ref-foto")) salir(evento.relatedTarget);
  });
  grid.addEventListener("focusin", (evento) => {
    const foto = evento.target.closest(".ref-foto");
    if (foto) mostrarDatos(foto);
  });
  grid.addEventListener("focusout", (evento) => {
    if (evento.target.closest(".ref-foto")) salir(evento.relatedTarget);
  });
  popover.addEventListener("mouseenter", () => window.clearTimeout(cierre));
  popover.addEventListener("mouseleave", () => programarCierre());
  window.addEventListener("scroll", ocultar, true);
}

/**
 * @returns {Promise<void>}
 */
export async function mostrarListadoEspecs() {
  document.title = ET.tituloListado;
  mostrarVista("vista-especificaciones");
  const estado = porId("espec-estado");
  estado.textContent = ET.cargando;
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
  const q = porId("ef-texto").value.trim().toLowerCase();
  const tipo = porId("ef-tipo").value;
  const avance = porId("ef-avance").value;
  return cache
    .filter((modelo) => !tipo || modelo.tipo === tipo)
    .filter((modelo) => !avance || estadoFicha(modelo) === avance)
    .filter((modelo) => !q || [
      modelo.nombre,
      modelo.otroNombre,
      ...(modelo.clientes || [])
    ].some((valor) => String(valor || "").toLowerCase().includes(q)))
    .sort((a, b) => {
      const tipoOrden = (ORDEN_TIPO.get(a.tipo) ?? 9)
        - (ORDEN_TIPO.get(b.tipo) ?? 9);
      return tipoOrden || String(a.nombre).localeCompare(b.nombre, "es");
    });
}

/**
 * @param {object} modelo
 * @returns {"completa"|"incompleta"}
 */
function estadoFicha(modelo) {
  const { llenos, total } = avanceFicha(modelo.ficha);
  return llenos === total ? "completa" : "incompleta";
}

/**
 * @returns {void}
 */
function pintar() {
  if (!cache) return;
  ocultar();
  const lista = filtrados();
  const grid = porId("espec-grid");
  grid.replaceChildren();
  porId("espec-conteo").textContent = `${lista.length} ${ET.registros}`;
  porId("espec-vacio").hidden = cache.length > 0;
  const estado = porId("espec-estado");
  estado.hidden = lista.length > 0 || cache.length === 0;
  estado.textContent = ET.sinResultados;
  lista.forEach((modelo) => grid.append(tarjeta(modelo)));
}

/**
 * @param {object} modelo
 * @returns {HTMLElement}
 */
function tarjeta(modelo) {
  const caja = document.createElement("article");
  caja.className = "ref-card";
  const foto = document.createElement("button");
  foto.type = "button";
  foto.className = "ref-foto";
  foto.dataset.id = modelo.id;
  foto.setAttribute("aria-label", textoFoto(modelo.nombre));
  foto.append(contenidoFoto(modelo));
  const cuerpo = document.createElement("div");
  cuerpo.className = "ref-cuerpo";
  const tipo = document.createElement("span");
  tipo.className = "ref-tipo";
  tipo.textContent = etiquetaDe(TIPOS_MODELO, modelo.tipo);
  const nombre = document.createElement("h3");
  nombre.textContent = modelo.nombre;
  const clientes = document.createElement("p");
  clientes.className = "ref-clientes";
  clientes.textContent = textoClientes(modelo.clientes, CLIENTES_VISIBLES);
  clientes.title = (modelo.clientes || []).join(", ");
  cuerpo.append(tipo, nombre, clientes, avanceTarjeta(modelo));
  const acciones = document.createElement("div");
  acciones.className = "ref-acciones";
  acciones.append(
    boton(ET.editarFicha, "abrir", modelo.id),
    boton(ET.pdf, "pdf", modelo.id)
  );
  caja.append(foto, cuerpo, acciones);
  return caja;
}

/**
 * Barra con los datos completos de la ficha.
 * @param {object} modelo
 * @returns {HTMLElement}
 */
function avanceTarjeta(modelo) {
  const { llenos, total } = avanceFicha(modelo.ficha);
  const completa = llenos === total;
  const caja = document.createElement("div");
  caja.className = completa ? "ref-avance completa" : "ref-avance";
  const texto = document.createElement("span");
  texto.textContent = completa
    ? ET.fichaCompleta
    : textoAvance(llenos, total);
  const barra = document.createElement("div");
  barra.className = completa ? "avance-barra completa" : "avance-barra";
  barra.setAttribute("aria-hidden", "true");
  const relleno = document.createElement("span");
  relleno.style.width = `${(llenos / total) * 100}%`;
  barra.append(relleno);
  caja.append(texto, barra);
  return caja;
}

/**
 * PDF con portada, índice y una página por equipo filtrado.
 * @returns {Promise<void>}
 */
async function exportarTodo() {
  const lista = filtrados();
  if (!lista.length) {
    avisar(ET.sinFichas, "aviso");
    return;
  }
  const boton = porId("btn-espec-todo");
  boton.disabled = true;
  boton.textContent = ET.generandoTodo;
  try {
    ocultar();
    await descargarCatalogoEspecPdf(lista);
  } finally {
    boton.disabled = false;
    boton.textContent = ET.exportarTodo;
  }
}

/**
 * @param {object} modelo
 * @returns {HTMLElement}
 */
function contenidoFoto(modelo) {
  if (!modelo.imagen) {
    const vacio = document.createElement("span");
    vacio.textContent = ET.sinImagen;
    return vacio;
  }
  const img = document.createElement("img");
  img.src = modelo.imagen;
  img.alt = "";
  img.draggable = false;
  return img;
}

/**
 * @param {HTMLButtonElement} foto
 * @returns {void}
 */
function mostrarDatos(foto) {
  const modelo = (cache || []).find((item) => item.id === foto.dataset.id);
  if (!modelo) return;
  window.clearTimeout(cierre);
  ancla = foto;
  const popover = porId("espec-popover");
  popover.replaceChildren(tablaDatos(modelo));
  popover.hidden = false;
  ubicar(foto, popover);
}

/**
 * @param {object} modelo
 * @returns {HTMLTableElement}
 */
function tablaDatos(modelo) {
  const ficha = modelo.ficha || {};
  const tabla = document.createElement("table");
  tabla.className = "ref-tabla";
  FILAS_VISTA.forEach((fila) => {
    const valor = fila.id === "nombre" ? modelo.nombre : ficha[fila.id];
    if (!fila.siempre && !valor) return;
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = fila.etiqueta;
    const td = document.createElement("td");
    td.textContent = valor || "—";
    tr.append(th, td);
    tabla.append(tr);
  });
  return tabla;
}

/**
 * @param {HTMLElement} foto
 * @param {HTMLElement} popover
 * @returns {void}
 */
function ubicar(foto, popover) {
  const caja = foto.getBoundingClientRect();
  const margen = 8;
  const ancho = popover.offsetWidth;
  const alto = popover.offsetHeight;
  let left = caja.right + 12;
  if (left + ancho > window.innerWidth - margen) {
    left = caja.left - ancho - 12;
  }
  left = Math.max(margen, left);
  let top = caja.top;
  if (top + alto > window.innerHeight - margen) {
    top = window.innerHeight - alto - margen;
  }
  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(Math.max(margen, top))}px`;
}

/**
 * @param {EventTarget|null} destino
 * @returns {void}
 */
function salir(destino) {
  const popover = porId("espec-popover");
  const nodo = destino instanceof Node ? destino : null;
  if (nodo && (ancla && ancla.contains(nodo) || popover.contains(nodo))) {
    return;
  }
  programarCierre();
}

/**
 * @returns {void}
 */
function programarCierre() {
  window.clearTimeout(cierre);
  cierre = window.setTimeout(ocultar, DEMORA_CIERRE);
}

/**
 * @returns {void}
 */
function ocultar() {
  ancla = null;
  const popover = porId("espec-popover");
  popover.hidden = true;
  popover.replaceChildren();
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
  nodo.className = "boton boton-secundario";
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
  ocultar();
  if (accion === "abrir") {
    location.hash = `#/especificacion?id=${encodeURIComponent(id)}`;
    return;
  }
  const modelo = (cache || []).find((item) => item.id === id);
  if (modelo && accion === "pdf") await descargarEspecPdf(modelo);
}

/**
 * @param {unknown} error
 * @returns {void}
 */
function fallo(error) {
  registrarError(error, "especificaciones");
  porId("espec-estado").hidden = false;
  porId("espec-estado").textContent = mensajeError(error);
  avisar(mensajeError(error), "error");
}
