/**
 * Propósito: Normalizar y validar un registro de la base de costos,
 *   incluida su hoja de costeo por categorías.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: config, costeo, costo-historial, costo-textos, fechas,
 *   hw-catalogo, sanitizar, tipos-equipo
 */

import { APP } from "./config.js";
import {
  cambiosNecesarios,
  convertir,
  linkSeguro,
  redondear
} from "./costeo.js";
import { normalizarHistorial } from "./costo-historial.js";
import { CT, textoLinea, textoLinkInvalido } from "./costo-textos.js";
import { fechaValida, hoyIso } from "./fechas.js";
import {
  CATEGORIAS_COSTO,
  LINEAS_PRODUCTO,
  MONEDAS,
  claveModelo,
  decimalesDe,
  idEn,
  leerMonto
} from "./hw-catalogo.js";
import { texto } from "./sanitizar.js";
import { tipoValido, TXT_TIPO } from "./tipos-equipo.js";

export const LIMITES_COSTO = {
  modelo: 120,
  configuracion: 160,
  referencia: 200,
  concepto: 160,
  fabricante: 80,
  link: 500,
  obs: 600,
  lineas: APP.maxLineasCosto,
  cantidadMax: 9999,
  equiposMax: APP.maxEquiposLote,
  cambioMax: 10000000,
  montoMax: 1000000000
};

/** Decimales admitidos en la cantidad (ej.: 0,125 l o 0,333). */
const DECIMALES_CANTIDAD = 3;

/**
 * @param {object} entrada
 * @returns {object}
 */
export function normalizarCosto(entrada) {
  const origen = entrada || {};
  const L = LIMITES_COSTO;
  const moneda = idEn(MONEDAS, origen.moneda) ? origen.moneda : "";
  const decimales = decimalesDe(moneda);
  const tipoCambio = normalizarCambio(origen.tipoCambio);
  const lineas = normalizarLineas(origen.lineas, moneda, tipoCambio);
  const modelo = texto(origen.modelo, L.modelo);
  const suma = lineas.reduce((acc, linea) => acc + linea.subtotalCosto, 0);
  const costo = lineas.length
    ? redondear(suma, decimales)
    : Math.min(leerMonto(origen.costo, decimales), L.montoMax);
  const cantidadEquipos = entero(origen.cantidadEquipos, L.equiposMax)
    || 1;
  const fecha = texto(origen.fechaActualizacion, 10);
  return {
    plantilla: APP.plantillaCostos,
    linea: idEn(LINEAS_PRODUCTO, origen.linea) ? origen.linea : "",
    tipoEquipo: tipoValido(origen.tipoEquipo) ? origen.tipoEquipo : "",
    modelo,
    modeloClave: claveModelo(modelo),
    configuracion: texto(origen.configuracion, L.configuracion),
    moneda,
    costo,
    cantidadEquipos,
    costoLote: Math.min(
      redondear(costo * cantidadEquipos, decimales),
      L.montoMax
    ),
    tipoCambio,
    fechaCambio: fechaValida(origen.fechaCambio) ? origen.fechaCambio : "",
    fechaActualizacion: fechaValida(fecha) ? fecha : "",
    referencia: texto(origen.referencia, L.referencia),
    lineas,
    clienteCotizacion: texto(origen.clienteCotizacion, 48),
    historial: normalizarHistorial(origen.historial),
    observaciones: texto(origen.observaciones, L.obs)
  };
}

/**
 * @param {object|undefined} cambio
 * @returns {{usd: number, uf: number}}
 */
function normalizarCambio(cambio) {
  const origen = cambio || {};
  const max = LIMITES_COSTO.cambioMax;
  return {
    usd: Math.min(leerMonto(origen.usd, 2), max),
    uf: Math.min(leerMonto(origen.uf, 2), max)
  };
}

/**
 * Descarta filas vacías y calcula subtotales. Las filas antiguas sin
 * categoría o moneda quedan en «Otros» y en la moneda del costo.
 * @param {object[]|undefined} lineas
 * @param {string} moneda
 * @param {{usd: number, uf: number}} cambio
 * @returns {object[]}
 */
function normalizarLineas(lineas, moneda, cambio) {
  const L = LIMITES_COSTO;
  return (Array.isArray(lineas) ? lineas : [])
    .slice(0, L.lineas)
    .map((cruda) => {
      const linea = cruda || {};
      const propia = idEn(MONEDAS, linea.moneda) ? linea.moneda : moneda;
      const decimales = decimalesDe(propia);
      const cantidad = Math.min(
        leerMonto(linea.cantidad, DECIMALES_CANTIDAD),
        L.cantidadMax
      );
      const valor = Math.min(leerMonto(linea.valor, decimales), L.montoMax);
      const decSubtotal = propia === "UF" ? 4 : decimales;
      const subtotal = redondear(cantidad * valor, decSubtotal);
      return {
        categoria: idEn(CATEGORIAS_COSTO, linea.categoria)
          ? linea.categoria
          : "otros",
        concepto: texto(linea.concepto, L.concepto),
        fabricante: texto(linea.fabricante, L.fabricante),
        link: linkSeguro(linea.link, L.link),
        cantidad,
        moneda: propia,
        valor,
        subtotal,
        subtotalCosto: redondear(
          convertir(subtotal, propia, moneda, cambio),
          decimalesDe(moneda)
        )
      };
    })
    .filter((linea) => linea.concepto || linea.valor);
}

/**
 * @param {unknown} valor
 * @param {number} max
 * @returns {number}
 */
function entero(valor, max) {
  const limpio = String(valor ?? "").replace(/\D/g, "");
  if (!limpio) return 0;
  const n = Number(limpio);
  if (!Number.isSafeInteger(n) || n < 0) return 0;
  return Math.min(n, max);
}

/**
 * @param {object} datos
 * @param {string} [fechaCruda] valor escrito, para avisar si es inválido
 * @param {object[]} [lineasCrudas] filas escritas, para avisar de links
 *   que se descartarían
 * @returns {{valido: boolean, errores: string[], campos: object}}
 */
export function validarCosto(datos, fechaCruda, lineasCrudas) {
  const errores = [];
  const campos = {};
  const fallar = (campo, mensaje) => {
    errores.push(mensaje);
    campos[campo] = true;
  };
  if (!datos.linea) fallar("k-linea", CT.faltaLinea);
  if (!datos.tipoEquipo) fallar("k-tipo", TXT_TIPO.falta);
  if (!datos.modelo) fallar("k-modelo", CT.faltaModelo);
  if (!datos.moneda) fallar("k-moneda", CT.faltaMoneda);
  if (fechaCruda && !datos.fechaActualizacion) {
    fallar("k-fecha", CT.fechaInvalida);
  } else if (datos.fechaActualizacion > hoyIso()) {
    fallar("k-fecha", CT.fechaFutura);
  }
  validarCambio(datos, fallar);
  (datos.lineas || []).forEach((linea, indice) => {
    const n = indice + 1;
    if (!linea.concepto) {
      fallar("k-lineas", textoLinea(n, CT.faltaConcepto));
    }
    if (!(linea.cantidad > 0)) {
      fallar("k-lineas", textoLinea(n, CT.cantidadInvalida));
    }
  });
  (lineasCrudas || []).forEach((linea) => {
    const link = String((linea && linea.link) || "").trim();
    if (link && !linkSeguro(link, LIMITES_COSTO.link)) {
      fallar("k-lineas", textoLinkInvalido(linea.concepto));
    }
  });
  if ((lineasCrudas || []).length > LIMITES_COSTO.lineas) {
    fallar("k-lineas", CT.maxLineas);
  }
  if (!(datos.costo > 0)) fallar("k-costo", CT.faltaCosto);
  return { valido: errores.length === 0, errores, campos };
}

/**
 * Exige el dólar o la UF solo si alguna línea necesita convertirse.
 * @param {object} datos
 * @param {(campo: string, mensaje: string) => void} fallar
 * @returns {void}
 */
function validarCambio(datos, fallar) {
  if (!datos.moneda) return;
  const cambio = datos.tipoCambio || {};
  const necesarios = cambiosNecesarios(datos.lineas || [], datos.moneda);
  if (necesarios.has("USD") && !(cambio.usd > 0)) {
    fallar("k-cambio-usd", CT.faltaDolar);
  }
  if (necesarios.has("UF") && !(cambio.uf > 0)) {
    fallar("k-cambio-uf", CT.faltaUf);
  }
}
