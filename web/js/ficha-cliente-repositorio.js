/**
 * Propósito: Guardar fichas enviadas al cliente. El id
 *   del documento es el token del enlace público.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-14
 * Dependencias: config.js, firebase-cliente.js, logger.js,
 *   repositorio.js, ficha-cliente-validacion.js
 */

import { APP } from "./config.js";
import { obtenerApi } from "./firebase-cliente.js";
import {
  crearToken,
  entradaHistorial,
  normalizarEnvio
} from "./ficha-cliente-validacion.js";
import { FICHA_PRUEBA } from "./ficha-datos.js";
import { preservarRedInterna } from "./ficha-red-vista.js";
import { registrarError } from "./logger.js";
import { modoMemoria } from "./repositorio.js";
import { texto } from "./sanitizar.js";

const COL = () => APP.coleccionFichasCliente;
const memoria = [];

/**
 * @param {object[]} registros
 * @returns {void}
 */
export function sembrarEnvios(registros) {
  memoria.length = 0;
  (registros || []).forEach((fila) => {
    memoria.push(structuredClone(fila));
  });
}

/**
 * Envío de ejemplo para la vista previa local.
 * @returns {object[]}
 */
export function semillaEnvios() {
  const ahora = Date.now();
  const token = "demo-ficha-suralis01";
  const base = normalizarEnvio({
    ...FICHA_PRUEBA,
    token,
    rellenadoPor: "",
    estado: "pendiente",
    plazoHasta: ahora + 7 * 24 * 60 * 60 * 1000,
    historial: [{
      fecha: ahora,
      quien: "Vista previa",
      accion: "creada"
    }]
  });
  return [{
    ...base,
    id: token,
    numero: 1,
    creadoEn: ahora,
    actualizadoEn: ahora,
    creadoPor: "demo",
    creadoPorEmail: "preview@dts.local",
    actualizadoPor: "demo"
  }];
}

/**
 * @returns {Promise<object[]>}
 */
export async function listarEnvios() {
  if (modoMemoria()) {
    return memoria.map((fila) => structuredClone(fila));
  }
  try {
    const { fsMod, db } = obtenerApi();
    const snap = await fsMod.getDocs(fsMod.query(
      fsMod.collection(db, COL()),
      fsMod.orderBy("creadoEn", "desc"),
      fsMod.limit(APP.limiteListado)
    ));
    const lista = [];
    snap.forEach((docu) => {
      lista.push({ id: docu.id, ...docu.data() });
    });
    return lista;
  } catch (error) {
    registrarError(error, "fichasCliente.listar");
    throw error;
  }
}

/**
 * Lectura por token. Sirve al admin y al cliente.
 * @param {string} token
 * @returns {Promise<object|null>}
 */
export async function obtenerEnvio(token) {
  if (!token) return null;
  if (modoMemoria()) {
    const hallado = memoria.find((fila) => fila.id === token);
    return hallado ? structuredClone(hallado) : null;
  }
  try {
    const { fsMod, db } = obtenerApi();
    const snap = await fsMod.getDoc(fsMod.doc(db, COL(), token));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    registrarError(error, "fichasCliente.obtener");
    throw error;
  }
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function eliminarEnvio(id) {
  if (!id) return;
  if (modoMemoria()) {
    const idx = memoria.findIndex((fila) => fila.id === id);
    if (idx >= 0) memoria.splice(idx, 1);
    return;
  }
  try {
    const { fsMod, db } = obtenerApi();
    await fsMod.deleteDoc(fsMod.doc(db, COL(), id));
  } catch (error) {
    registrarError(error, "fichasCliente.eliminar");
    throw error;
  }
}

/**
 * El historial va del más antiguo al más reciente. Si se llena, se
 * descartan los más antiguos para que siempre quede lo último.
 * @param {object[]} lista
 * @returns {object[]}
 */
export function recortarHistorial(lista) {
  return lista.slice(-APP.maxHistorialFicha);
}

/**
 * @param {object} datos
 * @param {{uid: string, email: string}} autor
 * @returns {Promise<object>}
 */
export async function crearEnvio(datos, autor) {
  const limpio = normalizarEnvio(datos);
  const token = limpio.token || crearToken();
  limpio.token = token;
  const quien = (autor && autor.email) || "Admin";
  limpio.historial = recortarHistorial([
    ...limpio.historial,
    entradaHistorial(quien, "creada")
  ]);
  if (modoMemoria()) {
    return enMemoria(limpio, null, autor, token);
  }
  try {
    return await crearRemoto(limpio, autor, token);
  } catch (error) {
    registrarError(error, "fichasCliente.crear");
    throw error;
  }
}

/**
 * Guardado del admin (plazo, correcciones).
 * @param {object} datos
 * @param {object} previo
 * @param {{uid: string, email: string}} autor
 * @returns {Promise<object>}
 */
export async function guardarEnvioAdmin(datos, previo, autor) {
  const limpio = normalizarEnvio({ ...previo, ...datos });
  limpio.token = previo.id || previo.token;
  const quien = (autor && autor.email) || "Admin";
  limpio.historial = recortarHistorial([
    ...((previo && previo.historial) || []),
    entradaHistorial(quien, "guardada")
  ]);
  if (modoMemoria()) {
    return enMemoria(limpio, previo, autor, limpio.token);
  }
  try {
    return await escribirRemoto(limpio, previo, autor.uid);
  } catch (error) {
    registrarError(error, "fichasCliente.admin");
    throw error;
  }
}

/**
 * Guardado del cliente sin sesión.
 * @param {object} datos
 * @param {object} previo
 * @param {string} nombre
 * @param {boolean} finalizar
 * @param {{url?: string, ruta?: string, nombre?: string}|null} [pdf]
 * @returns {Promise<object>}
 */
export async function guardarEnvioCliente(
  datos,
  previo,
  nombre,
  finalizar,
  pdf
) {
  const mezclado = { ...previo, ...datos };
  mezclado.plazoHasta = previo.plazoHasta;
  mezclado.creadoEn = previo.creadoEn;
  mezclado.numero = previo.numero;
  const limpio = normalizarEnvio(mezclado);
  limpio.token = previo.id || previo.token;
  limpio.rellenadoPor = nombre;
  limpio.estado = finalizar ? "finalizado" : "en_curso";
  limpio.plazoHasta = previo.plazoHasta;
  limpio.red = preservarRedInterna(limpio.red, previo.red);
  if (finalizar) limpio.finalizadoEn = Date.now();
  aplicarPdf(limpio, previo, pdf);
  const accion = finalizar ? "finalizada" : "guardada";
  limpio.historial = recortarHistorial([
    ...((previo && previo.historial) || []),
    entradaHistorial(nombre, accion)
  ]);
  if (modoMemoria()) {
    return enMemoria(limpio, previo, {
      uid: "cliente",
      email: nombre
    }, limpio.token);
  }
  try {
    return await escribirCliente(limpio, previo, finalizar);
  } catch (error) {
    registrarError(error, "fichasCliente.cliente");
    throw error;
  }
}

/**
 * @param {object} previo
 * @param {number} plazoHasta
 * @param {{uid: string, email: string}} autor
 * @returns {Promise<object>}
 */
export async function ampliarPlazo(previo, plazoHasta, autor) {
  const limpio = normalizarEnvio(previo);
  limpio.plazoHasta = plazoHasta;
  limpio.estado = "en_curso";
  limpio.finalizadoEn = 0;
  const quien = (autor && autor.email) || "Admin";
  const extra = previo.estado === "finalizado"
    ? [entradaHistorial(quien, "reabierta")]
    : [];
  limpio.historial = recortarHistorial([
    ...((previo && previo.historial) || []),
    entradaHistorial(quien, "plazo"),
    ...extra
  ]);
  if (modoMemoria()) {
    return enMemoria(limpio, previo, autor, previo.id);
  }
  try {
    return await escribirRemoto(limpio, previo, autor.uid, true);
  } catch (error) {
    registrarError(error, "fichasCliente.plazo");
    throw error;
  }
}

/**
 * @param {object} limpio
 * @param {{uid: string, email: string}} autor
 * @param {string} token
 * @returns {Promise<object>}
 */
async function crearRemoto(limpio, autor, token) {
  const { fsMod, db } = obtenerApi();
  const contador = fsMod.doc(db, APP.coleccionContadores, COL());
  const ref = fsMod.doc(db, COL(), token);
  await fsMod.runTransaction(db, async (tx) => {
    const snap = await tx.get(contador);
    const ultimo = snap.exists()
      ? Number(snap.data().ultimo) || 0
      : 0;
    const numero = ultimo + 1;
    tx.set(contador, { ultimo: numero });
    tx.set(ref, payloadNuevo(limpio, autor, numero, fsMod));
  });
  return obtenerEnvio(token);
}

/**
 * @param {object} limpio
 * @param {object} previo
 * @param {string} actualizadoPor
 * @returns {Promise<object>}
 */
async function escribirRemoto(
  limpio,
  previo,
  actualizadoPor,
  cambiarPlazo
) {
  const { fsMod, db } = obtenerApi();
  const id = previo.id || limpio.token;
  const body = {
    ...limpio,
    numero: Number(previo.numero) || 1,
    creadoEn: previo.creadoEn,
    creadoPor: previo.creadoPor,
    creadoPorEmail: previo.creadoPorEmail || "",
    actualizadoEn: fsMod.serverTimestamp(),
    actualizadoPor,
    plazoHasta: cambiarPlazo
      ? aTs(fsMod, limpio.plazoHasta, null)
      : previo.plazoHasta,
    historial: histRemoto(limpio.historial, fsMod)
  };
  delete body.id;
  if (cambiarPlazo) {
    body.estado = limpio.estado || "en_curso";
    body.finalizadoEn = null;
  } else if (limpio.finalizadoEn) {
    body.finalizadoEn = aTs(
      fsMod,
      limpio.finalizadoEn,
      previo.finalizadoEn
    );
  } else if (previo.finalizadoEn) {
    body.finalizadoEn = previo.finalizadoEn;
  } else {
    delete body.finalizadoEn;
  }
  await fsMod.setDoc(fsMod.doc(db, COL(), id), body);
  return obtenerEnvio(id);
}

/**
 * El cliente no toca el plazo ni la auditoría.
 * @param {object} limpio
 * @param {object} previo
 * @param {boolean} finalizar
 * @returns {Promise<object>}
 */
async function escribirCliente(limpio, previo, finalizar) {
  const { fsMod, db } = obtenerApi();
  const id = previo.id || limpio.token;
  const body = camposFicha(limpio);
  body.rellenadoPor = limpio.rellenadoPor;
  body.estado = finalizar ? "finalizado" : "en_curso";
  body.historial = histRemoto(limpio.historial, fsMod);
  body.actualizadoEn = fsMod.serverTimestamp();
  body.actualizadoPor = "cliente";
  if (finalizar) body.finalizadoEn = fsMod.Timestamp.now();
  await fsMod.updateDoc(fsMod.doc(db, COL(), id), body);
  return obtenerEnvio(id);
}

/**
 * @param {object} limpio
 * @param {object} previo
 * @param {{url?: string, ruta?: string, nombre?: string}|null} pdf
 * @returns {void}
 */
function aplicarPdf(limpio, previo, pdf) {
  limpio.pdfUrl = (pdf && pdf.url) || previo.pdfUrl || "";
  limpio.pdfRuta = (pdf && pdf.ruta) || previo.pdfRuta || "";
  limpio.pdfNombre = (pdf && pdf.nombre)
    || previo.pdfNombre
    || "";
}

/**
 * @param {object} limpio
 * @returns {object}
 */
function camposFicha(limpio) {
  return {
    cliente: limpio.cliente,
    sistema: limpio.sistema,
    pais: limpio.pais,
    oficinas: limpio.oficinas,
    sectores: limpio.sectores,
    totems: limpio.totems,
    gruposModulo: limpio.gruposModulo,
    admins: limpio.admins,
    adminsSector: limpio.adminsSector,
    ejecutivos: limpio.ejecutivos,
    visores: limpio.visores,
    idCentro: limpio.idCentro,
    msgAtrasado: limpio.msgAtrasado,
    minutosAtraso: limpio.minutosAtraso,
    minutosAdelanto: limpio.minutosAdelanto,
    msgTemprano: limpio.msgTemprano,
    equipos: limpio.equipos,
    requisitos: limpio.requisitos,
    menu: limpio.menu,
    red: limpio.red,
    pdfUrl: texto(limpio.pdfUrl, 600),
    pdfRuta: texto(limpio.pdfRuta, 200),
    pdfNombre: texto(limpio.pdfNombre, 120)
  };
}

/**
 * @param {object} limpio
 * @param {{uid: string, email: string}} autor
 * @param {number} numero
 * @param {object} fsMod
 * @returns {object}
 */
function payloadNuevo(limpio, autor, numero, fsMod) {
  const ahora = fsMod.Timestamp.now();
  const body = {
    ...limpio,
    numero,
    creadoEn: ahora,
    creadoPor: autor.uid,
    creadoPorEmail: autor.email || "",
    actualizadoEn: ahora,
    actualizadoPor: autor.uid,
    plazoHasta: aTs(fsMod, limpio.plazoHasta, null),
    historial: histRemoto(limpio.historial, fsMod)
  };
  delete body.finalizadoEn;
  delete body.id;
  return body;
}

/**
 * @param {object} fsMod
 * @param {number} ms
 * @param {unknown} previo
 * @returns {object}
 */
function aTs(fsMod, ms, previo) {
  if (previo && typeof previo.toMillis === "function") {
    if (millisIgual(previo, ms)) return previo;
  }
  const n = Number(ms);
  if (Number.isFinite(n) && n > 0) {
    return fsMod.Timestamp.fromMillis(n);
  }
  return fsMod.Timestamp.now();
}

/**
 * @param {object} ts
 * @param {number} ms
 * @returns {boolean}
 */
function millisIgual(ts, ms) {
  return Math.abs(ts.toMillis() - Number(ms || 0)) < 2;
}

/**
 * @param {object[]} lista
 * @param {object} fsMod
 * @returns {object[]}
 */
function histRemoto(lista, fsMod) {
  return (lista || []).map((item) => ({
    quien: item.quien,
    accion: item.accion,
    fecha: aTs(fsMod, item.fecha, item.fecha)
  }));
}

/**
 * @param {object} limpio
 * @param {object|null} previo
 * @param {{uid: string, email: string}} autor
 * @param {string} token
 * @returns {object}
 */
function enMemoria(limpio, previo, autor, token) {
  const ahora = Date.now();
  const maximo = memoria.reduce((max, fila) => {
    const n = Number(fila.numero);
    return Number.isInteger(n) && n > max ? n : max;
  }, 0);
  const docu = {
    ...limpio,
    id: token,
    token,
    numero: previo && previo.numero
      ? Number(previo.numero)
      : maximo + 1,
    creadoEn: previo && previo.creadoEn ? previo.creadoEn : ahora,
    creadoPor: previo && previo.creadoPor
      ? previo.creadoPor
      : autor.uid,
    creadoPorEmail: previo && typeof previo.creadoPorEmail === "string"
      ? previo.creadoPorEmail
      : (autor.email || ""),
    actualizadoEn: ahora,
    actualizadoPor: autor.uid
  };
  const idx = memoria.findIndex((fila) => fila.id === token);
  if (idx >= 0) memoria[idx] = docu;
  else memoria.unshift(docu);
  return structuredClone(docu);
}
