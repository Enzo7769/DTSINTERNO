/**
 * Propósito: Catálogos compartidos de costos y modelos de hardware.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: tipos-equipo
 */

import { TIPOS_EQUIPO } from "./tipos-equipo.js";

/** Líneas de producto de DTS. */
export const LINEAS_PRODUCTO = [
  { id: "autoservicio", etiqueta: "Autoservicio" },
  { id: "cleverq", etiqueta: "CleverQ" },
  { id: "clickCollect", etiqueta: "Click&Collect" },
  { id: "mercadata", etiqueta: "Mercadata" }
];

/** Monedas aceptadas en la base de costos. */
export const MONEDAS = [
  { id: "USD", etiqueta: "USD", decimales: 2, prefijo: "USD " },
  { id: "CLP", etiqueta: "CLP", decimales: 0, prefijo: "$ " },
  { id: "UF", etiqueta: "UF", decimales: 2, prefijo: "UF " }
];

/**
 * Categorías de la hoja de costeo, en el orden del resumen.
 * Equivalen a las pestañas de «The Real Costo Operacional».
 */
export const CATEGORIAS_COSTO = [
  { id: "dispositivos", etiqueta: "Dispositivos y periféricos",
    corto: "Dispositivos" },
  { id: "arneses", etiqueta: "Arneses y cableado", corto: "Arneses" },
  { id: "metalmecanica", etiqueta: "Metalmecánica y fabricación",
    corto: "Metalmecánica" },
  { id: "logistica", etiqueta: "Logística y traslado",
    corto: "Logística" },
  { id: "ferreteria", etiqueta: "Ferretería", corto: "Ferretería" },
  { id: "insumos", etiqueta: "Insumos", corto: "Insumos" },
  { id: "licencias", etiqueta: "Licencias y software (SW)", corto: "SW" },
  { id: "manoObra", etiqueta: "Mano de obra (HH)", corto: "HH" },
  { id: "otros", etiqueta: "Otros", corto: "Otros" }
];

/** El catálogo de modelos admite además componentes sueltos. */
export const TIPOS_MODELO = [
  ...TIPOS_EQUIPO,
  { id: "componente", etiqueta: "Componente / Mini PC" }
];

export const ESTADOS_MODELO = [
  { id: "vigente", etiqueta: "Vigente" },
  { id: "descontinuado", etiqueta: "Descontinuado" }
];

/** Ficha técnica: grupos y campos, en el orden del PDF. */
export const GRUPOS_FICHA = [
  {
    titulo: "Computador",
    campos: [
      { id: "computador", etiqueta: "CPU, RAM y almacenamiento",
        ejemplo: "Ej.: Intel Celeron N5095 · RAM 8 GB · SSD 128 GB" },
      { id: "sistemaOperativo", etiqueta: "Sistema operativo",
        ejemplo: "Ej.: Windows 11 Pro" }
    ]
  },
  {
    titulo: "Pantalla e interacción",
    campos: [
      { id: "pantalla", etiqueta: "Pantalla",
        ejemplo: "Ej.: LCD 21,5\" 1920 × 1080 (FHD)" },
      { id: "tactil", etiqueta: "Táctil",
        ejemplo: "Ej.: Capacitivo 10 puntos" },
      { id: "audio", etiqueta: "Audio",
        ejemplo: "Ej.: Parlantes 2 × 3 W" }
    ]
  },
  {
    titulo: "Periféricos y conectividad",
    campos: [
      { id: "impresora", etiqueta: "Impresora",
        ejemplo: "Ej.: Térmica 80 mm con corte automático" },
      { id: "conectividad", etiqueta: "Conectividad",
        ejemplo: "Ej.: WiFi 2,4 + 5,8 GHz · Ethernet 1000 Mbps" },
      { id: "conectores", etiqueta: "Conectores",
        ejemplo: "Ej.: Poder C14 · Red RJ45" },
      { id: "accesorios", etiqueta: "Accesorios",
        ejemplo: "Ej.: Llave · Cable de poder · Cable de red" }
    ]
  },
  {
    titulo: "Energía y estructura",
    campos: [
      { id: "alimentacion", etiqueta: "Fuente de alimentación",
        ejemplo: "Ej.: 220 V AC, 50 Hz" },
      { id: "consumo", etiqueta: "Consumo",
        ejemplo: "Ej.: 48 W" },
      { id: "dimensiones", etiqueta: "Dimensiones",
        ejemplo: "Ej.: Base 41,5 × 45 cm; alto 140 cm" },
      { id: "peso", etiqueta: "Peso",
        ejemplo: "Ej.: 30 kg" }
    ]
  }
];

export const CAMPOS_FICHA = GRUPOS_FICHA.flatMap((grupo) => grupo.campos);

/**
 * Cuántos campos de la ficha técnica tienen datos.
 * @param {object|null|undefined} ficha
 * @param {{id: string}[]} [campos] por defecto, todos
 * @returns {{llenos: number, total: number}}
 */
export function avanceFicha(ficha, campos = CAMPOS_FICHA) {
  const datos = ficha || {};
  const llenos = campos
    .filter((campo) => String(datos[campo.id] ?? "").trim())
    .length;
  return { llenos, total: campos.length };
}

/**
 * @param {{id: string, etiqueta: string}[]} lista
 * @param {string} id
 * @returns {string}
 */
export function etiquetaDe(lista, id) {
  const hallado = lista.find((item) => item.id === id);
  return hallado ? hallado.etiqueta : "";
}

/**
 * @param {{id: string}[]} lista
 * @param {string} id
 * @returns {boolean}
 */
export function idEn(lista, id) {
  return lista.some((item) => item.id === id);
}

/**
 * Monto con el formato chileno de la moneda.
 * @param {number} valor
 * @param {string} moneda
 * @returns {string}
 */
export function formatoMonto(valor, moneda) {
  const def = MONEDAS.find((item) => item.id === moneda) || MONEDAS[0];
  const n = Number(valor) || 0;
  const texto = n.toLocaleString("es-CL", {
    minimumFractionDigits: def.decimales,
    maximumFractionDigits: def.decimales
  });
  return `${def.prefijo}${texto}`;
}

/**
 * Lee montos como 3840.69, 3.840,69 o 3840,69. Un número ya guardado
 * se usa tal cual: 0.125 no es «ciento veinticinco».
 * @param {unknown} valor
 * @param {number} decimales
 * @returns {number}
 */
export function leerMonto(valor, decimales) {
  const factor = 10 ** decimales;
  if (typeof valor === "number") {
    if (!Number.isFinite(valor) || valor < 0) return 0;
    return Math.round(valor * factor) / factor;
  }
  let limpio = String(valor ?? "").replace(/[^\d.,]/g, "");
  if (!limpio) return 0;
  const coma = limpio.lastIndexOf(",");
  const punto = limpio.lastIndexOf(".");
  if (coma >= 0 && punto >= 0) {
    const decimal = coma > punto ? "," : ".";
    const miles = decimal === "," ? /\./g : /,/g;
    limpio = limpio.replace(miles, "").replace(decimal, ".");
  } else if (coma >= 0) {
    limpio = limpio.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) {
    limpio = limpio.replace(/\./g, "");
  }
  const n = Number(limpio);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * factor) / factor;
}

/**
 * @param {string} moneda
 * @returns {number}
 */
export function decimalesDe(moneda) {
  const def = MONEDAS.find((item) => item.id === moneda);
  return def ? def.decimales : 2;
}

/**
 * Clave para relacionar costos y modelos por nombre.
 * @param {unknown} nombre
 * @returns {string}
 */
export function claveModelo(nombre) {
  return String(nombre ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]+/g, "")
    .toUpperCase();
}
