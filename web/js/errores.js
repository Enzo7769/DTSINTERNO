/**
 * Propósito: Traduce códigos de Firebase a textos de la interfaz.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: constantes.js
 */

import { MSG } from "./constantes.js";

/**
 * @param {unknown} error
 * @returns {string}
 */
export function mensajeError(error) {
  const codigo = error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "";
  if (codigo === "auth/invalid-credential") return MSG.credenciales;
  if (codigo === "auth/wrong-password") return MSG.credenciales;
  if (codigo === "auth/user-not-found") return MSG.credenciales;
  if (codigo === "auth/invalid-email") return MSG.correoInvalido;
  if (codigo === "auth/too-many-requests") return MSG.muchosIntentos;
  if (codigo === "auth/network-request-failed") return MSG.errorRed;
  if (codigo === "permission-denied") return MSG.errorPermiso;
  if (codigo === "unavailable") return MSG.errorRed;
  return MSG.errorGenerico;
}
