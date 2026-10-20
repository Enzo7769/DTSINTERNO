/**
 * Propósito: Selector «Cliente de la cotización» del costo. Junta los
 *   clientes de la planilla con los creados en la app y permite
 *   guardar las piezas del costo como un cliente nuevo.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-07
 * Dependencias: cliente-cotizacion-repositorio,
 *   cliente-cotizacion-validacion, clientes-cotizacion, costo-hh,
 *   costo-hoja, costo-textos, hw-catalogo, logger, ui
 */

import {
  eliminarClienteCotizacion,
  guardarClienteCotizacion,
  listarClientesCotizacion
} from "./cliente-cotizacion-repositorio.js";
import {
  normalizarClienteCotizacion,
  validarClienteCotizacion
} from "./cliente-cotizacion-validacion.js";
import { CLIENTES_COTIZACION } from "./clientes-cotizacion.js";
import { paqueteHhActivo } from "./costo-hh.js";
import { aplicarCotizacionCliente } from "./costo-hoja.js";
import {
  CT,
  textoClienteGuardado,
  textoClientePiezas
} from "./costo-textos.js";
import { claveModelo } from "./hw-catalogo.js";
import { registrarError } from "./logger.js";
import { avisar, porId } from "./ui.js";

const ANIOS_PLANILLA = [2025, 2026];
const CLAVES_PLANILLA = CLIENTES_COTIZACION
  .map((cliente) => claveModelo(cliente.etiqueta));

/** @type {object[]} */
let creados = [];
/** @type {{alCambiar: () => void, leerLineas: () => object[],
 *   autor: () => object}|null} */
let ganchos = null;
let ocupado = false;

/**
 * @param {{alCambiar: () => void, leerLineas: () => object[],
 *   autor: () => object}} opciones
 * @returns {void}
 */
export function iniciarClientesCosto(opciones) {
  ganchos = opciones;
  pintarOpciones();
  porId("k-cliente-ayuda").textContent = CT.clienteAyuda;
  porId("k-cliente-cotizacion").addEventListener("change", elegir);
  porId("btn-cliente-nuevo").addEventListener("click", abrirNuevo);
  porId("btn-cliente-cancelar").addEventListener("click", cerrarNuevo);
  porId("btn-cliente-guardar").addEventListener("click", () => {
    guardarNuevo().catch(fallo);
  });
  porId("btn-cliente-eliminar").addEventListener("click", () => {
    eliminarElegido().catch(fallo);
  });
}

/**
 * Relee los clientes creados. Si falla, quedan los de la planilla.
 * @param {string} elegido id a dejar seleccionado, sin aplicarlo
 * @returns {Promise<void>}
 */
export async function cargarClientesCosto(elegido) {
  try {
    creados = await listarClientesCotizacion();
  } catch (error) {
    registrarError(error, "costo.clientes");
    creados = [];
  }
  pintarOpciones();
  fijarClienteCosto(elegido);
}

/**
 * Deja el cliente elegido sin tocar las piezas del costo.
 * @param {string} id
 * @returns {void}
 */
export function fijarClienteCosto(id) {
  const select = porId("k-cliente-cotizacion");
  select.value = buscarCliente(id) ? id : "";
  porId("k-cliente-ayuda").textContent = CT.clienteAyuda;
  cerrarNuevo();
  pintarEliminar();
}

/**
 * @param {string} id
 * @returns {object|null}
 */
function buscarCliente(id) {
  if (!id) return null;
  return CLIENTES_COTIZACION.find((cliente) => cliente.id === id)
    || creados.find((cliente) => cliente.id === id)
    || null;
}

/**
 * @returns {void}
 */
function pintarOpciones() {
  const select = porId("k-cliente-cotizacion");
  const previo = select.value;
  const vacio = document.createElement("option");
  vacio.value = "";
  vacio.textContent = CT.sinCliente;
  const grupos = [];
  if (creados.length) {
    grupos.push(grupo(CT.clientesCreados, ordenar(creados)));
  }
  ANIOS_PLANILLA.forEach((anio) => {
    const lista = CLIENTES_COTIZACION
      .filter((cliente) => cliente.anio === anio);
    grupos.push(grupo(`${CT.planilla} ${anio}`, lista));
  });
  select.replaceChildren(vacio, ...grupos);
  select.value = buscarCliente(previo) ? previo : "";
}

/**
 * @param {object[]} lista
 * @returns {object[]}
 */
function ordenar(lista) {
  return [...lista].sort((a, b) =>
    String(a.etiqueta).localeCompare(String(b.etiqueta), "es"));
}

/**
 * @param {string} titulo
 * @param {{id: string, etiqueta: string}[]} lista
 * @returns {HTMLOptGroupElement}
 */
function grupo(titulo, lista) {
  const nodo = document.createElement("optgroup");
  nodo.label = titulo;
  lista.forEach((cliente) => {
    const opcion = document.createElement("option");
    opcion.value = cliente.id;
    opcion.textContent = cliente.etiqueta;
    nodo.append(opcion);
  });
  return nodo;
}

/**
 * @returns {void}
 */
function elegir() {
  const id = porId("k-cliente-cotizacion").value;
  const cliente = buscarCliente(id);
  const n = aplicarCotizacionCliente(cliente);
  const ayuda = porId("k-cliente-ayuda");
  if (!cliente) ayuda.textContent = CT.clienteAyuda;
  else if (!n) ayuda.textContent = CT.clienteVacio;
  else ayuda.textContent = textoClientePiezas(n);
  pintarEliminar();
  ganchos.alCambiar();
}

/**
 * @returns {void}
 */
function pintarEliminar() {
  const id = porId("k-cliente-cotizacion").value;
  porId("btn-cliente-eliminar").hidden =
    !creados.some((cliente) => cliente.id === id);
}

/**
 * @returns {void}
 */
function abrirNuevo() {
  porId("cliente-nuevo-caja").hidden = false;
  porId("k-cliente-anio").value = String(new Date().getFullYear());
  porId("k-cliente-nuevo-error").textContent = "";
  porId("k-cliente-nombre").focus();
}

/**
 * @returns {void}
 */
function cerrarNuevo() {
  porId("cliente-nuevo-caja").hidden = true;
  porId("k-cliente-nombre").value = "";
  porId("k-cliente-nuevo-error").textContent = "";
}

/**
 * Guarda las piezas marcadas como receta. Si ya existe un cliente
 * creado con ese nombre, se reemplaza su receta.
 * @returns {Promise<void>}
 */
async function guardarNuevo() {
  if (ocupado) return;
  const limpio = normalizarClienteCotizacion({
    etiqueta: porId("k-cliente-nombre").value,
    anio: porId("k-cliente-anio").value,
    incluyeHh: paqueteHhActivo(),
    componentes: ganchos.leerLineas()
  });
  const revision = validarClienteCotizacion(limpio, CLAVES_PLANILLA);
  const error = porId("k-cliente-nuevo-error");
  error.textContent = revision.errores.join(" ");
  if (!revision.valido) return;
  const previo = creados.find((cliente) =>
    cliente.etiquetaClave === limpio.etiquetaClave) || null;
  if (previo && !window.confirm(CT.clienteReemplazar)) return;
  ocupado = true;
  try {
    const fresco = await guardarClienteCotizacion(
      limpio,
      previo,
      ganchos.autor()
    );
    await cargarClientesCosto(fresco.id);
    porId("k-cliente-ayuda").textContent =
      textoClienteGuardado(fresco.etiqueta);
    ganchos.alCambiar();
  } finally {
    ocupado = false;
  }
}

/**
 * @returns {Promise<void>}
 */
async function eliminarElegido() {
  const id = porId("k-cliente-cotizacion").value;
  const cliente = creados.find((item) => item.id === id);
  if (!cliente || ocupado) return;
  if (!window.confirm(CT.clienteConfirmarEliminar)) return;
  ocupado = true;
  try {
    await eliminarClienteCotizacion(id);
    await cargarClientesCosto("");
    avisar(CT.clienteEliminado, "ok");
    ganchos.alCambiar();
  } finally {
    ocupado = false;
  }
}

/**
 * @param {unknown} error
 * @returns {void}
 */
function fallo(error) {
  registrarError(error, "costo.clientes");
  avisar(CT.clienteFalloGuardar, "error");
}
