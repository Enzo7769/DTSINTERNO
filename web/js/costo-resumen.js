/**
 * Propósito: Cifras del resumen gerencial de costos: todo en dólares,
 *   la cotización vigente de cada modelo, composición por categoría,
 *   variación y lo que requiere atención.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-23
 * Dependencias: costeo, hw-catalogo
 *
 * Funciones puras: reciben los registros y devuelven datos listos
 * para pintar. Así se pueden probar sin navegador.
 */

import { convertir, redondear } from "./costeo.js";
import { CATEGORIAS_COSTO } from "./hw-catalogo.js";

/** Días sin actualizar a partir de los cuales un costo se avisa. */
export const DIAS_VENCIDO = 180;

/** Categorías que se muestran solas; el resto va a «Otros». */
const CATEGORIAS_VISIBLES = 5;

/**
 * Tipo de cambio que vale para un registro: el que se guardó con él
 * y, si falta, el de referencia (dólar del día o de config).
 * @param {object} registro
 * @param {{usd: number, uf: number}} referencia
 * @returns {{usd: number, uf: number}}
 */
function cambioDe(registro, referencia) {
  const propio = (registro && registro.tipoCambio) || {};
  return {
    usd: Number(propio.usd) > 0 ? Number(propio.usd) : referencia.usd,
    uf: Number(propio.uf) > 0 ? Number(propio.uf) : referencia.uf
  };
}

/**
 * Un monto del registro en dólares.
 * @param {number} valor
 * @param {object} registro
 * @param {{usd: number, uf: number}} referencia
 * @returns {number} 0 si no se puede convertir
 */
export function enUsd(valor, registro, referencia) {
  const n = Number(valor) || 0;
  if (!(n > 0)) return 0;
  const moneda = registro.moneda || "USD";
  if (moneda === "USD") return redondear(n, 2);
  return redondear(
    convertir(n, moneda, "USD", cambioDe(registro, referencia)),
    2
  );
}

/**
 * @param {object} a
 * @param {object} b
 * @returns {number} positivo si a es más reciente
 */
function masReciente(a, b) {
  const fecha = String(a.fechaActualizacion || "")
    .localeCompare(String(b.fechaActualizacion || ""));
  return fecha || (Number(a.numero) || 0) - (Number(b.numero) || 0);
}

/**
 * La cotización vigente (la más reciente) de cada modelo y línea.
 * @param {object[]} costos
 * @returns {{registro: object, cotizaciones: number}[]}
 */
export function vigentes(costos) {
  const grupos = new Map();
  (costos || []).forEach((registro) => {
    const clave = `${registro.modeloClave}|${registro.linea}`;
    const lista = grupos.get(clave) || [];
    lista.push(registro);
    grupos.set(clave, lista);
  });
  return [...grupos.values()].map((lista) => {
    const orden = [...lista].sort((a, b) => masReciente(b, a));
    return { registro: orden[0], cotizaciones: lista.length };
  });
}

/**
 * Cambio del costo por equipo entre las dos últimas entradas del
 * historial, en dólares para comparar aunque cambie la moneda.
 * @param {object} registro
 * @param {{usd: number, uf: number}} referencia
 * @returns {{pct: number, desde: string}|null} null sin dos entradas
 */
export function variacion(registro, referencia) {
  const hist = (registro && registro.historial) || [];
  if (hist.length < 2) return null;
  const [antes, ahora] = hist.slice(-2).map((entrada) => enUsd(
    entrada.costo,
    { moneda: entrada.moneda, tipoCambio: entrada },
    referencia
  ));
  if (!(antes > 0) || !(ahora > 0)) return null;
  return {
    pct: redondear(((ahora - antes) / antes) * 100, 1),
    desde: hist[hist.length - 2].fecha || ""
  };
}

/**
 * @param {string} iso
 * @param {string} hoy
 * @returns {number} días entre ambas fechas; Infinity sin fecha
 */
export function diasDesde(iso, hoy) {
  if (!iso) return Infinity;
  const ms = Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`);
  return Number.isFinite(ms) ? Math.floor(ms / 86400000) : Infinity;
}

/**
 * Filas de la tabla gerencial: una por modelo y línea, en dólares.
 * @param {object[]} costos
 * @param {{usd: number, uf: number}} referencia
 * @param {string} hoy
 * @returns {object[]} ordenadas de mayor a menor costo
 */
export function filasResumen(costos, referencia, hoy) {
  return vigentes(costos).map(({ registro, cotizaciones }) => ({
    id: registro.id,
    modelo: registro.modelo,
    linea: registro.linea,
    tipo: registro.tipoEquipo,
    usd: enUsd(registro.costo, registro, referencia),
    moneda: registro.moneda,
    costo: registro.costo,
    fecha: registro.fechaActualizacion || "",
    dias: diasDesde(registro.fechaActualizacion, hoy),
    cotizaciones,
    variacion: variacion(registro, referencia),
    conDesglose: (registro.lineas || []).length > 0
  })).sort((a, b) => b.usd - a.usd);
}

/**
 * Cifras de cabecera.
 * @param {object[]} filas de filasResumen
 * @param {number} totalCostos registros en la base
 * @returns {{costos: number, modelos: number, promedio: number,
 *   minimo: object|null, maximo: object|null}}
 */
export function indicadores(filas, totalCostos) {
  const conMonto = filas.filter((fila) => fila.usd > 0);
  const suma = conMonto.reduce((acc, fila) => acc + fila.usd, 0);
  return {
    costos: totalCostos,
    modelos: new Set(filas.map((fila) => fila.modelo)).size,
    promedio: conMonto.length ? redondear(suma / conMonto.length, 2) : 0,
    minimo: conMonto.length ? conMonto[conMonto.length - 1] : null,
    maximo: conMonto.length ? conMonto[0] : null
  };
}

/**
 * Costo promedio por línea de producto, en dólares.
 * @param {object[]} filas
 * @returns {{linea: string, usd: number, modelos: number}[]}
 */
export function porLinea(filas) {
  const mapa = new Map();
  filas.filter((fila) => fila.usd > 0).forEach((fila) => {
    const previo = mapa.get(fila.linea) || { suma: 0, n: 0 };
    mapa.set(fila.linea, { suma: previo.suma + fila.usd, n: previo.n + 1 });
  });
  return [...mapa.entries()]
    .map(([linea, dato]) => ({
      linea,
      usd: redondear(dato.suma / dato.n, 2),
      modelos: dato.n
    }))
    .sort((a, b) => b.usd - a.usd);
}

/**
 * En qué se va el costo: suma por categoría de las cotizaciones
 * vigentes con desglose. Las categorías chicas se juntan en «Otros».
 * @param {object[]} costos
 * @param {{usd: number, uf: number}} referencia
 * @returns {{total: number, modelos: number,
 *   partes: {id: string, etiqueta: string, usd: number,
 *   pct: number}[]}}
 */
export function composicion(costos, referencia) {
  const sumas = new Map();
  let modelos = 0;
  vigentes(costos).forEach(({ registro }) => {
    const lineas = registro.lineas || [];
    if (!lineas.length) return;
    modelos += 1;
    lineas.forEach((linea) => {
      const usd = enUsd(linea.subtotalCosto, registro, referencia);
      sumas.set(linea.categoria, (sumas.get(linea.categoria) || 0) + usd);
    });
  });
  const total = [...sumas.values()].reduce((acc, v) => acc + v, 0);
  const ordenadas = CATEGORIAS_COSTO
    .filter((cat) => sumas.get(cat.id) > 0)
    .map((cat) => ({ id: cat.id, etiqueta: cat.corto, usd: sumas.get(cat.id) }))
    .sort((a, b) => b.usd - a.usd);
  const visibles = ordenadas.slice(0, CATEGORIAS_VISIBLES);
  const resto = ordenadas.slice(CATEGORIAS_VISIBLES)
    .reduce((acc, parte) => acc + parte.usd, 0);
  if (resto > 0) {
    visibles.push({ id: "resto", etiqueta: "Otros", usd: resto });
  }
  return {
    total: redondear(total, 2),
    modelos,
    partes: visibles.map((parte) => ({
      ...parte,
      usd: redondear(parte.usd, 2),
      pct: total > 0 ? redondear((parte.usd / total) * 100, 1) : 0
    }))
  };
}

/**
 * Lo que conviene revisar, de lo más a lo menos urgente.
 * @param {object[]} filas de filasResumen
 * @param {object[]} costos
 * @param {object[]} modelos catálogo
 * @returns {{tipo: string, texto: string, id?: string,
 *   modeloId?: string}[]}
 */
export function alertas(filas, costos, modelos) {
  const salida = [];
  const conCosto = new Set((costos || []).map((c) => c.modeloClave));
  const enCatalogo = new Set((modelos || []).map((m) => m.nombreClave));
  filas
    .filter((fila) => fila.dias > DIAS_VENCIDO)
    .forEach((fila) => salida.push({
      tipo: "vencido",
      id: fila.id,
      texto: fila.fecha
        ? `${fila.modelo}: sin actualizar hace ${fila.dias} días.`
        : `${fila.modelo}: sin fecha de actualización.`
    }));
  (modelos || [])
    .filter((m) => m.estado !== "descontinuado"
      && m.tipo !== "componente"
      && !conCosto.has(m.nombreClave))
    .forEach((m) => salida.push({
      tipo: "sinCosto",
      modeloId: m.id,
      texto: `${m.nombre}: está en el catálogo pero no tiene costo.`
    }));
  if (enCatalogo.size) {
    filas
      .filter((fila) => !enCatalogo.has(claveDe(costos, fila.id)))
      .forEach((fila) => salida.push({
        tipo: "sinCatalogo",
        id: fila.id,
        texto: `${fila.modelo}: el costo no corresponde a un modelo `
          + "del catálogo."
      }));
  }
  return salida;
}

/**
 * @param {object[]} costos
 * @param {string} id
 * @returns {string}
 */
function claveDe(costos, id) {
  const hallado = (costos || []).find((c) => c.id === id);
  return hallado ? hallado.modeloClave : "";
}
