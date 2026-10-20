/**
 * Propósito: Lectura y escritura del catálogo de modelos HW.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: config, modelo-validacion, repositorio-generico
 */

import { APP } from "./config.js";
import { normalizarModelo } from "./modelo-validacion.js";
import { crearRepositorio } from "./repositorio-generico.js";

const repo = crearRepositorio({
  coleccion: APP.coleccionModelos,
  normalizar: normalizarModelo,
  contexto: "modelos"
});

export const sembrarModelos = repo.sembrar;
export const listarModelos = repo.listar;
export const obtenerModelo = repo.obtener;
export const guardarModelo = repo.guardar;
export const eliminarModelo = repo.eliminar;
