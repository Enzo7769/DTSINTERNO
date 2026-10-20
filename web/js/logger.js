/**
 * Propósito: Registro local de errores con tope de tamaño.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: config.js
 *
 * El navegador no puede escribir error.log en el servidor.
 * El registro queda en localStorage (dts_error_log), con
 * rotación bajo 1 MB. En producción no se imprime en consola.
 */

import { APP } from "./config.js";

const CLAVE = "dts_error_log";
const MAX_ENTRADAS = 200;

/**
 * Guarda un error con fecha ISO, nivel y stack.
 * @param {unknown} error
 * @param {string} contexto
 * @returns {void}
 */
export function registrarError(error, contexto) {
  try {
    const entrada = {
      fecha: new Date().toISOString(),
      nivel: "error",
      contexto: String(contexto || "app"),
      mensaje: mensajeDe(error),
      stack: stackDe(error)
    };
    persistir(entrada);
    if (!APP.produccion) {
      console.error(entrada.fecha, entrada.contexto, entrada.mensaje);
    }
  } catch (fallo) {
    if (!APP.produccion) {
      console.error("logger", fallo);
    }
  }
}

/**
 * @param {unknown} error
 * @returns {string}
 */
function mensajeDe(error) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message || "Error");
  }
  return String(error || "Error");
}

/**
 * @param {unknown} error
 * @returns {string}
 */
function stackDe(error) {
  if (error && typeof error === "object" && "stack" in error) {
    return String(error.stack || "").slice(0, 4000);
  }
  return "";
}

/**
 * @param {object} entrada
 * @returns {void}
 */
function persistir(entrada) {
  let actual = [];
  try {
    actual = JSON.parse(localStorage.getItem(CLAVE) || "[]");
    if (!Array.isArray(actual)) actual = [];
  } catch (error) {
    actual = [];
  }
  actual.push(entrada);
  while (actual.length > MAX_ENTRADAS) actual.shift();
  let serial = JSON.stringify(actual);
  while (serial.length > APP.maxBytesLog && actual.length > 1) {
    actual.shift();
    serial = JSON.stringify(actual);
  }
  localStorage.setItem(CLAVE, serial);
}
