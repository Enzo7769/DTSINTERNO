/**
 * Propósito: Pestaña 2. Datos de red de la ficha.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-13
 * Dependencias: ficha-datos.js, ficha-ip.js
 */

import { asegurarRed, nombresUnicos } from "./ficha-datos.js";
import { campoIp } from "./ficha-ip.js";

const TXT = {
  nota:
    "Hay una ficha de red por cada tótem y visor. "
    + "Si agregas uno nuevo en datos de config, "
    + "aparece acá. Completa todos los campos.",
  titulo: "2. Datos de red",
  grupoIdentificacion: "Identificación",
  grupoRed: "Red",
  grupoSoporte: "Soporte y monitoreo (DTS)",
  vacio:
    "Primero crea tótems o visores en 1. Datos de config.",
  idCentro: "ID centro",
  tienda: "Tienda / oficina",
  equipo: "Equipo",
  ubicacion: "Ubicación física dentro del establecimiento",
  idSitio: "ID sitio web",
  serie: "N° de serie",
  monitoreo: "ID equipo (monitoreo)",
  anydesk: "ID AnyDesk",
  ip: "Dirección IP",
  mascara: "Máscara",
  gateway: "Puerta de enlace",
  dns1: "DNS 1",
  dns2: "DNS 2",
  seleccionar: "Seleccionar",
  notaInternos:
    "ID sitio, serie, monitoreo y AnyDesk los completa "
    + "DTS cuando el cliente finalice la ficha."
};

/**
 * El cliente no envía sitio, serie, monitoreo ni AnyDesk.
 * @param {object[]} nueva
 * @param {object[]} previa
 * @returns {object[]}
 */
export function preservarRedInterna(nueva, previa) {
  const vieja = Array.isArray(previa) ? previa : [];
  return (Array.isArray(nueva) ? nueva : []).map((fila, i) => {
    const old = vieja[i] || {};
    return {
      ...fila,
      idSitio: old.idSitio || "",
      serie: old.serie || "",
      idMonitoreo: old.idMonitoreo || "",
      anydesk: old.anydesk || ""
    };
  });
}

/**
 * @param {object} ficha
 * @param {{ocultarInternos?: boolean,
 *   internosEditables?: boolean}} [opciones]
 * @returns {HTMLElement}
 */
export function dibujarDatosRed(ficha, opciones) {
  const ops = opciones || {};
  asegurarRed(ficha);
  const caja = document.createElement("div");
  caja.dataset.ancla = "red";
  const p = document.createElement("p");
  p.className = "ficha-nota";
  p.textContent = TXT.nota;
  const nodo = document.createElement("section");
  nodo.className = "tarjeta ficha-bloque";
  const h2 = document.createElement("h2");
  h2.textContent = TXT.titulo;
  nodo.append(h2);
  const lista = ficha.red || [];
  if (!lista.length) {
    const vacio = document.createElement("p");
    vacio.className = "ayuda";
    vacio.textContent = TXT.vacio;
    nodo.append(vacio);
  }
  const oficinas = nombresUnicos(ficha.oficinas);
  lista.forEach((fila, i) => {
    nodo.append(tarjetaRed(fila, i, oficinas, ops));
  });
  if (!ops.ocultarInternos && ops.internosEditables === false) {
    const aviso = document.createElement("p");
    aviso.className = "ayuda";
    aviso.textContent = TXT.notaInternos;
    nodo.append(aviso);
  }
  caja.append(p, nodo);
  return caja;
}

/**
 * Ya no se agregan filas a mano: salen de tótem/visor.
 * @returns {boolean}
 */
export function aplicarRed() {
  return false;
}

/**
 * @param {object} fila
 * @param {number} i
 * @param {string[]} oficinas
 * @param {{ocultarInternos?: boolean,
 *   internosEditables?: boolean}} ops
 * @returns {HTMLElement}
 */
function tarjetaRed(fila, i, oficinas, ops) {
  const card = document.createElement("article");
  card.className = "ficha-red-card";
  const h = document.createElement("h3");
  h.className = "ficha-red-titulo";
  const num = document.createElement("span");
  num.className = "ficha-num";
  num.textContent = String(i + 1);
  h.append(num, document.createTextNode(fila.equipo || TXT.equipo));
  card.append(h);
  const grid = document.createElement("div");
  grid.className = "ficha-red-grid";
  grid.append(
    grupo(TXT.grupoIdentificacion),
    dato(TXT.equipo, fijo(fila.equipo)),
    dato(
      TXT.tienda,
      lista(fila.tienda, `red.${i}.tienda`, oficinas)
    ),
    dato(
      TXT.idCentro,
      campo(fila.idCentro, `red.${i}.idCentro`, 40)
    ),
    dato(
      TXT.ubicacion,
      campo(fila.ubicacion, `red.${i}.ubicacion`, 80)
    ),
    grupo(TXT.grupoRed),
    dato(TXT.ip, campoIp(fila.ip, `red.${i}.ip`)),
    dato(
      TXT.mascara,
      campoIp(fila.mascara, `red.${i}.mascara`)
    ),
    dato(
      TXT.gateway,
      campoIp(fila.gateway, `red.${i}.gateway`)
    ),
    dato(TXT.dns1, campoIp(fila.dns1, `red.${i}.dns1`)),
    dato(TXT.dns2, campoIp(fila.dns2, `red.${i}.dns2`))
  );
  if (!ops.ocultarInternos) {
    const bloq = ops.internosEditables === false;
    grid.append(
      grupo(TXT.grupoSoporte),
      dato(
        TXT.idSitio,
        campo(fila.idSitio, `red.${i}.idSitio`, 20, bloq)
      ),
      dato(
        TXT.serie,
        campo(fila.serie, `red.${i}.serie`, 40, bloq)
      ),
      dato(
        TXT.monitoreo,
        campo(fila.idMonitoreo, `red.${i}.idMonitoreo`, 40, bloq)
      ),
      dato(
        TXT.anydesk,
        campo(fila.anydesk, `red.${i}.anydesk`, 80, bloq)
      )
    );
  }
  card.append(grid);
  return card;
}

/**
 * Subtítulo que ocupa toda la fila de la grilla.
 * @param {string} texto
 * @returns {HTMLElement}
 */
function grupo(texto) {
  const h = document.createElement("h4");
  h.className = "ficha-red-grupo";
  h.textContent = texto;
  return h;
}

/**
 * @param {string} titulo
 * @param {HTMLElement} control
 * @returns {HTMLLabelElement}
 */
function dato(titulo, control) {
  const lab = document.createElement("label");
  lab.className = "campo";
  const span = document.createElement("span");
  span.textContent = titulo;
  lab.append(span, control);
  return lab;
}

/**
 * @param {string} texto
 * @returns {HTMLElement}
 */
function fijo(texto) {
  const span = document.createElement("span");
  span.className = "ficha-fijo";
  span.textContent = texto || "—";
  return span;
}

/**
 * @param {string} valor
 * @param {string} ruta
 * @param {number} max
 * @param {boolean} [bloqueado]
 * @returns {HTMLInputElement}
 */
function campo(valor, ruta, max, bloqueado) {
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = max;
  input.value = valor == null ? "" : String(valor);
  input.autocomplete = "off";
  input.dataset.ruta = ruta;
  if (bloqueado) input.disabled = true;
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
