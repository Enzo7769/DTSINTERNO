/**
 * Propósito: Listado de la Base de costos HW con filtros e
 *   indicadores.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: constantes, costeo, costo-historial, costo-pdf,
 *   costo-repositorio,
 *   costo-textos, errores, exportar-csv, fechas, hw-catalogo,
 *   logger, planilla-importar, tipo-cambio-dia, tipos-equipo, ui
 */

import { MSG } from "./constantes.js";
import { equivalenteDia } from "./costeo.js";
import { historialVisible } from "./costo-historial.js";
import { descargarCostoPdf, descargarResumenPdf } from "./costo-pdf.js";
import { eliminarCosto, listarCostos } from "./costo-repositorio.js";
import { CT, textoImportados } from "./costo-textos.js";
import { mensajeError } from "./errores.js";
import { descargarCsv } from "./exportar-csv.js";
import { formatearFecha, hoyIso } from "./fechas.js";
import {
  LINEAS_PRODUCTO,
  decimalesDe,
  etiquetaDe,
  formatoMonto
} from "./hw-catalogo.js";
import { registrarError } from "./logger.js";
import {
  cambioEnFecha,
  fechaConsultable,
  textoCambio
} from "./tipo-cambio-dia.js";
import { importarCostos } from "./planilla-importar.js";
import {
  TIPOS_EQUIPO,
  etiquetaTipo,
  llenarFiltroTipo
} from "./tipos-equipo.js";
import { avisar, mostrarVista, porId } from "./ui.js";

const ORDEN_TIPO = new Map(TIPOS_EQUIPO.map((tipo, i) => [tipo.id, i]));

let cache = null;
/** @type {{usd: number, uf: number, fecha: string}|null} */
let cambioDia = null;
let fechaDolar = "";
let consultandoDolar = false;
let pedidoDolar = 0;
let autor = { uid: "", email: "" };
let importando = false;

/**
 * @returns {void}
 */
export function invalidarCostos() {
  cache = null;
}

/**
 * @param {{uid: string, email: string}} sesion
 * @returns {void}
 */
export function definirAutorListadoCostos(sesion) {
  autor = sesion;
}

/**
 * @returns {void}
 */
export function iniciarListadoCostos() {
  llenarFiltroTipo(porId("kf-tipo"));
  llenarFiltroTipo(porId("kf-linea"), LINEAS_PRODUCTO);
  porId("form-filtros-costo").addEventListener("submit", (evento) => {
    evento.preventDefault();
  });
  porId("kf-texto").addEventListener("input", pintar);
  porId("kf-tipo").addEventListener("change", pintar);
  porId("kf-linea").addEventListener("change", pintar);
  porId("btn-costo-limpiar").addEventListener("click", () => {
    ["kf-texto", "kf-tipo", "kf-linea"].forEach((id) => {
      porId(id).value = "";
    });
    pintar();
  });
  porId("btn-costo-nuevo").addEventListener("click", () => {
    location.hash = "#/costo";
  });
  porId("btn-costo-csv").addEventListener("click", exportarCsv);
  porId("btn-costo-resumen").addEventListener("click", () => {
    const lista = filtrados();
    if (!lista.length) {
      avisar(CT.sinDatos, "aviso");
      return;
    }
    descargarResumenPdf(lista).catch(fallo);
  });
  porId("btn-costo-importar").addEventListener("click", () => {
    importar().catch(fallo);
  });
  porId("costo-tabla").addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) return;
    ejecutar(boton.dataset.accion, boton.dataset.id).catch(fallo);
  });
}

/**
 * @returns {Promise<void>}
 */
export async function mostrarListadoCostos() {
  document.title = CT.tituloListado;
  mostrarVista("vista-costos");
  const estado = porId("costo-estado");
  estado.textContent = CT.cargando;
  estado.hidden = false;
  try {
    if (!fechaDolar) fechaDolar = hoyIso();
    const pendientes = [cambioEnFecha(fechaDolar)];
    if (!cache) pendientes.push(listarCostos());
    const [dia, lista] = await Promise.all(pendientes);
    cambioDia = dia;
    if (lista) cache = lista;
    pintar();
  } catch (error) {
    fallo(error);
  }
}

/**
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
function comparar(a, b) {
  const tipo = (ORDEN_TIPO.get(a.tipoEquipo) ?? 9)
    - (ORDEN_TIPO.get(b.tipoEquipo) ?? 9);
  if (tipo) return tipo;
  const modelo = String(a.modelo).localeCompare(String(b.modelo), "es");
  if (modelo) return modelo;
  return (Number(a.numero) || 0) - (Number(b.numero) || 0);
}

/**
 * @returns {object[]}
 */
function filtrados() {
  if (!cache) return [];
  const q = porId("kf-texto").value.trim().toLowerCase();
  const tipo = porId("kf-tipo").value;
  const linea = porId("kf-linea").value;
  return cache
    .filter((registro) => !tipo || registro.tipoEquipo === tipo)
    .filter((registro) => !linea || registro.linea === linea)
    .filter((registro) => !q || [
      registro.modelo, registro.referencia
    ].some((valor) => String(valor || "").toLowerCase().includes(q)))
    .sort(comparar);
}

/**
 * @returns {void}
 */
function pintar() {
  if (!cache) return;
  const lista = filtrados();
  pintarKpis(cache);
  const cuerpo = porId("costo-tabla");
  cuerpo.replaceChildren();
  porId("costo-conteo").textContent = `${lista.length} ${CT.registros}`;
  porId("costo-vacio").hidden = cache.length > 0;
  const estado = porId("costo-estado");
  estado.hidden = lista.length > 0 || cache.length === 0;
  estado.textContent = CT.sinResultados;
  lista.forEach((registro) => cuerpo.append(crearFila(registro)));
}

/**
 * @param {object[]} lista
 * @returns {void}
 */
function pintarKpis(lista) {
  const modelos = new Set(lista.map((registro) => registro.modeloClave));
  const fechas = lista
    .map((registro) => registro.fechaActualizacion)
    .filter(Boolean)
    .sort();
  const ultima = fechas.length
    ? formatearFecha(fechas[fechas.length - 1])
    : CT.sinFecha;
  const caja = porId("costo-kpis");
  caja.replaceChildren(
    kpi(CT.kpiRegistros, String(lista.length)),
    kpi(CT.kpiModelos, String(modelos.size)),
    kpi(CT.kpiActualizado, ultima),
    tarjetaDolar()
  );
}

/**
 * Indicador del dólar con el día que elige el usuario.
 * @returns {HTMLElement}
 */
function tarjetaDolar() {
  const valor = consultandoDolar
    ? CT.consultandoDolar
    : (cambioDia
      ? textoCambio(cambioDia.usd)
      : CT.dolarNoDisponible);
  const detalle = !consultandoDolar && cambioDia
    ? formatearFecha(cambioDia.fecha)
    : "";
  const caja = kpi(CT.kpiDolar, valor, detalle);
  const fecha = document.createElement("input");
  fecha.type = "date";
  fecha.id = "costo-dolar-fecha";
  fecha.max = hoyIso();
  fecha.value = fechaDolar || hoyIso();
  fecha.setAttribute("aria-label", CT.elegirDiaDolar);
  fecha.addEventListener("change", () => {
    aplicarFechaDolar(fecha.value);
  });
  caja.append(fecha);
  return caja;
}

/**
 * @param {string} iso
 * @returns {Promise<void>}
 */
async function aplicarFechaDolar(iso) {
  if (!fechaConsultable(iso, hoyIso())) {
    avisar(CT.diaDolarInvalido, "aviso");
    pintar();
    return;
  }
  const pedido = ++pedidoDolar;
  const anterior = fechaDolar;
  fechaDolar = iso;
  consultandoDolar = true;
  pintar();
  try {
    const dato = await cambioEnFecha(iso);
    if (pedido !== pedidoDolar) return;
    if (!dato) {
      fechaDolar = anterior;
      avisar(CT.dolarNoDisponible, "aviso");
    } else {
      cambioDia = dato;
    }
  } catch (error) {
    if (pedido !== pedidoDolar) return;
    fechaDolar = anterior;
    registrarError(error, "costos.dolar");
    avisar(CT.dolarNoDisponible, "aviso");
  } finally {
    if (pedido === pedidoDolar) {
      consultandoDolar = false;
      pintar();
    }
  }
}

/**
 * @param {string} titulo
 * @param {string} valor
 * @param {string} [detalle]
 * @returns {HTMLElement}
 */
function kpi(titulo, valor, detalle) {
  const caja = document.createElement("div");
  caja.className = "kpi";
  const etiqueta = document.createElement("span");
  etiqueta.textContent = titulo;
  const numero = document.createElement("strong");
  numero.textContent = valor;
  caja.append(etiqueta, numero);
  if (detalle) {
    const nota = document.createElement("small");
    nota.textContent = detalle;
    caja.append(nota);
  }
  return caja;
}

/**
 * @param {unknown} valor
 * @param {string} clase
 * @returns {HTMLTableCellElement}
 */
function celdaTexto(valor, clase) {
  const td = document.createElement("td");
  td.textContent = valor ? String(valor) : "—";
  if (clase) td.className = clase;
  return td;
}

/**
 * Costo guardado y su equivalente con el dólar del día.
 * @param {object} registro
 * @returns {HTMLTableCellElement}
 */
function celdaCosto(registro) {
  const td = celdaTexto(
    formatoMonto(registro.costo, registro.moneda),
    "derecha monto"
  );
  const eq = equivalenteDia(registro.costo, registro.moneda, cambioDia);
  if (!eq) return td;
  const nota = document.createElement("small");
  nota.className = "costo-al-dolar";
  const dia = formatearFecha(cambioDia.fecha);
  const leyenda = dia ? `${CT.alDolar} ${dia}` : CT.alDolarHoy;
  nota.textContent = `${formatoMonto(eq.valor, eq.moneda)} ${leyenda}`;
  td.append(nota);
  return td;
}

/**
 * @param {object} registro
 * @returns {HTMLTableRowElement}
 */
function crearFila(registro) {
  const tr = document.createElement("tr");
  const celdas = [
    [registro.numero, "numero"],
    [etiquetaDe(LINEAS_PRODUCTO, registro.linea), ""],
    [etiquetaTipo(registro.tipoEquipo), ""],
    [registro.modelo, "fuerte"],
    ["", "derecha monto"],
    [formatearFecha(registro.fechaActualizacion), ""]
  ];
  celdas.forEach(([valor, clase]) => {
    tr.append(clase === "derecha monto"
      ? celdaCosto(registro)
      : celdaTexto(valor, clase));
  });
  const acciones = document.createElement("td");
  acciones.className = "acciones";
  acciones.append(
    boton(MSG.abrir, "abrir", registro.id),
    boton(CT.duplicar, "duplicar", registro.id),
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
    location.hash = `#/costo?id=${encodeURIComponent(id)}`;
    return;
  }
  if (accion === "duplicar") {
    location.hash = `#/costo?copia=${encodeURIComponent(id)}`;
    return;
  }
  const registro = (cache || []).find((item) => item.id === id);
  if (!registro) return;
  if (accion === "pdf") {
    await descargarCostoPdf({
      ...registro,
      historial: historialVisible(registro)
    });
    return;
  }
  if (accion === "eliminar") {
    if (!window.confirm(CT.confirmarEliminar)) return;
    await eliminarCosto(id);
    cache = await listarCostos();
    pintar();
    avisar(CT.eliminado, "ok");
  }
}

/**
 * @returns {void}
 */
function exportarCsv() {
  const lista = filtrados();
  if (!lista.length) {
    avisar(CT.sinDatos, "aviso");
    return;
  }
  const cabecera = ["N°", CT.linea, "Tipo de equipo", CT.modelo,
    CT.moneda, CT.costo, CT.fechaActualizacion,
    CT.referencia, CT.observaciones];
  const filas = lista.map((registro) => [
    registro.numero,
    etiquetaDe(LINEAS_PRODUCTO, registro.linea),
    etiquetaTipo(registro.tipoEquipo),
    registro.modelo,
    registro.moneda,
    (Number(registro.costo) || 0).toLocaleString("es-CL", {
      minimumFractionDigits: decimalesDe(registro.moneda),
      useGrouping: false
    }),
    formatearFecha(registro.fechaActualizacion),
    registro.referencia,
    registro.observaciones
  ]);
  descargarCsv(cabecera, filas, CT.csvArchivo);
}

/**
 * Solo se ofrece con la base vacía, para no duplicar registros.
 * @returns {Promise<void>}
 */
async function importar() {
  if (importando || (cache && cache.length)) return;
  if (!window.confirm(CT.confirmarImportar)) return;
  const boton = porId("btn-costo-importar");
  importando = true;
  boton.disabled = true;
  boton.textContent = CT.importando;
  try {
    const total = await importarCostos(autor);
    cache = await listarCostos();
    pintar();
    avisar(textoImportados(total), "ok");
  } finally {
    importando = false;
    boton.disabled = false;
    boton.textContent = CT.importar;
  }
}

/**
 * @param {unknown} error
 * @returns {void}
 */
function fallo(error) {
  registrarError(error, "costos");
  porId("costo-estado").hidden = false;
  porId("costo-estado").textContent = mensajeError(error);
  avisar(mensajeError(error), "error");
}
