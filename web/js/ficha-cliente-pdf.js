/**
 * Propósito: PDF de la ficha que el cliente finaliza y
 *   el admin resguarda.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-16
 * Dependencias: config.js, fechas.js, pdf.js, pdf-comun.js
 */

import { APP } from "./config.js";
import { ahoraLegible, formatearFechaHora } from "./fechas.js";
import { blobPdf, generarPdf } from "./pdf.js";
import {
  archivoPdf,
  cabeceraPdf,
  subtitulo,
  tablaDatos,
  tablaPares
} from "./pdf-comun.js";

const TXT = {
  titulo: "Ficha de configuración",
  rotulo: "Respuestas del cliente",
  datos: "1. Datos de configuración",
  oficinas: "Oficinas",
  sectores: "Sectores",
  udt: "UDT — Tótems",
  uac: "UAC — Módulos de atención",
  admins: "Administradores",
  adminsSec: "Administradores por sector",
  ejecutivos: "Ejecutivos",
  visores: "Visores",
  params: "10. Parámetros de atención",
  fisicos: "11. Datos físicos",
  req: "12. Requisitos",
  menu: "1.1 Configuración de menú",
  red: "Datos de red",
  listo: "Listo",
  pendiente: "Pendiente"
};

/**
 * @param {object} envio
 * @returns {string}
 */
export function nombrePdfFicha(envio) {
  return archivoPdf(
    "Ficha",
    (envio && envio.licitacion) || "cliente",
    envio && envio.numero
  );
}

/**
 * Ruta en Storage. El token es el secreto del enlace.
 * @param {unknown} token
 * @returns {string}
 */
export function rutaPdfFicha(token) {
  const id = String(token || "").replace(/[^\w\-]/g, "");
  return `${APP.carpetaPdfFicha}/${id}/respuestas.pdf`;
}

/**
 * @param {object} envio
 * @returns {Promise<void>}
 */
export function descargarFichaPdf(envio) {
  return generarPdf(
    (zona) => armarFichaPdf(zona, envio),
    nombrePdfFicha(envio)
  );
}

/**
 * Admin: arma el PDF con las respuestas guardadas.
 * @param {object} envio
 * @returns {Promise<void>}
 */
export function abrirPdfEnvio(envio) {
  return descargarFichaPdf(envio);
}

/**
 * @param {object} envio
 * @returns {Promise<Blob>}
 */
export function blobFichaPdf(envio) {
  return blobPdf(
    (zona) => armarFichaPdf(zona, envio),
    nombrePdfFicha(envio)
  );
}

/**
 * @param {Blob} blob
 * @param {string} nombre
 * @returns {void}
 */
export function bajarBlob(blob, nombre) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = nombre || "ficha.pdf";
  a.rel = "noopener";
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 2000);
}

/**
 * @param {HTMLElement} zona
 * @param {object} envio
 * @returns {void}
 */
export function armarFichaPdf(zona, envio) {
  const d = envio || {};
  zona.append(cabeceraPdf(
    TXT.titulo,
    d.licitacion || "—",
    TXT.rotulo
  ));
  zona.append(tablaPares(paresPortada(d)));
  zona.append(subtitulo(TXT.datos));
  zona.append(tablaPares(paresDatos(d)));
  tablaSiHay(zona, TXT.oficinas, ["Oficina"],
    (d.oficinas || []).map((n) => [n]));
  tablaSiHay(zona, TXT.sectores,
    ["Oficina", "Sector", "Tótem"],
    (d.sectores || []).map((f) => [
      f.oficina, f.sector, f.totem
    ]));
  tablaSiHay(zona, TXT.udt,
    ["Tótem", "Oficina", "Sector", "IP", "Horario"],
    (d.totems || []).map(filaUdt));
  pintarUac(zona, d);
  tablaSiHay(zona, TXT.admins,
    ["Nombre", "Usuario", "Clave"],
    (d.admins || []).map(filaPersona));
  tablaSiHay(zona, TXT.adminsSec,
    ["Sector", "Nombre", "Usuario", "Clave"],
    (d.adminsSector || []).map((f) => [
      f.sector, f.nombre, f.usuario, f.clave
    ]));
  pintarEjecutivos(zona, d);
  tablaSiHay(zona, TXT.visores,
    ["Sector", "Tótem", "Visor", "Texto"],
    (d.visores || []).map((f) => [
      f.sector, f.totem, f.visor, f.texto
    ]));
  zona.append(subtitulo(TXT.params));
  zona.append(tablaPares(paresParams(d)));
  pintarFisicos(zona, d);
  tablaSiHay(zona, TXT.req, ["Requisito", "Estado"],
    (d.requisitos || []).map((f) => [f.texto, f.estado]));
  pintarMenu(zona, d);
  pintarRed(zona, d);
}

/**
 * @param {object} d
 * @returns {[string, string][]}
 */
export function paresPortada(d) {
  return [
    ["Licitación", d.licitacion || ""],
    ["Cliente", d.cliente || ""],
    ["Quién rellenó", d.rellenadoPor || ""],
    ["Estado", d.estado || ""],
    ["Finalización", formatearFechaHora(d.finalizadoEn)
      || ahoraLegible()],
    ["N°", d.numero ? String(d.numero) : ""]
  ];
}

/**
 * @param {object} d
 * @returns {[string, string][]}
 */
function paresDatos(d) {
  return [
    ["Sistema", d.sistema || ""],
    ["País", d.pais || ""],
    ["ID centro", d.idCentro || ""]
  ];
}

/**
 * @param {object} d
 * @returns {[string, string][]}
 */
function paresParams(d) {
  return [
    ["Msg. atrasado", d.msgAtrasado || ""],
    ["Min. atraso", d.minutosAtraso || ""],
    ["Min. adelanto", d.minutosAdelanto || ""],
    ["Msg. temprano", d.msgTemprano || ""]
  ];
}

/**
 * @param {object} f
 * @returns {string[]}
 */
function filaUdt(f) {
  const horas = `${f.horaEntrada || ""} – ${f.horaSalida || ""}`;
  return [f.totem, f.oficina, f.sector, f.ip, f.horario || horas];
}

/**
 * @param {object} f
 * @returns {string[]}
 */
function filaPersona(f) {
  return [f.nombre, f.usuario, f.clave];
}

/**
 * @param {HTMLElement} zona
 * @param {string} titulo
 * @param {string[]} cols
 * @param {string[][]} filas
 * @returns {void}
 */
function tablaSiHay(zona, titulo, cols, filas) {
  const utiles = (filas || []).filter((f) =>
    f.some((c) => String(c || "").trim())
  );
  if (!utiles.length) return;
  zona.append(subtitulo(titulo));
  zona.append(tablaDatos(cols, utiles));
}

/**
 * @param {HTMLElement} zona
 * @param {object} d
 * @returns {void}
 */
function pintarUac(zona, d) {
  (d.gruposModulo || []).forEach((g) => {
    const filas = (g.filas || [])
      .filter((f) => f.modulo || f.tramites)
      .map((f) => [f.modulo, f.tramites]);
    if (!filas.length) return;
    zona.append(subtitulo(`${TXT.uac} — ${g.sector || ""}`));
    zona.append(tablaDatos(["Módulo", "Trámites"], filas));
  });
}

/**
 * @param {HTMLElement} zona
 * @param {object} d
 * @returns {void}
 */
function pintarEjecutivos(zona, d) {
  (d.ejecutivos || []).forEach((g) => {
    const filas = (g.filas || [])
      .filter((f) => f.nombre || f.usuario)
      .map((f) => [
        f.numero, f.modulo, f.nombre, f.usuario, f.clave
      ]);
    if (!filas.length) return;
    zona.append(subtitulo(
      `${TXT.ejecutivos} — ${g.sector || ""}`
    ));
    zona.append(tablaDatos(
      ["N°", "Módulo", "Nombre", "Usuario", "Clave"],
      filas
    ));
  });
}

/**
 * @param {HTMLElement} zona
 * @param {object} d
 * @returns {void}
 */
function pintarFisicos(zona, d) {
  (d.equipos || []).forEach((eq) => {
    const pares = [];
    (eq.pares || []).forEach((p) => {
      if (p.izquierda) {
        pares.push([p.izquierda, p.respuestaIzq || ""]);
      }
      if (p.derecha) {
        pares.push([p.derecha, p.respuestaDer || ""]);
      }
    });
    if (!pares.length) return;
    zona.append(subtitulo(
      `${TXT.fisicos} — ${eq.titulo || ""}`
    ));
    zona.append(tablaPares(pares));
  });
}

/**
 * @param {HTMLElement} zona
 * @param {object} d
 * @returns {void}
 */
function pintarMenu(zona, d) {
  const menu = d.menu || {};
  zona.append(subtitulo(TXT.menu));
  zona.append(tablaPares([
    ["Teclado", menu.teclado || ""]
  ]));
  (menu.totems || []).forEach((t) => {
    const tramites = (t.tramites || [])
      .filter((x) => x.texto)
      .map((x) => [
        x.texto,
        (x.hijos || []).filter(Boolean).join(", ")
      ]);
    zona.append(subtitulo(t.totem || "Tótem"));
    zona.append(tablaPares([
      ["Ingreso RUT", t.ingresoRut || ""],
      ["Preferente", t.tipoPreferente || ""],
      ["Ticket sin RUT", t.ticketSinRut || ""],
      ["Estado menú", t.listo ? TXT.listo : TXT.pendiente]
    ]));
    if (tramites.length) {
      zona.append(tablaDatos(
        ["Trámite", "Subtrámites"],
        tramites
      ));
    }
  });
}

/**
 * @param {HTMLElement} zona
 * @param {object} d
 * @returns {void}
 */
function pintarRed(zona, d) {
  const filas = (d.red || []).map((f) => [
    f.tienda, f.equipo, f.ubicacion, f.ip,
    f.mascara, f.gateway, f.dns1, f.dns2
  ]).filter((f) => f.some((c) => String(c || "").trim()));
  if (!filas.length) return;
  zona.append(subtitulo(TXT.red));
  zona.append(tablaDatos(
    [
      "Tienda", "Equipo", "Ubicación", "IP",
      "Máscara", "Gateway", "DNS1", "DNS2"
    ],
    filas
  ));
}
