/**
 * Propósito: Horario, contraseña segura, usuario y
 *   campos faltantes de la ficha de configuración.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-15
 * Dependencias: ficha-datos.js, ficha-ip.js
 */

import { asegurarRed } from "./ficha-datos.js";
import { ipLista } from "./ficha-ip.js";

const NIVELES = [
  { clave: "debil", texto: "Seguridad: débil", pct: "25%" },
  { clave: "media", texto: "Seguridad: media", pct: "50%" },
  { clave: "fuerte", texto: "Seguridad: fuerte", pct: "75%" },
  {
    clave: "muy",
    texto: "Seguridad: muy fuerte",
    pct: "100%"
  }
];

/**
 * @param {unknown} valor
 * @returns {{entrada: string, salida: string}}
 */
export function partirHorario(valor) {
  const m = String(valor || "").match(
    /(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/
  );
  if (!m) return { entrada: "", salida: "" };
  return { entrada: horaIso(m[1]), salida: horaIso(m[2]) };
}

/**
 * @param {unknown} entrada
 * @param {unknown} salida
 * @returns {string}
 */
export function componerHorario(entrada, salida) {
  const a = horaIso(entrada);
  const b = horaIso(salida);
  if (!a || !b) return "";
  return `${a} A ${b}`;
}

/**
 * Completa entrada y salida si solo viene el texto viejo.
 * @param {object} ficha
 * @returns {object}
 */
export function asegurarHorarios(ficha) {
  if (!ficha || !Array.isArray(ficha.totems)) return ficha;
  ficha.totems.forEach((fila) => {
    if (!fila.horaEntrada && !fila.horaSalida) {
      const partes = partirHorario(fila.horario);
      fila.horaEntrada = partes.entrada;
      fila.horaSalida = partes.salida;
    }
    fila.horaEntrada = horaIso(fila.horaEntrada);
    fila.horaSalida = horaIso(fila.horaSalida);
    fila.horario = componerHorario(
      fila.horaEntrada,
      fila.horaSalida
    ) || String(fila.horario || "");
  });
  return ficha;
}

/**
 * @param {unknown} valor
 * @returns {string}
 */
function horaIso(valor) {
  const m = String(valor || "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "";
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return "";
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

/**
 * @param {unknown} valor
 * @returns {{clave: string, texto: string, pct: string, puntos: number}}
 */
export function nivelClave(valor) {
  const s = String(valor || "");
  const puntos = [
    s.length >= 8,
    /[A-ZÁÉÍÓÚÑ]/.test(s),
    /[a-záéíóúñ]/.test(s),
    /\d/.test(s),
    /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]/.test(s)
  ].filter(Boolean).length;
  let idx = 0;
  if (puntos >= 5 && s.length >= 12) idx = 3;
  else if (puntos >= 5) idx = 2;
  else if (puntos >= 3) idx = 1;
  return { ...NIVELES[idx], puntos };
}

/**
 * @param {unknown} valor
 * @returns {boolean}
 */
export function claveSegura(valor) {
  return nivelClave(valor).puntos >= 5;
}

/**
 * Usuario sin espacios. El nombre sí puede tenerlos.
 * @param {unknown} valor
 * @returns {boolean}
 */
export function usuarioValido(valor) {
  const u = String(valor || "").trim();
  return Boolean(u) && !/\s/.test(u);
}

/**
 * Campos obligatorios que aún no están listos.
 * @param {object} ficha
 * @returns {string[]}
 */
export function faltantesFicha(ficha) {
  return detalleFaltantes(ficha).map((item) => item.texto);
}

export const GRUPOS_FALTA = [
  { id: "cabecera", titulo: "Datos de quien rellena" },
  { id: "datos", titulo: "1. Datos de config." },
  { id: "menu", titulo: "1.1 Config. menú" },
  { id: "red", titulo: "2. Datos de red" }
];

/**
 * Pestaña o página a la que pertenece el campo.
 * @param {string} ruta
 * @returns {"cabecera"|"datos"|"menu"|"red"}
 */
export function grupoDeRuta(ruta) {
  const r = String(ruta || "");
  if (r === "pub-nombre") return "cabecera";
  if (r === "menu" || r.startsWith("menu.")) return "menu";
  if (r === "red" || r.startsWith("red.")) return "red";
  return "datos";
}

/**
 * Agrupa los faltantes por pestaña.
 * @param {{texto: string, ruta: string}[]} items
 * @returns {{id: string, titulo: string,
 *   items: {texto: string, ruta: string}[]}[]}
 */
export function faltantesPorGrupo(items) {
  return GRUPOS_FALTA.map((grupo) => ({
    id: grupo.id,
    titulo: grupo.titulo,
    items: (items || []).filter((item) => (
      grupoDeRuta(item.ruta) === grupo.id
    ))
  })).filter((grupo) => grupo.items.length);
}

/**
 * Faltantes con la ruta del campo para ir directo.
 * @param {object} ficha
 * @returns {{texto: string, ruta: string}[]}
 */
export function detalleFaltantes(ficha) {
  const d = ficha || {};
  asegurarRed(d);
  const out = [];
  faltantesHorario(d, out);
  (d.admins || []).forEach((fila, i) => {
    out.push(...faltantesPersona(
      `Administrador ${i + 1}`,
      `admins.${i}`,
      fila
    ));
  });
  (d.adminsSector || []).forEach((fila, i) => {
    out.push(...faltantesPersona(
      `Administrador de sector ${i + 1}`,
      `adminsSector.${i}`,
      fila
    ));
  });
  (d.ejecutivos || []).forEach((grupo, g) => {
    const sec = grupo.sector || "sector";
    (grupo.filas || []).forEach((fila, i) => {
      if (personaVacia(fila)) return;
      const n = fila.numero || "usuario";
      out.push(...faltantesPersona(
        `${sec} · ${n}`,
        `ejecutivos.${g}.filas.${i}`,
        fila
      ));
    });
  });
  faltantesModulos(d, out);
  faltantesTotemDatos(d, out);
  faltantesMenu(d, out);
  faltantesRed(d, out);
  return out;
}

/**
 * @param {object} d
 * @param {{texto: string, ruta: string}[]} out
 * @returns {void}
 */
function faltantesHorario(d, out) {
  (d.totems || []).forEach((fila, i) => {
    const nom = fila.totem || `Tótem ${i + 1}`;
    if (!horaIso(fila.horaEntrada)) {
      out.push({
        texto: `${nom}: hora de entrada`,
        ruta: `totems.${i}.horaEntrada`
      });
    }
    if (!horaIso(fila.horaSalida)) {
      out.push({
        texto: `${nom}: hora de salida`,
        ruta: `totems.${i}.horaSalida`
      });
    }
  });
}

/**
 * @param {object} d
 * @param {{texto: string, ruta: string}[]} out
 * @returns {void}
 */
function faltantesModulos(d, out) {
  (d.gruposModulo || []).forEach((grupo, g) => {
    const sec = grupo.sector || "UAC";
    (grupo.filas || []).forEach((fila, i) => {
      const mod = String(fila.modulo || "").trim();
      if (!mod) return;
      if (!String(fila.tramites || "").trim()) {
        out.push({
          texto: `${sec} · ${mod}: trámites que atiende`,
          ruta: `gruposModulo.${g}.filas.${i}.tramites`
        });
      }
    });
  });
}

/**
 * @param {string} prefijo
 * @param {string} base
 * @param {object} fila
 * @returns {{texto: string, ruta: string}[]}
 */
function faltantesPersona(prefijo, base, fila) {
  if (personaVacia(fila)) return [];
  const out = [];
  if (!String(fila.nombre || "").trim()) {
    out.push({ texto: `${prefijo}: nombre`, ruta: `${base}.nombre` });
  }
  if (!usuarioValido(fila.usuario)) {
    out.push({
      texto: `${prefijo}: usuario (obligatorio y sin espacios)`,
      ruta: `${base}.usuario`
    });
  }
  if (!claveSegura(fila.clave)) {
    out.push({
      texto: `${prefijo}: contraseña segura`,
      ruta: `${base}.clave`
    });
  }
  return out;
}

/**
 * @param {object} fila
 * @returns {boolean}
 */
/**
 * Nombre, oficina, sector e IP de cada UDT.
 * @param {object} d
 * @param {{texto: string, ruta: string}[]} out
 * @returns {void}
 */
function faltantesTotemDatos(d, out) {
  const filas = d.totems || [];
  if (!filas.length) {
    out.push({
      texto: "Agrega al menos un UDT (tótem)",
      ruta: "totems"
    });
    return;
  }
  filas.forEach((fila, i) => {
    const nom = fila.totem || `Tótem ${i + 1}`;
    if (!String(fila.totem || "").trim()) {
      out.push({
        texto: `UDT ${i + 1}: nombre del tótem`,
        ruta: `totems.${i}.totem`
      });
    }
    if (!String(fila.oficina || "").trim()) {
      out.push({
        texto: `${nom}: oficina`,
        ruta: `totems.${i}.oficina`
      });
    }
    if (!String(fila.sector || "").trim()) {
      out.push({
        texto: `${nom}: sector`,
        ruta: `totems.${i}.sector`
      });
    }
    if (!ipLista(fila.ip)) {
      out.push({
        texto: `${nom}: dirección IP`,
        ruta: `totems.${i}.ip`
      });
    }
  });
}

/**
 * 1.1 Config. menú: listo y textos de trámites.
 * @param {object} d
 * @param {{texto: string, ruta: string}[]} out
 * @returns {void}
 */
function faltantesMenu(d, out) {
  const menus = (d.menu && d.menu.totems) || [];
  const hayUdt = (d.totems || []).some((f) => (
    String(f.totem || "").trim()
  ));
  if (hayUdt && !menus.length) {
    out.push({
      texto: "Configura 1.1 Config. menú",
      ruta: "menu"
    });
    return;
  }
  menus.forEach((fila, i) => {
    const nom = fila.totem || `Tótem ${i + 1}`;
    if (fila.listo !== true) {
      out.push({
        texto: `${nom}: no está listo en 1.1 Config. menú`,
        ruta: `menu.totems.${i}`
      });
    }
    faltantesTramitesMenu(nom, i, fila, out);
  });
}

/**
 * @param {string} nom
 * @param {number} i
 * @param {object} fila
 * @param {{texto: string, ruta: string}[]} out
 * @returns {void}
 */
function faltantesTramitesMenu(nom, i, fila, out) {
  const tramites = fila.tramites || [];
  if (!tramites.length) {
    out.push({
      texto: `${nom}: agrega al menos un trámite`,
      ruta: `menu.totems.${i}`
    });
    return;
  }
  tramites.forEach((item, t) => {
    const base = `menu.totems.${i}.tramites.${t}`;
    if (!String(item.texto || "").trim()) {
      out.push({
        texto: `${nom}: trámite ${t + 1} en blanco`,
        ruta: `${base}.texto`
      });
    }
    (item.hijos || []).forEach((hijo, h) => {
      if (String(hijo || "").trim()) return;
      out.push({
        texto: `${nom}: subtrámite ${t + 1}.${h + 1} en blanco`,
        ruta: `${base}.hijos.${h}`
      });
    });
  });
}

/**
 * Al menos 1 fila de red; 2 si hay dos o más UDT.
 * @param {object} d
 * @param {{texto: string, ruta: string}[]} out
 * @returns {void}
 */
function faltantesRed(d, out) {
  const red = d.red || [];
  if (!red.length) {
    out.push({
      texto: "Datos de red: crea un tótem o visor",
      ruta: "red"
    });
    return;
  }
  const textos = [
    ["idCentro", "ID centro"],
    ["tienda", "tienda / oficina"],
    ["ubicacion", "ubicación"]
  ];
  const ips = [
    ["ip", "IP"],
    ["mascara", "máscara"],
    ["gateway", "puerta de enlace"],
    ["dns1", "DNS 1"],
    ["dns2", "DNS 2"]
  ];
  red.forEach((fila, i) => {
    const nom = fila.equipo || `equipo ${i + 1}`;
    textos.forEach(([clave, et]) => {
      if (String(fila[clave] || "").trim()) return;
      out.push({
        texto: `Red ${nom}: ${et}`,
        ruta: `red.${i}.${clave}`
      });
    });
    ips.forEach(([clave, et]) => {
      if (ipLista(fila[clave])) return;
      out.push({
        texto: `Red ${nom}: ${et}`,
        ruta: `red.${i}.${clave}`
      });
    });
  });
}

/**
 * @param {object} fila
 * @returns {boolean}
 */
function personaVacia(fila) {
  return !String(fila.nombre || "").trim()
    && !String(fila.usuario || "").trim()
    && !String(fila.clave || "").trim();
}
