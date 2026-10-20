/**
 * Propósito: Normalizar y validar un modelo del catálogo HW.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: config, hw-catalogo, modelo-textos, sanitizar
 */

import { APP } from "./config.js";
import {
  CAMPOS_FICHA,
  ESTADOS_MODELO,
  TIPOS_MODELO,
  claveModelo,
  idEn
} from "./hw-catalogo.js";
import { MT } from "./modelo-textos.js";
import { texto } from "./sanitizar.js";

export const LIMITES_MODELO = {
  nombre: 120,
  otroNombre: 120,
  cliente: 120,
  clientes: APP.maxClientesModelo,
  campoFicha: 600,
  notas: 600
};

const IMAGEN_PERMITIDA = /^data:image\/(png|jpeg|webp);base64,[\w+/=]+$/;

/**
 * @param {object} entrada
 * @returns {object}
 */
export function normalizarModelo(entrada) {
  const origen = entrada || {};
  const L = LIMITES_MODELO;
  const nombre = texto(origen.nombre, L.nombre);
  return {
    plantilla: APP.plantillaModelos,
    tipo: idEn(TIPOS_MODELO, origen.tipo) ? origen.tipo : "",
    nombre,
    nombreClave: claveModelo(nombre),
    otroNombre: texto(origen.otroNombre, L.otroNombre),
    estado: idEn(ESTADOS_MODELO, origen.estado)
      ? origen.estado
      : ESTADOS_MODELO[0].id,
    clientes: normalizarClientes(origen.clientes),
    imagen: imagenModelo(origen.imagen),
    ficha: normalizarFicha(origen.ficha),
    notas: texto(origen.notas, L.notas)
  };
}

/**
 * Acepta lista o texto con un cliente por línea, sin repetidos.
 * @param {string[]|string|undefined} valor
 * @returns {string[]}
 */
export function normalizarClientes(valor) {
  const L = LIMITES_MODELO;
  const crudos = Array.isArray(valor)
    ? valor
    : String(valor ?? "").split(/\r?\n/);
  const vistos = new Set();
  const lista = [];
  crudos.forEach((item) => {
    const limpio = texto(item, L.cliente);
    const clave = limpio.toLowerCase();
    if (!limpio || vistos.has(clave) || lista.length >= L.clientes) return;
    vistos.add(clave);
    lista.push(limpio);
  });
  return lista;
}

/**
 * Solo guarda los campos conocidos y con contenido.
 * @param {object|undefined} ficha
 * @returns {object}
 */
function normalizarFicha(ficha) {
  const origen = ficha && typeof ficha === "object" ? ficha : {};
  const limpia = {};
  CAMPOS_FICHA.forEach((campo) => {
    const valor = textoMultilinea(origen[campo.id]);
    if (valor) limpia[campo.id] = valor;
  });
  return limpia;
}

/**
 * Conserva saltos de línea y quita otros caracteres de control.
 * @param {unknown} valor
 * @returns {string}
 */
function textoMultilinea(valor) {
  return String(valor ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, LIMITES_MODELO.campoFicha);
}

/**
 * @param {unknown} valor
 * @returns {string}
 */
export function imagenModelo(valor) {
  const dato = String(valor || "");
  if (!dato || dato.length > APP.maxImagen) return "";
  return IMAGEN_PERMITIDA.test(dato) ? dato : "";
}

/**
 * @param {object} datos
 * @param {object[]} [otros] modelos ya guardados, para duplicados
 * @param {string} [idActual]
 * @returns {{valido: boolean, errores: string[], campos: object}}
 */
export function validarModelo(datos, otros, idActual) {
  const errores = [];
  const campos = {};
  const fallar = (campo, mensaje) => {
    errores.push(mensaje);
    campos[campo] = true;
  };
  if (!datos.tipo) fallar("m-tipo", MT.faltaTipo);
  if (!datos.nombre) fallar("m-nombre", MT.faltaNombre);
  const repetido = (otros || []).some((otro) => {
    return otro.id !== idActual
      && otro.nombreClave === datos.nombreClave
      && datos.nombreClave;
  });
  if (repetido) fallar("m-nombre", MT.nombreDuplicado);
  return { valido: errores.length === 0, errores, campos };
}
