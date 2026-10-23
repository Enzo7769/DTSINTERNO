/**
 * Propósito: Configuración pública de la app y de Firebase.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: ninguna
 *
 * La apiKey web de Firebase es pública. La protección está en
 * Authentication y en firestore.rules. Pega el SDK desde
 * Consola Firebase > Configuración del proyecto > Tus apps.
 */

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBlqt3m0luRDy2Q7PM3dH2IFVQ2Ic_qszY",
  authDomain: "controldtshardware.firebaseapp.com",
  projectId: "controldtshardware",
  storageBucket: "controldtshardware.firebasestorage.app",
  messagingSenderId: "65112995231",
  appId: "1:65112995231:web:1d8c32d2acba47388179aa"
};

export const APP = {
  produccion: false,
  coleccionChecklists: "checklistsSalida",
  coleccionUsuarios: "usuarios",
  coleccionContadores: "contadores",
  coleccionCartillas: "cartillasRuta",
  plantillaCartilla: "cartilla-ruta-v1",
  coleccionCostos: "baseCostosHw",
  plantillaCostos: "base-costos-hw-v1",
  coleccionModelos: "modelosHw",
  plantillaModelos: "modelo-hw-v1",
  /** Recetas de cliente creadas desde la base de costos. */
  coleccionClientesCotizacion: "clientesCotizacion",
  plantillaClienteCotizacion: "cliente-cotizacion-v1",
  /** Locales y equipos devueltos al terminar un contrato. */
  coleccionRecepcion: "recepcionLocales",
  coleccionFichas: "fichasConfig",
  plantillaFicha: "ficha-config-v1",
  coleccionFichasCliente: "fichasCliente",
  plantillaFichaCliente: "ficha-cliente-v1",
  /** Carpeta de resguardo PDF en Firebase Storage. */
  carpetaPdfFicha: "fichasCliente",
  plazoFichaDias: 7,
  maxHistorialFicha: 80,
  /** Máximo de componentes por hoja de costeo. */
  maxLineasCosto: 200,
  /** Máximo de equipos en un lote de costeo. */
  maxEquiposLote: 9999,
  /**
   * Respaldo si no se puede leer el dólar o la UF del día.
   * El formulario propone primero la cotización del día.
   */
  tipoCambioUsd: 982.01,
  valorUf: 41065.38,
  maxClientesModelo: 60,
  plantilla: "salida-hardware-v1",
  limiteListado: 500,
  maxIntentosLogin: 5,
  bloqueoLoginMs: 60000,
  maxBytesLog: 900000,
  maxImagen: 150000,
  minObservaciones: 10,
  maxPerifericosLibres: 15,
  /** Nombre que propone una cartilla nueva en cada firma. Editable. */
  firmaCartillaPorDefecto: "Christian L."
};

/**
 * Indica si ya se pegó la configuración mínima de Firebase.
 * @returns {boolean}
 */
export function configLista() {
  const cfg = FIREBASE_CONFIG;
  return Boolean(
    cfg.apiKey
    && cfg.authDomain
    && cfg.projectId
    && cfg.appId
  );
}
