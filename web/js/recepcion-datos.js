/**
 * Propósito: Datos de la recepción de equipos devueltos: normalizar y
 *   validar un local con sus equipos, calcular etapas, resultados y
 *   avance, y leer locales pegados desde Excel.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-23
 * Dependencias: recepcion-catalogo, sanitizar
 *
 * Funciones puras (sin DOM), probadas en test/verificar.mjs.
 */

import {
  ESTADOS_COMPONENTE,
  ETAPAS,
  REGIONES,
  TIPOS_RECEPCION,
  itemsDeTipo
} from "./recepcion-catalogo.js";
import { texto } from "./sanitizar.js";

export const PLANTILLA_RECEPCION = "recepcion-local-v1";

export const LIMITES_RECEPCION = {
  contrato: 80,
  codigo: 20,
  nombre: 120,
  comuna: 60,
  direccion: 160,
  contacto: 120,
  transportista: 80,
  guia: 40,
  notas: 600,
  equipos: 20,
  modelo: 80,
  serie: 60,
  recibidoPor: 80,
  nota: 160,
  observaciones: 600
};

const ORDEN_ETAPA = new Map(ETAPAS.map((etapa, i) => [etapa.id, i]));
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Clave para comparar códigos de local: LID01, lid-01 y «LID 01» son
 * el mismo.
 * @param {unknown} codigo
 * @returns {string}
 */
export function claveCodigo(codigo) {
  return String(codigo ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^0-9a-z]/gi, "")
    .toUpperCase();
}

/**
 * @param {unknown} valor
 * @param {{id: string}[]} lista
 * @param {string} porDefecto
 * @returns {string}
 */
function idValido(valor, lista, porDefecto) {
  return lista.some((item) => item.id === valor) ? valor : porDefecto;
}

/**
 * @param {unknown} valor
 * @returns {string}
 */
function fecha(valor) {
  const t = String(valor ?? "").slice(0, 10);
  return FECHA.test(t) ? t : "";
}

/**
 * @returns {string}
 */
export function nuevoUid() {
  const base = Date.now().toString(36);
  const azar = Math.random().toString(36).slice(2, 8);
  return `eq-${base}-${azar}`;
}

/**
 * Un equipo con su revisión. Solo se guardan los ítems que aplican a
 * su tipo.
 * @param {object} crudo
 * @returns {object}
 */
export function normalizarEquipo(crudo) {
  const e = crudo || {};
  const L = LIMITES_RECEPCION;
  const tipo = idValido(e.tipo, TIPOS_RECEPCION, "totem");
  const checklist = {};
  const origen = e.checklist && typeof e.checklist === "object"
    ? e.checklist
    : {};
  itemsDeTipo(tipo).forEach((item) => {
    const fila = origen[item.id] || {};
    const estado = idValido(fila.estado, ESTADOS_COMPONENTE, "");
    const nota = texto(fila.nota, L.nota);
    if (estado || nota) checklist[item.id] = { estado, nota };
  });
  return {
    uid: texto(e.uid, 40) || nuevoUid(),
    tipo,
    modelo: texto(e.modelo, L.modelo),
    serie: texto(e.serie, L.serie),
    etapa: idValido(e.etapa, ETAPAS, "pendiente"),
    fechaRecepcion: fecha(e.fechaRecepcion),
    recibidoPor: texto(e.recibidoPor, L.recibidoPor),
    enciende: ["si", "no"].includes(e.enciende) ? e.enciende : "",
    checklist,
    observaciones: texto(e.observaciones, L.observaciones)
  };
}

/**
 * @param {object} crudo
 * @returns {object}
 */
export function normalizarLocal(crudo) {
  const d = crudo || {};
  const L = LIMITES_RECEPCION;
  const codigo = texto(d.codigo, L.codigo).toUpperCase();
  return {
    plantilla: PLANTILLA_RECEPCION,
    contrato: texto(d.contrato, L.contrato),
    codigo,
    codigoClave: claveCodigo(codigo),
    nombre: texto(d.nombre, L.nombre),
    region: idValido(d.region, REGIONES, ""),
    comuna: texto(d.comuna, L.comuna),
    direccion: texto(d.direccion, L.direccion),
    contacto: texto(d.contacto, L.contacto),
    retiroProgramado: fecha(d.retiroProgramado),
    transportista: texto(d.transportista, L.transportista),
    guia: texto(d.guia, L.guia),
    notas: texto(d.notas, L.notas),
    equipos: (Array.isArray(d.equipos) ? d.equipos : [])
      .slice(0, L.equipos)
      .map(normalizarEquipo)
  };
}

/**
 * Revisión antes de guardar. Un equipo revisado debe tener todos sus
 * componentes evaluados.
 * @param {object} local normalizado
 * @param {object[]} [otros] locales guardados, para códigos repetidos
 * @param {string} [idActual]
 * @returns {{valido: boolean, errores: string[], campos: object}}
 */
export function validarLocal(local, otros, idActual) {
  const errores = [];
  const campos = {};
  const fallar = (campo, mensaje) => {
    errores.push(mensaje);
    campos[campo] = true;
  };
  if (!local.contrato) fallar("r-contrato", "Indica el contrato o cliente.");
  if (!local.codigoClave) fallar("r-codigo", "Indica el código del local.");
  if (!local.region) fallar("r-region", "Elige la región.");
  const repetido = (otros || []).some((otro) => otro.id !== idActual
    && otro.codigoClave === local.codigoClave
    && claveCodigo(otro.contrato) === claveCodigo(local.contrato));
  if (local.codigoClave && repetido) {
    fallar("r-codigo", `Ya existe el local ${local.codigo} en este contrato.`);
  }
  local.equipos.forEach((equipo, i) => {
    const n = `Equipo ${i + 1}${equipo.serie ? ` (${equipo.serie})` : ""}`;
    const llego = ORDEN_ETAPA.get(equipo.etapa) >= ORDEN_ETAPA.get("recibido");
    if (llego && !equipo.fechaRecepcion) {
      fallar(`eq-${i}`, `${n}: indica la fecha de recepción.`);
    }
    if (equipo.etapa === "revisado") {
      const sinRevisar = pendientesRevision(equipo);
      if (sinRevisar.length) {
        fallar(`eq-${i}`, `${n}: faltan por revisar `
          + `${sinRevisar.map((item) => item.nombre).join(", ")}.`);
      }
      if (!equipo.enciende) {
        fallar(`eq-${i}`, `${n}: indica si enciende.`);
      }
    }
  });
  return { valido: errores.length === 0, errores, campos };
}

/**
 * Componentes del equipo aún sin estado.
 * @param {object} equipo
 * @returns {object[]}
 */
export function pendientesRevision(equipo) {
  return itemsDeTipo(equipo.tipo)
    .filter((item) => !(equipo.checklist[item.id]
      && equipo.checklist[item.id].estado));
}

/**
 * Resultado de un equipo revisado: incompleto si falta algo, con
 * daños si algo está dañado o no enciende; si no, OK.
 * @param {object} equipo
 * @returns {"ok"|"danado"|"incompleto"|""} vacío si no está revisado
 */
export function resultadoEquipo(equipo) {
  if (!equipo || equipo.etapa !== "revisado") return "";
  const estados = Object.values(equipo.checklist || {})
    .map((fila) => fila.estado);
  if (estados.includes("falta")) return "incompleto";
  if (estados.includes("danado") || equipo.enciende === "no") {
    return "danado";
  }
  return "ok";
}

/**
 * Etapa del local según sus equipos: la del equipo más atrasado.
 * @param {object} local
 * @returns {string} id de etapa; «pendiente» si no tiene equipos
 */
export function etapaLocal(local) {
  const equipos = (local && local.equipos) || [];
  if (!equipos.length) return "pendiente";
  const minimo = Math.min(...equipos
    .map((equipo) => ORDEN_ETAPA.get(equipo.etapa) ?? 0));
  return ETAPAS[minimo].id;
}

/**
 * Totales del avance de un grupo de locales.
 * @param {object[]} locales
 * @returns {{locales: number, equipos: number, transito: number,
 *   recibidos: number, revisados: number, ok: number, danados: number,
 *   incompletos: number, localesListos: number}}
 */
export function avance(locales) {
  const t = {
    locales: 0, equipos: 0, transito: 0, recibidos: 0, revisados: 0,
    ok: 0, danados: 0, incompletos: 0, localesListos: 0
  };
  (locales || []).forEach((local) => {
    t.locales += 1;
    if (local.equipos.length && etapaLocal(local) === "revisado") {
      t.localesListos += 1;
    }
    local.equipos.forEach((equipo) => {
      t.equipos += 1;
      const orden = ORDEN_ETAPA.get(equipo.etapa) ?? 0;
      if (orden === 1) t.transito += 1;
      if (orden >= 2) t.recibidos += 1;
      const r = resultadoEquipo(equipo);
      if (r) t.revisados += 1;
      if (r === "ok") t.ok += 1;
      if (r === "danado") t.danados += 1;
      if (r === "incompleto") t.incompletos += 1;
    });
  });
  return t;
}

/**
 * Avance por región, de norte a sur; solo regiones con locales.
 * @param {object[]} locales
 * @returns {{region: string, etiqueta: string, locales: number,
 *   equipos: number, recibidos: number, revisados: number}[]}
 */
export function avancePorRegion(locales) {
  return REGIONES.map((region) => {
    const propios = (locales || []).filter((l) => l.region === region.id);
    const a = avance(propios);
    return {
      region: region.id,
      etiqueta: region.etiqueta,
      locales: a.locales,
      equipos: a.equipos,
      recibidos: a.recibidos,
      revisados: a.revisados
    };
  }).filter((fila) => fila.locales > 0);
}

/**
 * Componentes que llegaron faltando o dañados, para reclamar.
 * @param {object[]} locales
 * @param {object[]} items catálogo de componentes
 * @returns {{id: string, nombre: string, falta: number,
 *   danado: number, donde: string[]}[]} de más a menos casos
 */
export function novedades(locales, items) {
  const mapa = new Map();
  (locales || []).forEach((local) => {
    local.equipos.forEach((equipo) => {
      Object.entries(equipo.checklist || {}).forEach(([id, fila]) => {
        if (fila.estado !== "falta" && fila.estado !== "danado") return;
        const previo = mapa.get(id) || { falta: 0, danado: 0, donde: [] };
        previo[fila.estado] += 1;
        previo.donde.push(local.codigo);
        mapa.set(id, previo);
      });
    });
  });
  return [...mapa.entries()]
    .map(([id, dato]) => ({
      id,
      nombre: (items.find((item) => item.id === id) || {}).nombre || id,
      ...dato,
      donde: [...new Set(dato.donde)]
    }))
    .sort((a, b) => (b.falta + b.danado) - (a.falta + a.danado));
}

/* ---------- Importar desde Excel ---------- */

const ENCABEZADOS = {
  codigo: ["codigo", "cod", "local", "idlocal", "codlocal", "tienda"],
  nombre: ["nombre", "nombrelocal", "sucursal", "nombretienda"],
  region: ["region", "reg"],
  comuna: ["comuna", "ciudad"],
  direccion: ["direccion", "dir", "domicilio"],
  equipos: ["equipos", "cantidad", "cant", "totems", "ntotems"],
  modelo: ["modelo"],
  serie: ["serie", "nserie", "numeroserie", "ns", "sn"],
  tipo: ["tipo", "tipoequipo"]
};

/**
 * @param {string} valor
 * @returns {string}
 */
function plano(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^0-9a-z]/gi, "")
    .toLowerCase();
}

/**
 * Región desde lo que venga escrito: «RM», «Metropolitana», «V»,
 * «Región de Valparaíso», «13»…
 * @param {string} valor
 * @returns {string} id de región o vacío
 */
export function regionDesdeTexto(valor) {
  const p = plano(valor).replace(/^region(de|del)?/, "");
  if (!p) return "";
  const porNumero = {
    "1": "TA", "2": "AN", "3": "AT", "4": "CO", "5": "VA", "6": "LI",
    "7": "ML", "8": "BI", "9": "AR", "10": "LL", "11": "AI", "12": "MA",
    "13": "RM", "14": "LR", "15": "AP", "16": "NB"
  };
  if (porNumero[p]) return porNumero[p];
  if (p === "santiago" || p === "metropolitana" || p === "rm") return "RM";
  const exacta = REGIONES.find((r) => plano(r.numero) === p
    || plano(r.id) === p || plano(r.etiqueta) === p);
  if (exacta) return exacta.id;
  const parcial = REGIONES.find((r) => plano(r.etiqueta).includes(p)
    || (p.length > 4 && p.includes(plano(r.etiqueta))));
  return parcial ? parcial.id : "";
}

/**
 * Lee filas pegadas desde Excel (tabulaciones) o un CSV (; o ,). La
 * primera fila debe tener los encabezados. Si un código se repite,
 * cada fila es otro equipo del mismo local.
 * @param {string} textoPegado
 * @param {string} contrato
 * @returns {{locales: object[], avisos: string[]}}
 */
export function leerPlanillaLocales(textoPegado, contrato) {
  const filas = String(textoPegado || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((linea) => linea.trim());
  const avisos = [];
  if (filas.length < 2) {
    return {
      locales: [],
      avisos: ["Pega la fila de encabezados y al menos un local."]
    };
  }
  const sep = filas[0].includes("\t")
    ? "\t"
    : (filas[0].split(";").length > filas[0].split(",").length ? ";" : ",");
  const cabeza = filas[0].split(sep).map(plano);
  const col = {};
  Object.entries(ENCABEZADOS).forEach(([campo, nombres]) => {
    const i = cabeza.findIndex((c) => nombres.includes(c));
    if (i >= 0) col[campo] = i;
  });
  if (col.codigo === undefined) {
    return {
      locales: [],
      avisos: ["No se encontró la columna «Código» en la primera fila."]
    };
  }
  const porCodigo = new Map();
  filas.slice(1).forEach((linea, n) => {
    const celdas = linea.split(sep).map((c) => c.trim());
    const valor = (campo) => (col[campo] === undefined
      ? ""
      : celdas[col[campo]] || "");
    const codigo = valor("codigo");
    const clave = claveCodigo(codigo);
    if (!clave) {
      avisos.push(`Fila ${n + 2}: sin código, se omitió.`);
      return;
    }
    const region = regionDesdeTexto(valor("region"));
    if (valor("region") && !region) {
      avisos.push(`Fila ${n + 2} (${codigo}): no se reconoce la región `
        + `«${valor("region")}».`);
    }
    if (!porCodigo.has(clave)) {
      porCodigo.set(clave, {
        contrato,
        codigo,
        nombre: valor("nombre"),
        region,
        comuna: valor("comuna"),
        direccion: valor("direccion"),
        equipos: []
      });
    }
    const local = porCodigo.get(clave);
    const cantidad = Math.min(
      Math.max(parseInt(valor("equipos"), 10) || 0, 0),
      LIMITES_RECEPCION.equipos
    );
    const tipo = TIPOS_RECEPCION.find((t) => plano(t.etiqueta)
      === plano(valor("tipo")))?.id || "totem";
    if (valor("serie") || valor("modelo") || !cantidad) {
      local.equipos.push({
        tipo,
        modelo: valor("modelo"),
        serie: valor("serie")
      });
    } else {
      for (let i = 0; i < cantidad; i += 1) {
        local.equipos.push({ tipo, modelo: valor("modelo"), serie: "" });
      }
    }
  });
  const locales = [...porCodigo.values()].map(normalizarLocal);
  return { locales, avisos };
}
