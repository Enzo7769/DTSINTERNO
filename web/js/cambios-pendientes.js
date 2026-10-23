/**
 * Propósito: Avisar antes de salir de un formulario con cambios sin
 *   guardar (otra ruta del panel, recarga o cierre de la pestaña).
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-23
 * Dependencias: ui
 */

import { porId } from "./ui.js";

const AVISO =
  "Hay cambios sin guardar. Si sales ahora se perderán. ¿Salir igual?";

/** Vistas vigiladas y si tienen cambios. */
const sucias = new Map();
let rutaAnterior = location.hash;

/**
 * Marca la vista como modificada cuando el usuario escribe en ella.
 * @param {string} vistaId
 * @returns {void}
 */
export function vigilarCambios(vistaId) {
  const vista = porId(vistaId);
  sucias.set(vistaId, false);
  const marcar = (evento) => {
    if (evento.isTrusted) sucias.set(vistaId, true);
  };
  vista.addEventListener("input", marcar);
  vista.addEventListener("change", marcar);
}

/**
 * Se llama al abrir el formulario y después de guardarlo.
 * @param {string} vistaId
 * @returns {void}
 */
export function cambiosGuardados(vistaId) {
  sucias.set(vistaId, false);
}

/**
 * Hay cambios en una vista que está a la vista del usuario.
 * @returns {boolean}
 */
function hayPendientes() {
  return [...sucias.entries()]
    .some(([id, sucia]) => sucia && !porId(id).hidden);
}

/**
 * Pide confirmar la salida. Si el usuario se queda, la dirección
 * vuelve a la ruta anterior sin recargar la vista.
 * @returns {boolean} true si se puede cambiar de ruta
 */
export function permitirCambioRuta() {
  if (hayPendientes() && !window.confirm(AVISO)) {
    history.replaceState(null, "", rutaAnterior);
    return false;
  }
  sucias.forEach((_, id) => sucias.set(id, false));
  rutaAnterior = location.hash;
  return true;
}

window.addEventListener("beforeunload", (evento) => {
  if (!hayPendientes()) return;
  evento.preventDefault();
  evento.returnValue = "";
});
