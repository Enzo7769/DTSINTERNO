/**
 * Propósito: Simulación interactiva del tótem en 1.1
 *   Config. menú, desde el video de descanso hasta el ticket.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-13
 * Dependencias: sim-ticket-cine
 */

import { reproducirTicket } from "./sim-ticket-cine.js";

const VIDEO = "./assets/dtsdescanso.mp4";
const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "K", "0", "x"];

const TXT = {
  toque: "Toque la pantalla para comenzar",
  tipo: "Seleccione el tipo de atención",
  pref: "Atención preferente",
  general: "Atención general",
  rut: "Ingrese su Rut",
  menu: "Seleccione su trámite",
  sub: "Seleccione el subtrámite",
  volver: "Volver",
  ingresar: "Ingresar",
  sinRut: "Continuar sin RUT",
  faltaRut: "Ingrese un RUT para continuar.",
  nuevo: "Nueva atención",
  marca: "DTS",
  submarca: "AUTOSERVICIO",
  ticket: "Ticket emitido",
  gracias: "Retire su número y aguarde el llamado.",
  verImpresion: "Ver impresión",
  bienvenido: "Bienvenido",
  general: "General",
  preferenteCorto: "Preferente"
};

const estados = new Map();
let ultimoTicket = 0;

/**
 * @param {unknown} valor
 * @returns {boolean}
 */
export function esSi(valor) {
  const t = String(valor || "").trim().toLowerCase();
  return t === "sí" || t === "si";
}

/**
 * @param {string} crudo
 * @returns {string}
 */
export function formatearRut(crudo) {
  const limpio = String(crudo || "")
    .replace(/[^0-9kK]/g, "")
    .slice(0, 9);
  if (limpio.length < 2) return limpio.toUpperCase();
  return `${limpio.slice(0, -1)}-${limpio.slice(-1).toUpperCase()}`;
}

/**
 * @param {object} fila
 * @returns {"preferente"|"rut"|"tramites"}
 */
export function faseTrasDescanso(fila) {
  if (esSi(fila && fila.tipoPreferente)) return "preferente";
  if (esSi(fila && fila.ingresoRut)) return "rut";
  return "tramites";
}

/**
 * @param {string} rut
 * @param {string} tramite
 * @param {string} [sub]
 * @param {number} numero
 * @returns {string}
 */
export function mensajeTicket(rut, tramite, sub, numero) {
  const quien = rut ? `con el RUT ${rut}` : "sin RUT";
  const que = sub ? `${tramite} / ${sub}` : tramite;
  return `Se emitió el ticket N° ${numero} ${quien} `
    + `y el trámite ${que}.`;
}

/**
 * Código del ticket: una letra por trámite (A, B, C…) o P si es
 * atención preferente, y el número con tres cifras.
 * @param {number} numero
 * @param {number} indiceTramite
 * @param {boolean} preferente
 * @returns {string}
 */
export function codigoTicket(numero, indiceTramite, preferente) {
  const i = Math.max(0, Number(indiceTramite) || 0) % 26;
  const letra = preferente ? "P" : String.fromCharCode(65 + i);
  return `${letra}-${String(numero).padStart(3, "0")}`;
}

/**
 * RUT con puntos de miles: 12.345.678-5.
 * @param {string} crudo
 * @returns {string}
 */
export function rutConPuntos(crudo) {
  const rut = formatearRut(crudo);
  const [cuerpo, dv] = rut.split("-");
  if (!dv) return rut;
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
}

/**
 * Datos que se imprimen en el ticket de la simulación.
 * @param {object} est
 * @param {object} fila
 * @returns {object}
 */
function datosTicket(est, fila) {
  const preferente = est.tipo === "preferente";
  const numero = Number(est.ticket) || 1;
  const fecha = new Date(est.emitido || Date.now());
  return {
    codigo: codigoTicket(numero, est.idx, preferente),
    tramite: est.tramite,
    sub: est.sub,
    rut: est.rut ? rutConPuntos(est.rut) : "",
    atencion: preferente ? TXT.preferenteCorto : TXT.general,
    totem: fila.totem || "",
    fecha: fecha.toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }),
    antes: (numero * 7) % 9 + 1
  };
}

/**
 * El tótem completo: cabezal, pantalla, ranura de impresión y base.
 * @param {object} fila
 * @param {number} indice
 * @param {string} teclado
 * @returns {HTMLElement}
 */
export function crearSimTotem(fila, indice, teclado) {
  const caja = document.createElement("article");
  caja.className = "sim-totem";
  caja.dataset.simIndice = String(indice);
  const h = document.createElement("h3");
  h.textContent = `Simulación · ${fila.totem || "Tótem"}`;
  const mueble = document.createElement("div");
  mueble.className = "sim-mueble";
  const cabezal = document.createElement("div");
  cabezal.className = "sim-cabezal";
  const logo = document.createElement("img");
  logo.src = "./assets/logo-dts.png";
  logo.alt = "";
  cabezal.append(logo, document.createTextNode(TXT.submarca));
  const marco = document.createElement("div");
  marco.className = "sim-marco";
  marco.append(pintarFase(fila, indice, teclado));
  const impresora = document.createElement("div");
  impresora.className = "sim-impresora";
  impresora.setAttribute("aria-hidden", "true");
  impresora.append(document.createElement("span"));
  const base = document.createElement("div");
  base.className = "sim-base";
  mueble.append(cabezal, marco, impresora, base);
  caja.append(h, mueble);
  return caja;
}

/**
 * @param {Event} evento
 * @param {object} menu
 * @returns {boolean}
 */
export function alPulsarSim(evento, menu) {
  const nodo = evento.target.closest("[data-sim]");
  if (!nodo || !menu) return false;
  const p = nodo.dataset.sim.split(":");
  const i = Number(p[0]);
  const fila = (menu.totems || [])[i] || {};
  const est = estadoDe(i);
  aplicarSim(p, est, fila);
  const caja = nodo.closest(".sim-totem");
  if (caja) {
    const marco = caja.querySelector(".sim-marco");
    marco.replaceChildren(pintarFase(fila, i, menu.teclado));
  }
  if (est.fase === "ticket" && (est.animar || p[1] === "verTicket")) {
    est.animar = false;
    reproducirTicket(datosTicket(est, fila));
  }
  return true;
}

/**
 * @param {number} i
 * @returns {object}
 */
function estadoDe(i) {
  if (!estados.has(i)) {
    estados.set(i, vacio());
  }
  return estados.get(i);
}

/**
 * @returns {object}
 */
function vacio() {
  return {
    fase: "descanso",
    rut: "",
    tipo: "",
    tramite: "",
    sub: "",
    ticket: "",
    aviso: ""
  };
}

/**
 * @param {string[]} p
 * @param {object} est
 * @param {object} fila
 * @returns {void}
 */
function aplicarSim(p, est, fila) {
  const accion = p[1];
  if (accion === "tocar") {
    est.fase = faseTrasDescanso(fila);
    return;
  }
  if (accion === "verTicket") return;
  if (accion === "tipo") {
    est.tipo = p[2] || "";
    est.fase = esSi(fila.ingresoRut) ? "rut" : "tramites";
    return;
  }
  if (accion === "tecla") {
    est.aviso = "";
    est.rut = aplicarTecla(est.rut, p[2]);
    return;
  }
  if (accion === "ingresar") {
    if (!est.rut && !esSi(fila.ticketSinRut)) {
      est.aviso = TXT.faltaRut;
      return;
    }
    est.fase = "tramites";
    return;
  }
  if (accion === "sinRut" && esSi(fila.ticketSinRut)) {
    est.rut = "";
    est.fase = "tramites";
    return;
  }
  if (accion === "tramite") {
    elegirTramite(est, fila, Number(p[2]));
    return;
  }
  if (accion === "sub") {
    emitir(est, p.slice(3).join(":"), Number(p[2]));
    return;
  }
  if (accion === "volver") {
    est.fase = faseVolver(est.fase, fila);
    est.aviso = "";
    if (est.fase === "descanso") Object.assign(est, vacio());
    return;
  }
  if (accion === "nuevo") Object.assign(est, vacio());
}

/**
 * @param {object} est
 * @param {object} fila
 * @param {number} idx
 * @returns {void}
 */
function elegirTramite(est, fila, idx) {
  const item = (fila.tramites || [])[idx] || {};
  est.tramite = item.texto || "";
  const hijos = (item.hijos || []).filter((h) => String(h).trim());
  if (hijos.length) {
    est.fase = "sub";
    est.subIdx = idx;
    return;
  }
  emitir(est, "", idx);
}

/**
 * @param {object} est
 * @param {string} sub
 * @param {number} idx trámite elegido, para la letra del ticket
 * @returns {void}
 */
function emitir(est, sub, idx) {
  ultimoTicket += 1;
  est.sub = sub;
  est.idx = idx;
  est.ticket = String(ultimoTicket);
  est.emitido = Date.now();
  est.animar = true;
  est.fase = "ticket";
}

/**
 * @param {string} fase
 * @param {object} fila
 * @returns {string}
 */
function faseVolver(fase, fila) {
  if (fase === "sub") return "tramites";
  if (fase === "tramites" && esSi(fila.ingresoRut)) return "rut";
  if (fase === "tramites" || fase === "rut") {
    return esSi(fila.tipoPreferente) ? "preferente" : "descanso";
  }
  return "descanso";
}

/**
 * @param {string} rut
 * @param {string} tecla
 * @returns {string}
 */
function aplicarTecla(rut, tecla) {
  if (tecla === "x") return rut.slice(0, -1);
  if (rut.replace(/[^0-9kK]/g, "").length >= 9) return rut;
  if (tecla === "K" || tecla === "k") return rut + "K";
  return rut + String(tecla || "");
}

/**
 * @param {object} fila
 * @param {number} i
 * @param {string} teclado
 * @returns {HTMLElement}
 */
function pintarFase(fila, i, teclado) {
  const est = estadoDe(i);
  if (est.fase === "preferente") return pantallaTipo(i);
  if (est.fase === "rut") return pantallaRut(i, est, fila, teclado);
  if (est.fase === "tramites") return pantallaLista(i, fila, "tramites");
  if (est.fase === "sub") return pantallaLista(i, fila, "sub", est);
  if (est.fase === "ticket") return pantallaTicket(i, est);
  return pantallaDescanso(i);
}

/**
 * @param {number} i
 * @returns {HTMLElement}
 */
function pantallaDescanso(i) {
  const caja = document.createElement("button");
  caja.type = "button";
  caja.className = "sim-pantalla sim-descanso";
  caja.dataset.sim = `${i}:tocar`;
  // Pantalla de descanso propia por si el video no está o no carga.
  const marca = document.createElement("div");
  marca.className = "sim-reposo";
  const logo = document.createElement("img");
  logo.src = "./assets/logo-dts.png";
  logo.alt = "";
  const hola = document.createElement("strong");
  hola.textContent = TXT.bienvenido;
  const sub = document.createElement("small");
  sub.textContent = TXT.submarca;
  marca.append(logo, hola, sub);
  const video = document.createElement("video");
  video.addEventListener("error", () => video.remove());
  video.src = VIDEO;
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.play().catch(() => {});
  const aviso = document.createElement("span");
  aviso.className = "sim-toque";
  aviso.textContent = TXT.toque;
  caja.append(marca, video, aviso);
  return caja;
}

/**
 * @param {number} i
 * @returns {HTMLElement}
 */
function pantallaTipo(i) {
  const caja = pantallaBase(TXT.tipo);
  const lista = document.createElement("div");
  lista.className = "vista-botones";
  lista.append(
    botonSim(TXT.pref, `${i}:tipo:preferente`),
    botonSim(TXT.general, `${i}:tipo:general`)
  );
  caja.append(lista, pie([pill(TXT.volver, `${i}:volver`)]));
  return caja;
}

/**
 * @param {number} i
 * @param {object} est
 * @param {object} fila
 * @param {string} teclado
 * @returns {HTMLElement}
 */
function pantallaRut(i, est, fila, teclado) {
  const caja = pantallaBase(TXT.rut);
  caja.classList.add("vista-rut", clasePad(teclado));
  const cuerpo = document.createElement("div");
  cuerpo.className = "vista-cuerpo";
  const sup = document.createElement("div");
  sup.className = "vista-hueco vista-hueco-sup";
  const inf = document.createElement("div");
  inf.className = "vista-hueco vista-hueco-inf";
  const pad = document.createElement("div");
  pad.className = "vista-teclado";
  const campo = document.createElement("div");
  campo.className = "vista-rut-campo sim-rut";
  campo.textContent = rutConPuntos(est.rut);
  const grilla = document.createElement("div");
  grilla.className = "vista-pad";
  TECLAS.forEach((tecla) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = tecla === "x" ? "vista-tecla borra" : "vista-tecla";
    btn.dataset.sim = `${i}:tecla:${tecla}`;
    btn.textContent = tecla === "x" ? "⌫" : tecla;
    grilla.append(btn);
  });
  pad.append(campo, grilla);
  cuerpo.append(sup, pad, inf);
  const pills = [
    pill(TXT.volver, `${i}:volver`),
    pill(TXT.ingresar, `${i}:ingresar`)
  ];
  if (esSi(fila.ticketSinRut)) {
    pills.push(pill(TXT.sinRut, `${i}:sinRut`));
  }
  if (est.aviso) {
    const p = document.createElement("p");
    p.className = "sim-aviso";
    p.textContent = est.aviso;
    caja.append(p);
  }
  caja.append(cuerpo, pie(pills));
  return caja;
}

/**
 * @param {number} i
 * @param {object} fila
 * @param {"tramites"|"sub"} modo
 * @param {object} [est]
 * @returns {HTMLElement}
 */
function pantallaLista(i, fila, modo, est) {
  const titulo = modo === "sub" ? TXT.sub : TXT.menu;
  const caja = pantallaBase(titulo);
  const lista = document.createElement("div");
  lista.className = "vista-botones";
  if (modo === "sub") {
    const item = (fila.tramites || [])[est.subIdx] || {};
    (item.hijos || []).filter((h) => String(h).trim()).forEach((hijo) => {
      lista.append(botonSim(hijo, `${i}:sub:${est.subIdx}:${hijo}`));
    });
  } else {
    (fila.tramites || []).filter((t) => t && t.texto).forEach((item, t) => {
      const btn = botonSim(item.texto, `${i}:tramite:${t}`);
      btn.dataset.vistaItem = String(t);
      lista.append(btn);
    });
  }
  caja.append(lista, pie([pill(TXT.volver, `${i}:volver`)]));
  return caja;
}

/**
 * @param {number} i
 * @param {object} est
 * @returns {HTMLElement}
 */
function pantallaTicket(i, est) {
  const caja = pantallaBase(TXT.ticket);
  const nro = document.createElement("p");
  nro.className = "sim-ticket-nro";
  nro.textContent = codigoTicket(
    Number(est.ticket),
    est.idx,
    est.tipo === "preferente"
  );
  const msg = document.createElement("p");
  msg.className = "sim-ticket-msg";
  msg.textContent = mensajeTicket(
    est.rut ? rutConPuntos(est.rut) : "",
    est.tramite,
    est.sub,
    Number(est.ticket)
  );
  const ok = document.createElement("p");
  ok.className = "sim-ticket-ok";
  ok.textContent = TXT.gracias;
  caja.append(nro, msg, ok, pie([
    pill(TXT.verImpresion, `${i}:verTicket`),
    pill(TXT.nuevo, `${i}:nuevo`)
  ]));
  return caja;
}

/**
 * @param {string} titulo
 * @returns {HTMLElement}
 */
function pantallaBase(titulo) {
  const caja = document.createElement("div");
  caja.className = "sim-pantalla vista-pantalla";
  const cabeza = document.createElement("div");
  cabeza.className = "vista-cabeza";
  const h = document.createElement("p");
  h.textContent = titulo;
  const marca = document.createElement("div");
  marca.className = "vista-marca";
  const img = document.createElement("img");
  img.src = "./assets/logo-dts.png";
  img.alt = TXT.marca;
  const textos = document.createElement("div");
  const fuerte = document.createElement("strong");
  fuerte.textContent = TXT.marca;
  const small = document.createElement("small");
  small.textContent = TXT.submarca;
  textos.append(fuerte, small);
  marca.append(img, textos);
  cabeza.append(h, marca);
  caja.append(cabeza);
  return caja;
}

/**
 * @param {string} texto
 * @param {string} sim
 * @returns {HTMLButtonElement}
 */
function botonSim(texto, sim) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "vista-boton";
  btn.dataset.sim = sim;
  btn.textContent = texto;
  return btn;
}

/**
 * @param {string} texto
 * @param {string} sim
 * @returns {HTMLButtonElement}
 */
function pill(texto, sim) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "vista-pill";
  btn.dataset.sim = sim;
  btn.textContent = texto;
  return btn;
}

/**
 * @param {HTMLElement[]} pills
 * @returns {HTMLElement}
 */
function pie(pills) {
  const caja = document.createElement("div");
  caja.className = "vista-pie";
  pills.forEach((nodo) => caja.append(nodo));
  return caja;
}

/**
 * @param {string} posicion
 * @returns {string}
 */
function clasePad(posicion) {
  const p = String(posicion || "").toLowerCase();
  if (p.includes("abajo")) return "teclado-abajo";
  if (p.includes("centr")) return "teclado-centrado";
  return "teclado-arriba";
}
