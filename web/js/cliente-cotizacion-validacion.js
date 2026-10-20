/**
 * Propósito: Normalizar y validar los clientes de cotización creados
 *   desde la base de costos (receta de piezas por cliente).
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-07
 * Dependencias: config, costo-textos, hw-catalogo, sanitizar
 */

import { APP } from "./config.js";
import { CT } from "./costo-textos.js";
import {
  CATEGORIAS_COSTO,
  MONEDAS,
  claveModelo,
  idEn
} from "./hw-catalogo.js";
import { texto } from "./sanitizar.js";

export const LIMITES_CLIENTE = {
  etiqueta: 80,
  concepto: 160,
  componentes: APP.maxLineasCosto,
  cantidadMax: 9999,
  valorMax: 1000000000,
  anioMin: 2020,
  anioMax: 2100
};

/**
 * @param {object} entrada
 * @returns {object}
 */
export function normalizarClienteCotizacion(entrada) {
  const origen = entrada || {};
  const L = LIMITES_CLIENTE;
  const etiqueta = texto(origen.etiqueta, L.etiqueta);
  const anio = Number(origen.anio);
  return {
    plantilla: APP.plantillaClienteCotizacion,
    etiqueta,
    etiquetaClave: claveModelo(etiqueta).slice(0, L.etiqueta),
    anio: Number.isInteger(anio) && anio >= L.anioMin && anio <= L.anioMax
      ? anio
      : new Date().getFullYear(),
    incluyeHh: origen.incluyeHh === true,
    componentes: normalizarComponentes(origen.componentes)
  };
}

/**
 * La mano de obra no va en la receta: la enciende incluyeHh.
 * @param {unknown} lista
 * @returns {{categoria: string, concepto: string, cantidad: number,
 *   moneda: string, valor: number}[]}
 */
function normalizarComponentes(lista) {
  const L = LIMITES_CLIENTE;
  return (Array.isArray(lista) ? lista : [])
    .slice(0, L.componentes)
    .map((crudo) => {
      const pieza = crudo || {};
      const cantidad = Number(pieza.cantidad);
      const valor = Number(pieza.valor);
      return {
        categoria: idEn(CATEGORIAS_COSTO, pieza.categoria)
          ? pieza.categoria
          : "otros",
        concepto: texto(pieza.concepto, L.concepto),
        cantidad: cantidad > 0 ? Math.min(cantidad, L.cantidadMax) : 1,
        moneda: idEn(MONEDAS, pieza.moneda) ? pieza.moneda : "CLP",
        valor: valor > 0 ? Math.min(valor, L.valorMax) : 0
      };
    })
    .filter((pieza) => pieza.concepto && pieza.categoria !== "manoObra");
}

/**
 * @param {object} datos cliente normalizado
 * @param {string[]} etiquetasFijas claves de los clientes de la planilla
 * @returns {{valido: boolean, errores: string[]}}
 */
export function validarClienteCotizacion(datos, etiquetasFijas) {
  const errores = [];
  if (!datos.etiqueta) errores.push(CT.clienteFaltaNombre);
  if (!datos.componentes.length && !datos.incluyeHh) {
    errores.push(CT.clienteSinPiezas);
  }
  if ((etiquetasFijas || []).includes(datos.etiquetaClave)) {
    errores.push(CT.clienteNombrePlanilla);
  }
  return { valido: errores.length === 0, errores };
}
