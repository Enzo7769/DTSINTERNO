/**
 * Propósito: Lectura y escritura de los clientes de cotización
 *   creados desde la base de costos.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-07
 * Dependencias: cliente-cotizacion-validacion, config,
 *   repositorio-generico
 */

import { normalizarClienteCotizacion } from
  "./cliente-cotizacion-validacion.js";
import { APP } from "./config.js";
import { crearRepositorio } from "./repositorio-generico.js";

const repo = crearRepositorio({
  coleccion: APP.coleccionClientesCotizacion,
  normalizar: normalizarClienteCotizacion,
  contexto: "clientesCotizacion"
});

export const listarClientesCotizacion = repo.listar;
export const guardarClienteCotizacion = repo.guardar;
export const eliminarClienteCotizacion = repo.eliminar;
