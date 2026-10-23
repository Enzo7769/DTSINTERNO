/**
 * Propósito: Normalizar y validar un checklist antes de guardar.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: catalogo.js, constantes.js, fechas.js, sanitizar.js, config.js
 */

import { APP } from "./config.js";
import { SECCIONES, seccionDeItem } from "./catalogo.js";
import { LIMITES, MSG, mensajeExtra } from "./constantes.js";
import { fechaValida, hoyIso } from "./fechas.js";
import {
  imagenSegura,
  normalizarIp,
  normalizarMac,
  normalizarSerie,
  texto
} from "./sanitizar.js";
import { tipoValido, TXT_TIPO } from "./tipos-equipo.js";

/**
 * Cuenta ítems marcados OK contra el catálogo vigente.
 * @param {Record<string, {ok?: boolean}>} items
 * @returns {{ok: number, total: number}}
 */
export function contarOk(items, tipo) {
  let ok = 0;
  let total = 0;
  SECCIONES.forEach((seccion) => {
    seccion.items.forEach((item) => {
      if (!itemAplica(item, items, tipo)) return;
      total += 1;
      const fila = items && items[item.id];
      if (itemCumplido(item, fila)) ok += 1;
    });
  });
  return { ok, total };
}

/**
 * La prueba de reconexión solo aplica si el equipo tiene BAM.
 * @param {{dependeDe?: string}} item
 * @param {Record<string, {ok?: boolean}>|undefined} items
 * @returns {boolean}
 */
export function itemAplica(item, items, tipo) {
  if (!cabeEnTipo(item, tipo)) return false;
  if (!item.dependeDe) return true;
  const padre = items && items[item.dependeDe];
  return Boolean(padre && (padre.ok || padre.resultado === "ok"));
}

/**
 * @param {object} item
 * @param {string} tipo
 * @returns {boolean}
 */
function cabeEnTipo(item, tipo) {
  const seccion = seccionDeItem(item.id) || {};
  const solo = item.solo || seccion.solo || [];
  if (solo.length && !solo.includes(tipo)) return false;
  const salvo = item.salvo || seccion.salvo || [];
  return !(tipo && salvo.includes(tipo));
}

/**
 * Un ítem sin BAM cuenta como cumplido: no obliga a rechazar.
 * @param {object} item
 * @param {{ok?: boolean, resultado?: string}|undefined} fila
 * @returns {boolean}
 */
export function itemCumplido(item, fila) {
  const dato = fila || {};
  if (dato.ok || dato.resultado === "ok") return true;
  return Boolean(item.aceptaNo && dato.resultado === "malo");
}

/**
 * Estado que corresponde al avance actual.
 * @param {Record<string, {ok?: boolean}>} items
 * @returns {"aprobado"|"rechazado"}
 */
export function estadoSugerido(items, tipo) {
  const cuenta = contarOk(items, tipo);
  if (cuenta.total > 0 && cuenta.ok === cuenta.total) {
    return "aprobado";
  }
  return "rechazado";
}

/**
 * Deja el checklist en la forma que acepta la base.
 * @param {object} entrada
 * @returns {object}
 */
export function normalizarChecklist(entrada) {
  const origen = entrada || {};
  const items = {};
  SECCIONES.forEach((seccion) => {
    seccion.items.forEach((item) => {
      const fila = (origen.items && origen.items[item.id]) || {};
      const maxExtra = item.extra ? item.extra.max : 0;
      const resultado = resultadoDe(fila);
      items[item.id] = {
        ok: resultado === "ok",
        resultado,
        extra: texto(fila.extra, maxExtra),
        extras: extrasDe(item, fila)
      };
    });
  });
  const serie = texto(origen.numeroSerie, LIMITES.serie);
  const tecnico = firmaDe(origen.firmaTecnico);
  const calidad = firmaDe(origen.firmaCalidad);
  const estado = origen.estado === "aprobado"
    ? "aprobado"
    : "rechazado";
  return {
    plantilla: APP.plantilla,
    tipoEquipo: tipoValido(origen.tipoEquipo) ? origen.tipoEquipo : "",
    proyecto: texto(origen.proyecto, LIMITES.proyecto),
    fechaInspeccion: texto(origen.fechaInspeccion, 10),
    cliente: texto(origen.cliente, LIMITES.cliente),
    tecnico: texto(origen.tecnico, LIMITES.tecnico),
    numeroSerie: serie,
    numeroSerieNorm: normalizarSerie(serie),
    mac: normalizarMac(origen.mac),
    ip: normalizarIp(origen.ip),
    fechaSalida: texto(origen.fechaSalida, 10),
    items,
    estado,
    observaciones: texto(
      origen.observaciones,
      LIMITES.observaciones
    ),
    firmaTecnico: tecnico,
    firmaCalidad: calidad
  };
}

/**
 * @param {object|undefined} firma
 * @returns {{nombre: string, imagen: string}}
 */
function firmaDe(firma) {
  const origen = firma || {};
  return {
    nombre: texto(origen.nombre, LIMITES.firma),
    imagen: imagenSegura(origen.imagen)
  };
}

/**
 * Revisa un checklist ya normalizado.
 * @param {object} datos
 * @returns {{valido: boolean, errores: string[], campos: object}}
 */
export function validarDatos(datos, crudo) {
  const errores = [];
  const campos = {};
  const fallar = (campo, mensaje) => {
    errores.push(mensaje);
    campos[campo] = true;
  };
  revisarCabecera(datos, fallar, crudo || {});
  revisarItems(datos, fallar);
  revisarCierre(datos, fallar);
  return {
    valido: errores.length === 0,
    errores,
    campos
  };
}

/**
 * @param {object} datos
 * @param {Function} fallar
 * @returns {void}
 */
function revisarCabecera(datos, fallar, crudo) {
  const escrito = (valor) => String(valor ?? "").trim() !== "";
  if (!datos.tipoEquipo) fallar("tipoEquipo", TXT_TIPO.falta);
  if (!datos.proyecto) fallar("proyecto", MSG.faltaProyecto);
  if (!datos.cliente) fallar("cliente", MSG.faltaCliente);
  if (!datos.tecnico) fallar("tecnico", MSG.faltaTecnico);
  if (!datos.numeroSerie) fallar("numeroSerie", MSG.faltaSerie);
  if (!datos.mac) {
    fallar("mac", escrito(crudo.mac) ? MSG.macInvalida : MSG.faltaMac);
  }
  if (!datos.ip) {
    fallar("ip", escrito(crudo.ip) ? MSG.ipInvalida : MSG.faltaIp);
  }
  const inspeccion = fechaValida(datos.fechaInspeccion);
  const salida = fechaValida(datos.fechaSalida);
  if (!inspeccion) {
    fallar("fechaInspeccion", MSG.faltaFechaInspeccion);
  } else if (datos.fechaInspeccion > hoyIso()) {
    fallar("fechaInspeccion", MSG.inspeccionFutura);
  }
  if (!salida) {
    fallar("fechaSalida", MSG.faltaFechaSalida);
  } else if (inspeccion && datos.fechaSalida < datos.fechaInspeccion) {
    fallar("fechaSalida", MSG.salidaAntes);
  }
}

/**
 * @param {object} datos
 * @param {Function} fallar
 * @returns {void}
 */
function revisarItems(datos, fallar) {
  SECCIONES.forEach((seccion) => {
    seccion.items.forEach((item) => {
      const fila = datos.items[item.id] || {};
      if (
        item.extra
        && item.extra.obligatorioSiOk
        && fila.ok
        && !fila.extra
      ) {
        fallar(
          `extra:${item.id}`,
          mensajeExtra(item.extra.etiqueta)
        );
      }
      if (!fila.ok || !item.extras) return;
      item.extras.forEach((campo) => {
        const valor = fila.extras && fila.extras[campo.id];
        if (valor) return;
        fallar(
          `extra:${item.id}:${campo.id}`,
          mensajeExtra(campo.etiqueta)
        );
      });
    });
  });
}

/**
 * @param {{ok?: boolean, resultado?: string}} fila
 * @returns {"ok"|"malo"|""}
 */
function resultadoDe(fila) {
  if (fila.resultado === "malo") return "malo";
  if (fila.ok || fila.resultado === "ok") return "ok";
  return "";
}

/**
 * @param {object} item
 * @param {object} fila
 * @returns {Record<string, string>}
 */
function extrasDe(item, fila) {
  const salida = {};
  const origen = fila.extras || {};
  (item.extras || []).forEach((campo) => {
    salida[campo.id] = texto(origen[campo.id], campo.max);
  });
  return salida;
}

/**
 * @param {object} datos
 * @param {Function} fallar
 * @returns {void}
 */
function revisarCierre(datos, fallar) {
  if (datos.estado !== "aprobado" && datos.estado !== "rechazado") {
    fallar("estado", MSG.faltaEstado);
  }
  if (datos.estado === "aprobado") {
    const cuenta = contarOk(datos.items, datos.tipoEquipo);
    if (cuenta.ok !== cuenta.total) fallar("estado", MSG.noAprobado);
  }
  if (
    datos.estado === "rechazado"
    && datos.observaciones.length < APP.minObservaciones
  ) {
    fallar("observaciones", MSG.observacionesRechazo);
  }
  if (!datos.firmaTecnico || !datos.firmaTecnico.nombre) {
    fallar("firmaTecnico", MSG.faltaFirma);
  }
}
