/**
 * Propósito: Cargar la planilla de referencia en una base vacía.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: costo-repositorio, datos-planilla, modelo-repositorio
 */

import { guardarCosto } from "./costo-repositorio.js";
import { PLANILLA_COSTOS, PLANILLA_MODELOS } from "./datos-planilla.js";
import { guardarModelo } from "./modelo-repositorio.js";

/**
 * Guarda de a uno: cada alta reserva su N° en una transacción.
 * @param {object[]} registros
 * @param {Function} guardar
 * @param {{uid: string, email: string}} autor
 * @returns {Promise<number>}
 */
async function importarEnOrden(registros, guardar, autor) {
  let total = 0;
  for (const registro of registros) {
    await guardar(registro, null, autor);
    total += 1;
  }
  return total;
}

/**
 * @param {{uid: string, email: string}} autor
 * @returns {Promise<number>}
 */
export function importarModelos(autor) {
  return importarEnOrden(PLANILLA_MODELOS, guardarModelo, autor);
}

/**
 * @param {{uid: string, email: string}} autor
 * @returns {Promise<number>}
 */
export function importarCostos(autor) {
  return importarEnOrden(PLANILLA_COSTOS, guardarCosto, autor);
}
