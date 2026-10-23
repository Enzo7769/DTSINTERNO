/**
 * Propósito: Pestaña 1.1 Config. menú, un tótem a la vez.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-14
 * Dependencias: ficha-datos.js, ficha-sim-totem.js
 */

import { sincronizarMenuTotems } from "./ficha-datos.js";
import { crearBarraPestanas } from "./ficha-pestanas.js";
import { crearSimTotem } from "./ficha-sim-totem.js";

const TXT = {
  nota:
    "Los tótems salen de los UDT ya creados. "
    + "Si hay más de 2, usa Ver otros tótem. "
    + "Pulsa Guardar tótem para el check verde.",
  teclado: "Ubicación del teclado en pantalla",
  totem: "Tótem",
  ingreso: "Ingreso de RUT",
  preferente: "Pantalla de tipo de atención preferente",
  sinRut: "Se puede sacar ticket sin RUT",
  agregarTramite: "Agregar trámite",
  agregarSub: "Agregar subtrámite",
  guardarTotem: "Guardar tótem",
  quitar: "Quitar",
  seleccionar: "Seleccionar",
  lista: "Tótems de esta licitación",
  vacio:
    "Crea los UDT en 1. Datos de config. "
    + "Aquí aparecen solos.",
  otros: "Ver otros tótem",
  ocultar: "Ocultar otros",
  listo: "Listo",
  falta: "Pendiente",
  sim: "Simulación de cómo queda el tótem",
  simAyuda: "Toca el video de descanso y recorre el flujo."
};

const TECLADO = ["Arriba", "Centrado", "Abajo"];
const SI_NO = ["Sí", "No"];

/** Índice del tótem visible en simulación y formulario. */
let indiceActivo = 0;
/** Panel lateral de tótems 3, 4… */
let listaExpandida = false;

/**
 * Elige el tótem visible en 1.1 Config. menú.
 * @param {number} i
 * @returns {void}
 */
export function elegirIndiceMenu(i) {
  indiceActivo = Number(i) || 0;
}

/**
 * @param {object} ficha
 * @returns {HTMLElement}
 */
export function dibujarConfigMenu(ficha) {
  sincronizarMenuTotems(ficha);
  const menus = ficha.menu.totems || [];
  const i = indiceDe(menus.length);
  const caja = document.createElement("div");
  caja.className = "ficha-menu";
  caja.dataset.ancla = "menu";
  caja.append(nota(), listaTotems(menus, i));
  if (i < 0) {
    caja.append(vacio());
    return caja;
  }
  // Simulación a la izquierda; teclado y menú a la derecha, para
  // ver el cambio mientras se edita.
  const editor = document.createElement("div");
  editor.className = "ficha-menu-editor";
  editor.append(
    teclado(ficha.menu),
    menuTotem(menus[i], i, ficha),
    acciones([[TXT.guardarTotem, `menu:guardarTotem:${i}`]])
  );
  const dos = document.createElement("div");
  dos.className = "ficha-menu-dos";
  dos.append(vistas(ficha.menu, i), editor);
  caja.append(dos);
  return caja;
}

/**
 * @param {object} datos
 * @param {string} codigo
 * @returns {boolean}
 */
export function aplicarMenu(datos, codigo) {
  const p = codigo.split(":");
  if (p[0] !== "menu") return false;
  const menus = datos.menu.totems;
  if (p[1] === "elegir") {
    indiceActivo = Number(p[2]);
    return true;
  }
  if (p[1] === "verOtros") {
    listaExpandida = true;
    return true;
  }
  if (p[1] === "ocultarOtros") {
    listaExpandida = false;
    return true;
  }
  const fila = menus[Number(p[2])];
  if (!fila) return true;
  if (!Array.isArray(fila.tramites)) fila.tramites = [];
  if (p[1] === "guardarTotem") {
    fila.listo = true;
    return true;
  }
  if (p[1] === "sumarTramite") {
    fila.tramites.push({ texto: "", hijos: [] });
    fila.listo = false;
    return true;
  }
  if (p[1] === "quitarTramite") {
    fila.tramites.splice(Number(p[3]), 1);
    fila.listo = false;
    return true;
  }
  if (p[1] === "sumarHijo") {
    const item = fila.tramites[Number(p[3])];
    if (item) {
      if (!Array.isArray(item.hijos)) item.hijos = [];
      item.hijos.push("");
    }
    fila.listo = false;
    return true;
  }
  if (p[1] === "quitarHijo") {
    const item = fila.tramites[Number(p[3])];
    if (item && Array.isArray(item.hijos)) {
      item.hijos.splice(Number(p[4]), 1);
    }
    fila.listo = false;
    return true;
  }
  return true;
}

/**
 * Si se edita un tótem ya guardado, quita el check verde.
 * @param {object} datos
 * @param {string} ruta
 * @returns {boolean}
 */
export function marcarTotemPendiente(datos, ruta) {
  const m = /^menu\.totems\.(\d+)/.exec(ruta || "");
  if (!m || !datos.menu) return false;
  const i = Number(m[1]);
  const fila = datos.menu.totems[i];
  if (!fila || !fila.listo) return false;
  fila.listo = false;
  const item = document.querySelector(
    `[data-accion="menu:elegir:${i}"]`
  );
  if (item) {
    item.classList.remove("es-listo");
    const marca = item.querySelector(".ficha-totem-check");
    if (marca) marca.textContent = "";
    const est = item.querySelector(".ficha-totem-estado");
    if (est) est.textContent = TXT.falta;
  }
  return true;
}

/**
 * True si el clic pide persistir el tótem activo.
 * @param {string} codigo
 * @returns {boolean}
 */
export function esGuardarTotem(codigo) {
  return String(codigo || "").startsWith("menu:guardarTotem:");
}

/**
 * Mueve el teclado de la simulación visible.
 * @param {string} posicion
 * @returns {void}
 */
export function moverTeclado(posicion) {
  const vista = document.querySelector(".vista-rut");
  if (!vista) return;
  vista.classList.remove(
    "teclado-arriba",
    "teclado-centrado",
    "teclado-abajo"
  );
  vista.classList.add(claseTeclado(posicion));
}

/**
 * @param {string} posicion
 * @returns {string}
 */
export function claseTeclado(posicion) {
  const p = String(posicion || "").toLowerCase();
  if (p.includes("abajo")) return "teclado-abajo";
  if (p.includes("centr")) return "teclado-centrado";
  return "teclado-arriba";
}

/**
 * @param {string} ruta
 * @param {string} valor
 * @returns {void}
 */
export function pintarItemVista(ruta, valor) {
  const m = /^menu\.totems\.\d+\.tramites\.(\d+)\.texto$/.exec(
    ruta || ""
  );
  if (!m) return;
  const btn = document.querySelector(`[data-vista-item="${m[1]}"]`);
  if (btn) btn.textContent = valor || " ";
}

/**
 * @param {number} total
 * @returns {number}
 */
function indiceDe(total) {
  if (total < 1) return -1;
  if (indiceActivo < 0 || indiceActivo >= total) {
    indiceActivo = 0;
  }
  return indiceActivo;
}

/**
 * @returns {HTMLElement}
 */
function nota() {
  const p = document.createElement("p");
  p.className = "ficha-nota";
  p.textContent = TXT.nota;
  return p;
}

/**
 * @returns {HTMLElement}
 */
function vacio() {
  const p = document.createElement("p");
  p.className = "ayuda";
  p.textContent = TXT.vacio;
  return p;
}

/**
 * @param {object[]} menus
 * @param {number} activo
 * @returns {HTMLElement}
 */
function listaTotems(menus, activo) {
  const nodo = bloque("", TXT.lista);
  nodo.append(crearBarraPestanas({
    items: menus.map((fila, i) => ({
      titulo: fila.totem || `${TXT.totem} ${i + 1}`,
      listo: fila.listo === true
    })),
    activo,
    otrosAbiertos: listaExpandida,
    prefijo: "menu",
    txtOtros: TXT.otros,
    txtOcultar: TXT.ocultar,
    txtListo: TXT.listo,
    txtFalta: TXT.falta
  }));
  return nodo;
}

/**
 * @param {object} menu
 * @param {number} i
 * @returns {HTMLElement}
 */
function vistas(menu, i) {
  const nodo = document.createElement("section");
  nodo.className = "tarjeta ficha-bloque";
  const h2 = document.createElement("h2");
  h2.textContent = TXT.sim;
  const ayuda = document.createElement("p");
  ayuda.className = "ayuda";
  ayuda.textContent = TXT.simAyuda;
  const grilla = document.createElement("div");
  grilla.className = "sim-grilla sim-grilla-una";
  grilla.append(crearSimTotem(menu.totems[i], i, menu.teclado));
  nodo.append(h2, ayuda, grilla);
  return nodo;
}

/**
 * @param {object} menu
 * @returns {HTMLElement}
 */
function teclado(menu) {
  const nodo = bloque("3.1", "Botones del tótem de atención (UDT)");
  const lab = document.createElement("label");
  lab.className = "campo";
  const span = document.createElement("span");
  span.textContent = TXT.teclado;
  const sel = lista(menu.teclado, "menu.teclado", TECLADO);
  sel.dataset.teclado = "1";
  lab.append(span, sel);
  nodo.append(lab);
  return nodo;
}

/**
 * @param {object} fila
 * @param {number} i
 * @param {object} ficha
 * @returns {HTMLElement}
 */
function menuTotem(fila, i, ficha) {
  const nodo = bloque("", `Menú del ${fila.totem || "tótem"}`);
  const cabeza = document.createElement("div");
  cabeza.className = "ficha-menu-flags";
  const fijo = document.createElement("span");
  fijo.className = "ficha-fijo";
  fijo.textContent = fila.totem || `${TXT.totem} ${i + 1}`;
  cabeza.append(
    etiqueta(TXT.totem, fijo),
    etiqueta(TXT.ingreso, lista(
      fila.ingresoRut,
      `menu.totems.${i}.ingresoRut`,
      SI_NO
    )),
    etiqueta(TXT.preferente, lista(
      fila.tipoPreferente,
      `menu.totems.${i}.tipoPreferente`,
      SI_NO
    )),
    etiqueta(TXT.sinRut, lista(
      fila.ticketSinRut,
      `menu.totems.${i}.ticketSinRut`,
      SI_NO
    ))
  );
  nodo.append(cabeza);
  (fila.tramites || []).forEach((item, t) => {
    nodo.append(tramite(item, i, t));
  });
  nodo.append(acciones([[
    TXT.agregarTramite,
    `menu:sumarTramite:${i}`
  ]]));
  return nodo;
}

/**
 * @param {object} item
 * @param {number} i
 * @param {number} t
 * @returns {HTMLElement}
 */
function tramite(item, i, t) {
  const caja = document.createElement("div");
  caja.className = "ficha-menu-tramite";
  const linea = document.createElement("div");
  linea.className = "ficha-linea";
  const lab = document.createElement("label");
  lab.className = "campo";
  const span = document.createElement("span");
  span.textContent = String(t + 1);
  lab.append(
    span,
    campo(item.texto, `menu.totems.${i}.tramites.${t}.texto`, 80)
  );
  linea.append(lab, boton(TXT.quitar, `menu:quitarTramite:${i}:${t}`));
  caja.append(linea);
  const subs = document.createElement("div");
  subs.className = "ficha-menu-subs";
  (item.hijos || []).forEach((hijo, h) => {
    const fila = document.createElement("div");
    fila.className = "ficha-linea";
    const et = document.createElement("label");
    et.className = "campo";
    const nro = document.createElement("span");
    nro.textContent = `${t + 1}.${h + 1}`;
    et.append(
      nro,
      campo(hijo, `menu.totems.${i}.tramites.${t}.hijos.${h}`, 80)
    );
    fila.append(et, boton(TXT.quitar, `menu:quitarHijo:${i}:${t}:${h}`));
    subs.append(fila);
  });
  caja.append(subs);
  caja.append(acciones([[
    TXT.agregarSub,
    `menu:sumarHijo:${i}:${t}`
  ]]));
  return caja;
}

/**
 * @param {string} numero
 * @param {string} titulo
 * @returns {HTMLElement}
 */
function bloque(numero, titulo) {
  const nodo = document.createElement("section");
  nodo.className = "tarjeta ficha-bloque";
  const h2 = document.createElement("h2");
  h2.textContent = numero ? `${numero}. ${titulo}` : titulo;
  nodo.append(h2);
  return nodo;
}

/**
 * @param {string} texto
 * @param {HTMLElement} control
 * @returns {HTMLElement}
 */
function etiqueta(texto, control) {
  const lab = document.createElement("label");
  lab.className = "campo";
  const span = document.createElement("span");
  span.textContent = texto;
  lab.append(span, control);
  return lab;
}

/**
 * @param {string} valor
 * @param {string} ruta
 * @param {number} [max]
 * @returns {HTMLInputElement}
 */
function campo(valor, ruta, max) {
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = max || 160;
  input.value = valor == null ? "" : String(valor);
  input.autocomplete = "off";
  input.dataset.ruta = ruta;
  return input;
}

/**
 * @param {string} valor
 * @param {string} ruta
 * @param {string[]} opciones
 * @returns {HTMLSelectElement}
 */
function lista(valor, ruta, opciones) {
  const select = document.createElement("select");
  select.dataset.ruta = ruta;
  const vacia = document.createElement("option");
  vacia.value = "";
  vacia.textContent = TXT.seleccionar;
  select.append(vacia);
  const ops = [...opciones];
  if (valor && !ops.includes(valor)) ops.push(valor);
  ops.forEach((item) => {
    const nodo = document.createElement("option");
    nodo.value = item;
    nodo.textContent = item;
    select.append(nodo);
  });
  select.value = valor || "";
  return select;
}

/**
 * @param {string} texto
 * @param {string} accion
 * @returns {HTMLButtonElement}
 */
function boton(texto, accion) {
  const primario = accion.includes("guardarTotem");
  const nodo = document.createElement("button");
  nodo.type = "button";
  const sumar = /:sumar/.test(accion);
  nodo.className = primario
    ? "boton"
    : accion.includes("quitar")
      ? "boton boton-secundario ficha-quitar"
      : "boton boton-secundario";
  if (sumar) nodo.classList.add("ficha-agregar");
  nodo.textContent = sumar ? `+ ${texto}` : texto;
  nodo.dataset.accion = accion;
  return nodo;
}

/**
 * @param {string[][]} lista
 * @returns {HTMLElement}
 */
function acciones(lista) {
  const caja = document.createElement("div");
  caja.className = "ficha-acciones";
  lista.forEach(([texto, accion]) => caja.append(boton(texto, accion)));
  return caja;
}
