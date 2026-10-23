/**
 * Propósito: Lectura y escritura de checklists y perfiles.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: config.js, firebase-cliente.js, logger.js, validacion.js
 */

import { APP } from "./config.js";
import { obtenerApi } from "./firebase-cliente.js";
import { registrarError } from "./logger.js";
import { normalizarChecklist } from "./validacion.js";

let enMemoria = false;
const memoria = [];

/**
 * Activa el almacén local de la vista previa.
 * @param {object[]} registros
 * @returns {void}
 */
export function activarMemoria(registros) {
  enMemoria = true;
  memoria.length = 0;
  (registros || []).forEach((registro) => {
    memoria.push(structuredClone(registro));
  });
}

/**
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function leerPerfil(uid) {
  if (enMemoria) {
    return {
      rol: "admin",
      nombre: "Vista previa",
      email: "preview@dts.local"
    };
  }
  try {
    const { fsMod, db } = obtenerApi();
    const ref = fsMod.doc(db, APP.coleccionUsuarios, uid);
    const snap = await fsMod.getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data();
  } catch (error) {
    registrarError(error, "leerPerfil");
    throw error;
  }
}

/**
 * @returns {Promise<object[]>}
 */
export async function listarChecklists() {
  if (enMemoria) {
    return memoria.map((registro) => structuredClone(registro));
  }
  try {
    const { fsMod, db } = obtenerApi();
    const consulta = fsMod.query(
      fsMod.collection(db, APP.coleccionChecklists),
      fsMod.orderBy("creadoEn", "desc"),
      fsMod.limit(APP.limiteListado)
    );
    const snap = await fsMod.getDocs(consulta);
    const lista = [];
    snap.forEach((docu) => {
      lista.push({ id: docu.id, ...docu.data() });
    });
    return lista;
  } catch (error) {
    registrarError(error, "listarChecklists");
    throw error;
  }
}

/**
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function obtenerChecklist(id) {
  if (!id) return null;
  if (enMemoria) {
    const hallado = memoria.find((registro) => registro.id === id);
    return hallado ? structuredClone(hallado) : null;
  }
  try {
    const { fsMod, db } = obtenerApi();
    const ref = fsMod.doc(db, APP.coleccionChecklists, id);
    const snap = await fsMod.getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    registrarError(error, "obtenerChecklist");
    throw error;
  }
}

/**
 * Busca otra salida con la misma serie normalizada.
 * @param {string} serieNorm
 * @param {string} idActual
 * @returns {Promise<object[]>}
 */
export async function buscarPorSerie(serieNorm, idActual) {
  if (!serieNorm) return [];
  if (enMemoria) {
    return memoria
      .filter((registro) => {
        return registro.numeroSerieNorm === serieNorm
          && registro.id !== idActual;
      })
      .map((registro) => structuredClone(registro));
  }
  try {
    const { fsMod, db } = obtenerApi();
    const consulta = fsMod.query(
      fsMod.collection(db, APP.coleccionChecklists),
      fsMod.where("numeroSerieNorm", "==", serieNorm),
      fsMod.limit(5)
    );
    const snap = await fsMod.getDocs(consulta);
    const lista = [];
    snap.forEach((docu) => {
      if (docu.id !== idActual) {
        lista.push({ id: docu.id, ...docu.data() });
      }
    });
    return lista;
  } catch (error) {
    registrarError(error, "buscarPorSerie");
    throw error;
  }
}

/**
 * Crea o actualiza un checklist ya validado.
 * @param {object} crudo
 * @param {object|null} previo
 * @param {{uid: string, email: string}} autor
 * @returns {Promise<object>}
 */
export async function guardarChecklist(crudo, previo, autor) {
  const limpio = normalizarChecklist(crudo);
  if (enMemoria) return guardarEnMemoria(limpio, previo, autor);
  try {
    const { fsMod, db } = obtenerApi();
    const ref = previo && previo.id
      ? fsMod.doc(db, APP.coleccionChecklists, previo.id)
      : fsMod.doc(fsMod.collection(db, APP.coleccionChecklists));
    const payload = armarPayload(limpio, previo, autor, fsMod);
    if (numeroValido(previo && previo.numero)) {
      payload.numero = Number(previo.numero);
      await fsMod.setDoc(ref, payload);
      return obtenerChecklist(ref.id);
    }
    const id = await crearConNumero(fsMod, db, payload);
    return obtenerChecklist(id);
  } catch (error) {
    registrarError(error, "guardarChecklist");
    throw error;
  }
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function eliminarChecklist(id) {
  if (enMemoria) {
    const idx = memoria.findIndex((registro) => registro.id === id);
    if (idx >= 0) memoria.splice(idx, 1);
    return;
  }
  try {
    const { fsMod, db } = obtenerApi();
    await fsMod.deleteDoc(
      fsMod.doc(db, APP.coleccionChecklists, id)
    );
  } catch (error) {
    registrarError(error, "eliminarChecklist");
    throw error;
  }
}

/**
 * @param {object} limpio
 * @param {object|null} previo
 * @param {{uid: string, email: string}} autor
 * @returns {object}
 */
function guardarEnMemoria(limpio, previo, autor) {
  const ahora = Date.now();
  const id = previo && previo.id
    ? previo.id
    : idLocal();
  const docu = {
    ...limpio,
    id,
    numero: numeroValido(previo && previo.numero)
      ? Number(previo.numero)
      : siguienteNumero(),
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
  const idx = memoria.findIndex((registro) => registro.id === id);
  if (idx >= 0) memoria[idx] = docu;
  else memoria.unshift(docu);
  return structuredClone(docu);
}

/**
 * @param {object} limpio
 * @param {object|null} previo
 * @param {{uid: string, email: string}} autor
 * @param {object} fsMod
 * @returns {object}
 */
function armarPayload(limpio, previo, autor, fsMod) {
  return {
    ...limpio,
    creadoEn: previo && previo.creadoEn
      ? previo.creadoEn
      : fsMod.serverTimestamp(),
    creadoPor: previo && previo.creadoPor
      ? previo.creadoPor
      : autor.uid,
    creadoPorEmail: previo && typeof previo.creadoPorEmail === "string"
      ? previo.creadoPorEmail
      : (autor.email || ""),
    actualizadoEn: fsMod.serverTimestamp(),
    actualizadoPor: autor.uid
  };
}

/**
 * Reserva el siguiente número de la colección y crea el documento.
 * El contador vive en contadores/{coleccion}.
 * @param {object} fsMod
 * @param {object} db
 * @param {object} payload
 * @param {string} [coleccion]
 * @returns {Promise<string>}
 */
export async function crearConNumero(fsMod, db, payload, coleccion) {
  const destino = coleccion || APP.coleccionChecklists;
  const contador = fsMod.doc(db, APP.coleccionContadores, destino);
  const ref = fsMod.doc(fsMod.collection(db, destino));
  await fsMod.runTransaction(db, async (tx) => {
    const snap = await tx.get(contador);
    const ultimo = snap.exists()
      ? Number(snap.data().ultimo) || 0
      : 0;
    const numero = ultimo + 1;
    tx.set(contador, { ultimo: numero });
    tx.set(ref, { ...payload, numero });
  });
  return ref.id;
}

/**
 * Indica si la app corre con datos de vista previa en memoria.
 * @returns {boolean}
 */
export function modoMemoria() {
  return enMemoria;
}

/**
 * Id para registros de vista previa. randomUUID solo existe en
 * contextos seguros, y la red local se sirve por HTTP.
 * @returns {string}
 */
export function idLocal() {
  const azar = window.crypto && window.crypto.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `local-${azar}`;
}

/**
 * @param {unknown} valor
 * @returns {boolean}
 */
export function numeroValido(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0;
}

/**
 * @returns {number}
 */
function siguienteNumero() {
  let maximo = 0;
  memoria.forEach((registro) => {
    const numero = Number(registro.numero);
    if (Number.isInteger(numero) && numero > maximo) maximo = numero;
  });
  return maximo + 1;
}
