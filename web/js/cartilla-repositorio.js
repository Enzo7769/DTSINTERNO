/**
 * Propósito: Lectura y escritura de cartillas de ruta.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: config, firebase-cliente, logger, repositorio,
 *   cartilla-validacion
 */

import { APP } from "./config.js";
import { obtenerApi } from "./firebase-cliente.js";
import { registrarError } from "./logger.js";
import {
  crearConNumero,
  idLocal,
  modoMemoria,
  numeroValido
} from "./repositorio.js";
import { normalizarCartilla } from "./cartilla-validacion.js";

const memoria = [];

/**
 * Carga cartillas de ejemplo para la vista previa.
 * @param {object[]} registros
 * @returns {void}
 */
export function sembrarCartillas(registros) {
  memoria.length = 0;
  (registros || []).forEach((registro) => {
    memoria.push(structuredClone(registro));
  });
}

/**
 * @returns {Promise<object[]>}
 */
export async function listarCartillas() {
  if (modoMemoria()) {
    return memoria.map((registro) => structuredClone(registro));
  }
  try {
    const { fsMod, db } = obtenerApi();
    const consulta = fsMod.query(
      fsMod.collection(db, APP.coleccionCartillas),
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
    registrarError(error, "listarCartillas");
    throw error;
  }
}

/**
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function obtenerCartilla(id) {
  if (!id) return null;
  if (modoMemoria()) {
    const hallada = memoria.find((registro) => registro.id === id);
    return hallada ? structuredClone(hallada) : null;
  }
  try {
    const { fsMod, db } = obtenerApi();
    const snap = await fsMod.getDoc(
      fsMod.doc(db, APP.coleccionCartillas, id)
    );
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    registrarError(error, "obtenerCartilla");
    throw error;
  }
}

/**
 * Crea o actualiza una cartilla ya validada.
 * @param {object} crudo
 * @param {object|null} previa
 * @param {{uid: string, email: string}} autor
 * @returns {Promise<object>}
 */
export async function guardarCartilla(crudo, previa, autor) {
  const limpia = normalizarCartilla(crudo);
  if (modoMemoria()) return guardarEnMemoria(limpia, previa, autor);
  try {
    const { fsMod, db } = obtenerApi();
    const payload = {
      ...limpia,
      creadoEn: previa && previa.creadoEn
        ? previa.creadoEn
        : fsMod.serverTimestamp(),
      creadoPor: previa && previa.creadoPor ? previa.creadoPor : autor.uid,
      creadoPorEmail: previa && previa.creadoPorEmail
        ? previa.creadoPorEmail
        : (autor.email || ""),
      actualizadoEn: fsMod.serverTimestamp(),
      actualizadoPor: autor.uid
    };
    if (previa && numeroValido(previa.numero)) {
      payload.numero = Number(previa.numero);
      await fsMod.setDoc(
        fsMod.doc(db, APP.coleccionCartillas, previa.id),
        payload
      );
      return obtenerCartilla(previa.id);
    }
    const id = await crearConNumero(
      fsMod,
      db,
      payload,
      APP.coleccionCartillas
    );
    return obtenerCartilla(id);
  } catch (error) {
    registrarError(error, "guardarCartilla");
    throw error;
  }
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function eliminarCartilla(id) {
  if (modoMemoria()) {
    const idx = memoria.findIndex((registro) => registro.id === id);
    if (idx >= 0) memoria.splice(idx, 1);
    return;
  }
  try {
    const { fsMod, db } = obtenerApi();
    await fsMod.deleteDoc(fsMod.doc(db, APP.coleccionCartillas, id));
  } catch (error) {
    registrarError(error, "eliminarCartilla");
    throw error;
  }
}

/**
 * @param {object} limpia
 * @param {object|null} previa
 * @param {{uid: string, email: string}} autor
 * @returns {object}
 */
function guardarEnMemoria(limpia, previa, autor) {
  const ahora = Date.now();
  let maximo = 0;
  memoria.forEach((registro) => {
    if (numeroValido(registro.numero) && registro.numero > maximo) {
      maximo = registro.numero;
    }
  });
  const docu = {
    ...limpia,
    id: previa && previa.id ? previa.id : idLocal(),
    numero: previa && numeroValido(previa.numero)
      ? Number(previa.numero)
      : maximo + 1,
    creadoEn: previa && previa.creadoEn ? previa.creadoEn : ahora,
    creadoPor: previa && previa.creadoPor ? previa.creadoPor : autor.uid,
    creadoPorEmail: autor.email || "",
    actualizadoEn: ahora,
    actualizadoPor: autor.uid
  };
  const idx = memoria.findIndex((registro) => registro.id === docu.id);
  if (idx >= 0) memoria[idx] = docu;
  else memoria.unshift(docu);
  return structuredClone(docu);
}
