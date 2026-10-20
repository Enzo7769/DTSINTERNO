/**
 * Propósito: Cálculos puros de la hoja de costeo: conversión de
 *   monedas, subtotales por categoría y totales por equipo y lote.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: hw-catalogo
 */

import {
  CATEGORIAS_COSTO,
  decimalesDe,
  formatoMonto
} from "./hw-catalogo.js";

const MAX_CONCEPTO = 160;

/**
 * Texto con que se guarda un componente del catálogo.
 * @param {string} categoria
 * @param {string[]} fila [tipo, componente, descripción]
 * @returns {string}
 */
export function conceptoDe(categoria, fila) {
  const [, componente, descripcion] = fila;
  let texto = componente;
  if (categoria === "ferreteria" && descripcion) {
    texto = `${descripcion} · ${componente}`;
  } else if (categoria !== "manoObra" && descripcion) {
    texto = `${componente}: ${descripcion}`;
  }
  return texto.slice(0, MAX_CONCEPTO);
}

/**
 * Link de cotización: solo http o https, sin espacios.
 * @param {unknown} valor
 * @param {number} max
 * @returns {string} vacío si no es seguro
 */
export function linkSeguro(valor, max) {
  const limpio = String(valor ?? "").trim();
  if (!limpio || limpio.length > max) return "";
  if (!/^https?:\/\/[^\s<>"']+$/i.test(limpio)) return "";
  try {
    const url = new URL(limpio);
    return url.protocol === "http:" || url.protocol === "https:"
      ? limpio
      : "";
  } catch {
    return "";
  }
}

/**
 * Pesos chilenos que vale una unidad de la moneda.
 * @param {string} moneda
 * @param {{usd: number, uf: number}} cambio
 * @returns {number} 0 si falta el tipo de cambio
 */
export function factorClp(moneda, cambio) {
  if (moneda === "CLP") return 1;
  if (moneda === "USD") return Number(cambio && cambio.usd) || 0;
  if (moneda === "UF") return Number(cambio && cambio.uf) || 0;
  return 0;
}

/**
 * @param {number} valor
 * @param {string} de
 * @param {string} a
 * @param {{usd: number, uf: number}} cambio
 * @returns {number} 0 si falta un tipo de cambio necesario
 */
export function convertir(valor, de, a, cambio) {
  if (de === a) return valor;
  const origen = factorClp(de, cambio);
  const destino = factorClp(a, cambio);
  if (!origen || !destino) return 0;
  return (valor * origen) / destino;
}

/**
 * @param {number} valor
 * @param {number} decimales
 * @returns {number}
 */
export function redondear(valor, decimales) {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

/**
 * Monedas cuyo tipo de cambio hace falta para sumar las líneas.
 * @param {{moneda: string}[]} lineas
 * @param {string} moneda moneda del costo
 * @returns {Set<string>} contiene "USD" y/o "UF"
 */
export function cambiosNecesarios(lineas, moneda) {
  const necesarios = new Set();
  lineas.forEach((linea) => {
    if (linea.moneda === moneda) return;
    [linea.moneda, moneda].forEach((item) => {
      if (item === "USD" || item === "UF") necesarios.add(item);
    });
  });
  return necesarios;
}

/**
 * Subtotales por categoría en la moneda del costo.
 * @param {{categoria: string, subtotalCosto: number}[]} lineas
 * @param {string} moneda
 * @returns {{id: string, etiqueta: string, items: number,
 *   subtotal: number, porcentaje: number}[]}
 */
export function resumenCategorias(lineas, moneda) {
  const decimales = decimalesDe(moneda);
  const sumas = new Map();
  lineas.forEach((linea) => {
    const previo = sumas.get(linea.categoria) || { items: 0, subtotal: 0 };
    sumas.set(linea.categoria, {
      items: previo.items + 1,
      subtotal: previo.subtotal + linea.subtotalCosto
    });
  });
  const total = [...sumas.values()]
    .reduce((acc, item) => acc + item.subtotal, 0);
  return CATEGORIAS_COSTO
    .filter((categoria) => sumas.has(categoria.id))
    .map((categoria) => {
      const suma = sumas.get(categoria.id);
      return {
        id: categoria.id,
        etiqueta: categoria.etiqueta,
        items: suma.items,
        subtotal: redondear(suma.subtotal, decimales),
        porcentaje: total > 0 ? (suma.subtotal / total) * 100 : 0
      };
    });
}

/**
 * Equivalente con el dólar del día. Un costo en USD pasa a pesos;
 * uno en CLP o UF pasa a dólares.
 * @param {number} costo
 * @param {string} moneda
 * @param {{usd: number, uf: number}|null} cambio
 * @returns {{moneda: string, valor: number}|null}
 */
export function equivalenteDia(costo, moneda, cambio) {
  const n = Number(costo);
  const conocidas = ["CLP", "USD", "UF"];
  if (!cambio || !Number.isFinite(n) || n <= 0) return null;
  if (!conocidas.includes(moneda)) return null;
  const destino = moneda === "CLP" ? "USD" : "CLP";
  const valor = redondear(
    convertir(n, moneda, destino, cambio),
    decimalesDe(destino)
  );
  if (valor <= 0) return null;
  return { moneda: destino, valor };
}

/**
 * El mismo monto en dólares y en pesos. Si falta el tipo de
 * cambio, devuelve solo la moneda que se puede calcular.
 * @param {number} valor
 * @param {string} moneda
 * @param {{usd: number, uf: number}} cambio
 * @returns {{moneda: string, valor: number}[]}
 */
export function parUsdClp(valor, moneda, cambio) {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) return [];
  if (!["CLP", "USD", "UF"].includes(moneda)) return [];
  return ["USD", "CLP"].map((destino) => ({
    moneda: destino,
    valor: redondear(
      destino === moneda
        ? n
        : convertir(n, moneda, destino, cambio || {}),
      decimalesDe(destino)
    )
  })).filter((item) => item.valor > 0);
}

/**
 * @param {number} valor
 * @param {string} moneda
 * @param {{usd: number, uf: number}} cambio
 * @returns {string}
 */
export function textoUsdYClp(valor, moneda, cambio) {
  const pares = parUsdClp(valor, moneda, cambio);
  if (!pares.length) return formatoMonto(Number(valor) || 0, moneda);
  return pares
    .map((item) => formatoMonto(item.valor, item.moneda))
    .join(" · ");
}

/**
 * Costo por equipo expresado en las tres monedas.
 * @param {number} costo
 * @param {string} moneda
 * @param {{usd: number, uf: number}} cambio
 * @returns {{moneda: string, valor: number}[]} solo las convertibles
 */
export function equivalencias(costo, moneda, cambio) {
  return ["CLP", "USD", "UF"]
    .filter((destino) => destino !== moneda)
    .map((destino) => ({
      moneda: destino,
      valor: redondear(
        convertir(costo, moneda, destino, cambio),
        decimalesDe(destino)
      )
    }))
    .filter((item) => item.valor > 0);
}
