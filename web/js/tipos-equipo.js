/**
 * Propósito: Tipo de equipo, compartido por checklist y cartilla.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: ninguna
 *
 * Una sola opción: tótem, visor o locker.
 */

export const GRUPO_CHECKLIST = "tipo-checklist";
export const GRUPO_CARTILLA = "tipo-cartilla";
export const GRUPO_COSTO = "tipo-costo";
export const GRUPO_MODELO = "tipo-modelo";

export const TXT_TIPO = {
  leyenda: "Tipo de equipo",
  ayuda: "Elige una sola opción.",
  falta: "Indica si el equipo es tótem, visor o locker.",
  todos: "Todos"
};

export const TIPOS_EQUIPO = [
  { id: "totem", etiqueta: "Tótem" },
  { id: "visor", etiqueta: "Visor" },
  { id: "locker", etiqueta: "Locker" }
];

/**
 * @param {string} id
 * @returns {boolean}
 */
export function tipoValido(id) {
  return TIPOS_EQUIPO.some((tipo) => tipo.id === id);
}

/**
 * @param {string} id
 * @returns {string}
 */
export function etiquetaTipo(id) {
  const hallado = TIPOS_EQUIPO.find((tipo) => tipo.id === id);
  return hallado ? hallado.etiqueta : "";
}

/**
 * Dibuja las opciones dentro del contenedor (por defecto, las tres).
 * @param {HTMLElement} raiz
 * @param {string} grupo
 * @param {string} campo
 * @param {{id: string, etiqueta: string}[]} [opciones]
 * @param {string} [titulo]
 * @returns {void}
 */
export function pintarTipo(raiz, grupo, campo, opciones, titulo) {
  raiz.replaceChildren();
  const caja = document.createElement("fieldset");
  caja.className = "tipo-equipo";
  caja.dataset.campo = campo;
  const leyenda = document.createElement("legend");
  leyenda.textContent = titulo || TXT_TIPO.leyenda;
  const ayuda = document.createElement("p");
  ayuda.className = "ayuda";
  ayuda.textContent = TXT_TIPO.ayuda;
  const lista = document.createElement("div");
  lista.className = "tipo-opciones";
  lista.setAttribute("role", "radiogroup");
  lista.setAttribute("aria-label", titulo || TXT_TIPO.leyenda);
  (opciones || TIPOS_EQUIPO).forEach((tipo) => {
    lista.append(opcionTipo(grupo, tipo));
  });
  caja.append(leyenda, ayuda, lista);
  raiz.append(caja);
}

/**
 * @param {string} grupo
 * @param {{id: string, etiqueta: string}} tipo
 * @returns {HTMLElement}
 */
function opcionTipo(grupo, tipo) {
  const lab = document.createElement("label");
  lab.className = "tipo-opcion";
  const input = document.createElement("input");
  input.type = "radio";
  input.name = grupo;
  input.value = tipo.id;
  const nombre = document.createElement("span");
  nombre.textContent = tipo.etiqueta;
  lab.append(input, nombre);
  return lab;
}

/**
 * @param {string} grupo
 * @returns {string}
 */
export function leerTipo(grupo) {
  const marcado = document.querySelector(
    `input[name="${grupo}"]:checked`
  );
  return marcado ? marcado.value : "";
}

/**
 * @param {string} grupo
 * @param {string} id
 * @returns {void}
 */
export function marcarTipo(grupo, id) {
  document.querySelectorAll(`input[name="${grupo}"]`).forEach((input) => {
    input.checked = input.value === id;
  });
}

/**
 * Llena un select de filtro. Conserva la opción vacía.
 * @param {HTMLSelectElement} select
 * @param {{id: string, etiqueta: string}[]} [opciones]
 * @returns {void}
 */
export function llenarFiltroTipo(select, opciones) {
  if (select.options.length > 1) return;
  (opciones || TIPOS_EQUIPO).forEach((tipo) => {
    const opcion = document.createElement("option");
    opcion.value = tipo.id;
    opcion.textContent = tipo.etiqueta;
    select.append(opcion);
  });
}
