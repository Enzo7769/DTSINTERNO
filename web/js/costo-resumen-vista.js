/**
 * Propósito: Pantalla «Resumen de costos» para gerencia: indicadores,
 *   costo por modelo, composición, promedio por línea, alertas y
 *   detalle, con filtros de línea y tipo.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-23
 * Dependencias: config, costo-repositorio, costo-resumen, errores,
 *   exportar-csv, fechas, hw-catalogo, logger, modelo-repositorio,
 *   tipo-cambio-dia, tipos-equipo, ui
 *
 * Los gráficos son HTML (barras con ancho proporcional): nítidos,
 * accesibles y con el valor escrito junto a cada barra.
 */

import { APP } from "./config.js";
import { listarCostos } from "./costo-repositorio.js";
import {
  alertas,
  composicion,
  filasResumen,
  indicadores,
  porLinea
} from "./costo-resumen.js";
import { mensajeError } from "./errores.js";
import { descargarCsv } from "./exportar-csv.js";
import { formatearFecha, hoyIso } from "./fechas.js";
import {
  LINEAS_PRODUCTO,
  etiquetaDe,
  formatoMonto
} from "./hw-catalogo.js";
import { registrarError } from "./logger.js";
import { listarModelos } from "./modelo-repositorio.js";
import { cambioDelDia } from "./tipo-cambio-dia.js";
import { etiquetaTipo, llenarFiltroTipo } from "./tipos-equipo.js";
import { avisar, mostrarVista, porId, textoConteo } from "./ui.js";

/** Paleta categórica validada (orden fijo), para la composición. */
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];
const GRIS_OTROS = "#9a9a96";

const TXT = {
  titulo: "Resumen de costos | DTS",
  cargando: "Calculando resumen…",
  vacio: "Todavía no hay costos. Agrégalos en la Base de costos HW.",
  sinFiltro: "No hay costos con esos filtros.",
  kpiModelos: "Modelos costeados",
  kpiPromedio: "Costo promedio por equipo",
  kpiMax: "Más alto",
  kpiMin: "Más bajo",
  sinComposicion:
    "Ningún costo vigente tiene hoja de costeo con componentes.",
  sinAlertas: "Todo en orden: no hay costos que revisar.",
  abrir: "Abrir",
  sinFecha: "Sin fecha",
  sinVariacion: "—",
  grupos: {
    vencido: "Costos para actualizar",
    sinCosto: "Modelos sin costo",
    sinCatalogo: "Costos fuera del catálogo"
  },
  verMas: "Ver todos",
  verMenos: "Ver menos",
  csv: "Resumen_costos_gerencia.csv"
};

/** Alertas que se muestran por grupo antes de «Ver todos». */
const ALERTAS_VISIBLES = 4;

let datos = null;
let listo = false;

/**
 * @returns {void}
 */
export function invalidarResumenCostos() {
  datos = null;
}

/**
 * @returns {Promise<void>}
 */
export async function mostrarResumenCostos() {
  iniciar();
  document.title = TXT.titulo;
  mostrarVista("vista-costos-resumen");
  const estado = porId("cr-estado");
  estado.textContent = TXT.cargando;
  estado.hidden = false;
  try {
    // Siempre fresco: otros módulos crean, renombran o borran costos.
    datos = await cargar();
    pintar();
  } catch (error) {
    registrarError(error, "costos.resumen");
    estado.textContent = mensajeError(error);
    avisar(mensajeError(error), "error");
  }
}

/**
 * @returns {Promise<object>}
 */
async function cargar() {
  const [costos, modelos, dia] = await Promise.all([
    listarCostos(),
    listarModelos().catch(() => []),
    cambioDelDia().catch(() => null)
  ]);
  const referencia = {
    usd: (dia && dia.usd) || APP.tipoCambioUsd,
    uf: (dia && dia.uf) || APP.valorUf
  };
  return { costos, modelos, referencia };
}

/**
 * @returns {void}
 */
function iniciar() {
  if (listo) return;
  listo = true;
  llenarFiltroTipo(porId("cr-linea"), LINEAS_PRODUCTO);
  llenarFiltroTipo(porId("cr-tipo"));
  porId("form-filtros-cr").addEventListener("submit", (e) => {
    e.preventDefault();
  });
  ["cr-linea", "cr-tipo"].forEach((id) => {
    porId(id).addEventListener("change", pintar);
  });
  porId("btn-cr-limpiar").addEventListener("click", () => {
    porId("cr-linea").value = "";
    porId("cr-tipo").value = "";
    pintar();
  });
  porId("btn-cr-csv").addEventListener("click", exportar);
  const vista = porId("vista-costos-resumen");
  vista.addEventListener("pointermove", moverTooltip);
  vista.addEventListener("pointerleave", ocultarTooltip);
  vista.addEventListener("focusin", (e) => mostrarTooltipDe(e.target));
  vista.addEventListener("focusout", ocultarTooltip);
  vista.addEventListener("click", (e) => {
    const boton = e.target.closest("[data-alternar]");
    if (!boton) return;
    const grupo = boton.closest(".cr-alerta-grupo");
    grupo.classList.toggle("abierto");
    boton.textContent = grupo.classList.contains("abierto")
      ? TXT.verMenos
      : TXT.verMas;
  });
}

/**
 * Costos que pasan los filtros.
 * @returns {object[]}
 */
function costosFiltrados() {
  const linea = porId("cr-linea").value;
  const tipo = porId("cr-tipo").value;
  return datos.costos
    .filter((c) => !linea || c.linea === linea)
    .filter((c) => !tipo || c.tipoEquipo === tipo);
}

/**
 * @returns {void}
 */
function pintar() {
  if (!datos) return;
  ocultarTooltip();
  const costos = costosFiltrados();
  const estado = porId("cr-estado");
  const contenido = porId("cr-contenido");
  const hay = costos.length > 0;
  estado.hidden = hay;
  estado.textContent = datos.costos.length ? TXT.sinFiltro : TXT.vacio;
  contenido.hidden = !hay;
  if (!hay) return;
  const { referencia, modelos } = datos;
  const filas = filasResumen(costos, referencia, hoyIso());
  pintarKpis(indicadores(filas, costos.length));
  pintarBarras(porId("cr-barras"), filas.map((fila) => ({
    etiqueta: fila.modelo,
    detalle: etiquetaDe(LINEAS_PRODUCTO, fila.linea),
    usd: fila.usd,
    tooltip: tooltipFila(fila)
  })));
  pintarComposicion(composicion(costos, referencia));
  pintarBarras(porId("cr-lineas"), porLinea(filas).map((dato) => ({
    etiqueta: etiquetaDe(LINEAS_PRODUCTO, dato.linea) || "—",
    detalle: textoConteo(dato.modelos, "modelo"),
    usd: dato.usd,
    tooltip: [
      etiquetaDe(LINEAS_PRODUCTO, dato.linea),
      `Promedio: ${formatoMonto(dato.usd, "USD")}`,
      textoConteo(dato.modelos, "modelo")
    ]
  })));
  pintarAlertas(alertas(filas, costos, modelos));
  pintarTabla(filas);
}

/**
 * @param {object} k
 * @returns {void}
 */
function pintarKpis(k) {
  const caja = porId("cr-kpis");
  caja.replaceChildren(
    tile(TXT.kpiModelos, String(k.modelos),
      textoConteo(k.costos, "cotización", "cotizaciones")),
    tile(TXT.kpiPromedio, formatoMonto(k.promedio, "USD"),
      `Promedio de ${textoConteo(k.modelos, "modelo")}`),
    tile(TXT.kpiMax, k.maximo ? formatoMonto(k.maximo.usd, "USD") : "—",
      k.maximo ? k.maximo.modelo : ""),
    tile(TXT.kpiMin, k.minimo ? formatoMonto(k.minimo.usd, "USD") : "—",
      k.minimo ? k.minimo.modelo : "")
  );
}

/**
 * @param {string} titulo
 * @param {string} valor
 * @param {string} detalle
 * @returns {HTMLElement}
 */
function tile(titulo, valor, detalle) {
  const caja = document.createElement("div");
  caja.className = "kpi";
  const t = document.createElement("span");
  t.textContent = titulo;
  const v = document.createElement("strong");
  v.textContent = valor;
  caja.append(t, v);
  if (detalle) {
    const d = document.createElement("small");
    d.textContent = detalle;
    caja.append(d);
  }
  return caja;
}

/**
 * Barras horizontales de una serie, con el valor escrito al lado.
 * @param {HTMLElement} raiz
 * @param {{etiqueta: string, detalle: string, usd: number,
 *   tooltip: string[]}[]} items
 * @returns {void}
 */
function pintarBarras(raiz, items) {
  const max = Math.max(...items.map((item) => item.usd), 0);
  raiz.replaceChildren(...items.map((item) => {
    const fila = document.createElement("div");
    fila.className = "cr-fila";
    fila.tabIndex = 0;
    fila.dataset.tooltip = JSON.stringify(item.tooltip);
    fila.setAttribute("aria-label", item.tooltip.join(". "));
    const nombre = document.createElement("div");
    nombre.className = "cr-nombre";
    const fuerte = document.createElement("strong");
    fuerte.textContent = item.etiqueta;
    const sub = document.createElement("small");
    sub.textContent = item.detalle;
    nombre.append(fuerte, sub);
    const pista = document.createElement("div");
    pista.className = "cr-pista";
    const barra = document.createElement("span");
    barra.className = "cr-barra";
    barra.style.width = max > 0 ? `${(item.usd / max) * 100}%` : "0";
    const valor = document.createElement("span");
    valor.className = "cr-valor";
    valor.textContent = item.usd > 0 ? formatoMonto(item.usd, "USD") : "—";
    pista.append(barra, valor);
    fila.append(nombre, pista);
    return fila;
  }));
}

/**
 * Barra 100 % apilada con leyenda que repite valor y porcentaje.
 * @param {{total: number, modelos: number, partes: object[]}} comp
 * @returns {void}
 */
function pintarComposicion(comp) {
  const raiz = porId("cr-composicion");
  const ayuda = porId("cr-comp-ayuda");
  if (!comp.partes.length) {
    ayuda.textContent = TXT.sinComposicion;
    raiz.replaceChildren();
    return;
  }
  ayuda.textContent = `Suma de las hojas de costeo de ${textoConteo(
    comp.modelos, "modelo")} con desglose: ${formatoMonto(
    comp.total, "USD")}.`;
  const barra = document.createElement("div");
  barra.className = "cr-apilada";
  barra.setAttribute("role", "img");
  barra.setAttribute("aria-label", comp.partes
    .map((p) => `${p.etiqueta} ${p.pct} %`).join(", "));
  const leyenda = document.createElement("ul");
  leyenda.className = "cr-leyenda";
  comp.partes.forEach((parte, i) => {
    const color = parte.id === "resto" ? GRIS_OTROS : SERIES[i];
    const tramo = document.createElement("span");
    tramo.style.flexGrow = String(parte.usd);
    tramo.style.background = color;
    tramo.tabIndex = 0;
    tramo.dataset.tooltip = JSON.stringify([
      parte.etiqueta,
      formatoMonto(parte.usd, "USD"),
      `${parte.pct.toLocaleString("es-CL")} % del total`
    ]);
    barra.append(tramo);
    const li = document.createElement("li");
    const marca = document.createElement("i");
    marca.style.background = color;
    const nombre = document.createElement("span");
    nombre.textContent = parte.etiqueta;
    const pct = document.createElement("strong");
    pct.textContent = `${parte.pct.toLocaleString("es-CL")} %`;
    const monto = document.createElement("small");
    monto.textContent = formatoMonto(parte.usd, "USD");
    li.append(marca, nombre, monto, pct);
    leyenda.append(li);
  });
  raiz.replaceChildren(barra, leyenda);
}

/**
 * @param {object[]} lista
 * @returns {void}
 */
function pintarAlertas(lista) {
  const raiz = porId("cr-alertas");
  const cuenta = porId("cr-alertas-cuenta");
  cuenta.textContent = lista.length ? String(lista.length) : "OK";
  cuenta.className = lista.length
    ? "pill pill-pendiente"
    : "pill pill-aprobado";
  if (!lista.length) {
    const p = document.createElement("p");
    p.className = "ayuda";
    p.textContent = TXT.sinAlertas;
    raiz.replaceChildren(p);
    return;
  }
  const grupos = Object.keys(TXT.grupos)
    .map((tipo) => [tipo, lista.filter((a) => a.tipo === tipo)])
    .filter(([, items]) => items.length);
  raiz.replaceChildren(...grupos.map(([tipo, items]) => {
    const caja = document.createElement("div");
    caja.className = `cr-alerta-grupo cr-alerta-${tipo}`;
    const h = document.createElement("h3");
    h.textContent = `${TXT.grupos[tipo]} (${items.length})`;
    const ul = document.createElement("ul");
    items.forEach((item, i) => {
      const li = document.createElement("li");
      if (i >= ALERTAS_VISIBLES) li.className = "cr-extra";
      const a = document.createElement("a");
      a.href = item.id
        ? `#/costo?id=${encodeURIComponent(item.id)}`
        : `#/costo?modelo=${encodeURIComponent(item.modeloId)}`;
      a.textContent = item.texto;
      li.append(a);
      ul.append(li);
    });
    caja.append(h, ul);
    if (items.length > ALERTAS_VISIBLES) {
      const mas = document.createElement("button");
      mas.type = "button";
      mas.className = "boton boton-secundario cr-mas";
      mas.dataset.alternar = "1";
      mas.textContent = TXT.verMas;
      caja.append(mas);
    }
    return caja;
  }));
}

/**
 * @param {object[]} filas
 * @returns {void}
 */
function pintarTabla(filas) {
  porId("cr-cuerpo").replaceChildren(...filas.map((fila) => {
    const tr = document.createElement("tr");
    const celdas = [
      [fila.modelo, "fuerte texto"],
      [etiquetaDe(LINEAS_PRODUCTO, fila.linea), ""],
      [etiquetaTipo(fila.tipo), ""],
      [fila.usd > 0 ? formatoMonto(fila.usd, "USD") : "—", "derecha"],
      [formatoMonto(fila.costo, fila.moneda), "derecha nowrap"]
    ];
    celdas.forEach(([texto, clase]) => {
      const td = document.createElement("td");
      td.textContent = texto || "—";
      if (clase) td.className = clase;
      tr.append(td);
    });
    tr.append(celdaVariacion(fila.variacion));
    const fecha = document.createElement("td");
    fecha.className = "nowrap";
    fecha.textContent = fila.fecha ? formatearFecha(fila.fecha) : TXT.sinFecha;
    if (fila.dias > 180) fecha.classList.add("cr-vencido");
    const n = document.createElement("td");
    n.className = "derecha";
    n.textContent = String(fila.cotizaciones);
    const accion = document.createElement("td");
    const a = document.createElement("a");
    a.className = "boton boton-secundario";
    a.href = `#/costo?id=${encodeURIComponent(fila.id)}`;
    a.textContent = TXT.abrir;
    accion.append(a);
    tr.append(fecha, n, accion);
    return tr;
  }));
}

/**
 * Sube = más caro (alerta); baja = más barato. Ícono + texto, no
 * solo color.
 * @param {{pct: number, desde: string}|null} v
 * @returns {HTMLTableCellElement}
 */
function celdaVariacion(v) {
  const td = document.createElement("td");
  td.className = "nowrap";
  if (!v || v.pct === 0) {
    td.textContent = v ? "= 0 %" : TXT.sinVariacion;
    return td;
  }
  const span = document.createElement("span");
  const sube = v.pct > 0;
  span.className = sube ? "cr-sube" : "cr-baja";
  const pct = v.pct.toLocaleString("es-CL");
  span.textContent = `${sube ? "▲ +" : "▼ "}${pct} %`;
  span.title = v.desde ? `Respecto del ${formatearFecha(v.desde)}` : "";
  td.append(span);
  return td;
}

/**
 * @param {object} fila
 * @returns {string[]}
 */
function tooltipFila(fila) {
  const lineas = [
    fila.modelo,
    `${etiquetaDe(LINEAS_PRODUCTO, fila.linea)} · ${etiquetaTipo(fila.tipo)}`,
    `Costo por equipo: ${formatoMonto(fila.usd, "USD")}`
  ];
  if (fila.moneda !== "USD") {
    lineas.push(`Original: ${formatoMonto(fila.costo, fila.moneda)}`);
  }
  lineas.push(fila.fecha
    ? `Actualizado: ${formatearFecha(fila.fecha)}`
    : TXT.sinFecha);
  return lineas;
}

/**
 * @param {PointerEvent} e
 * @returns {void}
 */
function moverTooltip(e) {
  const nodo = e.target.closest && e.target.closest("[data-tooltip]");
  if (!nodo) {
    ocultarTooltip();
    return;
  }
  mostrarTooltipDe(nodo, e.clientX, e.clientY);
}

/**
 * @param {EventTarget} objetivo
 * @param {number} [x]
 * @param {number} [y]
 * @returns {void}
 */
function mostrarTooltipDe(objetivo, x, y) {
  const nodo = objetivo instanceof Element
    && objetivo.closest("[data-tooltip]");
  if (!nodo) return;
  const tip = porId("cr-tooltip");
  const lineas = JSON.parse(nodo.dataset.tooltip || "[]");
  tip.replaceChildren(...lineas.map((texto, i) => {
    const el = document.createElement(i === 0 ? "strong" : "span");
    el.textContent = texto;
    return el;
  }));
  tip.hidden = false;
  const caja = nodo.getBoundingClientRect();
  const px = x ?? caja.left + caja.width / 2;
  const py = y ?? caja.top;
  const ancho = tip.offsetWidth;
  const left = Math.min(Math.max(8, px + 14), window.innerWidth - ancho - 8);
  tip.style.left = `${left}px`;
  tip.style.top = `${Math.max(8, py - tip.offsetHeight - 12)}px`;
}

/**
 * @returns {void}
 */
function ocultarTooltip() {
  const tip = document.getElementById("cr-tooltip");
  if (tip) tip.hidden = true;
}

/**
 * @returns {void}
 */
function exportar() {
  if (!datos) return;
  const filas = filasResumen(costosFiltrados(), datos.referencia, hoyIso());
  if (!filas.length) {
    avisar(TXT.sinFiltro, "aviso");
    return;
  }
  descargarCsv(
    ["Modelo", "Línea", "Tipo", "Costo por equipo (US$)", "Moneda",
      "Costo original", "Variación %", "Actualizado", "Cotizaciones"],
    filas.map((fila) => [
      fila.modelo,
      etiquetaDe(LINEAS_PRODUCTO, fila.linea),
      etiquetaTipo(fila.tipo),
      fila.usd.toLocaleString("es-CL", { minimumFractionDigits: 2,
        useGrouping: false }),
      fila.moneda,
      String(fila.costo).replace(".", ","),
      fila.variacion ? String(fila.variacion.pct).replace(".", ",") : "",
      fila.fecha ? formatearFecha(fila.fecha) : "",
      fila.cotizaciones
    ]),
    TXT.csv
  );
}
