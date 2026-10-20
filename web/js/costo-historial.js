/**
 * Propósito: Historial de cotización de un costo: en qué fecha se
 *   cotizó, a cuánto estaba el dólar y la UF y qué costo tenía.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-06
 * Dependencias: costo-textos, fechas, hw-catalogo, sanitizar
 */

import { CT } from "./costo-textos.js";
import { aMillis, fechaValida, formatearFecha } from "./fechas.js";
import { MONEDAS, formatoMonto, idEn } from "./hw-catalogo.js";
import { texto } from "./sanitizar.js";

/** Entradas que se conservan por costo (las más recientes). */
export const MAX_HISTORIAL = 100;

const ACCIONES = new Set(["creado", "actualizado"]);
const MONTO_MAX = 1000000000;
const CAMBIO_MAX = 10000000;

/**
 * Limpia el historial guardado o recibido.
 * @param {unknown} lista
 * @returns {object[]}
 */
export function normalizarHistorial(lista) {
  return (Array.isArray(lista) ? lista : [])
    .map(normalizarEntrada)
    .filter(Boolean)
    .slice(-MAX_HISTORIAL);
}

/**
 * @param {unknown} cruda
 * @returns {object|null}
 */
function normalizarEntrada(cruda) {
  if (!cruda || typeof cruda !== "object") return null;
  const fecha = String(cruda.fecha || "").slice(0, 10);
  const moneda = idEn(MONEDAS, cruda.moneda) ? cruda.moneda : "";
  const costo = monto(cruda.costo, MONTO_MAX);
  if (!fechaValida(fecha) || !moneda || !(costo > 0)) return null;
  const fechaDolar = String(cruda.fechaDolar || "").slice(0, 10);
  return {
    fecha,
    fechaDolar: fechaValida(fechaDolar) ? fechaDolar : "",
    accion: ACCIONES.has(cruda.accion) ? cruda.accion : "actualizado",
    moneda,
    costo,
    costoLote: monto(cruda.costoLote, MONTO_MAX),
    cantidadEquipos: Math.max(
      1,
      Math.min(Math.trunc(Number(cruda.cantidadEquipos) || 1), 9999)
    ),
    usd: monto(cruda.usd, CAMBIO_MAX),
    uf: monto(cruda.uf, CAMBIO_MAX),
    usuario: texto(cruda.usuario, 120)
  };
}

/**
 * @param {unknown} valor
 * @param {number} max
 * @returns {number}
 */
function monto(valor, max) {
  const n = Number(valor);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

/**
 * Entrada con lo que tiene el costo al momento de guardar.
 * @param {object} costo registro normalizado
 * @param {string} accion «creado» o «actualizado»
 * @param {string} fecha YYYY-MM-DD
 * @param {string} usuario correo de quien guarda
 * @returns {object}
 */
export function entradaHistorial(costo, accion, fecha, usuario) {
  const cambio = costo.tipoCambio || {};
  return normalizarEntrada({
    fecha,
    fechaDolar: costo.fechaCambio,
    accion,
    moneda: costo.moneda,
    costo: costo.costo,
    costoLote: costo.costoLote || costo.costo,
    cantidadEquipos: costo.cantidadEquipos,
    usd: cambio.usd,
    uf: cambio.uf,
    usuario
  });
}

/**
 * Historial que queda al guardar. Un costo antiguo sin historial
 * parte con lo que tenía guardado. Solo se agrega una entrada si
 * cambió el costo, la moneda, los equipos o el tipo de cambio.
 * @param {object|null} previo registro guardado (null si es nuevo)
 * @param {object} limpio registro normalizado que se guardará
 * @param {string} fecha YYYY-MM-DD de hoy
 * @param {string} usuario
 * @returns {object[]}
 */
export function historialAlGuardar(previo, limpio, fecha, usuario) {
  if (!previo) {
    const primera = entradaHistorial(limpio, "creado", fecha, usuario);
    return primera ? [primera] : [];
  }
  const lista = normalizarHistorial(previo.historial);
  if (!lista.length) {
    const inicial = entradaInicial(previo);
    if (inicial) lista.push(inicial);
  }
  const nueva = entradaHistorial(limpio, "actualizado", fecha, usuario);
  const ultima = lista[lista.length - 1];
  if (nueva && (!ultima || cambio(ultima, nueva))) lista.push(nueva);
  return lista.slice(-MAX_HISTORIAL);
}

/**
 * Historial que se muestra: el guardado o, en un costo antiguo,
 * lo que tenía al momento de crearse.
 * @param {object|null} registro
 * @returns {object[]}
 */
export function historialVisible(registro) {
  if (!registro) return [];
  const lista = normalizarHistorial(registro.historial);
  if (lista.length) return lista;
  const inicial = entradaInicial(registro);
  return inicial ? [inicial] : [];
}

/**
 * Lo que tenía un costo creado antes de existir el historial.
 * @param {object} previo
 * @returns {object|null}
 */
export function entradaInicial(previo) {
  const creado = aMillis(previo.creadoEn);
  const fecha = fechaValida(previo.fechaActualizacion)
    ? previo.fechaActualizacion
    : (creado ? isoLocal(creado) : "");
  if (!fecha) return null;
  return entradaHistorial(previo, "creado", fecha,
    previo.creadoPorEmail || "");
}

/**
 * @param {number} ms
 * @returns {string}
 */
function isoLocal(ms) {
  const d = new Date(ms);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
function cambio(a, b) {
  return a.moneda !== b.moneda
    || a.costo !== b.costo
    || a.cantidadEquipos !== b.cantidadEquipos
    || a.usd !== b.usd
    || a.uf !== b.uf
    || a.fechaDolar !== b.fechaDolar;
}

/**
 * Filas para mostrar, de la más reciente a la más antigua, con la
 * variación del costo respecto de la cotización anterior.
 * @param {object[]} historial normalizado
 * @returns {string[][]}
 */
export function filasHistorial(historial) {
  const filas = historial.map((entrada, i) => {
    const previa = i > 0 ? historial[i - 1] : null;
    return [
      formatearFecha(entrada.fecha),
      entrada.accion === "creado" ? CT.histCreado : CT.histActualizado,
      textoDolar(entrada),
      entrada.uf ? textoPesos(entrada.uf) : "—",
      formatoMonto(entrada.costo, entrada.moneda),
      formatoMonto(entrada.costoLote || entrada.costo, entrada.moneda),
      variacion(previa, entrada),
      entrada.usuario || "—"
    ];
  });
  return filas.reverse();
}

/**
 * @param {object|null} previa
 * @param {object} actual
 * @returns {string}
 */
function variacion(previa, actual) {
  if (!previa || previa.moneda !== actual.moneda || !previa.costo) {
    return "—";
  }
  const diferencia = actual.costo - previa.costo;
  if (!diferencia) return "0 %";
  const pct = (diferencia / previa.costo) * 100;
  const signo = diferencia > 0 ? "+" : "−";
  const monto = formatoMonto(Math.abs(diferencia), actual.moneda);
  const porcentaje = Math.abs(pct).toLocaleString("es-CL", {
    maximumFractionDigits: 1
  });
  return `${signo}${monto} (${signo}${porcentaje} %)`;
}

/**
 * Dólar con el día de su cotización, si se conoce.
 * @param {object} entrada
 * @returns {string}
 */
function textoDolar(entrada) {
  if (!entrada.usd) return "—";
  const valor = textoPesos(entrada.usd);
  return entrada.fechaDolar
    ? `${valor} (${formatearFecha(entrada.fechaDolar)})`
    : valor;
}

/**
 * @param {number} valor
 * @returns {string}
 */
function textoPesos(valor) {
  return `$ ${valor.toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Columnas de la tabla del historial, en el orden de filasHistorial.
 * @returns {string[]}
 */
export function cabeceraHistorial() {
  return [
    CT.histFecha, CT.histMovimiento, CT.histDolar, CT.histUf,
    CT.costoEquipo, CT.costoLote, CT.histVariacion, CT.histUsuario
  ];
}
