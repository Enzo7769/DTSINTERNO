/**
 * Propósito: Pestañas de la hoja de costeo. Cada categoría muestra
 *   su lista completa de componentes para marcar y valorizar, más
 *   los componentes agregados a mano.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: catalogo-componentes (carga diferida), config, costeo,
 *   costo-hh, costo-lineas, costo-textos, hw-catalogo, logger, ui
 */

import { fijarPaqueteHh, pintarPanelHh } from "./costo-hh.js";
import { APP } from "./config.js";
import { conceptoDe, textoUsdYClp } from "./costeo.js";
import {
  actualizarLink,
  filaCatalogo,
  filaManual,
  incluida,
  marcarIncluida,
  normalizarBusqueda,
  numeroVisible,
  valorDe
} from "./costo-lineas.js";
import { CT } from "./costo-textos.js";
import { CATEGORIAS_COSTO, decimalesDe } from "./hw-catalogo.js";
import { registrarError } from "./logger.js";
import { avisar, porId } from "./ui.js";

const SELECTOR_FILA = "tr.costeo-fila";
const COLUMNAS = [
  "incluir", "concepto", "cantidadEquipo", "monedaLinea", "valor",
  "fabricante", "link", "subtotalCosto", ""
];

/** @type {Promise<Record<string, string[][]>>|null} */
let carga = null;
let activa = CATEGORIAS_COSTO[0].id;

/**
 * La lista de componentes se descarga solo al abrir un costo.
 * @returns {Promise<Record<string, string[][]>>}
 */
function cargarCatalogo() {
  carga = carga || import("./catalogo-componentes.js")
    .then((modulo) => modulo.COMPONENTES)
    .catch((error) => {
      carga = null;
      registrarError(error, "costo.componentes");
      return {};
    });
  return carga;
}

/**
 * @param {() => void} alCambiar recalcula totales
 * @returns {void}
 */
export function iniciarHoja(alCambiar) {
  const pestanas = porId("costo-pestanas");
  pestanas.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-pestana]");
    if (boton) activar(boton.dataset.pestana);
  });
  pestanas.addEventListener("keydown", moverPestana);
  const zona = porId("costo-lineas");
  zona.addEventListener("click", (evento) => {
    const agregar = evento.target.closest("[data-agregar]");
    const quitar = evento.target.closest("[data-quitar-linea]");
    if (agregar) agregarManual(agregar.dataset.agregar);
    else if (quitar) quitarManual(quitar.closest("tr"));
    else return;
    alCambiar();
  });
  zona.addEventListener("input", (evento) => {
    const campo = evento.target;
    if ("filtro" in campo.dataset) {
      filtrar(campo.closest("[role=tabpanel]"));
      return;
    }
    const tr = campo.closest("tr.costeo-fila");
    if (!tr) return;
    if (campo.dataset.k === "valor" && campo.value.trim()) {
      tr.querySelector('[data-k="incluir"]').checked = true;
      marcarIncluida(tr);
    }
    if (campo.dataset.k === "link") actualizarLink(tr);
    alCambiar();
  });
  zona.addEventListener("change", (evento) => {
    const campo = evento.target;
    const panel = campo.closest("[role=tabpanel]");
    if ("solo" in campo.dataset) {
      filtrar(panel);
      return;
    }
    if ("hhPaquete" in campo.dataset) {
      alCambiar();
      return;
    }
    const tr = campo.closest("tr.costeo-fila");
    if (!tr) return;
    if (campo.dataset.k === "incluir") {
      marcarIncluida(tr);
      filtrar(panel);
    }
    alCambiar();
  });
}

/**
 * Arma todas las pestañas. Lo guardado que coincide con el catálogo
 * se marca en su fila; el resto queda como componente manual.
 * @param {object[]} lineas
 * @returns {Promise<void>}
 */
export async function pintarHoja(lineas) {
  const zona = porId("costo-lineas");
  const aviso = document.createElement("p");
  aviso.className = "ayuda";
  aviso.textContent = CT.cargandoLista;
  zona.replaceChildren(aviso);
  const catalogo = await cargarCatalogo();
  const guardadas = new Map();
  const manuales = [];
  (lineas || []).forEach((linea) => {
    const clave = `${linea.categoria}|${linea.concepto}`;
    if (guardadas.has(clave)) manuales.push(linea);
    else guardadas.set(clave, linea);
  });
  const usadas = new Set();
  const paneles = CATEGORIAS_COSTO.map((categoria) => {
    const filas = (catalogo[categoria.id] || []).map((item) => {
      const clave = `${categoria.id}|${conceptoDe(categoria.id, item)}`;
      const linea = guardadas.get(clave) || null;
      if (linea) usadas.add(clave);
      return { item, linea };
    });
    return { categoria, filas };
  });
  guardadas.forEach((linea, clave) => {
    if (!usadas.has(clave)) manuales.push(linea);
  });
  porId("costo-pestanas").replaceChildren(
    ...paneles.map(({ categoria }) => pestana(categoria))
  );
  const hh = (lineas || []).filter((linea) =>
    linea && linea.categoria === "manoObra");
  zona.replaceChildren(...paneles.map(({ categoria, filas }) =>
    categoria.id === "manoObra"
      ? pintarPanelHh(hh)
      : panel(
        categoria,
        filas,
        manuales.filter((linea) => linea.categoria === categoria.id)
      )));
  if ((lineas || []).length) mostrarSoloIncluidas();
  const conDatos = paneles.find(({ filas, categoria }) =>
    filas.some((fila) => fila.linea)
    || manuales.some((linea) => linea.categoria === categoria.id));
  activar(conDatos ? conDatos.categoria.id : CATEGORIAS_COSTO[0].id);
}

/**
 * Al abrir un costo con piezas, cada pestaña con algo incluido parte
 * mostrando solo eso; la lista completa vuelve al desmarcar el filtro.
 * @returns {void}
 */
function mostrarSoloIncluidas() {
  porId("costo-lineas").querySelectorAll("[role=tabpanel]")
    .forEach((caja) => {
      const solo = caja.querySelector("[data-solo]");
      const algo = [...caja.querySelectorAll(SELECTOR_FILA)].some(incluida);
      if (!solo || !algo) return;
      solo.checked = true;
      filtrar(caja);
    });
}

/**
 * @param {{id: string, corto: string, etiqueta: string}} categoria
 * @returns {HTMLButtonElement}
 */
function pestana(categoria) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "costeo-pestana";
  boton.id = `pestana-${categoria.id}`;
  boton.dataset.pestana = categoria.id;
  boton.title = categoria.etiqueta;
  boton.setAttribute("role", "tab");
  boton.setAttribute("aria-controls", `panel-${categoria.id}`);
  const nombre = document.createElement("span");
  nombre.textContent = categoria.corto;
  const cuenta = document.createElement("span");
  cuenta.className = "costeo-cuenta";
  cuenta.hidden = true;
  boton.append(nombre, cuenta);
  return boton;
}

/**
 * @param {{id: string, etiqueta: string}} categoria
 * @param {{item: string[], linea: object|null}[]} filas
 * @param {object[]} manuales
 * @returns {HTMLElement}
 */
function panel(categoria, filas, manuales) {
  const caja = document.createElement("section");
  caja.id = `panel-${categoria.id}`;
  caja.className = "costeo-panel";
  caja.dataset.categoria = categoria.id;
  caja.setAttribute("role", "tabpanel");
  caja.setAttribute("aria-labelledby", `pestana-${categoria.id}`);
  caja.hidden = true;
  const tabla = document.createElement("table");
  tabla.className = "tabla-lineas costeo-tabla";
  tabla.append(cabeza(), cuerpoManual(categoria.id, manuales),
    cuerpoCatalogo(categoria.id, filas));
  const envoltura = document.createElement("div");
  envoltura.className = "tabla-wrap";
  envoltura.append(tabla);
  const vacio = document.createElement("p");
  vacio.className = "ayuda costeo-vacio";
  vacio.hidden = true;
  const pie = document.createElement("p");
  pie.className = "costeo-pie";
  pie.dataset.pie = categoria.id;
  caja.append(barra(categoria.id), envoltura, vacio, pie);
  filtrar(caja);
  return caja;
}

/**
 * @param {string} categoria
 * @returns {HTMLElement}
 */
function barra(categoria) {
  const caja = document.createElement("div");
  caja.className = "costeo-barra";
  const buscar = document.createElement("input");
  buscar.type = "search";
  buscar.className = "costeo-buscar";
  buscar.placeholder = CT.buscarPestana;
  buscar.setAttribute("aria-label", CT.buscarPestana);
  buscar.maxLength = 80;
  buscar.dataset.filtro = "1";
  buscar.dataset.sinCambios = "";
  const solo = document.createElement("label");
  solo.className = "costeo-solo";
  const casilla = document.createElement("input");
  casilla.type = "checkbox";
  casilla.dataset.solo = "1";
  casilla.dataset.sinCambios = "";
  solo.append(casilla, document.createTextNode(` ${CT.soloSeleccionados}`));
  const agregar = document.createElement("button");
  agregar.type = "button";
  agregar.className = "boton boton-secundario";
  agregar.dataset.agregar = categoria;
  agregar.textContent = CT.agregarManual;
  caja.append(buscar, solo, agregar);
  return caja;
}

/**
 * @returns {HTMLTableSectionElement}
 */
function cabeza() {
  const thead = document.createElement("thead");
  const tr = document.createElement("tr");
  COLUMNAS.forEach((clave) => {
    const th = document.createElement("th");
    th.textContent = clave ? CT[clave] : "";
    tr.append(th);
  });
  thead.append(tr);
  return thead;
}

/**
 * Filas del catálogo con una banda por tipo (por conjunto en
 * Ferretería, donde el tipo es siempre el mismo).
 * @param {string} categoria
 * @param {{item: string[], linea: object|null}[]} filas
 * @returns {HTMLTableSectionElement}
 */
function cuerpoCatalogo(categoria, filas) {
  const tbody = document.createElement("tbody");
  let grupo = null;
  filas.forEach(({ item, linea }) => {
    const titulo = categoria === "ferreteria" ? item[1] : item[0];
    if (titulo !== grupo) {
      grupo = titulo;
      tbody.append(banda(titulo));
    }
    tbody.append(filaCatalogo(categoria, item, linea));
  });
  return tbody;
}

/**
 * @param {string} categoria
 * @param {object[]} manuales
 * @returns {HTMLTableSectionElement}
 */
function cuerpoManual(categoria, manuales) {
  const tbody = document.createElement("tbody");
  tbody.dataset.manual = categoria;
  tbody.append(banda(CT.manual));
  manuales.forEach((linea) => tbody.append(filaManual(categoria, linea)));
  return tbody;
}

/**
 * @param {string} texto
 * @returns {HTMLTableRowElement}
 */
function banda(texto) {
  const tr = document.createElement("tr");
  tr.className = "costeo-grupo";
  const td = document.createElement("td");
  td.colSpan = COLUMNAS.length;
  td.textContent = texto;
  tr.append(td);
  return tr;
}

/**
 * @param {string} categoria
 * @returns {void}
 */
function agregarManual(categoria) {
  const tbody = porId("costo-lineas")
    .querySelector(`tbody[data-manual="${categoria}"]`);
  if (!tbody) return;
  const tr = filaManual(categoria, {});
  tbody.append(tr);
  const panelActual = tbody.closest("[role=tabpanel]");
  panelActual.querySelector("[data-filtro]").value = "";
  filtrar(panelActual);
  tr.querySelector('[data-k="concepto"]').focus();
}

/**
 * @param {HTMLTableRowElement} tr
 * @returns {void}
 */
function quitarManual(tr) {
  const panelActual = tr.closest("[role=tabpanel]");
  tr.remove();
  filtrar(panelActual);
}

/**
 * Aplica la búsqueda y «Solo seleccionados»; oculta bandas vacías.
 * @param {HTMLElement|null} caja panel de la pestaña
 * @returns {void}
 */
function filtrar(caja) {
  if (!caja) return;
  const buscar = caja.querySelector("[data-filtro]");
  const palabras = normalizarBusqueda(buscar ? buscar.value : "")
    .split(/\s+/).filter(Boolean);
  const solo = caja.querySelector("[data-solo]");
  const soloIncluidas = Boolean(solo && solo.checked);
  let visibles = 0;
  caja.querySelectorAll("tbody").forEach((tbody) => {
    let bandaActual = null;
    let enBanda = 0;
    const cerrarBanda = () => {
      if (bandaActual) bandaActual.hidden = enBanda === 0;
    };
    [...tbody.rows].forEach((tr) => {
      if (tr.classList.contains("costeo-grupo")) {
        cerrarBanda();
        bandaActual = tr;
        enBanda = 0;
        return;
      }
      const texto = tr.dataset.origen === "manual"
        ? normalizarBusqueda(valorDe(tr, "concepto"))
        : tr.dataset.busqueda;
      const pasa = (!soloIncluidas || incluida(tr))
        && palabras.every((palabra) => texto.includes(palabra));
      tr.hidden = !pasa;
      if (pasa) enBanda += 1;
    });
    cerrarBanda();
    visibles += [...tbody.rows]
      .filter((tr) => !tr.hidden && !tr.classList.contains("costeo-grupo"))
      .length;
  });
  const vacio = caja.querySelector(".costeo-vacio");
  const total = caja.querySelectorAll("tr.costeo-fila").length;
  vacio.hidden = visibles > 0;
  vacio.textContent = total ? CT.sinFiltro : CT.pestanaVacia;
  caja.querySelector(".tabla-wrap").hidden = visibles === 0;
}

/**
 * @param {string} id
 * @returns {void}
 */
function activar(id) {
  activa = id;
  porId("costo-pestanas").querySelectorAll("[data-pestana]")
    .forEach((boton) => {
      const esta = boton.dataset.pestana === id;
      boton.setAttribute("aria-selected", String(esta));
      boton.tabIndex = esta ? 0 : -1;
      boton.classList.toggle("activa", esta);
    });
  porId("costo-lineas").querySelectorAll("[role=tabpanel]")
    .forEach((caja) => {
      caja.hidden = caja.dataset.categoria !== id;
    });
}

/**
 * Flechas izquierda y derecha para cambiar de pestaña.
 * @param {KeyboardEvent} evento
 * @returns {void}
 */
function moverPestana(evento) {
  const paso = { ArrowRight: 1, ArrowLeft: -1 }[evento.key];
  if (!paso) return;
  evento.preventDefault();
  const ids = CATEGORIAS_COSTO.map((categoria) => categoria.id);
  const siguiente = ids[(ids.indexOf(activa) + paso + ids.length)
    % ids.length];
  activar(siguiente);
  porId(`pestana-${siguiente}`).focus();
}

/**
 * Quita las piezas agregadas por el cliente anterior y marca las
 * del cliente elegido, con la cantidad de su receta (1 en la
 * planilla).
 * @param {{incluyeHh: boolean, componentes: object[]}|null} cliente
 *   null para solo limpiar
 * @returns {number} piezas incluidas
 */
export function aplicarCotizacionCliente(cliente) {
  quitarAutomaticos();
  fijarPaqueteHh(Boolean(cliente && cliente.incluyeHh));
  if (!cliente) return 0;
  let incluidas = 0;
  let cupo = true;
  cliente.componentes.forEach((pieza) => {
    if (!cupo) return;
    if (!cabeOtraFila() && !filaIgual(pieza)) {
      cupo = false;
      avisar(CT.maxLineas, "aviso");
      return;
    }
    const existente = filaIgual(pieza);
    const tr = existente || crearAutomatica(pieza);
    if (!tr) return;
    completarPieza(tr, pieza, Boolean(existente));
    incluidas += 1;
  });
  limpiarFiltros();
  const primera = cliente.componentes[0];
  if (primera) {
    document.getElementById(`pestana-${primera.categoria}`)?.click();
  }
  return incluidas;
}

/**
 * @returns {void}
 */
function quitarAutomaticos() {
  porId("costo-lineas").querySelectorAll("[data-auto-cliente]")
    .forEach((tr) => {
      if (tr.dataset.autoModo === "nuevo") {
        tr.remove();
        return;
      }
      const casilla = tr.querySelector('[data-k="incluir"]');
      if (casilla) casilla.checked = false;
      marcarIncluida(tr);
      delete tr.dataset.autoCliente;
      delete tr.dataset.autoModo;
    });
}

/**
 * @param {{categoria: string, concepto: string}} pieza
 * @returns {HTMLTableRowElement|undefined}
 */
function filaIgual(pieza) {
  const busca = normalizarBusqueda(pieza.concepto);
  const filas = porId("costo-lineas").querySelectorAll(
    `tr.costeo-fila[data-categoria="${pieza.categoria}"]`
  );
  return [...filas].find((tr) => normalizarBusqueda(textoFila(tr)) === busca);
}

/**
 * @param {HTMLTableRowElement} tr
 * @returns {string}
 */
function textoFila(tr) {
  return tr.dataset.origen === "manual"
    ? valorDe(tr, "concepto")
    : (tr.dataset.concepto || "");
}

/**
 * @param {{categoria: string, concepto: string, moneda: string,
 *   valor: number}} pieza
 * @returns {HTMLTableRowElement|null}
 */
function crearAutomatica(pieza) {
  const tbody = porId("costo-lineas").querySelector(
    `tbody[data-manual="${pieza.categoria}"]`
  );
  if (!tbody) return null;
  const tr = filaManual(pieza.categoria, {
    concepto: pieza.concepto,
    cantidad: pieza.cantidad || 1,
    moneda: pieza.moneda,
    valor: pieza.valor || ""
  });
  tr.dataset.autoModo = "nuevo";
  tbody.append(tr);
  return tr;
}

/**
 * @param {HTMLTableRowElement} tr
 * @param {{moneda: string, valor: number, cantidad?: number}} pieza
 * @param {boolean} yaExistia
 * @returns {void}
 */
function completarPieza(tr, pieza, yaExistia) {
  const estaba = incluida(tr);
  const casilla = tr.querySelector('[data-k="incluir"]');
  casilla.checked = true;
  marcarIncluida(tr);
  const cantidad = tr.querySelector('[data-k="cantidad"]');
  if (!estaba || !cantidad.value.trim()) {
    cantidad.value = numeroVisible(pieza.cantidad || 1, 3);
  }
  const valor = tr.querySelector('[data-k="valor"]');
  if (!valor.value.trim() && pieza.valor > 0) {
    tr.querySelector('[data-k="moneda"]').value = pieza.moneda;
    valor.value = numeroVisible(
      pieza.valor,
      decimalesDe(pieza.moneda),
      true
    );
  }
  if (yaExistia && estaba) return;
  tr.dataset.autoCliente = "1";
  if (!yaExistia) tr.dataset.autoModo = "nuevo";
  else if (!tr.dataset.autoModo) tr.dataset.autoModo = "marcado";
}

/**
 * @returns {boolean}
 */
function cabeOtraFila() {
  const filas = porId("costo-lineas").querySelectorAll("tr.costeo-fila");
  const n = [...filas].filter(incluida).length;
  return n < APP.maxLineasCosto;
}

/**
 * @returns {void}
 */
function limpiarFiltros() {
  porId("costo-lineas").querySelectorAll("[role=tabpanel]")
    .forEach((panel) => {
      const buscar = panel.querySelector("[data-filtro]");
      const solo = panel.querySelector("[data-solo]");
      if (buscar) buscar.value = "";
      if (solo) solo.checked = false;
      filtrar(panel);
    });
}

/**
 * Cantidad incluida en cada pestaña y subtotal al pie.
 * @param {Map<string, {n: number, total: number}>} totales
 * @param {string} moneda
 * @param {{usd: number, uf: number}} cambio
 * @returns {void}
 */
export function pintarPestanas(totales, moneda, cambio) {
  CATEGORIAS_COSTO.forEach((categoria) => {
    const dato = totales.get(categoria.id) || { n: 0, total: 0 };
    const boton = document.getElementById(`pestana-${categoria.id}`);
    if (boton) {
      const cuenta = boton.querySelector(".costeo-cuenta");
      cuenta.hidden = dato.n === 0;
      cuenta.textContent = String(dato.n);
    }
    const pie = porId("costo-lineas")
      .querySelector(`[data-pie="${categoria.id}"]`);
    if (pie) {
      pie.textContent = dato.total > 0
        ? `${CT.subtotalPestana}: ${textoUsdYClp(
          dato.total, moneda, cambio)}`
        : "";
    }
  });
}
