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
 * @param {string} [hoy] AAAA-MM-DD; la recepción no puede ser futura
 * @returns {{valido: boolean, errores: string[], campos: object}}
 */
export function validarLocal(local, otros, idActual, hoy) {
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
    if (hoy && equipo.fechaRecepcion > hoy) {
      fallar(`eq-${i}`, `${n}: la fecha de recepción no puede ser futura.`);
    }
    if (equipo.etapa === "revisado") {
      const sinRevisar = pendientesRevision(equipo);
      if (sinRevisar.length > 3) {
        fallar(`eq-${i}`, `${n}: faltan ${sinRevisar.length} componentes `
          + "por revisar.");
      } else if (sinRevisar.length) {
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
 * daños si algo está dañado o no enciende; si no, OK. «No probado»
 * (p. ej. porque el equipo no enciende) no cambia el resultado.
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

/** Días antes del retiro en que un local pasa a «próximos». */
export const DIAS_AVISO_RETIRO = 3;

/**
 * Días entre dos fechas AAAA-MM-DD (positivo si «hasta» es después).
 * @param {string} desde
 * @param {string} hasta
 * @returns {number}
 */
export function diasEntre(desde, hasta) {
  const ms = Date.parse(`${hasta}T00:00:00Z`)
    - Date.parse(`${desde}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

/**
 * Retiros que vencen: locales con fecha de retiro programada y
 * equipos que siguen pendientes de retiro (los que ya salieron no
 * cuentan).
 * @param {object[]} locales
 * @param {string} hoy AAAA-MM-DD
 * @param {number} [dias] anticipación de «próximos»
 * @returns {{atrasados: object[], hoy: object[], proximos: object[]}}
 *   cada fila: {local, dias, pendientes}; atrasados de más a menos
 *   días, próximos del más cercano al más lejano
 */
export function retirosPorFecha(locales, hoy, dias = DIAS_AVISO_RETIRO) {
  const salida = { atrasados: [], hoy: [], proximos: [] };
  (locales || []).forEach((local) => {
    if (!local.retiroProgramado) return;
    const pendientes = local.equipos
      .filter((equipo) => equipo.etapa === "pendiente").length;
    if (!pendientes) return;
    const faltan = diasEntre(hoy, local.retiroProgramado);
    const fila = { local, dias: Math.abs(faltan), pendientes };
    if (faltan < 0) salida.atrasados.push(fila);
    else if (faltan === 0) salida.hoy.push(fila);
    else if (faltan <= dias) salida.proximos.push(fila);
  });
  const porCodigo = (a, b) => a.local.codigo.localeCompare(b.local.codigo,
    "es", { numeric: true });
  salida.atrasados.sort((a, b) => b.dias - a.dias || porCodigo(a, b));
  salida.hoy.sort(porCodigo);
  salida.proximos.sort((a, b) => a.dias - b.dias || porCodigo(a, b));
  return salida;
}

/** Novedad que no es un componente: el equipo no enciende. */
export const NOVEDAD_NO_ENCIENDE = {
  id: "_enciende",
  nombre: "Equipo no enciende"
};

/**
 * Componentes que llegaron faltando o dañados, para reclamar. Un
 * equipo que no enciende cuenta como daño aparte.
 * @param {object[]} locales
 * @param {object[]} items catálogo de componentes
 * @returns {{id: string, nombre: string, falta: number,
 *   danado: number, donde: string[]}[]} de más a menos casos
 */
export function novedades(locales, items) {
  const mapa = new Map();
  const sumar = (id, estado, codigo) => {
    const previo = mapa.get(id) || { falta: 0, danado: 0, donde: [] };
    previo[estado] += 1;
    previo.donde.push(codigo);
    mapa.set(id, previo);
  };
  (locales || []).forEach((local) => {
    local.equipos.forEach((equipo) => {
      if (equipo.enciende === "no") {
        sumar(NOVEDAD_NO_ENCIENDE.id, "danado", local.codigo);
      }
      Object.entries(equipo.checklist || {}).forEach(([id, fila]) => {
        if (fila.estado !== "falta" && fila.estado !== "danado") return;
        sumar(id, fila.estado, local.codigo);
      });
    });
  });
  const catalogo = [...items, NOVEDAD_NO_ENCIENDE];
  return [...mapa.entries()]
    .map(([id, dato]) => ({
      id,
      nombre: (catalogo.find((item) => item.id === id) || {}).nombre || id,
      ...dato,
      donde: [...new Set(dato.donde)]
    }))
    .sort((a, b) => (b.falta + b.danado) - (a.falta + a.danado));
}

/* ---------- Importar desde Excel ---------- */

const ENCABEZADOS = {
  codigo: ["codigo", "cod", "local", "idlocal", "codlocal", "tienda"],
  nombre: ["nombre", "nombrelocal", "sucursal", "nombretienda", "local"],
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

/** Palabras que no ayudan a reconocer una región. */
const PALABRAS_VACIAS = new Set([
  "region", "reg", "de", "del", "la", "el", "y", "general", "bernardo",
  "carlos", "ibanez", "campo", "chilena", "antartica"
]);

/** Números romanos y arábigos de las regiones. */
const NUMEROS_REGION = {
  i: "TA", ii: "AN", iii: "AT", iv: "CO", v: "VA", vi: "LI", vii: "ML",
  viii: "BI", ix: "AR", x: "LL", xi: "AI", xii: "MA", xiii: "RM",
  xiv: "LR", xv: "AP", xvi: "NB", rm: "RM"
};
["TA", "AN", "AT", "CO", "VA", "LI", "ML", "BI", "AR", "LL", "AI", "MA",
  "RM", "LR", "AP", "NB"].forEach((id, i) => {
  NUMEROS_REGION[String(i + 1)] = id;
});

/** Otras formas de escribir una región (ya sin tildes ni espacios). */
const ALIAS_REGION = {
  AP: ["arica", "parinacota"],
  TA: ["tarapaca", "iquique"],
  RM: ["metropolitana", "santiago"],
  LI: ["ohiggins", "higgins", "libertador", "rancagua"],
  ML: ["maule", "talca"],
  NB: ["nuble", "chillan"],
  BI: ["biobio", "concepcion"],
  AR: ["araucania", "temuco"],
  LR: ["losrios", "rios", "valdivia"],
  LL: ["loslagos", "lagos", "puertomontt"],
  AI: ["aysen", "aisen", "coyhaique"],
  MA: ["magallanes", "puntaarenas"]
};

/**
 * @param {string} valor
 * @returns {string[]} palabras sin tildes ni signos, en minúscula
 */
function palabras(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^0-9a-z]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

/**
 * Región desde lo que venga escrito: «RM», «Metropolitana», «V»,
 * «VI Región», «Región del Libertador General Bernardo O'Higgins»,
 * «13»…
 * @param {string} valor
 * @returns {string} id de región o vacío
 */
export function regionDesdeTexto(valor) {
  const todas = palabras(valor);
  const utiles = todas.filter((w) => !PALABRAS_VACIAS.has(w));
  const p = utiles.join("");
  if (!todas.length) return "";
  if (NUMEROS_REGION[p]) return NUMEROS_REGION[p];
  const numero = utiles.find((w) => NUMEROS_REGION[w] && w.length <= 4);
  if (utiles.length === 1 && numero) return NUMEROS_REGION[numero];
  const exacta = REGIONES.find((r) => plano(r.id) === p
    || palabras(r.etiqueta).filter((w) => !PALABRAS_VACIAS.has(w))
      .join("") === p);
  if (exacta) return exacta.id;
  if (!p) return todas.includes("antartica") ? "MA" : "";
  const porAlias = Object.entries(ALIAS_REGION)
    .find(([, alias]) => alias.some((a) => p.includes(a)));
  if (porAlias) return porAlias[0];
  const parcial = REGIONES.find((r) => p.length > 3
    && (plano(r.etiqueta).includes(p) || p.includes(plano(r.etiqueta))));
  if (parcial) return parcial.id;
  return numero ? NUMEROS_REGION[numero] : "";
}

/**
 * Parte una fila de CSV respetando comillas: «"Av. Uno, 123"» es una
 * sola celda y «""» dentro de comillas es una comilla.
 * @param {string} linea
 * @param {string} sep
 * @returns {string[]}
 */
export function partirFila(linea, sep) {
  const celdas = [];
  let actual = "";
  let entreComillas = false;
  for (let i = 0; i < linea.length; i += 1) {
    const c = linea[i];
    if (entreComillas) {
      if (c === "\"" && linea[i + 1] === "\"") {
        actual += "\"";
        i += 1;
      } else if (c === "\"") {
        entreComillas = false;
      } else {
        actual += c;
      }
    } else if (c === "\"" && !actual.trim()) {
      entreComillas = true;
      actual = "";
    } else if (c === sep) {
      celdas.push(actual.trim());
      actual = "";
    } else {
      actual += c;
    }
  }
  celdas.push(actual.trim());
  return celdas;
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
    : (partirFila(filas[0], ";").length > partirFila(filas[0], ",").length
      ? ";"
      : ",");
  const cabeza = partirFila(filas[0], sep).map(plano);
  const col = {};
  // Cada columna se usa una vez: con «Código» y «Local», «Local» es
  // el nombre; si solo viene «Local», es el código.
  const usadas = new Set();
  Object.entries(ENCABEZADOS).forEach(([campo, nombres]) => {
    const i = cabeza.findIndex((c, n) => !usadas.has(n)
      && nombres.includes(c));
    if (i >= 0) {
      col[campo] = i;
      usadas.add(i);
    }
  });
  if (col.codigo === undefined) {
    return {
      locales: [],
      avisos: ["No se encontró la columna «Código» en la primera fila."]
    };
  }
  const porCodigo = new Map();
  filas.slice(1).forEach((linea, n) => {
    const celdas = partirFila(linea, sep);
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
    const textoCantidad = valor("equipos");
    const cantidad = Math.min(
      Math.max(parseInt(textoCantidad, 10) || 0, 0),
      LIMITES_RECEPCION.equipos
    );
    const tipo = TIPOS_RECEPCION.find((t) => plano(t.etiqueta)
      === plano(valor("tipo")))?.id || "totem";
    // Con serie la fila es un equipo; sin serie manda la cantidad
    // (0 = ninguno) y, si no viene cantidad, se asume uno.
    const veces = valor("serie") ? 1 : (textoCantidad ? cantidad : 1);
    for (let i = 0; i < veces; i += 1) {
      local.equipos.push({
        tipo,
        modelo: valor("modelo"),
        serie: valor("serie")
      });
    }
  });
  const locales = [...porCodigo.values()].map(normalizarLocal);
  return { locales, avisos };
}
