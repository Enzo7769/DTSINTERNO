/**
 * Propósito: Cliente de Firebase Auth y Firestore.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: logger.js
 */

import { registrarError } from "./logger.js";

const SDK_APP =
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
const SDK_AUTH =
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
const SDK_FS =
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

let api = null;

/**
 * Inicializa Firebase una sola vez.
 * @param {object} config
 * @returns {Promise<void>}
 */
export async function iniciarFirebase(config) {
  if (api) return;
  try {
    const appMod = await import(SDK_APP);
    const authMod = await import(SDK_AUTH);
    const fsMod = await import(SDK_FS);
    const aplicacion = appMod.initializeApp(config);
    const auth = authMod.getAuth(aplicacion);
    await authMod.setPersistence(
      auth,
      authMod.browserLocalPersistence
    );
    api = {
      authMod,
      fsMod,
      auth,
      db: fsMod.getFirestore(aplicacion)
    };
  } catch (error) {
    registrarError(error, "iniciarFirebase");
    throw error;
  }
}

/**
 * @returns {object}
 */
export function obtenerApi() {
  if (!api) throw new Error("Firebase no está listo");
  return api;
}

/**
 * @param {Function} alCambiar
 * @returns {Function}
 */
export function observarSesion(alCambiar) {
  const { authMod, auth } = obtenerApi();
  return authMod.onAuthStateChanged(auth, (usuario) => {
    alCambiar(usuario);
  });
}

/**
 * @param {string} email
 * @param {string} clave
 * @returns {Promise<void>}
 */
export async function entrar(email, clave) {
  try {
    const { authMod, auth } = obtenerApi();
    await authMod.signInWithEmailAndPassword(auth, email, clave);
  } catch (error) {
    registrarError(error, "entrar");
    throw error;
  }
}

/**
 * @returns {Promise<void>}
 */
export async function salir() {
  try {
    const { authMod, auth } = obtenerApi();
    await authMod.signOut(auth);
  } catch (error) {
    registrarError(error, "salir");
    throw error;
  }
}
