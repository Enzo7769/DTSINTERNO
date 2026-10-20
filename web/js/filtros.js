/**
 * Propósito: Filtros y orden del listado de checklists.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: fechas.js
 */

import { aMillis } from "./fechas.js";

/**
 * Aplica los filtros del panel. Los vacíos no restringen.
 * @param {object[]} lista
 * @param {object} filtros
 * @returns {object[]}
 */
export function aplicarFiltros(lista, filtros) {
  const f = filtros || {};
  return (lista || []).filter((item) => {
    if (!incluye(item.proyecto, f.proyecto)) return false;
    if (!incluye(item.cliente, f.cliente)) return false;
    if (!incluye(item.tecnico, f.tecnico)) return false;
    if (!incluye(item.numeroSerie, f.serie)) return false;
    if (!fechaIgual(item.fechaInspeccion, f.fechaInspeccion)) {
      return false;
    }
    if (!fechaIgual(item.fechaSalida, f.fechaSalida)) return false;
    if (f.tipoEquipo && item.tipoEquipo !== f.tipoEquipo) return false;
    if (f.estado && item.estado !== f.estado) return false;
    return true;
  });
}

/**
 * Ordena del checklist más nuevo al más antiguo.
 * @param {object[]} lista
 * @returns {object[]}
 */
export function ordenarPorSalida(lista) {
  return [...(lista || [])].sort((a, b) => {
    const diferencia = numeroDe(b) - numeroDe(a);
    if (diferencia !== 0) return diferencia;
    const fa = a.fechaSalida || "";
    const fb = b.fechaSalida || "";
    if (fa !== fb) return fb.localeCompare(fa);
    return aMillis(b.creadoEn) - aMillis(a.creadoEn);
  });
}

/**
 * @param {object} registro
 * @returns {number}
 */
function numeroDe(registro) {
  const numero = Number(registro && registro.numero);
  if (!Number.isInteger(numero) || numero <= 0) return 0;
  return numero;
}

/**
 * @param {unknown} valor
 * @param {unknown} consulta
 * @returns {boolean}
 */
function incluye(valor, consulta) {
  const q = String(consulta || "").trim().toLowerCase();
  if (!q) return true;
  return String(valor || "").toLowerCase().includes(q);
}

/**
 * @param {unknown} valor
 * @param {unknown} consulta
 * @returns {boolean}
 */
function fechaIgual(valor, consulta) {
  const q = String(consulta || "").trim();
  if (!q) return true;
  return String(valor || "") === q;
}
