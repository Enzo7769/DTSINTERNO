/**
 * Propósito: Token, plazo e historial de la ficha que
 *   el cliente rellena por un enlace externo.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-14
 * Dependencias: config.js, fechas.js, ficha-validacion.js,
 *   sanitizar.js
 */

import { APP } from "./config.js";
import { millisDe } from "./fechas.js";
import { normalizarFicha } from "./ficha-validacion.js";
import { texto } from "./sanitizar.js";

export const ESTADOS_ENVIO = [
  "pendiente",
  "en_curso",
  "finalizado"
];

const TXT = {
  faltaLicitacion: "Indica el nombre de la licitación.",
  faltaNombre: "Indica el nombre de quien rellena la ficha.",
  faltaPlazo: "Indica cuántos días o la fecha límite.",
  sinLetras: "El nombre de la licitación debe tener letras o números.",
  plazoPasado: "La fecha límite ya pasó. Elige una fecha futura.",
  vencido: "Plazo vencido"
};

/**
 * Token opaco. El id del documento es este valor.
 * @returns {string}
 */
export function crearToken() {
  const bytes = new Uint8Array(16);
  const cripto = globalThis.crypto;
  if (cripto && cripto.getRandomValues) {
    cripto.getRandomValues(bytes);
  } else {
    bytes.forEach((_, i) => {
      bytes[i] = Math.floor(Math.random() * 256);
    });
  }
  return [...bytes]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * @param {string} token
 * @returns {string}
 */
export function urlPublica(token) {
  const base = `${location.origin}${location.pathname}`
    + `${location.search || ""}`;
  return `${base}#/rellenar?t=${encodeURIComponent(token)}`;
}

/**
 * @param {number} dias
 * @returns {number}
 */
export function plazoDesdeDias(dias) {
  const n = Number(dias);
  const seguro = Number.isFinite(n) && n > 0 ? Math.min(n, 90) : 7;
  return Date.now() + seguro * 24 * 60 * 60 * 1000;
}

/**
 * @param {unknown} valor
 * @returns {number}
 */
export function plazoDeCampo(valor) {
  if (!valor) return 0;
  const ms = Date.parse(String(valor));
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * @param {unknown} plazoHasta
 * @returns {{vencido: boolean, resto: number, texto: string}}
 */
export function restoPlazo(plazoHasta) {
  const fin = millisDe(plazoHasta);
  if (!fin) {
    return {
      vencido: false,
      conocido: false,
      resto: 0,
      texto: "—"
    };
  }
  const resto = fin - Date.now();
  if (resto <= 0) {
    return {
      vencido: true,
      conocido: true,
      resto: 0,
      texto: TXT.vencido
    };
  }
  return {
    vencido: false,
    conocido: true,
    resto,
    texto: textoResto(resto)
  };
}

/**
 * @param {number} ms
 * @returns {string}
 */
function textoResto(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(seg).padStart(2, "0");
  if (d > 0) return `${d}d ${hh}:${mm}:${ss}`;
  return `${hh}:${mm}:${ss}`;
}

/**
 * @param {string} quien
 * @param {string} accion
 * @returns {{fecha: number, quien: string, accion: string}}
 */
export function entradaHistorial(quien, accion) {
  return {
    fecha: Date.now(),
    quien: texto(quien, 120) || "Cliente",
    accion: texto(accion, 40)
  };
}

/**
 * @param {object} crudo
 * @returns {object}
 */
export function normalizarEnvio(crudo) {
  const d = crudo || {};
  const ficha = normalizarFicha({
    ...d,
    licitacion: d.licitacion || "Pendiente"
  });
  const hist = Array.isArray(d.historial) ? d.historial : [];
  return {
    ...ficha,
    plantilla: APP.plantillaFichaCliente,
    token: texto(d.token || d.id, 80),
    rellenadoPor: texto(d.rellenadoPor, 120),
    estado: estadoDe(d.estado),
    plazoHasta: millisDe(d.plazoHasta),
    finalizadoEn: millisDe(d.finalizadoEn),
    pdfUrl: texto(d.pdfUrl, 600),
    pdfRuta: texto(d.pdfRuta, 200),
    pdfNombre: texto(d.pdfNombre, 120),
    historial: hist
      .slice(-APP.maxHistorialFicha)
      .map(itemHistorial)
  };
}

/**
 * Revisa un enlace nuevo antes de crearlo.
 * @param {object} crudo
 * @param {number} [ahora] ms, para las pruebas
 * @returns {{ok: boolean, mensaje: string, datos: object|null}}
 */
export function validarEnvio(crudo, ahora = Date.now()) {
  const fallar = (mensaje) => ({ ok: false, mensaje, datos: null });
  if (!texto(crudo && crudo.licitacion, 160)) {
    return fallar(TXT.faltaLicitacion);
  }
  const datos = normalizarEnvio(crudo);
  if (!datos.licitacionClave) return fallar(TXT.sinLetras);
  if (!datos.plazoHasta) return fallar(TXT.faltaPlazo);
  if (datos.plazoHasta <= ahora) return fallar(TXT.plazoPasado);
  return { ok: true, mensaje: "", datos };
}

/**
 * @param {unknown} nombre
 * @returns {{ok: boolean, mensaje: string, nombre: string}}
 */
export function validarNombreCliente(nombre) {
  const limpio = texto(nombre, 120);
  if (limpio.length < 3) {
    return { ok: false, mensaje: TXT.faltaNombre, nombre: "" };
  }
  return { ok: true, mensaje: "", nombre: limpio };
}

/**
 * @param {object} envio
 * @returns {boolean}
 */
export function envioVencido(envio) {
  return restoPlazo(envio && envio.plazoHasta).vencido;
}

/**
 * @param {object} envio
 * @returns {boolean}
 */
export function clientePuedeEditar(envio) {
  if (!envio) return false;
  if (envio.estado === "finalizado") return false;
  return clientePuedeVer(envio);
}

/**
 * El enlace sirve solo mientras el plazo no venza.
 * Si ya finalizó, puede ver (sin editar) hasta esa fecha.
 * @param {object} envio
 * @returns {boolean}
 */
export function clientePuedeVer(envio) {
  if (!envio) return false;
  return !envioVencido(envio);
}

/**
 * @param {object} envio
 * @returns {string}
 */
export function etiquetaEstado(envio) {
  if (!envio) return "";
  if (envio.estado === "finalizado") return "Finalizada";
  if (envioVencido(envio)) return "Vencida";
  if (envio.estado === "en_curso") return "En proceso";
  return "Pendiente";
}

/**
 * @param {unknown} valor
 * @returns {string}
 */
function estadoDe(valor) {
  const t = String(valor || "pendiente");
  return ESTADOS_ENVIO.includes(t) ? t : "pendiente";
}

/**
 * @param {object} item
 * @returns {{fecha: number, quien: string, accion: string}}
 */
function itemHistorial(item) {
  const fila = item || {};
  return {
    fecha: millisDe(fila.fecha) || Date.now(),
    quien: texto(fila.quien, 120),
    accion: texto(fila.accion, 40)
  };
}
