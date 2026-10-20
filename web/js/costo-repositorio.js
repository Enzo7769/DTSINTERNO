/**
 * Propósito: Lectura y escritura de la Base de costos HW.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: config, costo-validacion, repositorio-generico
 */

import { APP } from "./config.js";
import { normalizarCosto } from "./costo-validacion.js";
import { crearRepositorio } from "./repositorio-generico.js";

const repo = crearRepositorio({
  coleccion: APP.coleccionCostos,
  normalizar: normalizarCosto,
  contexto: "costos"
});

export const sembrarCostos = repo.sembrar;
export const listarCostos = repo.listar;
export const obtenerCosto = repo.obtener;
export const guardarCosto = repo.guardar;
export const eliminarCosto = repo.eliminar;
