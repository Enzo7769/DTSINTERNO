/**
 * Propósito: Limpieza de textos e imágenes antes de guardar.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: config.js, constantes.js
 */

import { APP } from "./config.js";
import { LIMITES } from "./constantes.js";

/**
 * Recorta, quita controles y limita el largo.
 * @param {unknown} valor
 * @param {number} max
 * @returns {string}
 */
export function texto(valor, max) {
  const limpio = String(valor ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
  const tope = Number.isFinite(max) ? max : limpio.length;
  return limpio.slice(0, tope);
}

/**
 * Normaliza un correo para el inicio de sesión.
 * @param {unknown} valor
 * @returns {string}
 */
export function correo(valor) {
  return texto(valor, 120).toLowerCase();
}

/**
 * @param {string} valor
 * @returns {boolean}
 */
export function correoValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

/**
 * Serie en mayúsculas para comparar duplicados.
 * @param {unknown} valor
 * @returns {string}
 */
export function normalizarSerie(valor) {
  return texto(valor, LIMITES.serie).toUpperCase();
}

/**
 * Deja la MAC como AA:BB:CC:DD:EE:FF, o vacío si no es válida.
 * @param {unknown} valor
 * @returns {string}
 */
export function normalizarMac(valor) {
  const hex = texto(valor, 23)
    .toUpperCase()
    .replace(/[^0-9A-F]/g, "");
  if (!/^[0-9A-F]{12}$/.test(hex)) return "";
  return hex.match(/.{2}/g).join(":");
}

/**
 * Deja la IP como cuatro octetos, o vacío si no es válida.
 * @param {unknown} valor
 * @returns {string}
 */
export function normalizarIp(valor) {
  const partes = texto(valor, 15).split(".");
  if (partes.length !== 4) return "";
  const octetos = [];
  for (let i = 0; i < partes.length; i += 1) {
    if (!/^\d{1,3}$/.test(partes[i])) return "";
    const numero = Number(partes[i]);
    if (numero > 255) return "";
    octetos.push(String(numero));
  }
  return octetos.join(".");
}

/**
 * Acepta solo PNG en data URL y bajo el tope de tamaño.
 * @param {unknown} valor
 * @returns {string}
 */
export function imagenSegura(valor) {
  const dato = String(valor || "");
  if (!dato) return "";
  if (!dato.startsWith("data:image/png;base64,")) return "";
  if (dato.length > APP.maxImagen) return "";
  return dato;
}
