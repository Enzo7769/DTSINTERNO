/**
 * Propósito: Avisos y acceso corto al DOM.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: ninguna
 */

/**
 * @param {string} id
 * @returns {HTMLElement}
 */
export function porId(id) {
  const nodo = document.getElementById(id);
  if (!nodo) throw new Error(`Falta #${id}`);
  return nodo;
}

/**
 * @param {HTMLElement} nodo
 * @param {boolean} visible
 * @returns {void}
 */
export function mostrar(nodo, visible) {
  nodo.hidden = !visible;
}

/**
 * Muestra una sola vista del panel y oculta las demás.
 * @param {string} id
 * @returns {void}
 */
export function mostrarVista(id) {
  document.querySelectorAll(".vista").forEach((vista) => {
    vista.hidden = vista.id !== id;
  });
  window.scrollTo(0, 0);
}

let destinoExito = "#/listado";
let modalListo = false;

/**
 * Abre el aviso de éxito y al aceptar navega al destino.
 * @param {string} titulo
 * @param {string} texto
 * @param {string} boton
 * @param {string} destino
 * @returns {void}
 */
export function mostrarExito(titulo, texto, boton, destino) {
  const modal = porId("modal-exito");
  if (!modalListo) {
    modalListo = true;
    porId("modal-aceptar").addEventListener("click", cerrarExito);
    modal.addEventListener("cancel", (evento) => {
      evento.preventDefault();
      cerrarExito();
    });
  }
  destinoExito = destino;
  porId("modal-titulo").textContent = titulo;
  porId("modal-texto").textContent = texto;
  porId("modal-aceptar").textContent = boton;
  if (!modal.open) modal.showModal();
}

/**
 * @returns {void}
 */
function cerrarExito() {
  const modal = porId("modal-exito");
  if (modal.open) modal.close();
  location.hash = destinoExito;
}

let confirmarListo = false;
/** @type {(() => void)|null} */
let confirmarOk = null;

/**
 * Modal de confirmación. Cancelar cierra; Aceptar ejecuta onOk.
 * @param {{titulo: string, texto: string, ok?: string,
 *   cancelar?: string, onOk: () => void}} ops
 * @returns {void}
 */
export function pedirConfirmacion(ops) {
  const modal = porId("modal-confirmar");
  if (!confirmarListo) {
    confirmarListo = true;
    porId("confirmar-cancelar").addEventListener("click", () => {
      cerrarConfirmacion();
    });
    porId("confirmar-ok").addEventListener("click", () => {
      const fn = confirmarOk;
      cerrarConfirmacion();
      if (fn) fn();
    });
    modal.addEventListener("cancel", (evento) => {
      evento.preventDefault();
      cerrarConfirmacion();
    });
  }
  porId("confirmar-titulo").textContent = ops.titulo;
  porId("confirmar-texto").textContent = ops.texto;
  porId("confirmar-ok").textContent = ops.ok || "Eliminar";
  porId("confirmar-cancelar").textContent =
    ops.cancelar || "Cancelar";
  confirmarOk = ops.onOk || null;
  if (!modal.open) modal.showModal();
}

/**
 * @returns {void}
 */
function cerrarConfirmacion() {
  confirmarOk = null;
  const modal = porId("modal-confirmar");
  if (modal.open) modal.close();
}

let temporizador = 0;

/**
 * Muestra un aviso breve arriba del panel.
 * @param {string} texto
 * @param {"ok"|"error"} tipo
 * @returns {void}
 */
export function avisar(texto, tipo) {
  const nodo = porId("aviso-global");
  nodo.textContent = texto;
  nodo.className = `aviso aviso-${tipo || "ok"}`;
  nodo.hidden = false;
  window.clearTimeout(temporizador);
  temporizador = window.setTimeout(() => {
    nodo.hidden = true;
  }, 4200);
}

/**
 * «1 costo», «14 costos». El plural se arma con «s» o se indica.
 * @param {number} n
 * @param {string} singular
 * @param {string} [plural]
 * @returns {string}
 */
export function textoConteo(n, singular, plural) {
  return n === 1 ? `1 ${singular}` : `${n} ${plural || `${singular}s`}`;
}
