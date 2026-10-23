/**
 * Propósito: Registros de ejemplo para la vista previa local.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: catalogo.js, validacion.js, cartilla-validacion.js,
 *   costo-validacion.js, datos-planilla.js, modelo-validacion.js,
 *   recepcion-datos.js
 */

import { SECCIONES } from "./catalogo.js";
import { normalizarCartilla } from "./cartilla-validacion.js";
import { normalizarCosto } from "./costo-validacion.js";
import { PLANILLA_COSTOS, PLANILLA_MODELOS } from "./datos-planilla.js";
import { hoyIso } from "./fechas.js";
import { normalizarModelo } from "./modelo-validacion.js";
import { normalizarLocal } from "./recepcion-datos.js";
import { normalizarChecklist } from "./validacion.js";

const RED_PRIVADA = [
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/
];

/**
 * La vista previa solo existe en este equipo o en la red interna.
 * @returns {boolean}
 */
export function pedidoDemo() {
  const param = new URLSearchParams(location.search).get("demo");
  return esLocal() && param === "1";
}

/**
 * @returns {boolean}
 */
export function esLocal() {
  const host = location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return RED_PRIVADA.some((patron) => patron.test(host));
}

/**
 * @returns {object[]}
 */
export function semilla() {
  return [
    armar({
      id: "local-demo-001",
      numero: 2,
      tipoEquipo: "totem",
      proyecto: "Licitación de prueba",
      fechaInspeccion: "2026-09-28",
      cliente: "Cliente de prueba",
      tecnico: "Técnico de prueba",
      numeroSerie: "DTS-DEMO-001",
      mac: "AA:BB:CC:DD:EE:01",
      ip: "192.168.1.10",
      fechaSalida: "2026-09-30",
      estado: "aprobado",
      observaciones: "",
      extras: {
        anydeskInstalacion: "123 456 789",
        instanwebPrueba: "IW-1001"
      },
      grupos: {
        tieneBam: {
          ssid: "DTS-BAM",
          wifiKey: "clave-demo",
          password: "demo-1234"
        }
      },
      ok: true,
      creadoEn: Date.now() - 86400000
    }),
    armar({
      id: "local-demo-002",
      numero: 1,
      tipoEquipo: "visor",
      proyecto: "Proyecto piloto",
      fechaInspeccion: "2026-09-20",
      cliente: "Destino norte",
      tecnico: "Técnico de prueba",
      numeroSerie: "DTS-DEMO-002",
      mac: "AA:BB:CC:DD:EE:02",
      ip: "192.168.1.11",
      fechaSalida: "2026-09-21",
      estado: "rechazado",
      observaciones: "La impresora no dejó la página de prueba.",
      extras: {},
      ok: false,
      creadoEn: Date.now() - 172800000
    })
  ];
}

/**
 * Cartilla de ejemplo con periféricos, testing y red elegidos.
 * @returns {object[]}
 */
export function semillaCartillas() {
  const fila = (obs, aprobado, extra) => ({
    incluido: true,
    obs,
    nombre: "Técnico de prueba",
    fecha: "2026-09-29",
    aprobado,
    ...extra
  });
  const limpia = normalizarCartilla({
    tipoEquipo: "locker",
    creadaPorNombre: "Técnico de prueba",
    aprobadaPorNombre: "Jefe de taller",
    cliente: "Cliente de prueba",
    modelo: "Kiosco K-20",
    numeroSerie: "DTS-DEMO-001",
    numeroParte: "PN-2026-01",
    filas: {
      recepcionChasis: fila("Chasis sin golpes.", "si"),
      perPantalla: fila("Touch 21,5 pulgadas.", "si"),
      perMiniPc: fila("", "si", {
        extras: { procesador: "i5", ram: "8 GB", almacenamiento: "256 GB" }
      }),
      perImpresora: fila("Térmica 80 mm.", "si"),
      tesWindows: fila("Licencia activada.", "si"),
      tesAnydesk: fila("ID 123 456 789", "si"),
      biosEncendido: fila("Encendido automático activado.", "si"),
      cliIp: fila("192.168.1.50", "si"),
      cliMask: fila("255.255.255.0", "si"),
      cliGw: fila("192.168.1.1", "si"),
      cliDns1: fila("8.8.8.8", "si"),
      cliDns2: fila("8.8.4.4", "si"),
      cliHostname: fila("KIOSCO-01", "si"),
      cliProxy: fila("Sin proxy.", "si")
    },
    finalizacion: {
      entregadoPor: { nombre: "Técnico de prueba", fecha: "2026-09-30" }
    }
  });
  return [{
    ...limpia,
    id: "local-cartilla-001",
    numero: 1,
    creadoEn: Date.now() - 86400000,
    creadoPor: "demo",
    creadoPorEmail: "preview@dts.local",
    actualizadoEn: Date.now() - 86400000,
    actualizadoPor: "demo"
  }];
}

/**
 * Base de costos con los datos de la planilla de referencia.
 * El primero lleva un desglose de ejemplo.
 * @returns {object[]}
 */
export function semillaCostos() {
  const desglose = [
    { categoria: "metalmecanica", concepto: "Gabinete y estructura",
      cantidad: "1", moneda: "USD", valor: "620,00" },
    { categoria: "dispositivos", concepto: "Mini PC Beelink EQI12",
      cantidad: "1", moneda: "USD", valor: "340,68" },
    { categoria: "dispositivos", concepto: "Impresora Epson TM-m30II",
      cantidad: "1", moneda: "USD", valor: "212,00" }
  ];
  return PLANILLA_COSTOS.map((crudo, indice) => {
    const extra = crudo.modelo === "T22 Dalcahue"
      ? { lineas: desglose, fechaActualizacion: "2026-09-15" }
      : {};
    return conAuditoria(
      normalizarCosto({ ...crudo, ...extra }),
      `local-costo-${indice + 1}`,
      indice + 1
    );
  });
}

/**
 * Catálogo de modelos con los datos de la planilla de referencia.
 * @returns {object[]}
 */
export function semillaModelos() {
  return PLANILLA_MODELOS.map((crudo, indice) => conAuditoria(
    normalizarModelo(crudo),
    `local-modelo-${indice + 1}`,
    indice + 1
  ));
}

/**
 * @param {object} limpio
 * @param {string} id
 * @param {number} numero
 * @returns {object}
 */
function conAuditoria(limpio, id, numero) {
  const momento = Date.now() - (1000 - numero) * 60000;
  return {
    ...limpio,
    id,
    numero,
    creadoEn: momento,
    creadoPor: "demo",
    creadoPorEmail: "preview@dts.local",
    actualizadoEn: momento,
    actualizadoPor: "demo"
  };
}

/**
 * @param {object} base
 * @returns {object}
 */
function armar(base) {
  const items = {};
  SECCIONES.forEach((seccion) => {
    seccion.items.forEach((item) => {
      const grupo = (base.grupos && base.grupos[item.id]) || {};
      items[item.id] = {
        ok: base.ok,
        resultado: base.ok ? "ok" : "",
        extra: base.extras[item.id] || "",
        extras: grupo
      };
    });
  });
  const limpio = normalizarChecklist({
    ...base,
    items,
    firmaTecnico: { nombre: "Técnico de prueba", imagen: "" },
    firmaCalidad: { nombre: "", imagen: "" }
  });
  return {
    ...limpio,
    id: base.id,
    numero: base.numero,
    creadoEn: base.creadoEn,
    creadoPor: "demo",
    creadoPorEmail: "preview@dts.local",
    actualizadoEn: base.creadoEn,
    actualizadoPor: "demo"
  };
}

/**
 * Fecha AAAA-MM-DD a n días de hoy.
 * @param {number} n negativo hacia atrás
 * @returns {string}
 */
function correrDias(n) {
  const fecha = new Date(`${hoyIso()}T12:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + n);
  return fecha.toISOString().slice(0, 10);
}

/**
 * Recepción de equipos de ejemplo: locales Líder en varias regiones,
 * con equipos en distintas etapas y algunas revisiones con novedades.
 * @returns {object[]}
 */
export function semillaRecepcion() {
  // Retiros relativos a hoy, para ver atrasados, hoy y próximos.
  const RETIRO_DEMO = { LID08: -4, LID10: 0, LID11: 2, LID14: 6 };
  const todoOk = (tipo, extra) => {
    const lista = ["gabinete", "cerradura", "base", "pantalla", "cpu",
      "disco", "ram", "fuente", "lector", "parlantes", "cables",
      "router", "ups"];
    if (tipo === "totem") lista.push("touch", "impresora");
    const checklist = {};
    lista.forEach((id) => {
      checklist[id] = { estado: id === "ups" || id === "router" ? "na" : "ok" };
    });
    return { ...checklist, ...(extra || {}) };
  };
  const revisado = (serie, fecha, extra, enciende) => ({
    tipo: "totem", modelo: "T22-M41 Aconcagua", serie, etapa: "revisado",
    fechaRecepcion: fecha, recibidoPor: "Bodega Santiago",
    enciende: enciende || "si", checklist: todoOk("totem", extra)
  });
  const simple = (serie, etapa, fecha) => ({
    tipo: "totem", modelo: "T22-M41 Aconcagua", serie, etapa,
    fechaRecepcion: fecha || "", recibidoPor: fecha ? "Bodega Santiago" : ""
  });
  const datos = [
    ["LID01", "Líder Maipú", "RM", "Maipú", "Av. Pajaritos 3030",
      [revisado("DTS-L001", "2026-10-14"), revisado("DTS-L002", "2026-10-14",
        { impresora: { estado: "falta", nota: "Llegó sin impresora" } })]],
    ["LID02", "Líder La Florida", "RM", "La Florida",
      "Av. Vicuña Mackenna 7110",
      [revisado("DTS-L003", "2026-10-15",
        { pantalla: { estado: "danado", nota: "Trizadura en esquina" } })]],
    ["LID03", "Líder Puente Alto", "RM", "Puente Alto",
      "Av. Concha y Toro 1149",
      [simple("DTS-L004", "recibido", "2026-10-20"),
        simple("DTS-L005", "recibido", "2026-10-20")]],
    ["LID04", "Líder Quilicura", "RM", "Quilicura", "Av. Manuel A. Matta 580",
      [simple("DTS-L006", "transito")]],
    ["LID05", "Líder Viña del Mar", "VA", "Viña del Mar", "Av. 15 Norte 961",
      [revisado("DTS-L007", "2026-10-16",
        { cerradura: { estado: "falta", nota: "Sin llaves" } })]],
    ["LID06", "Líder Valparaíso", "VA", "Valparaíso", "Av. Argentina 150",
      [simple("DTS-L008", "transito"), simple("DTS-L009", "transito")]],
    ["LID07", "Líder Rancagua", "LI", "Rancagua",
      "Av. República de Chile 290",
      [revisado("DTS-L010", "2026-10-17")]],
    ["LID08", "Líder Talca", "ML", "Talca", "Av. San Miguel 2710",
      [simple("DTS-L011", "pendiente")]],
    ["LID09", "Líder Concepción", "BI", "Concepción", "Av. Los Carrera 301",
      [simple("DTS-L012", "recibido", "2026-10-21")]],
    ["LID10", "Líder Temuco", "AR", "Temuco", "Av. Alemania 0671",
      [simple("DTS-L013", "pendiente"), simple("DTS-L014", "pendiente")]],
    ["LID11", "Líder Puerto Montt", "LL", "Puerto Montt",
      "Av. Presidente Ibáñez 600",
      [simple("DTS-L015", "pendiente")]],
    ["LID12", "Líder Antofagasta", "AN", "Antofagasta", "Av. Angamos 745",
      [revisado("DTS-L016", "2026-10-18", {}, "no")]],
    ["LID13", "Líder La Serena", "CO", "La Serena", "Av. Balmaceda 2885",
      [simple("DTS-L017", "transito")]],
    ["LID14", "Líder Punta Arenas", "MA", "Punta Arenas", "Av. Frei 01110",
      [simple("DTS-L018", "pendiente")]]
  ];
  return datos.map(([codigo, nombre, region, comuna, direccion, equipos],
    i) => conAuditoria(normalizarLocal({
    contrato: "Walmart Líder",
    codigo, nombre, region, comuna, direccion,
    contacto: "Jefe de local",
    retiroProgramado: correrDias(RETIRO_DEMO[codigo] ?? -10),
    equipos
  }), `local-recepcion-${i + 1}`, i + 1));
}
