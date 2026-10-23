/**
 * Propósito: Formulario de alta y edición de la Base de costos HW.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: cambios-pendientes, config, costo-clientes, costo-hh,
 *   costo-historial, costo-historial-vista, costo-hoja, costo-lineas,
 *   costo-pdf, costo-repositorio, costo-textos, costo-validacion, errores,
 *   fechas, hw-catalogo, logger, modelo-repositorio,
 *   tipo-cambio-dia, tipos-equipo, ui
 */

import {
  cambiosGuardados,
  vigilarCambios
} from "./cambios-pendientes.js";
import { APP } from "./config.js";
import {
  cargarClientesCosto,
  iniciarClientesCosto
} from "./costo-clientes.js";
import {
  historialAlGuardar,
  historialVisible
} from "./costo-historial.js";
import { pintarHistorialCosto } from "./costo-historial-vista.js";
import { refrescarHh } from "./costo-hh.js";
import {
  iniciarHoja,
  pintarHoja,
  pintarPestanas
} from "./costo-hoja.js";
import {
  componentesSinValor,
  leerLineas,
  numeroVisible,
  pintarAyudaCosteo,
  pintarResumen,
  pintarSubtotales
} from "./costo-lineas.js";
import { descargarCostoPdf } from "./costo-pdf.js";
import { guardarCosto, obtenerCosto } from "./costo-repositorio.js";
import {
  CT,
  textoActualizado,
  textoCopiaDe,
  textoCambioDia,
  textoCreado
} from "./costo-textos.js";
import { normalizarCosto, validarCosto } from "./costo-validacion.js";
import { mensajeError } from "./errores.js";
import { formatearFecha, hoyIso } from "./fechas.js";
import {
  LINEAS_PRODUCTO,
  MONEDAS,
  claveModelo,
  decimalesDe
} from "./hw-catalogo.js";
import { registrarError } from "./logger.js";
import {
  cambioDelDia,
  cambioEnFecha,
  fechaConsultable
} from "./tipo-cambio-dia.js";
import { listarModelos, obtenerModelo } from "./modelo-repositorio.js";
import {
  GRUPO_COSTO,
  TIPOS_EQUIPO,
  leerTipo,
  marcarTipo,
  pintarTipo
} from "./tipos-equipo.js";
import {
  avisar,
  mostrarExito,
  mostrarVista,
  porId
} from "./ui.js";

const CAMPOS = {
  linea: "k-linea",
  modelo: "k-modelo",
  referencia: "k-referencia",
  fechaActualizacion: "k-fecha",
  moneda: "k-moneda",
  observaciones: "k-obs"
};

/** Tipos que admite un costo (el catálogo suma «componente»). */
const GRUPO_COSTO_IDS = new Set(TIPOS_EQUIPO.map((tipo) => tipo.id));

let autor = { uid: "", email: "", nombre: "" };
let actual = null;
let guardando = false;
let modelos = [];
/** Día de la cotización del dólar en uso; vacío si se escribió a mano. */
let fechaCambio = "";
/** Dólar y UF salieron de config porque no hubo cotización. */
let cambioReferencia = false;
/** La UF no vino con la cotización del día: se usa otra y se avisa. */
let ufSinCotizacion = false;

/**
 * @param {() => void} alGuardar
 * @returns {void}
 */
export function iniciarCosto(alGuardar) {
  llenarSelect(porId("k-linea"), LINEAS_PRODUCTO);
  llenarSelect(porId("k-moneda"), MONEDAS);
  pintarTipo(porId("tipo-costo"), GRUPO_COSTO, "k-tipo");
  porId("tipo-costo").addEventListener("change", pintarSugerencias);
  vigilarCambios("vista-costo");
  porId("k-modelo").addEventListener("input", pintarAyudaModelo);
  pintarAyudaCosteo();
  iniciarHoja(recalcular);
  iniciarClientesCosto({
    alCambiar: recalcular,
    leerLineas: () => normalizarCosto(leerCrudo()).lineas,
    autor: () => autor
  });
  porId("btn-costo-duplicar").addEventListener("click", () => {
    if (actual) {
      location.hash = `#/costo?copia=${encodeURIComponent(actual.id)}`;
    }
  });
  porId("k-moneda").addEventListener("change", recalcular);
  ["k-costo", "k-equipos", "k-cambio-usd", "k-cambio-uf"]
    .forEach((id) => porId(id).addEventListener("input", recalcular));
  porId("k-cambio-fecha").addEventListener("change", () => {
    usarCotizacion(porId("k-cambio-fecha").value).catch(fallo);
  });
  ["k-cambio-usd", "k-cambio-uf"].forEach((id) => {
    porId(id).addEventListener("input", () => {
      fechaCambio = "";
      cambioReferencia = false;
      ufSinCotizacion = false;
      pintarAyudaCambio();
    });
  });
  porId("vista-costo").addEventListener("input", limpiarMarca);
  porId("vista-costo").addEventListener("change", limpiarMarca);
  porId("btn-costo-volver").addEventListener("click", () => {
    location.hash = "#/costos";
  });
  porId("btn-costo-volver").textContent = CT.volver;
  const alTerminar = (ok) => {
    if (ok) alGuardar();
  };
  porId("btn-costo-guardar").addEventListener("click", () => {
    guardar(false).then(alTerminar).catch(fallo);
  });
  porId("btn-costo-guardar-pdf").addEventListener("click", () => {
    guardar(true).then(alTerminar).catch(fallo);
  });
  porId("btn-costo-pdf").addEventListener("click", () => {
    const datos = {
      ...normalizarCosto(leerCrudo()),
      historial: historialVisible(actual),
      numero: actual ? actual.numero : 0
    };
    descargarCostoPdf(datos).catch(fallo);
  });
}

/**
 * @param {{uid: string, email: string, nombre: string}} sesion
 * @returns {void}
 */
export function definirAutorCosto(sesion) {
  autor = sesion;
}

/**
 * @param {string} [modeloId] modelo del catálogo con que parte
 * @returns {Promise<void>}
 */
export async function mostrarCostoNuevo(modeloId) {
  actual = null;
  limpiarErrores();
  porId("costo-titulo").textContent = CT.nueva;
  porId("costo-meta").textContent = CT.sinGuardar;
  document.title = CT.tituloNuevo;
  const base = modeloId ? await modeloDeCatalogo(modeloId) : null;
  const tipo = base && GRUPO_COSTO_IDS.has(base.tipo) ? base.tipo : "";
  marcarTipo(GRUPO_COSTO, tipo);
  escribir({
    moneda: MONEDAS[0].id,
    fechaActualizacion: hoyIso(),
    modelo: base ? base.nombre : ""
  });
  porId("btn-costo-duplicar").hidden = true;
  prepararDiaCotizacion();
  escribirParametros({}, await cambioDelDia());
  pintarHistorialCosto(null);
  mostrarVista("vista-costo");
  await pintarLineas([]);
  await Promise.all([cargarModelos(), cargarClientesCosto("")]);
  cambiosGuardados("vista-costo");
}

/**
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function modeloDeCatalogo(id) {
  try {
    return await obtenerModelo(id);
  } catch (error) {
    registrarError(error, "costo.modeloBase");
    return null;
  }
}

/**
 * Costo nuevo que parte con los datos y piezas de otro. Toma el
 * dólar y la UF del día; el historial empieza de cero.
 * @param {string} id costo de origen
 * @returns {Promise<void>}
 */
export async function mostrarCostoCopia(id) {
  const origen = await obtenerCosto(id);
  if (!origen) {
    avisar(CT.noEncontrado, "error");
    location.hash = "#/costos";
    return;
  }
  actual = null;
  limpiarErrores();
  porId("costo-titulo").textContent = CT.copiaTitulo;
  porId("costo-meta").textContent = textoCopiaDe(origen.numero);
  document.title = CT.tituloNuevo;
  marcarTipo(GRUPO_COSTO, origen.tipoEquipo || "");
  escribir({ ...origen, fechaActualizacion: hoyIso() });
  porId("btn-costo-duplicar").hidden = true;
  prepararDiaCotizacion();
  escribirParametros(
    { cantidadEquipos: origen.cantidadEquipos },
    await cambioDelDia()
  );
  pintarHistorialCosto(null);
  mostrarVista("vista-costo");
  await pintarLineas(origen.lineas || []);
  if (!(origen.lineas || []).length) {
    porId("k-costo").value = numeroVisible(
      origen.costo,
      decimalesDe(origen.moneda),
      true
    );
    recalcular();
  }
  await Promise.all([
    cargarModelos(),
    cargarClientesCosto(origen.clienteCotizacion || "")
  ]);
  cambiosGuardados("vista-costo");
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function mostrarCostoEdicion(id) {
  const registro = await obtenerCosto(id);
  if (!registro) {
    avisar(CT.noEncontrado, "error");
    location.hash = "#/costos";
    return;
  }
  actual = registro;
  limpiarErrores();
  porId("costo-titulo").textContent = CT.editar;
  porId("costo-meta").textContent =
    `N° ${registro.numero || "—"} · ${registro.creadoPorEmail || ""}`;
  document.title = CT.tituloEdicion;
  marcarTipo(GRUPO_COSTO, registro.tipoEquipo || "");
  escribir(registro);
  porId("btn-costo-duplicar").hidden = false;
  prepararDiaCotizacion();
  escribirParametros(registro, await cambioDelDia());
  pintarHistorialCosto(registro);
  mostrarVista("vista-costo");
  await pintarLineas(registro.lineas || []);
  if (!(registro.lineas || []).length) {
    porId("k-costo").value = numeroVisible(
      registro.costo,
      decimalesDe(registro.moneda),
      true
    );
    recalcular();
  }
  await Promise.all([
    cargarModelos(),
    cargarClientesCosto(registro.clienteCotizacion || "")
  ]);
  cambiosGuardados("vista-costo");
}

/**
 * Carga el catálogo para sugerir modelos. Si falla, sigue libre.
 * @returns {Promise<void>}
 */
async function cargarModelos() {
  try {
    modelos = await listarModelos();
  } catch (error) {
    registrarError(error, "costo.modelos");
    modelos = [];
  }
  pintarSugerencias();
}

/**
 * @returns {void}
 */
function pintarSugerencias() {
  const tipo = leerTipo(GRUPO_COSTO);
  const lista = porId("k-modelos-lista");
  lista.replaceChildren();
  modelos
    .filter((modelo) => !tipo || modelo.tipo === tipo)
    .map((modelo) => modelo.nombre)
    .sort((a, b) => a.localeCompare(b, "es"))
    .forEach((nombre) => {
      const opcion = document.createElement("option");
      opcion.value = nombre;
      lista.append(opcion);
    });
  pintarAyudaModelo();
}

/**
 * @returns {void}
 */
function pintarAyudaModelo() {
  const clave = claveModelo(porId("k-modelo").value);
  const ayuda = porId("k-modelo-ayuda");
  const enlace = porId("k-modelo-ficha");
  const hallado = clave
    ? modelos.find((modelo) => modelo.nombreClave === clave)
    : null;
  enlace.hidden = !hallado;
  if (hallado) {
    enlace.href = `#/especificacion?id=${encodeURIComponent(hallado.id)}`;
    if (!leerTipo(GRUPO_COSTO) && GRUPO_COSTO_IDS.has(hallado.tipo)) {
      marcarTipo(GRUPO_COSTO, hallado.tipo);
    }
  }
  if (!clave || !modelos.length) {
    ayuda.textContent = "";
    return;
  }
  ayuda.textContent = hallado ? CT.modeloCatalogo : CT.modeloLibre;
}

/**
 * Sin catálogo cargado no se pregunta: puede ser un error de red.
 * @param {string} clave
 * @returns {boolean}
 */
function modeloEnCatalogo(clave) {
  return !modelos.length
    || modelos.some((modelo) => modelo.nombreClave === clave);
}

/**
 * @param {HTMLSelectElement} select
 * @param {{id: string, etiqueta: string}[]} opciones
 * @returns {void}
 */
function llenarSelect(select, opciones) {
  opciones.forEach((item) => {
    const opcion = document.createElement("option");
    opcion.value = item.id;
    opcion.textContent = item.etiqueta;
    select.append(opcion);
  });
}

/**
 * @param {object} datos
 * @returns {void}
 */
function escribir(datos) {
  Object.entries(CAMPOS).forEach(([clave, id]) => {
    porId(id).value = datos[clave] || "";
  });
  porId("k-costo").value = "";
}

/**
 * El día parte en hoy. Cambiarlo recién entonces reemplaza
 * el dólar y la UF guardados.
 * @returns {void}
 */
function prepararDiaCotizacion() {
  const fecha = porId("k-cambio-fecha");
  fecha.max = hoyIso();
  fecha.value = hoyIso();
  porId("k-fecha").max = hoyIso();
}

/**
 * @param {string} iso
 * @returns {Promise<void>}
 */
async function usarCotizacion(iso) {
  if (!fechaConsultable(iso, hoyIso())) {
    avisar(CT.diaDolarInvalido, "aviso");
    return;
  }
  const dato = await cambioEnFecha(iso);
  if (!dato) {
    avisar(CT.dolarNoDisponible, "aviso");
    return;
  }
  porId("k-cambio-usd").value = numeroVisible(dato.usd, 2, true);
  if (dato.uf) {
    porId("k-cambio-uf").value = numeroVisible(dato.uf, 2, true);
  }
  ufSinCotizacion = !dato.uf;
  fechaCambio = dato.fecha;
  cambioReferencia = false;
  pintarAyudaCambio();
  recalcular();
}

/**
 * Cantidad de equipos y tipos de cambio. Sin dato guardado usa
 * la cotización del día y, si falta, los valores de config.
 * @param {object} datos
 * @param {{usd: number, uf: number}|null} [dia]
 * @returns {void}
 */
function escribirParametros(datos, dia) {
  const cambio = datos.tipoCambio || {};
  const usd = cambio.usd || (dia && dia.usd) || APP.tipoCambioUsd;
  const uf = cambio.uf || (dia && dia.uf) || APP.valorUf;
  if (cambio.usd) fechaCambio = datos.fechaCambio || "";
  else fechaCambio = dia && dia.usd ? dia.fecha : "";
  cambioReferencia = !cambio.usd && !(dia && dia.usd);
  ufSinCotizacion = !cambio.uf && !(dia && dia.uf) && !cambioReferencia;
  if (fechaCambio) porId("k-cambio-fecha").value = fechaCambio;
  porId("k-equipos").value = String(datos.cantidadEquipos || 1);
  porId("k-cambio-usd").value = numeroVisible(usd, 2, true);
  porId("k-cambio-uf").value = numeroVisible(uf, 2, true);
  pintarAyudaCambio();
}

/**
 * Dice de dónde salen el dólar y la UF que se usan.
 * @returns {void}
 */
function pintarAyudaCambio() {
  let texto = CT.cambioManual;
  if (fechaCambio) texto = textoCambioDia(formatearFecha(fechaCambio));
  else if (cambioReferencia) texto = CT.cambioReferencia;
  if (ufSinCotizacion) texto = `${texto} ${CT.ufSinCotizacion}`;
  porId("k-cambio-ayuda").textContent = texto;
}

/**
 * Las filas antiguas sin moneda propia toman la del costo.
 * @param {object[]} lineas
 * @returns {Promise<void>}
 */
async function pintarLineas(lineas) {
  const moneda = porId("k-moneda").value;
  await pintarHoja(lineas.map((linea) => ({
    ...linea,
    moneda: linea.moneda || moneda
  })));
  recalcular();
}

/**
 * Suma los componentes; si hay alguno, el costo queda calculado.
 * @returns {void}
 */
function recalcular() {
  const crudo = leerCrudo();
  const limpio = normalizarCosto(crudo);
  pintarPestanas(
    pintarSubtotales(crudo, limpio.tipoCambio),
    limpio.moneda,
    limpio.tipoCambio
  );
  const calculado = limpio.lineas.length > 0;
  const campo = porId("k-costo");
  campo.readOnly = calculado;
  if (calculado) {
    campo.value = numeroVisible(
      limpio.costo,
      decimalesDe(limpio.moneda),
      true
    );
  }
  porId("k-costo-ayuda").textContent = calculado
    ? CT.costoCalculado
    : CT.ayudaCosto;
  pintarResumen(limpio);
}

/**
 * @returns {object}
 */
function leerCrudo() {
  refrescarHh();
  const crudo = {
    tipoEquipo: leerTipo(GRUPO_COSTO),
    costo: porId("k-costo").value,
    cantidadEquipos: porId("k-equipos").value,
    tipoCambio: {
      usd: porId("k-cambio-usd").value,
      uf: porId("k-cambio-uf").value
    },
    lineas: leerLineas(),
    configuracion: actual ? actual.configuracion || "" : "",
    fechaCambio,
    clienteCotizacion: porId("k-cliente-cotizacion").value,
    historial: actual ? actual.historial : []
  };
  Object.entries(CAMPOS).forEach(([clave, id]) => {
    crudo[clave] = porId(id).value;
  });
  return crudo;
}

/**
 * @param {boolean} conPdf
 * @returns {Promise<boolean>}
 */
async function guardar(conPdf) {
  if (guardando) return false;
  const crudo = leerCrudo();
  const limpio = normalizarCosto(crudo);
  const revision = validarCosto(
    limpio,
    crudo.fechaActualizacion,
    crudo.lineas,
    crudo.cantidadEquipos
  );
  pintarErrores(revision);
  if (!revision.valido) return false;
  if (!modeloEnCatalogo(limpio.modeloClave)
    && !window.confirm(CT.confirmarModeloLibre)) {
    return false;
  }
  if (componentesSinValor().length
    && !window.confirm(CT.confirmarSinValor)) {
    return false;
  }
  const nuevo = !actual;
  limpio.historial = historialAlGuardar(
    actual,
    limpio,
    hoyIso(),
    autor.email || ""
  );
  guardando = true;
  try {
    const fresco = await guardarCosto(limpio, actual, autor);
    actual = fresco;
    cambiosGuardados("vista-costo");
    if (conPdf) await descargarCostoPdf(fresco);
    mostrarExito(
      nuevo ? CT.creadoTitulo : CT.actualizadoTitulo,
      nuevo ? textoCreado(fresco.numero) : textoActualizado(fresco.numero),
      CT.volver,
      "#/costos"
    );
    return true;
  } finally {
    guardando = false;
  }
}

/**
 * @param {Event} evento
 * @returns {void}
 */
function limpiarMarca(evento) {
  const campo = evento.target.closest("[data-campo]");
  if (campo) campo.classList.remove("invalido");
}

/**
 * @param {{valido: boolean, errores: string[], campos: object}} revision
 * @returns {void}
 */
function pintarErrores(revision) {
  const caja = porId("costo-mensaje");
  caja.replaceChildren();
  porId("vista-costo").querySelectorAll("[data-campo]").forEach((nodo) => {
    nodo.classList.toggle(
      "invalido",
      Boolean(revision.campos[nodo.dataset.campo])
    );
  });
  if (revision.valido) {
    caja.hidden = true;
    return;
  }
  const lista = document.createElement("ul");
  revision.errores.forEach((texto) => {
    const li = document.createElement("li");
    li.textContent = texto;
    lista.append(li);
  });
  caja.append(lista);
  caja.hidden = false;
  caja.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * @returns {void}
 */
function limpiarErrores() {
  pintarErrores({ valido: true, errores: [], campos: {} });
}

/**
 * @param {unknown} error
 * @returns {void}
 */
function fallo(error) {
  registrarError(error, "costo");
  avisar(mensajeError(error), "error");
}
