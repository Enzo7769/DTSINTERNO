/**
 * Propósito: Formulario de alta y edición de la cartilla de ruta.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: cartilla-acordeon, cartilla-catalogo,
 *   cartilla-pdf, cartilla-repositorio, cartilla-textos,
 *   cartilla-validacion, config, errores, fechas, firma, logger, ui
 */

import {
  aplicarFilas,
  fijarPorDefecto,
  leerFilas,
  pintarAcordeon
} from "./cartilla-acordeon.js";
import { FINALIZACION } from "./cartilla-catalogo.js";
import { descargarCartillaPdf } from "./cartilla-pdf.js";
import {
  guardarCartilla,
  obtenerCartilla
} from "./cartilla-repositorio.js";
import {
  TXT,
  textoActualizada,
  textoCreada
} from "./cartilla-textos.js";
import {
  LIMITES_CARTILLA,
  normalizarCartilla,
  validarCartilla
} from "./cartilla-validacion.js";
import { APP } from "./config.js";
import { MSG } from "./constantes.js";
import { hoyIso } from "./fechas.js";
import { mensajeError } from "./errores.js";
import { crearFirma } from "./firma.js";
import { registrarError } from "./logger.js";
import {
  avisar,
  mostrarExito,
  mostrarVista,
  porId
} from "./ui.js";
import {
  GRUPO_CARTILLA,
  leerTipo,
  marcarTipo,
  pintarTipo
} from "./tipos-equipo.js";

const CAMPOS = {
  creadaPorNombre: "c-creada",
  aprobadaPorNombre: "c-aprobada",
  cliente: "c-cliente",
  modelo: "c-modelo",
  numeroSerie: "c-serie",
  numeroParte: "c-parte"
};

const firmas = new Map();
let autor = { uid: "", email: "", nombre: "" };
let actual = null;
let guardando = false;

/**
 * Dibuja el formulario y conecta sus botones.
 * @param {() => void} alGuardar
 * @returns {void}
 */
export function iniciarCartilla(alGuardar) {
  pintarTipo(porId("tipo-cartilla"), GRUPO_CARTILLA, "c-tipo");
  pintarAcordeon(porId("cartilla-secciones"));
  pintarFinalizacion(porId("cartilla-final"));
  porId("vista-cartilla").addEventListener("input", (evento) => {
    const campoMalo = evento.target.closest(".invalido");
    if (campoMalo) campoMalo.classList.remove("invalido");
  });
  porId("btn-cartilla-volver").addEventListener("click", () => {
    location.hash = "#/cartillas";
  });
  porId("btn-cartilla-guardar").addEventListener("click", () => {
    guardar(false).then((ok) => {
      if (ok) alGuardar();
    }).catch(fallo);
  });
  porId("btn-cartilla-guardar-pdf").addEventListener("click", () => {
    guardar(true).then((ok) => {
      if (ok) alGuardar();
    }).catch(fallo);
  });
  porId("btn-cartilla-pdf").addEventListener("click", () => {
    const crudo = leerCrudo();
    if (!crudo) return;
    const datos = {
      ...normalizarCartilla(crudo),
      numero: actual ? actual.numero : 0
    };
    descargarCartillaPdf(datos).catch(fallo);
  });
}

/**
 * @param {{uid: string, email: string, nombre: string}} sesion
 * @returns {void}
 */
export function definirAutorCartilla(sesion) {
  autor = sesion;
}

/**
 * Abre una cartilla vacía.
 * @returns {Promise<void>}
 */
export async function mostrarCartillaNueva() {
  actual = null;
  limpiarErrores();
  porId("cartilla-titulo").textContent = TXT.nueva;
  porId("cartilla-meta").textContent = TXT.sinGuardar;
  document.title = TXT.tituloNueva;
  marcarTipo(GRUPO_CARTILLA, "");
  escribirCabecera({ creadaPorNombre: autor.nombre || "" });
  const hoy = hoyIso();
  fijarPorDefecto({ nombre: APP.firmaCartillaPorDefecto, fecha: hoy });
  aplicarFilas({});
  await escribirFinalizacion(finalizacionDeHoy(hoy));
  mostrarVista("vista-cartilla");
}

/**
 * Carga una cartilla guardada.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function mostrarCartillaEdicion(id) {
  const registro = await obtenerCartilla(id);
  if (!registro) {
    avisar(TXT.noEncontrada, "error");
    location.hash = "#/cartillas";
    return;
  }
  actual = registro;
  limpiarErrores();
  porId("cartilla-titulo").textContent = TXT.editar;
  porId("cartilla-meta").textContent =
    `N° ${registro.numero || "—"} · ${registro.creadoPorEmail || ""}`;
  document.title = TXT.tituloEdicion;
  marcarTipo(GRUPO_CARTILLA, registro.tipoEquipo || "");
  escribirCabecera(registro);
  fijarPorDefecto({});
  aplicarFilas(registro.filas || {});
  await escribirFinalizacion(registro.finalizacion || {});
  mostrarVista("vista-cartilla");
}

/**
 * Cierre de una cartilla nueva: fecha de hoy y nombre propuesto.
 * @param {string} hoy
 * @returns {object}
 */
function finalizacionDeHoy(hoy) {
  const fin = {};
  FINALIZACION.forEach((paso) => {
    fin[paso.id] = { nombre: APP.firmaCartillaPorDefecto, fecha: hoy };
  });
  return fin;
}

/**
 * @param {HTMLElement} raiz
 * @returns {void}
 */
function pintarFinalizacion(raiz) {
  raiz.replaceChildren();
  FINALIZACION.forEach((paso) => {
    const bloque = document.createElement("div");
    bloque.className = "bloque-final";
    bloque.dataset.campo = `fin:${paso.id}`;
    const titulo = document.createElement("h3");
    titulo.textContent = `${paso.n} ${paso.nombre}`;
    const rejilla = document.createElement("div");
    rejilla.className = "rejilla rejilla-2";
    rejilla.append(
      campo(TXT.nombre, `fin-nombre-${paso.id}`, "text"),
      campo(TXT.fecha, `fin-fecha-${paso.id}`, "date")
    );
    const lienzo = document.createElement("canvas");
    lienzo.width = 440;
    lienzo.height = 120;
    lienzo.setAttribute("aria-label", `${TXT.firma} ${paso.nombre}`);
    const limpiar = document.createElement("button");
    limpiar.type = "button";
    limpiar.className = "boton boton-secundario";
    limpiar.textContent = MSG.limpiarFirma;
    const firma = crearFirma(lienzo);
    limpiar.addEventListener("click", () => firma.limpiar());
    firmas.set(paso.id, firma);
    bloque.append(titulo, rejilla, lienzo, limpiar);
    raiz.append(bloque);
  });
}

/**
 * @param {string} etiqueta
 * @param {string} id
 * @param {string} tipo
 * @returns {HTMLElement}
 */
function campo(etiqueta, id, tipo) {
  const lab = document.createElement("label");
  lab.className = "campo";
  const span = document.createElement("span");
  span.textContent = etiqueta;
  const input = document.createElement("input");
  input.id = id;
  input.type = tipo;
  if (tipo === "text") {
    input.maxLength = LIMITES_CARTILLA.persona;
    input.autocomplete = "name";
  }
  lab.append(span, input);
  return lab;
}

/**
 * @param {object} datos
 * @returns {void}
 */
function escribirCabecera(datos) {
  Object.entries(CAMPOS).forEach(([clave, id]) => {
    porId(id).value = datos[clave] || "";
  });
}

/**
 * @param {object} fin
 * @returns {Promise<void>}
 */
async function escribirFinalizacion(fin) {
  const cargas = FINALIZACION.map((paso) => {
    const dato = fin[paso.id] || {};
    porId(`fin-nombre-${paso.id}`).value = dato.nombre || "";
    porId(`fin-fecha-${paso.id}`).value = dato.fecha || "";
    return firmas.get(paso.id).cargar(dato.firma || "");
  });
  await Promise.all(cargas);
}

/**
 * Lee el formulario. Devuelve null si una firma es muy pesada.
 * @returns {object|null}
 */
function leerCrudo() {
  const finalizacion = {};
  for (const paso of FINALIZACION) {
    const firma = firmas.get(paso.id);
    const imagen = firma.exportar();
    if (firma.esGrande()) {
      avisar(TXT.firmaGrande, "error");
      return null;
    }
    finalizacion[paso.id] = {
      nombre: porId(`fin-nombre-${paso.id}`).value,
      fecha: porId(`fin-fecha-${paso.id}`).value,
      firma: imagen
    };
  }
  const crudo = {
    tipoEquipo: leerTipo(GRUPO_CARTILLA),
    filas: leerFilas(),
    finalizacion
  };
  Object.entries(CAMPOS).forEach(([clave, id]) => {
    crudo[clave] = porId(id).value;
  });
  return crudo;
}

/**
 * @param {boolean} conPdf
 * @returns {Promise<boolean>}
 */
async function guardar(conPdf) {
  if (guardando) return false;
  const crudo = leerCrudo();
  if (!crudo) return false;
  const limpia = normalizarCartilla(crudo);
  const revision = validarCartilla(limpia);
  pintarErrores(revision);
  if (!revision.valido) return false;
  const nueva = !actual;
  guardando = true;
  ocupado(true);
  try {
    const fresca = await guardarCartilla(limpia, actual, autor);
    actual = fresca;
    if (conPdf) await descargarCartillaPdf(fresca);
    mostrarExito(
      nueva ? TXT.creadaTitulo : TXT.actualizadaTitulo,
      nueva ? textoCreada(fresca.numero) : textoActualizada(fresca.numero),
      TXT.volver,
      "#/cartillas"
    );
    return true;
  } finally {
    guardando = false;
    ocupado(false);
  }
}

/**
 * @param {{valido: boolean, errores: string[], campos: object}} revision
 * @returns {void}
 */
function pintarErrores(revision) {
  const caja = porId("cartilla-mensaje");
  caja.replaceChildren();
  porId("vista-cartilla").querySelectorAll("[data-campo]")
    .forEach((nodo) => {
      nodo.classList.toggle(
        "invalido",
        Boolean(revision.campos[nodo.dataset.campo])
      );
    });
  if (revision.valido) {
    caja.hidden = true;
    return;
  }
  const lista = document.createElement("ul");
  revision.errores.forEach((texto) => {
    const li = document.createElement("li");
    li.textContent = texto;
    lista.append(li);
  });
  caja.append(lista);
  caja.hidden = false;
  caja.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * @returns {void}
 */
function limpiarErrores() {
  pintarErrores({ valido: true, errores: [], campos: {} });
}

/**
 * @param {boolean} si
 * @returns {void}
 */
function ocupado(si) {
  ["btn-cartilla-guardar", "btn-cartilla-guardar-pdf"].forEach((id) => {
    porId(id).disabled = si;
  });
}

/**
 * @param {unknown} error
 * @returns {void}
 */
function fallo(error) {
  registrarError(error, "cartilla");
  avisar(mensajeError(error), "error");
}
