/**
 * Propósito: Secciones de la cartilla como acordeón rellenable.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: cartilla-catalogo, cartilla-textos,
 *   cartilla-validacion, config, ui
 *
 * En las secciones seleccionables, tocar un elemento lo marca y
 * lo abre; abrir otro minimiza el que estaba abierto.
 */

import {
  idLibreValido,
  numeroItem,
  ordenarLibres,
  PREFIJO_LIBRE,
  SECCIONES_CARTILLA
} from "./cartilla-catalogo.js";
import { TXT } from "./cartilla-textos.js";
import { LIMITES_CARTILLA } from "./cartilla-validacion.js";
import { APP } from "./config.js";
import { avisar } from "./ui.js";

/** Nombre y fecha que propone una cartilla nueva. */
let porDefecto = {};

/**
 * Fija los valores que se proponen en las filas vacías.
 * En una cartilla guardada se pasa {} para no tocar lo que ya tiene.
 * @param {{nombre?: string, fecha?: string}} valores
 * @returns {void}
 */
export function fijarPorDefecto(valores) {
  porDefecto = { ...(valores || {}) };
}

/**
 * Dibuja todas las secciones y conecta su comportamiento.
 * @param {HTMLElement} raiz
 * @returns {void}
 */
export function pintarAcordeon(raiz) {
  raiz.replaceChildren();
  SECCIONES_CARTILLA.forEach((seccion) => {
    raiz.append(crearSeccion(seccion));
  });
  raiz.addEventListener("click", (evento) => {
    const quitar = evento.target.closest("[data-quitar]");
    if (quitar) {
      quitar.closest(".fila").remove();
      refrescar();
      return;
    }
    const agregar = evento.target.closest("[data-agregar]");
    if (agregar) {
      sumarPeriferico(agregar.closest("[data-seccion-cartilla]"));
      return;
    }
    const boton = evento.target.closest("[data-abrir]");
    if (!boton) return;
    const fila = boton.closest(".fila");
    const check = fila.querySelector("[data-incluir]");
    if (check && !check.checked) check.checked = true;
    alternar(fila);
    refrescar();
  });
  raiz.addEventListener("change", (evento) => {
    const check = evento.target.closest("[data-incluir]");
    if (check) {
      const fila = check.closest(".fila");
      if (check.checked) abrir(fila);
      else cerrar(fila);
    }
    refrescar();
  });
}

/**
 * @param {object} seccion
 * @returns {HTMLElement}
 */
function crearSeccion(seccion) {
  const nodo = document.createElement("section");
  nodo.className = "tarjeta seccion-cartilla";
  nodo.dataset.seccionCartilla = seccion.id;
  if (seccion.banda) {
    const banda = document.createElement("p");
    banda.className = "banda";
    banda.textContent = seccion.banda;
    nodo.append(banda);
  }
  const cabeza = document.createElement("div");
  cabeza.className = "cabeza-seccion";
  const titulo = document.createElement("h2");
  titulo.textContent = `N°${seccion.numero} · ${seccion.titulo}`;
  cabeza.append(titulo);
  if (seccion.obligatoria) {
    const marca = document.createElement("span");
    marca.className = "pill pill-pendiente";
    marca.textContent = TXT.obligatorio;
    cabeza.append(marca);
  }
  if (seccion.tipo === "seleccionable") {
    const cuenta = document.createElement("span");
    cuenta.className = "cuenta-seccion";
    cuenta.dataset.cuentaCartilla = seccion.id;
    cabeza.append(cuenta);
  }
  nodo.append(cabeza);
  if (seccion.tipo === "seleccionable") {
    const ayuda = document.createElement("p");
    ayuda.className = "ayuda";
    ayuda.textContent = seccion.obligatoria
      ? TXT.ayudaObligatoria
      : TXT.ayudaSeleccion;
    nodo.append(ayuda);
  }
  seccion.items.forEach((item, indice) => {
    nodo.append(crearFila(seccion, item, indice));
  });
  if (seccion.agregar) nodo.append(botonAgregar(seccion));
  return nodo;
}

/**
 * @param {object} seccion
 * @returns {HTMLButtonElement}
 */
function botonAgregar(seccion) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton-mas";
  boton.dataset.agregar = seccion.id;
  boton.textContent = `+ ${TXT.agregarPeriferico}`;
  return boton;
}

/**
 * Crea una fila de periférico con nombre libre y la abre.
 * @param {HTMLElement} seccionNodo
 * @returns {void}
 */
function sumarPeriferico(seccionNodo) {
  const actuales = seccionNodo.querySelectorAll("[data-libre]").length;
  if (actuales >= APP.maxPerifericosLibres) {
    avisar(TXT.maxPerifericos, "aviso");
    return;
  }
  const seccion = SECCIONES_CARTILLA.find(
    (item) => item.id === seccionNodo.dataset.seccionCartilla
  );
  const fila = insertarLibre(seccion, seccionNodo, siguienteLibre());
  fila.querySelectorAll(".fila-cuerpo [data-k]").forEach((campo) => {
    escribirCampo(campo, {});
  });
  abrir(fila);
  refrescar();
}

/**
 * @returns {string}
 */
function siguienteLibre() {
  let maximo = 0;
  document.querySelectorAll("[data-libre]").forEach((fila) => {
    const numero = Number(
      String(fila.dataset.fila).slice(PREFIJO_LIBRE.length)
    );
    if (numero > maximo) maximo = numero;
  });
  return `${PREFIJO_LIBRE}${maximo + 1}`;
}

/**
 * @param {object} seccion
 * @param {HTMLElement} seccionNodo
 * @param {string} id
 * @returns {HTMLElement}
 */
function insertarLibre(seccion, seccionNodo, id) {
  const item = {
    id,
    nombre: TXT.perifericoNuevo,
    nombreLibre: true,
    libre: true
  };
  const fila = crearFila(seccion, item, 0);
  const ancla = seccionNodo.querySelector("[data-agregar]");
  seccionNodo.insertBefore(fila, ancla);
  return fila;
}

/**
 * @param {object} seccion
 * @param {object} item
 * @param {number} indice
 * @returns {HTMLElement}
 */
function crearFila(seccion, item, indice) {
  const fila = document.createElement("article");
  fila.className = "fila";
  fila.dataset.fila = item.id;
  fila.dataset.campo = `fila:${item.id}`;
  if (item.libre) fila.dataset.libre = "1";
  if (incluidaSiempre(seccion, item)) fila.dataset.siempre = "1";
  const cabeza = document.createElement("div");
  cabeza.className = "fila-cabeza";
  if (seccion.tipo === "seleccionable" && !fila.dataset.siempre) {
    const marca = document.createElement("label");
    marca.className = "fila-check";
    const check = document.createElement("input");
    check.type = "checkbox";
    check.dataset.incluir = item.id;
    check.setAttribute("aria-label", item.nombre);
    marca.append(check);
    cabeza.append(marca);
  }
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "fila-toggle";
  boton.dataset.abrir = item.id;
  boton.setAttribute("aria-expanded", "false");
  const num = document.createElement("span");
  num.className = "fila-num";
  num.textContent = item.libre
    ? ""
    : numeroVisible(seccion, item, indice);
  const nombre = document.createElement("span");
  nombre.className = "fila-nombre";
  nombre.dataset.nombreFila = item.id;
  nombre.textContent = item.nombre;
  const estado = document.createElement("span");
  estado.className = "fila-estado";
  estado.dataset.estadoFila = item.id;
  const flecha = document.createElement("span");
  flecha.className = "fila-flecha";
  flecha.setAttribute("aria-hidden", "true");
  boton.append(num, nombre, estado, flecha);
  cabeza.append(boton);
  if (item.libre) cabeza.append(botonQuitar(item.id));
  fila.append(cabeza, crearCuerpo(seccion, item));
  return fila;
}

/**
 * @param {object} seccion
 * @param {object} item
 * @param {number} indice
 * @returns {string}
 */
function numeroVisible(seccion, item, indice) {
  if (seccion.tipo === "fija" || incluidaSiempre(seccion, item)) {
    return numeroItem(seccion, indice);
  }
  return "";
}

/**
 * La fila entra en la cartilla aunque nadie la marque.
 * @param {object} seccion
 * @param {object} item
 * @returns {boolean}
 */
function incluidaSiempre(seccion, item) {
  if (item.libre) return true;
  return Boolean(seccion.obligatoria) && !item.nombreLibre;
}

/**
 * @param {string} id
 * @returns {HTMLButtonElement}
 */
function botonQuitar(id) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton boton-secundario fila-quitar";
  boton.dataset.quitar = id;
  boton.textContent = TXT.quitar;
  return boton;
}

/**
 * @param {object} seccion
 * @param {object} item
 * @returns {HTMLElement}
 */
function crearCuerpo(seccion, item) {
  const L = LIMITES_CARTILLA;
  const cuerpo = document.createElement("div");
  cuerpo.className = "fila-cuerpo";
  cuerpo.hidden = true;
  if (item.nombreLibre) {
    cuerpo.append(campoTexto(TXT.nombreLibre, "nombreLibre", L.extra));
  }
  if (item.extras) {
    const rejilla = document.createElement("div");
    rejilla.className = "rejilla rejilla-3";
    item.extras.forEach((extra) => {
      rejilla.append(campoTexto(extra.etiqueta, `x:${extra.id}`, L.extra));
    });
    cuerpo.append(rejilla);
  }
  const etiquetaObs = seccion.columnaObs || TXT.observaciones;
  cuerpo.append(item.formato === "ip"
    ? campoTexto(etiquetaObs, "obs", 15, "192.168.1.10")
    : campoArea(etiquetaObs, "obs", L.obs));
  const rejilla = document.createElement("div");
  rejilla.className = "rejilla rejilla-3";
  rejilla.append(campoTexto(TXT.nombreFirma, "nombre", L.persona));
  rejilla.append(campoFecha(TXT.fecha, "fecha"));
  rejilla.append(campoAprobado(item.id));
  cuerpo.append(rejilla);
  return cuerpo;
}

/**
 * @param {string} etiqueta
 * @param {string} clave
 * @param {number} max
 * @param {string} [ejemplo]
 * @returns {HTMLElement}
 */
function campoTexto(etiqueta, clave, max, ejemplo) {
  const lab = document.createElement("label");
  lab.className = "campo";
  const span = document.createElement("span");
  span.textContent = etiqueta;
  const input = document.createElement("input");
  input.maxLength = max;
  input.autocomplete = "off";
  input.dataset.k = clave;
  if (ejemplo) input.placeholder = ejemplo;
  lab.append(span, input);
  return lab;
}

/**
 * @param {string} etiqueta
 * @param {string} clave
 * @param {number} max
 * @returns {HTMLElement}
 */
function campoArea(etiqueta, clave, max) {
  const lab = document.createElement("label");
  lab.className = "campo";
  const span = document.createElement("span");
  span.textContent = etiqueta;
  const area = document.createElement("textarea");
  area.rows = 2;
  area.maxLength = max;
  area.dataset.k = clave;
  lab.append(span, area);
  return lab;
}

/**
 * @param {string} etiqueta
 * @param {string} clave
 * @returns {HTMLElement}
 */
function campoFecha(etiqueta, clave) {
  const lab = document.createElement("label");
  lab.className = "campo";
  const span = document.createElement("span");
  span.textContent = etiqueta;
  const input = document.createElement("input");
  input.type = "date";
  input.dataset.k = clave;
  lab.append(span, input);
  return lab;
}

/**
 * @param {string} id
 * @returns {HTMLElement}
 */
function campoAprobado(id) {
  const grupo = document.createElement("fieldset");
  grupo.className = "campo aprobado";
  const leyenda = document.createElement("legend");
  leyenda.textContent = TXT.aprobado;
  grupo.append(leyenda);
  const opciones = document.createElement("div");
  opciones.className = "segmento";
  [["si", TXT.si], ["no", TXT.no]].forEach(([valor, texto]) => {
    const lab = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `ap-${id}`;
    radio.value = valor;
    radio.dataset.k = "aprobado";
    const span = document.createElement("span");
    span.textContent = texto;
    lab.append(radio, span);
    opciones.append(lab);
  });
  grupo.append(opciones);
  return grupo;
}

/**
 * @param {HTMLElement} fila
 * @returns {void}
 */
function alternar(fila) {
  const cuerpo = fila.querySelector(".fila-cuerpo");
  if (cuerpo.hidden) abrir(fila);
  else cerrar(fila);
}

/**
 * Abre una fila y minimiza la que estuviera abierta.
 * @param {HTMLElement} fila
 * @returns {void}
 */
function abrir(fila) {
  document.querySelectorAll(".seccion-cartilla .fila.abierta")
    .forEach((otra) => {
      if (otra !== fila) cerrar(otra);
    });
  fila.querySelector(".fila-cuerpo").hidden = false;
  fila.classList.add("abierta");
  fila.querySelector(".fila-toggle")
    .setAttribute("aria-expanded", "true");
  fila.scrollIntoView({ block: "nearest" });
  const primero = fila.querySelector(".fila-cuerpo [data-k]");
  if (primero) primero.focus({ preventScroll: true });
}

/**
 * @param {HTMLElement} fila
 * @returns {void}
 */
function cerrar(fila) {
  fila.querySelector(".fila-cuerpo").hidden = true;
  fila.classList.remove("abierta");
  fila.querySelector(".fila-toggle")
    .setAttribute("aria-expanded", "false");
}

/**
 * Cierra todas las filas abiertas.
 * @returns {void}
 */
export function cerrarTodas() {
  document.querySelectorAll(".seccion-cartilla .fila").forEach(cerrar);
}

/**
 * Actualiza marcas, estados y contadores visibles.
 * @returns {void}
 */
export function refrescar() {
  SECCIONES_CARTILLA.forEach((seccion) => {
    let incluidos = 0;
    seccion.items.forEach((item) => {
      const fila = document.querySelector(`[data-fila="${item.id}"]`);
      const dato = leerFila(fila, seccion);
      if (dato) incluidos += 1;
      fila.classList.toggle("incluida", Boolean(dato));
      pintarEstado(item, fila, dato);
    });
    if (seccion.agregar) incluidos += refrescarLibres(seccion);
    const cuenta = document.querySelector(
      `[data-cuenta-cartilla="${seccion.id}"]`
    );
    if (cuenta) cuenta.textContent = `${TXT.seleccionados}: ${incluidos}`;
  });
}

/**
 * @param {object} item
 * @param {HTMLElement} fila
 * @param {object|null} dato
 * @returns {void}
 */
function pintarEstado(item, fila, dato) {
  const estado = fila.querySelector(`[data-estado-fila="${item.id}"]`);
  const nombre = fila.querySelector(`[data-nombre-fila="${item.id}"]`);
  if (item.libre && dato && dato.nombreLibre) {
    nombre.textContent = dato.nombreLibre;
  } else if (dato && dato.nombreLibre) {
    nombre.textContent = `${item.nombre}: ${dato.nombreLibre}`;
  } else {
    nombre.textContent = item.nombre;
  }
  estado.className = "fila-estado";
  if (!dato) {
    estado.textContent = "";
    return;
  }
  if (dato.aprobado === "si") {
    estado.textContent = TXT.si;
    estado.classList.add("pill", "pill-aprobado");
  } else if (dato.aprobado === "no") {
    estado.textContent = TXT.no;
    estado.classList.add("pill", "pill-rechazado");
  } else {
    estado.textContent = TXT.pendiente;
    estado.classList.add("pill", "pill-pendiente");
  }
}

/**
 * Lee una fila del formulario. Devuelve null si no está incluida.
 * @param {HTMLElement} fila
 * @param {object} seccion
 * @returns {object|null}
 */
/**
 * Repinta los periféricos agregados y devuelve cuántos hay.
 * @param {object} seccion
 * @returns {number}
 */
function refrescarLibres(seccion) {
  const nodo = document.querySelector(
    `[data-seccion-cartilla="${seccion.id}"]`
  );
  let total = 0;
  nodo.querySelectorAll("[data-libre]").forEach((fila) => {
    const item = {
      id: fila.dataset.fila,
      nombre: TXT.perifericoNuevo,
      nombreLibre: true,
      libre: true
    };
    const dato = leerFila(fila, seccion);
    if (dato) total += 1;
    fila.classList.toggle("incluida", Boolean(dato));
    pintarEstado(item, fila, dato);
  });
  return total;
}

/**
 * Lee una fila del formulario. Devuelve null si no está incluida.
 * @param {HTMLElement} fila
 * @param {object} seccion
 * @returns {object|null}
 */
function leerFila(fila, seccion) {
  const check = fila.querySelector("[data-incluir]");
  const marcada = Boolean(check && check.checked);
  if (seccion.tipo === "seleccionable"
      && fila.dataset.siempre !== "1"
      && !marcada) {
    return null;
  }
  const dato = { incluido: true, extras: {}, aprobado: "" };
  fila.querySelectorAll(".fila-cuerpo [data-k]").forEach((campo) => {
    const clave = campo.dataset.k;
    if (clave === "aprobado") {
      if (campo.checked) dato.aprobado = campo.value;
    } else if (clave.startsWith("x:")) {
      dato.extras[clave.slice(2)] = campo.value;
    } else {
      dato[clave] = campo.value;
    }
  });
  return dato;
}

/**
 * Lee todas las filas incluidas.
 * @returns {object}
 */
export function leerFilas() {
  const filas = {};
  SECCIONES_CARTILLA.forEach((seccion) => {
    seccion.items.forEach((item) => {
      const fila = document.querySelector(`[data-fila="${item.id}"]`);
      const dato = leerFila(fila, seccion);
      if (dato) filas[item.id] = dato;
    });
  });
  document.querySelectorAll("[data-libre]").forEach((fila) => {
    const seccion = SECCIONES_CARTILLA.find((item) => item.agregar);
    const dato = leerFila(fila, seccion);
    if (dato) filas[fila.dataset.fila] = dato;
  });
  return filas;
}

/**
 * Carga valores guardados en el formulario.
 * @param {object} filas
 * @returns {void}
 */
export function aplicarFilas(filas) {
  document.querySelectorAll("[data-libre]").forEach((nodo) => nodo.remove());
  const origen = filas || {};
  const seccionLibre = SECCIONES_CARTILLA.find((item) => item.agregar);
  const nodoLibre = document.querySelector(
    `[data-seccion-cartilla="${seccionLibre.id}"]`
  );
  const ids = ordenarLibres(Object.keys(origen).filter(idLibreValido));
  ids.forEach((id) => {
    const fila = insertarLibre(seccionLibre, nodoLibre, id);
    fila.querySelectorAll(".fila-cuerpo [data-k]").forEach((campo) => {
      escribirCampo(campo, origen[id] || {});
    });
  });
  SECCIONES_CARTILLA.forEach((seccion) => {
    seccion.items.forEach((item) => {
      const fila = document.querySelector(`[data-fila="${item.id}"]`);
      const dato = (filas && filas[item.id]) || null;
      const check = fila.querySelector("[data-incluir]");
      if (check) check.checked = Boolean(dato);
      fila.querySelectorAll(".fila-cuerpo [data-k]").forEach((campo) => {
        escribirCampo(campo, dato || {});
      });
    });
  });
  cerrarTodas();
  refrescar();
}

/**
 * @param {HTMLInputElement|HTMLTextAreaElement} campo
 * @param {object} dato
 * @returns {void}
 */
function escribirCampo(campo, dato) {
  const clave = campo.dataset.k;
  if (clave === "aprobado") {
    campo.checked = dato.aprobado === campo.value;
    return;
  }
  if (clave.startsWith("x:")) {
    campo.value = (dato.extras && dato.extras[clave.slice(2)]) || "";
    return;
  }
  campo.value = dato[clave] || porDefecto[clave] || "";
}
