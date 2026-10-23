/**
 * Propósito: Lectura y escritura de la recepción de equipos (un
 *   documento por local, con sus equipos).
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-23
 * Dependencias: config, recepcion-datos, repositorio-generico
 */

import { APP } from "./config.js";
import { normalizarLocal } from "./recepcion-datos.js";
import { crearRepositorio } from "./repositorio-generico.js";

const repo = crearRepositorio({
  coleccion: APP.coleccionRecepcion,
  normalizar: normalizarLocal,
  contexto: "recepcion"
});

export const sembrarRecepcion = repo.sembrar;
export const listarLocales = repo.listar;
export const obtenerLocal = repo.obtener;
export const guardarLocal = repo.guardar;
export const eliminarLocal = repo.eliminar;
