/**
 * Propósito: Limpieza de la ficha de configuración antes
 *   de guardarla, una por licitación.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-13
 * Dependencias: config.js, sanitizar.js
 */

import { APP } from "./config.js";
import { tramitesDeMenu } from "./ficha-datos.js";
import {
  componerHorario,
  partirHorario
} from "./ficha-seguridad.js";
import { texto } from "./sanitizar.js";

const TOPE_LISTA = 40;
const TOPE_FILA = 40;
const TOPE_PAR = 12;

/**
 * Clave estable para no duplicar la misma licitación.
 * @param {unknown} valor
 * @returns {string}
 */
export function claveLicitacion(valor) {
  return texto(valor, 160)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * @param {unknown} valor
 * @param {number} tope
 * @param {(fila: object) => object} mapear
 * @returns {object[]}
 */
function lista(valor, tope, mapear) {
  const origen = Array.isArray(valor) ? valor : [];
  return origen.slice(0, tope).map((fila) => mapear(fila ?? {}));
}

/**
 * @param {object} fila
 * @returns {object}
 */
/**
 * @param {object} fila
 * @returns {object}
 */
function filaTotem(fila) {
  const partes = partirHorario(fila.horario);
  const entrada = texto(fila.horaEntrada, 8) || partes.entrada;
  const salida = texto(fila.horaSalida, 8) || partes.salida;
  return {
    totem: texto(fila.totem, 80),
    oficina: texto(fila.oficina, 160),
    sector: texto(fila.sector, 160),
    ip: texto(fila.ip, 40),
    menu: texto(fila.menu, 160),
    horaEntrada: entrada,
    horaSalida: salida,
    horario: componerHorario(entrada, salida)
      || texto(fila.horario, 80)
  };
}

/**
 * @param {object} fila
 * @returns {object}
 */
function sector(fila) {
  return {
    oficina: texto(fila.oficina, 160),
    sector: texto(fila.sector, 160),
    totem: texto(fila.totem, 80)
  };
}

/**
 * @param {object} fila
 * @returns {object}
 */
function grupo(fila) {
  return {
    sector: texto(fila.sector, 160),
    filas: lista(fila.filas, TOPE_FILA, (item) => ({
      modulo: texto(item.modulo, 80),
      tramites: texto(item.tramites, 800)
    }))
  };
}

/**
 * @param {object} fila
 * @returns {object}
 */
function persona(fila) {
  return {
    nombre: texto(fila.nombre, 120),
    usuario: texto(fila.usuario, 80),
    clave: texto(fila.clave, 80)
  };
}

/**
 * @param {object} fila
 * @returns {object}
 */
function ejecutivo(fila) {
  return {
    sector: texto(fila.sector, 160),
    filas: lista(fila.filas, TOPE_FILA, (item) => ({
      numero: texto(item.numero, 20),
      modulo: texto(item.modulo, 40),
      nombre: texto(item.nombre, 120),
      usuario: texto(item.usuario, 80),
      clave: texto(item.clave, 80)
    }))
  };
}

/**
 * @param {object} fila
 * @returns {object}
 */
function equipo(fila) {
  return {
    tipo: fila.tipo === "visor" ? "visor" : "totem",
    titulo: texto(fila.titulo, 80),
    pares: lista(fila.pares, TOPE_PAR, (item) => ({
      izquierda: texto(item.izquierda, 200),
      claveIzq: texto(item.claveIzq, 20),
      respuestaIzq: texto(item.respuestaIzq, 200),
      derecha: texto(item.derecha, 200),
      claveDer: texto(item.claveDer, 20),
      respuestaDer: texto(item.respuestaDer, 200)
    }))
  };
}

/**
 * Deja solo los campos que se persisten.
 * @param {object} crudo
 * @returns {object}
 */
export function normalizarFicha(crudo) {
  const d = crudo || {};
  const licitacion = texto(d.licitacion, 160);
  return {
    plantilla: APP.plantillaFicha,
    licitacion,
    licitacionClave: claveLicitacion(licitacion),
    cliente: texto(d.cliente, 80),
    sistema: texto(d.sistema, 80),
    pais: texto(d.pais, 40),
    oficinas: lista(d.oficinas, TOPE_LISTA, (v) => texto(v, 160)),
    sectores: lista(d.sectores, TOPE_LISTA, sector),
    totems: lista(d.totems, TOPE_LISTA, filaTotem),
    gruposModulo: lista(d.gruposModulo, TOPE_LISTA, grupo),
    admins: lista(d.admins, TOPE_LISTA, persona),
    adminsSector: lista(d.adminsSector, TOPE_LISTA, (fila) => ({
      ...persona(fila),
      sector: texto(fila.sector, 160)
    })),
    ejecutivos: lista(d.ejecutivos, TOPE_LISTA, ejecutivo),
    visores: lista(d.visores, TOPE_LISTA, (fila) => ({
      sector: texto(fila.sector, 160),
      totem: texto(fila.totem, 80),
      visor: texto(fila.visor, 80),
      texto: texto(fila.texto, 200)
    })),
    idCentro: texto(d.idCentro, 40),
    msgAtrasado: texto(d.msgAtrasado, 200),
    minutosAtraso: texto(d.minutosAtraso, 8),
    minutosAdelanto: texto(d.minutosAdelanto, 8),
    msgTemprano: texto(d.msgTemprano, 200),
    equipos: lista(d.equipos, TOPE_LISTA, equipo),
    requisitos: lista(d.requisitos, TOPE_LISTA, (fila) => ({
      texto: texto(fila.texto, 200),
      estado: texto(fila.estado, 80)
    })),
    menu: {
      teclado: texto(d.menu && d.menu.teclado, 40) || "Arriba",
      totems: lista(d.menu && d.menu.totems, 40, menuDeTotem)
    },
    red: lista(d.red, TOPE_LISTA, filaRed)
  };
}

/**
 * @param {object} fila
 * @returns {object}
 */
function filaRed(fila) {
  return {
    idCentro: texto(fila.idCentro, 40),
    tienda: texto(fila.tienda, 160),
    equipo: texto(fila.equipo, 120),
    ubicacion: texto(fila.ubicacion, 80),
    idSitio: texto(fila.idSitio, 20),
    serie: texto(fila.serie, 40),
    idMonitoreo: texto(fila.idMonitoreo, 40),
    anydesk: texto(fila.anydesk, 80),
    ip: texto(fila.ip, 40),
    mascara: texto(fila.mascara, 40),
    gateway: texto(fila.gateway, 40),
    dns1: texto(fila.dns1, 40),
    dns2: texto(fila.dns2, 40)
  };
}

/**
 * @param {object} fila
 * @returns {object}
 */
function menuDeTotem(fila) {
  return {
    totem: texto(fila.totem, 80),
    ingresoRut: texto(fila.ingresoRut, 20),
    tipoPreferente: texto(fila.tipoPreferente, 20),
    ticketSinRut: texto(fila.ticketSinRut, 20),
    tramites: lista(tramitesDeMenu(fila), 20, (item) => ({
      texto: texto(item.texto, 80),
      hijos: lista(item.hijos, 20, (hijo) => texto(hijo, 80))
    })),
    listo: fila.listo === true
  };
}

/**
 * @param {object} crudo
 * @returns {{ok: boolean, mensaje: string, datos: object|null}}
 */
export function validarFicha(crudo) {
  const datos = normalizarFicha(crudo);
  if (!datos.licitacion || !datos.licitacionClave) {
    return {
      ok: false,
      mensaje: "Indica el nombre de la licitación.",
      datos: null
    };
  }
  return { ok: true, mensaje: "", datos };
}
