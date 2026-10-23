/**
 * Propósito: Repositorio reutilizable con N° correlativo.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: config, firebase-cliente, logger, repositorio
 *
 * En la vista previa trabaja en memoria; si no, en Firestore.
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

/**
 * @typedef {object} Repositorio
 * @property {(registros: object[]) => void} sembrar
 * @property {() => Promise<object[]>} listar
 * @property {(id: string) => Promise<object|null>} obtener
 * @property {(crudo: object, previo: object|null,
 *   autor: object) => Promise<object>} guardar
 * @property {(id: string) => Promise<void>} eliminar
 */

/**
 * @param {{coleccion: string, normalizar: Function,
 *   contexto: string}} opciones
 * @returns {Repositorio}
 */
export function crearRepositorio(opciones) {
  const { coleccion, normalizar, contexto } = opciones;
  const memoria = [];

  const conRegistro = async (accion, tarea) => {
    try {
      return await tarea();
    } catch (error) {
      registrarError(error, `${contexto}.${accion}`);
      throw error;
    }
  };

  const obtener = async (id) => {
    if (!id) return null;
    if (modoMemoria()) {
      const hallado = memoria.find((registro) => registro.id === id);
      return hallado ? structuredClone(hallado) : null;
    }
    return conRegistro("obtener", async () => {
      const { fsMod, db } = obtenerApi();
      const snap = await fsMod.getDoc(fsMod.doc(db, coleccion, id));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    });
  };

  return {
    sembrar(registros) {
      memoria.length = 0;
      (registros || []).forEach((registro) => {
        memoria.push(structuredClone(registro));
      });
    },
    async listar() {
      if (modoMemoria()) {
        return memoria.map((registro) => structuredClone(registro));
      }
      return conRegistro("listar", async () => {
        const { fsMod, db } = obtenerApi();
        const consulta = fsMod.query(
          fsMod.collection(db, coleccion),
          fsMod.orderBy("creadoEn", "desc"),
          fsMod.limit(APP.limiteListado)
        );
        const snap = await fsMod.getDocs(consulta);
        const lista = [];
        snap.forEach((docu) => lista.push({ id: docu.id, ...docu.data() }));
        return lista;
      });
    },
    obtener,
    async guardar(crudo, previo, autor) {
      const limpio = normalizar(crudo);
      if (modoMemoria()) {
        return enMemoria(memoria, limpio, previo, autor);
      }
      return conRegistro("guardar", async () => {
        const { fsMod, db } = obtenerApi();
        const payload = armarPayload(limpio, previo, autor, fsMod);
        if (previo && numeroValido(previo.numero)) {
          payload.numero = Number(previo.numero);
          await fsMod.setDoc(fsMod.doc(db, coleccion, previo.id), payload);
          return obtener(previo.id);
        }
        const id = await crearConNumero(fsMod, db, payload, coleccion);
        return obtener(id);
      });
    },
    async eliminar(id) {
      if (modoMemoria()) {
        const idx = memoria.findIndex((registro) => registro.id === id);
        if (idx >= 0) memoria.splice(idx, 1);
        return;
      }
      await conRegistro("eliminar", async () => {
        const { fsMod, db } = obtenerApi();
        await fsMod.deleteDoc(fsMod.doc(db, coleccion, id));
      });
    }
  };
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
    creadoPor: previo && previo.creadoPor ? previo.creadoPor : autor.uid,
    creadoPorEmail: previo && typeof previo.creadoPorEmail === "string"
      ? previo.creadoPorEmail
      : (autor.email || ""),
    actualizadoEn: fsMod.serverTimestamp(),
    actualizadoPor: autor.uid
  };
}

/**
 * @param {object[]} memoria
 * @param {object} limpio
 * @param {object|null} previo
 * @param {{uid: string, email: string}} autor
 * @returns {object}
 */
function enMemoria(memoria, limpio, previo, autor) {
  const ahora = Date.now();
  const maximo = memoria.reduce((max, registro) => {
    const n = Number(registro.numero);
    return Number.isInteger(n) && n > max ? n : max;
  }, 0);
  const docu = {
    ...limpio,
    id: previo && previo.id ? previo.id : idLocal(),
    numero: previo && numeroValido(previo.numero)
      ? Number(previo.numero)
      : maximo + 1,
    creadoEn: previo && previo.creadoEn ? previo.creadoEn : ahora,
    creadoPor: previo && previo.creadoPor ? previo.creadoPor : autor.uid,
    creadoPorEmail: previo && typeof previo.creadoPorEmail === "string"
      ? previo.creadoPorEmail
      : (autor.email || ""),
    actualizadoEn: ahora,
    actualizadoPor: autor.uid
  };
  const idx = memoria.findIndex((registro) => registro.id === docu.id);
  if (idx >= 0) memoria[idx] = docu;
  else memoria.unshift(docu);
  return structuredClone(docu);
}
