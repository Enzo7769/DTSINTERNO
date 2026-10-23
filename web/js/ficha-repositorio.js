/**
 * Propósito: Lectura y escritura de fichas de configuración,
 *   una por licitación.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-13
 * Dependencias: config.js, ficha-validacion.js,
 *   repositorio-generico.js
 */

import { APP } from "./config.js";
import { normalizarFicha } from "./ficha-validacion.js";
import { crearRepositorio } from "./repositorio-generico.js";

const repo = crearRepositorio({
  coleccion: APP.coleccionFichas,
  normalizar: normalizarFicha,
  contexto: "fichasConfig"
});

export const listarFichas = repo.listar;
export const obtenerFicha = repo.obtener;
export const guardarFicha = repo.guardar;
export const eliminarFicha = repo.eliminar;
