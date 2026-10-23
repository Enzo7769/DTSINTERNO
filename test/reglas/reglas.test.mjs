/**
 * Propósito: Pruebas de firestore.rules y storage.rules con el
 *   emulador de Firebase.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-23
 * Dependencias: @firebase/rules-unit-testing, firebase
 *
 * Uso (instala las herramientas en una carpeta aparte):
 *   npm install firebase-tools @firebase/rules-unit-testing firebase
 *   npx firebase emulators:exec --only firestore,storage \
 *     --project demo-dts "node test/reglas/reglas.test.mjs"
 */

import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from "@firebase/rules-unit-testing";
import {
  Timestamp,
  doc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { ref, uploadString } from "firebase/storage";

const raiz = new URL("../../", import.meta.url);
const env = await initializeTestEnvironment({
  projectId: "demo-dts",
  firestore: {
    rules: readFileSync(new URL("firestore.rules", raiz), "utf8")
  },
  storage: {
    rules: readFileSync(new URL("storage.rules", raiz), "utf8")
  }
});

const TOKEN = "tok_abcdefghijklmnop1234";
const TOKEN_FIN = "tok_finalizadaabcdef1234";
const TOKEN_VENCIDO = "tok_vencidaabcdefgh12345";
const PDF = "%PDF-1.4 prueba";
const META = { contentType: "application/pdf" };
let fallos = 0;

/**
 * @param {string} nombre
 * @param {() => Promise<unknown>} prueba
 * @returns {Promise<void>}
 */
async function caso(nombre, prueba) {
  try {
    await prueba();
    console.log("ok", nombre);
  } catch (error) {
    fallos += 1;
    console.error("FALLO", nombre, "-", error.message);
  }
}

/**
 * @param {string} estado
 * @param {number} dias plazo desde hoy (negativo: vencido)
 * @returns {object}
 */
function fichaCliente(estado, dias) {
  const listas = ["oficinas", "sectores", "totems", "gruposModulo",
    "admins", "adminsSector", "ejecutivos", "visores", "equipos",
    "requisitos", "red"];
  const textos = ["cliente", "sistema", "pais", "idCentro",
    "msgAtrasado", "minutosAtraso", "minutosAdelanto", "msgTemprano",
    "rellenadoPor", "pdfUrl", "pdfRuta", "pdfNombre"];
  return {
    ...Object.fromEntries(listas.map((clave) => [clave, []])),
    ...Object.fromEntries(textos.map((clave) => [clave, ""])),
    plantilla: "ficha-cliente-v1",
    licitacion: "Licitación prueba",
    licitacionClave: "LICITACIONPRUEBA",
    token: "x".repeat(20),
    menu: {},
    estado,
    historial: [{ quien: "admin", accion: "creada" }],
    plazoHasta: Timestamp.fromMillis(Date.now() + dias * 86400000),
    creadoEn: Timestamp.now(),
    actualizadoEn: Timestamp.now(),
    creadoPor: "admin",
    creadoPorEmail: "admin@dts.cl",
    actualizadoPor: "admin",
    numero: 1
  };
}

/**
 * Guardado del cliente como lo hace la página pública.
 * @param {object} cambios
 * @returns {Promise<void>}
 */
function guardarCliente(cambios) {
  return updateDoc(doc(anonimo.firestore(), `fichasCliente/${TOKEN}`), {
    rellenadoPor: "Cliente",
    estado: "en_curso",
    actualizadoPor: "cliente",
    actualizadoEn: serverTimestamp(),
    historial: [
      { quien: "admin", accion: "creada" },
      { quien: "Cliente", accion: "guardada" }
    ],
    ...cambios
  });
}

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, "usuarios/admin"), { rol: "admin" });
  await setDoc(doc(db, "usuarios/tecnico"), { rol: "tecnico" });
  await setDoc(doc(db, `fichasCliente/${TOKEN}`),
    fichaCliente("pendiente", 7));
  await setDoc(doc(db, `fichasCliente/${TOKEN_FIN}`),
    fichaCliente("finalizado", 7));
  await setDoc(doc(db, `fichasCliente/${TOKEN_VENCIDO}`),
    fichaCliente("pendiente", -1));
  await setDoc(doc(db, "baseCostosHw/c1"), { modelo: "T22" });
});

const admin = env.authenticatedContext("admin");
const tecnico = env.authenticatedContext("tecnico");
const anonimo = env.unauthenticatedContext();

await caso("un usuario sin rol admin no lee costos", () =>
  assertFails(getDoc(doc(tecnico.firestore(), "baseCostosHw/c1"))));
await caso("el admin lee costos", () =>
  assertSucceeds(getDoc(doc(admin.firestore(), "baseCostosHw/c1"))));
await caso("nadie se asigna un rol desde la app", () =>
  assertFails(setDoc(doc(tecnico.firestore(), "usuarios/tecnico"),
    { rol: "admin" })));
await caso("el cliente abre su ficha con el enlace", () =>
  assertSucceeds(getDoc(doc(anonimo.firestore(),
    `fichasCliente/${TOKEN}`))));
await caso("un enlace vencido ya no se lee (guarda claves)", () =>
  assertFails(getDoc(doc(anonimo.firestore(),
    `fichasCliente/${TOKEN_VENCIDO}`))));
await caso("el admin sí lee un enlace vencido", () =>
  assertSucceeds(getDoc(doc(admin.firestore(),
    `fichasCliente/${TOKEN_VENCIDO}`))));
await caso("el cliente guarda sus respuestas", () =>
  assertSucceeds(guardarCliente({ cliente: "Municipalidad" })));
await caso("el cliente no cambia el link del PDF", () =>
  assertFails(guardarCliente({ pdfUrl: "https://phishing.test" })));
await caso("el cliente no borra el historial", () =>
  assertFails(guardarCliente({ historial: [] })));
await caso("el cliente no agrega campos propios", () =>
  assertFails(guardarCliente({ extra: "x" })));
await caso("el cliente no corre el plazo", () =>
  assertFails(guardarCliente({ plazoHasta: Timestamp.fromMillis(
    Date.now() + 90 * 86400000) })));
await caso("nadie sin sesión lista las fichas de cliente", () =>
  assertFails(getDocs(collection(anonimo.firestore(), "fichasCliente"))));
await caso("el cliente no reabre una ficha finalizada", () =>
  assertFails(updateDoc(doc(anonimo.firestore(),
    `fichasCliente/${TOKEN_FIN}`), { estado: "en_curso" })));

const localRecepcion = (cambios) => ({
  plantilla: "recepcion-local-v1",
  contrato: "Walmart Líder",
  codigo: "LID01",
  codigoClave: "LID01",
  nombre: "Líder Maipú",
  region: "RM",
  comuna: "Maipú",
  direccion: "",
  contacto: "",
  retiroProgramado: "",
  transportista: "",
  guia: "",
  notas: "",
  equipos: [],
  creadoEn: serverTimestamp(),
  actualizadoEn: serverTimestamp(),
  creadoPor: "admin",
  creadoPorEmail: "admin@dts.cl",
  actualizadoPor: "admin",
  numero: 1,
  ...cambios
});
await caso("el admin registra un local para recibir equipos", () =>
  assertSucceeds(setDoc(doc(admin.firestore(), "recepcionLocales/l1"),
    localRecepcion({}))));
await caso("un local necesita una región válida", () =>
  assertFails(setDoc(doc(admin.firestore(), "recepcionLocales/l2"),
    localRecepcion({ region: "Marte" }))));
await caso("un usuario sin rol admin no ve la recepción", () =>
  assertFails(getDoc(doc(tecnico.firestore(), "recepcionLocales/l1"))));

const subir = (ctx, token) => uploadString(
  ref(ctx.storage(), `fichasCliente/${token}/respuestas.pdf`),
  PDF,
  "raw",
  META
);
await caso("nadie sin sesión sube un PDF a una ficha inventada", () =>
  assertFails(subir(anonimo, "tok_inventadoXXXXXXXXXXXX")));
await caso("nadie sin sesión sube un PDF a una ficha finalizada", () =>
  assertFails(subir(anonimo, TOKEN_FIN)));
await caso("Storage está cerrado: ni el admin sube archivos", () =>
  assertFails(subir(admin, TOKEN)));
await caso("un usuario sin rol admin no sube PDF", () =>
  assertFails(subir(tecnico, TOKEN)));

await env.cleanup();
if (fallos > 0) {
  console.error(`${fallos} prueba(s) de reglas fallaron.`);
  process.exitCode = 1;
} else {
  console.log("Todas las pruebas de reglas pasaron.");
}
