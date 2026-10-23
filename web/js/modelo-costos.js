/**
 * Propósito: Mantener unidos un modelo y sus costos, que se
 *   relacionan por el nombre (modeloClave = nombreClave).
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-23
 * Dependencias: costo-repositorio
 */

import { guardarCosto, listarCostos } from "./costo-repositorio.js";

/**
 * @param {string} clave nombreClave del modelo
 * @returns {Promise<object[]>}
 */
export async function costosDelModelo(clave) {
  if (!clave) return [];
  const lista = await listarCostos();
  return lista.filter((costo) => costo.modeloClave === clave);
}

/**
 * Cambia el nombre del modelo en cada costo que usaba el anterior.
 * El historial y las piezas no cambian.
 * @param {object[]} costos
 * @param {string} nombre nombre nuevo del modelo
 * @param {{uid: string, email: string}} autor
 * @returns {Promise<number>} costos actualizados
 */
export async function renombrarCostos(costos, nombre, autor) {
  let hechos = 0;
  for (const costo of costos) {
    await guardarCosto({ ...costo, modelo: nombre }, costo, autor);
    hechos += 1;
  }
  return hechos;
}
