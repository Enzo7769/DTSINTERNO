/**
 * Propósito: Tabla del historial de cotización en el formulario.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-06
 * Dependencias: costo-historial, costo-textos, ui
 */

import {
  cabeceraHistorial,
  filasHistorial,
  historialVisible
} from "./costo-historial.js";
import { CT } from "./costo-textos.js";
import { porId } from "./ui.js";

/** Columnas que se alinean a la derecha (montos). */
const DERECHA = new Set([2, 3, 4, 5, 6]);

/**
 * @param {object|null} registro null en un costo nuevo
 * @returns {void}
 */
export function pintarHistorialCosto(registro) {
  porId("costo-historial-titulo").textContent = CT.historial;
  porId("costo-historial-ayuda").textContent = CT.historialAyuda;
  const cabeza = porId("costo-historial-cabeza");
  cabeza.replaceChildren(...cabeceraHistorial().map((titulo, i) => {
    const th = document.createElement("th");
    th.textContent = titulo;
    if (DERECHA.has(i)) th.className = "derecha";
    return th;
  }));
  const filas = filasHistorial(historialVisible(registro));
  porId("costo-historial").replaceChildren(...filas.map((fila) => {
    const tr = document.createElement("tr");
    fila.forEach((valor, i) => {
      const td = document.createElement("td");
      td.textContent = valor;
      if (DERECHA.has(i)) td.className = "derecha";
      tr.append(td);
    });
    return tr;
  }));
  const vacio = porId("costo-historial-vacio");
  vacio.textContent = CT.historialNuevo;
  vacio.hidden = filas.length > 0;
  porId("costo-historial").closest(".tabla-wrap").hidden = !filas.length;
}
