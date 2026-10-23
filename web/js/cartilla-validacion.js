/**
 * Propósito: Normalizar y validar una cartilla de ruta.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: config, cartilla-catalogo, cartilla-textos,
 *   fechas, sanitizar
 */

import { APP } from "./config.js";
import {
  FINALIZACION,
  idLibreValido,
  ordenarLibres,
  SECCIONES_CARTILLA
} from "./cartilla-catalogo.js";
import { TXT, textoCampo } from "./cartilla-textos.js";
import { fechaValida } from "./fechas.js";
import {
  imagenSegura,
  normalizarIp,
  normalizarSerie,
  texto
} from "./sanitizar.js";
import { tipoValido, TXT_TIPO } from "./tipos-equipo.js";

export const LIMITES_CARTILLA = {
  cliente: 160,
  modelo: 120,
  serie: 80,
  parte: 80,
  persona: 120,
  obs: 600,
  extra: 120
};

/**
 * Deja la cartilla con la forma que acepta la base.
 * @param {object} entrada
 * @returns {object}
 */
export function normalizarCartilla(entrada) {
  const origen = entrada || {};
  const L = LIMITES_CARTILLA;
  const serie = texto(origen.numeroSerie, L.serie);
  return {
    plantilla: APP.plantillaCartilla,
    tipoEquipo: tipoValido(origen.tipoEquipo) ? origen.tipoEquipo : "",
    creadaPorNombre: texto(origen.creadaPorNombre, L.persona),
    aprobadaPorNombre: texto(origen.aprobadaPorNombre, L.persona),
    cliente: texto(origen.cliente, L.cliente),
    modelo: texto(origen.modelo, L.modelo),
    numeroSerie: serie,
    numeroSerieNorm: normalizarSerie(serie),
    numeroParte: texto(origen.numeroParte, L.parte),
    filas: normalizarFilas(origen.filas || {}),
    finalizacion: normalizarFinalizacion(origen.finalizacion || {})
  };
}

/**
 * @param {object} filas
 * @returns {object}
 */
function normalizarFilas(filas) {
  const salida = {};
  SECCIONES_CARTILLA.forEach((seccion) => {
    seccion.items.forEach((item) => {
      const fila = filas[item.id] || {};
      const incluido = seccion.tipo === "fija"
        || obligatoriaFija(seccion, item)
        || Boolean(fila.incluido);
      if (!incluido) return;
      salida[item.id] = normalizarFila(item, fila);
    });
  });
  return { ...salida, ...normalizarLibres(filas) };
}

/**
 * Un ítem de sección obligatoria entra siempre, salvo los de nombre
 * libre y los opcionales (DNS2, Proxy).
 * @param {object} seccion
 * @param {object} item
 * @returns {boolean}
 */
function obligatoriaFija(seccion, item) {
  return Boolean(seccion.obligatoria) && !item.nombreLibre
    && !item.opcional;
}

/**
 * Conserva los periféricos creados con el botón +, hasta el máximo.
 * @param {object} filas
 * @returns {object}
 */
function normalizarLibres(filas) {
  const salida = {};
  const plantilla = { nombreLibre: true };
  const claves = Object.keys(filas).filter(idLibreValido);
  ordenarLibres(claves)
    .slice(0, APP.maxPerifericosLibres)
    .forEach((id) => {
      const fila = filas[id] || {};
      if (!fila.incluido) return;
      salida[id] = normalizarFila(plantilla, fila);
    });
  return salida;
}

/**
 * @param {object} item
 * @param {object} fila
 * @returns {object}
 */
function normalizarFila(item, fila) {
  const L = LIMITES_CARTILLA;
  const extras = {};
  (item.extras || []).forEach((extra) => {
    extras[extra.id] = texto(fila.extras && fila.extras[extra.id], L.extra);
  });
  const aprobado = fila.aprobado === "si" || fila.aprobado === "no"
    ? fila.aprobado
    : "";
  let obs = texto(fila.obs, L.obs);
  if (item.formato === "ip" && obs) obs = normalizarIp(obs) || obs;
  return {
    incluido: true,
    obs,
    nombre: texto(fila.nombre, L.persona),
    fecha: texto(fila.fecha, 10),
    aprobado,
    nombreLibre: item.nombreLibre
      ? texto(fila.nombreLibre, L.extra)
      : "",
    extras
  };
}

/**
 * @param {object} fin
 * @returns {object}
 */
function normalizarFinalizacion(fin) {
  const salida = {};
  FINALIZACION.forEach((paso) => {
    const dato = fin[paso.id] || {};
    salida[paso.id] = {
      nombre: texto(dato.nombre, LIMITES_CARTILLA.persona),
      fecha: texto(dato.fecha, 10),
      firma: imagenSegura(dato.firma)
    };
  });
  return salida;
}

/**
 * Revisa una cartilla ya normalizada.
 * @param {object} datos
 * @returns {{valido: boolean, errores: string[], campos: object}}
 */
export function validarCartilla(datos) {
  const errores = [];
  const campos = {};
  const fallar = (campo, mensaje) => {
    errores.push(mensaje);
    campos[campo] = true;
  };
  if (!datos.tipoEquipo) fallar("c-tipo", TXT_TIPO.falta);
  if (!datos.cliente) fallar("c-cliente", TXT.faltaCliente);
  if (!datos.modelo) fallar("c-modelo", TXT.faltaModelo);
  if (!datos.numeroSerie) fallar("c-serie", TXT.faltaSerie);
  if (!datos.creadaPorNombre) {
    fallar("c-creada", TXT.faltaCreadaPor);
  }
  revisarFilas(datos, fallar);
  FINALIZACION.forEach((paso) => {
    const fecha = datos.finalizacion[paso.id].fecha;
    if (fecha && !fechaValida(fecha)) {
      fallar(`fin:${paso.id}`, textoCampo(paso.nombre, TXT.fechaInvalida));
    }
  });
  return { valido: errores.length === 0, errores, campos };
}

/**
 * @param {object} datos
 * @param {Function} fallar
 * @returns {void}
 */
function revisarFilas(datos, fallar) {
  SECCIONES_CARTILLA.forEach((seccion) => {
    seccion.items.forEach((item) => {
      const fila = datos.filas[item.id];
      const clave = `fila:${item.id}`;
      if (obligatoriaFija(seccion, item) && !(fila && fila.obs)) {
        fallar(clave, textoCampo(item.nombre, TXT.faltaValor));
      }
      if (!fila) return;
      const etiqueta = fila.nombreLibre || item.nombre;
      if (fila.fecha && !fechaValida(fila.fecha)) {
        fallar(clave, textoCampo(etiqueta, TXT.fechaInvalida));
      }
      if (item.nombreLibre && !fila.nombreLibre) {
        fallar(clave, textoCampo(item.nombre, TXT.faltaNombreLibre));
      }
      if (item.formato === "ip" && fila.obs && !normalizarIp(fila.obs)) {
        fallar(clave, textoCampo(item.nombre, TXT.ipInvalida));
      }
    });
  });
  revisarLibres(datos, fallar);
}

/**
 * @param {object} datos
 * @param {Function} fallar
 * @returns {void}
 */
function revisarLibres(datos, fallar) {
  Object.keys(datos.filas).filter(idLibreValido).forEach((id) => {
    const fila = datos.filas[id];
    const clave = `fila:${id}`;
    const etiqueta = fila.nombreLibre || TXT.perifericoNuevo;
    if (!fila.nombreLibre) {
      fallar(clave, textoCampo(TXT.perifericoNuevo, TXT.faltaNombreLibre));
    }
    if (fila.fecha && !fechaValida(fila.fecha)) {
      fallar(clave, textoCampo(etiqueta, TXT.fechaInvalida));
    }
  });
}
