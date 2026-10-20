/**
 * Propósito: Dólar observado y UF del día para la base de costos.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-06
 * Dependencias: costo-validacion, fechas, hw-catalogo, logger
 *
 * Primero consulta mindicador.cl (trae la fecha oficial). Si no
 * responde, usa api.gael.cloud. El resultado se guarda en
 * sessionStorage solo para el día local.
 */

import { LIMITES_COSTO } from "./costo-validacion.js";
import { fechaValida, hoyIso } from "./fechas.js";
import { leerMonto } from "./hw-catalogo.js";
import { registrarError } from "./logger.js";

const CLAVE = "dts_cambio_dia";
const ESPERA_MS = 20000;
const URL_BASE = "https://mindicador.cl/api";
const URL_DOLAR = `${URL_BASE}/dolar`;
const URL_UF = `${URL_BASE}/uf`;
const URL_GAEL = "https://api.gael.cloud/general/public/monedas";

/** @type {Map<string, Promise<object[]>>} */
const seriesAnio = new Map();
/** @type {Map<string, {usd: number, uf: number, fecha: string}>} */
const memoriaFecha = new Map();

/**
 * @returns {Promise<{usd: number, uf: number, fecha: string}|null>}
 */
export async function cambioDelDia() {
  const cache = leerCache();
  if (cache) {
    precargarAnio();
    return cache;
  }
  try {
    const dato = await desdeGael() || await desdeMindicador();
    if (!dato) {
      registrarError(new Error("sin cotización"), "tipo-cambio");
      return null;
    }
    guardarCache(dato);
    precargarAnio();
    return dato;
  } catch (error) {
    registrarError(error, "tipo-cambio");
    return null;
  }
}

/**
 * Cotización del día pedido. Si ese día no hubo valor (fin de
 * semana o feriado), usa el último día hábil anterior.
 * @param {string} iso YYYY-MM-DD
 * @returns {Promise<{usd: number, uf: number, fecha: string}|null>}
 */
export async function cambioEnFecha(iso) {
  if (!fechaConsultable(iso, hoyIso())) return null;
  if (iso === hoyIso()) return cambioDelDia();
  if (memoriaFecha.has(iso)) return memoriaFecha.get(iso);
  try {
    const usd = await puntoAnual("dolar", iso);
    const uf = usd ? await Promise.race([
      puntoAnual("uf", iso),
      esperar(8000).then(() => null)
    ]) : null;
    if (!usd) return null;
    const dato = {
      usd: usd.valor,
      uf: uf ? uf.valor : 0,
      fecha: usd.fecha
    };
    memoriaFecha.set(iso, dato);
    return dato;
  } catch (error) {
    registrarError(error, "tipo-cambio.fecha");
    return null;
  }
}

/**
 * @param {string} iso
 * @param {string} hoy
 * @returns {boolean}
 */
export function fechaConsultable(iso, hoy) {
  return fechaValida(iso) && fechaValida(hoy) && iso <= hoy;
}

/**
 * Último valor de la serie con fecha igual o anterior a iso.
 * @param {unknown} serie
 * @param {string} iso
 * @returns {{valor: number, fecha: string}|null}
 */
export function puntoHasta(serie, iso) {
  if (!Array.isArray(serie) || !fechaValida(iso)) return null;
  let elegido = null;
  serie.forEach((punto) => {
    if (!punto) return;
    const fecha = String(punto.fecha || "").slice(0, 10);
    const valor = Number(punto.valor);
    const sirve = fechaValida(fecha) && fecha <= iso
      && valorValido(valor);
    if (!sirve) return;
    if (!elegido || fecha > elegido.fecha) elegido = { valor, fecha };
  });
  return elegido;
}

/**
 * @param {unknown} cuerpo respuesta de mindicador.cl
 * @returns {{valor: number, fecha: string}|null}
 */
export function serieMindicador(cuerpo) {
  const serie = cuerpo && Array.isArray(cuerpo.serie)
    ? cuerpo.serie
    : [];
  const punto = serie[0];
  if (!punto) return null;
  const valor = Number(punto.valor);
  const fecha = String(punto.fecha || "").slice(0, 10);
  if (!valorValido(valor) || !fechaValida(fecha)) return null;
  return { valor, fecha };
}

/**
 * @param {unknown} lista respuesta de api.gael.cloud
 * @param {string} fecha día local YYYY-MM-DD
 * @returns {{usd: number, uf: number, fecha: string}|null}
 */
export function monedasGael(lista, fecha) {
  if (!Array.isArray(lista) || !fechaValida(fecha)) return null;
  const usd = valorGael(lista, "USD");
  if (!usd) return null;
  return { usd, uf: valorGael(lista, "UF"), fecha };
}

/**
 * Pesos por unidad, con dos decimales y signo peso.
 * @param {number} valor
 * @returns {string}
 */
export function textoCambio(valor) {
  const texto = (Number(valor) || 0).toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `$ ${texto}`;
}

/**
 * @returns {Promise<{usd: number, uf: number, fecha: string}|null>}
 */
async function desdeMindicador() {
  try {
    const [cuerpoUsd, cuerpoUf] = await Promise.all([
      pedirJson(URL_DOLAR),
      pedirJson(URL_UF)
    ]);
    const usd = serieMindicador(cuerpoUsd);
    const uf = serieMindicador(cuerpoUf);
    if (!usd) return null;
    return { usd: usd.valor, uf: uf ? uf.valor : 0, fecha: usd.fecha };
  } catch (error) {
    falloFuente(error);
    return null;
  }
}

/**
 * @returns {Promise<{usd: number, uf: number, fecha: string}|null>}
 */
async function desdeGael() {
  try {
    return monedasGael(await pedirJson(URL_GAEL), hoyIso());
  } catch (error) {
    falloFuente(error);
    return null;
  }
}

/**
 * Devuelve la primera cotización válida. Si ninguna llega, null.
 * @param {Promise<object|null>[]} tareas
 * @returns {Promise<object|null>}
 */
function primeroUtil(tareas) {
  return new Promise((resolve) => {
    let pendientes = tareas.length;
    let listo = false;
    const cerrar = (dato) => {
      if (listo) return;
      listo = true;
      resolve(dato);
    };
    tareas.forEach((tarea) => {
      tarea.then((dato) => {
        if (dato) cerrar(dato);
      }).catch(falloFuente).finally(() => {
        pendientes -= 1;
        if (!listo && pendientes === 0) cerrar(null);
      });
    });
  });
}

/**
 * Un tiempo agotado no es un fallo de la otra fuente.
 * @param {unknown} error
 * @returns {void}
 */
function falloFuente(error) {
  const nombre = error && error.name;
  if (nombre === "TimeoutError" || nombre === "AbortError") return;
  registrarError(error, "tipo-cambio.fuente");
}

/**
 * @param {"dolar"|"uf"} indicador
 * @param {string} iso
 * @returns {Promise<{valor: number, fecha: string}|null>}
 */
async function puntoAnual(indicador, iso) {
  try {
    const anio = Number(iso.slice(0, 4));
    let punto = puntoHasta(await serieAnio(indicador, anio), iso);
    if (!punto && anio > 2010) {
      punto = puntoHasta(await serieAnio(indicador, anio - 1), iso);
    }
    return punto;
  } catch (error) {
    falloFuente(error);
    return null;
  }
}

/**
 * @param {"dolar"|"uf"} indicador
 * @param {number} anio
 * @returns {Promise<object[]>}
 */
async function serieAnio(indicador, anio) {
  if (indicador !== "dolar" && indicador !== "uf") return [];
  if (!Number.isInteger(anio) || anio < 2010) return [];
  const clave = `${indicador}-${anio}`;
  if (!seriesAnio.has(clave)) {
    const url = `${URL_BASE}/${indicador}/${anio}`;
    seriesAnio.set(clave, leerSerie(url).then((serie) => {
      if (!serie.length) seriesAnio.delete(clave);
      return serie;
    }).catch((error) => {
      seriesAnio.delete(clave);
      throw error;
    }));
  }
  return seriesAnio.get(clave);
}

/**
 * @param {string} url
 * @returns {Promise<object[]>}
 */
async function leerSerie(url) {
  try {
    const serie = serieDe(await pedirJson(url));
    if (serie.length) return serie;
  } catch (error) {
    falloFuente(error);
  }
  await esperar(2500);
  try {
    return serieDe(await pedirJson(url));
  } catch (error) {
    falloFuente(error);
    return [];
  }
}

/**
 * Baja la serie del año en segundo plano para cuando elijan un día.
 * @returns {void}
 */
function precargarAnio() {
  const anio = Number(hoyIso().slice(0, 4));
  serieAnio("dolar", anio)
    .then(() => serieAnio("uf", anio))
    .catch((error) => falloFuente(error));
}

/**
 * @param {unknown} cuerpo
 * @returns {object[]}
 */
function serieDe(cuerpo) {
  return cuerpo && Array.isArray(cuerpo.serie) ? cuerpo.serie : [];
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function esperar(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * @param {string} url
 * @returns {Promise<unknown>}
 */
async function pedirJson(url) {
  const respuesta = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(ESPERA_MS),
    headers: { Accept: "application/json" }
  });
  if (!respuesta.ok) {
    throw new Error(`cotización ${respuesta.status}`);
  }
  return respuesta.json();
}

/**
 * @param {object[]} lista
 * @param {string} codigo
 * @returns {number} 0 si el dato no sirve
 */
function valorGael(lista, codigo) {
  const item = lista.find((fila) => fila && fila.Codigo === codigo);
  if (!item) return 0;
  const valor = leerMonto(item.Valor, 2);
  return valorValido(valor) ? valor : 0;
}

/**
 * @param {number} valor
 * @returns {boolean}
 */
function valorValido(valor) {
  return Number.isFinite(valor)
    && valor >= 1
    && valor <= LIMITES_COSTO.cambioMax;
}

/**
 * @returns {{usd: number, uf: number, fecha: string}|null}
 */
function leerCache() {
  try {
    const crudo = sessionStorage.getItem(CLAVE);
    if (!crudo) return null;
    const dato = JSON.parse(crudo);
    if (!dato || dato.guardado !== hoyIso()) return null;
    if (!valorValido(dato.usd) || !fechaValida(dato.fecha)) return null;
    if (dato.uf && !valorValido(dato.uf)) return null;
    return {
      usd: dato.usd,
      uf: Number(dato.uf) || 0,
      fecha: dato.fecha
    };
  } catch (error) {
    registrarError(error, "tipo-cambio.cache");
    return null;
  }
}

/**
 * @param {{usd: number, uf: number, fecha: string}} dato
 * @returns {void}
 */
function guardarCache(dato) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify({
      ...dato,
      guardado: hoyIso()
    }));
  } catch (error) {
    registrarError(error, "tipo-cambio.cache");
  }
}
