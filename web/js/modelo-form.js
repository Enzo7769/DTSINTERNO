/**
 * Propósito: Alta y edición de un modelo, sin su ficha técnica.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: errores, hw-catalogo, imagen-modelo, logger,
 *   modelo-pdf, modelo-repositorio, modelo-textos,
 *   modelo-validacion, tipos-equipo, ui
 *
 * Al guardar se conserva la ficha. Esa se edita en
 * Especificaciones técnicas.
 */

import { mensajeError } from "./errores.js";
import { ESTADOS_MODELO, TIPOS_MODELO } from "./hw-catalogo.js";
import { reducirImagen } from "./imagen-modelo.js";
import { registrarError } from "./logger.js";
import { descargarModeloPdf } from "./modelo-pdf.js";
import {
  guardarModelo,
  listarModelos,
  obtenerModelo
} from "./modelo-repositorio.js";
import {
  MT,
  textoModeloActualizado,
  textoModeloCreado
} from "./modelo-textos.js";
import {
  normalizarModelo,
  validarModelo
} from "./modelo-validacion.js";
import {
  GRUPO_MODELO,
  leerTipo,
  marcarTipo,
  pintarTipo
} from "./tipos-equipo.js";
import { avisar, mostrarExito, mostrarVista, porId } from "./ui.js";

let autor = { uid: "", email: "" };
let actual = null;
let imagen = "";
let guardando = false;

/**
 * @param {() => void} alGuardar
 * @returns {void}
 */
export function iniciarModelo(alGuardar) {
  pintarTipo(porId("tipo-modelo"), GRUPO_MODELO, "m-tipo", TIPOS_MODELO,
    MT.leyendaTipo);
  ESTADOS_MODELO.forEach((estado) => {
    const opcion = document.createElement("option");
    opcion.value = estado.id;
    opcion.textContent = estado.etiqueta;
    porId("m-estado").append(opcion);
  });
  porId("btn-modelo-guardar-pdf").textContent = MT.guardarPdf;
  porId("btn-modelo-pdf").textContent = MT.descargarPdf;
  porId("m-imagen").addEventListener("change", () => {
    cargarImagen().catch(fallo);
  });
  porId("btn-modelo-quitar-imagen").addEventListener("click", () => {
    pintarImagen("");
  });
  porId("vista-modelo").addEventListener("input", limpiarMarca);
  porId("vista-modelo").addEventListener("change", limpiarMarca);
  porId("btn-modelo-volver").addEventListener("click", () => {
    location.hash = "#/modelos";
  });
  const alTerminar = (ok) => {
    if (ok) alGuardar();
  };
  porId("btn-modelo-guardar").addEventListener("click", () => {
    guardar(false).then(alTerminar).catch(fallo);
  });
  porId("btn-modelo-guardar-pdf").addEventListener("click", () => {
    guardar(true).then(alTerminar).catch(fallo);
  });
  porId("btn-modelo-pdf").addEventListener("click", () => {
    const datos = {
      ...normalizarModelo(leerCrudo()),
      numero: actual ? actual.numero : 0
    };
    descargarModeloPdf(datos).catch(fallo);
  });
}

/**
 * @param {{uid: string, email: string}} sesion
 * @returns {void}
 */
export function definirAutorModelo(sesion) {
  autor = sesion;
}

/**
 * @returns {Promise<void>}
 */
export async function mostrarModeloNuevo() {
  actual = null;
  limpiarErrores();
  porId("modelo-titulo").textContent = MT.nuevo;
  porId("modelo-meta").textContent = MT.sinGuardar;
  document.title = MT.tituloNuevo;
  escribir({});
  mostrarVista("vista-modelo");
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function mostrarModeloEdicion(id) {
  const registro = await obtenerModelo(id);
  if (!registro) {
    avisar(MT.noEncontrado, "error");
    location.hash = "#/modelos";
    return;
  }
  actual = registro;
  limpiarErrores();
  porId("modelo-titulo").textContent = registro.nombre || MT.editar;
  porId("modelo-meta").textContent =
    `N° ${registro.numero || "—"} · ${registro.creadoPorEmail || ""}`;
  document.title = MT.tituloEdicion;
  escribir(registro);
  mostrarVista("vista-modelo");
}

/**
 * @param {object} datos
 * @returns {void}
 */
function escribir(datos) {
  marcarTipo(GRUPO_MODELO, datos.tipo || "");
  porId("m-nombre").value = datos.nombre || "";
  porId("m-otro").value = datos.otroNombre || "";
  porId("m-estado").value = datos.estado || ESTADOS_MODELO[0].id;
  porId("m-clientes").value = (datos.clientes || []).join("\n");
  porId("m-notas").value = datos.notas || "";
  porId("m-imagen").value = "";
  pintarImagen(datos.imagen || "");
}

/**
 * @returns {object}
 */
function leerCrudo() {
  return {
    tipo: leerTipo(GRUPO_MODELO),
    nombre: porId("m-nombre").value,
    otroNombre: porId("m-otro").value,
    estado: porId("m-estado").value,
    clientes: porId("m-clientes").value,
    notas: porId("m-notas").value,
    imagen,
    ficha: actual && actual.ficha ? actual.ficha : {}
  };
}

/**
 * @returns {Promise<void>}
 */
async function cargarImagen() {
  const archivo = porId("m-imagen").files[0];
  if (!archivo) return;
  if (!archivo.type.startsWith("image/")) {
    avisar(MT.imagenInvalida, "error");
    porId("m-imagen").value = "";
    return;
  }
  const dato = await reducirImagen(archivo);
  if (!dato) {
    avisar(MT.imagenPesada, "error");
    porId("m-imagen").value = "";
    return;
  }
  pintarImagen(dato);
}

/**
 * @param {string} dato
 * @returns {void}
 */
function pintarImagen(dato) {
  imagen = dato;
  const vista = porId("m-imagen-vista");
  vista.hidden = !dato;
  if (dato) vista.src = dato;
  else vista.removeAttribute("src");
  porId("m-imagen-vacia").hidden = Boolean(dato);
  porId("btn-modelo-quitar-imagen").hidden = !dato;
  if (!dato) porId("m-imagen").value = "";
}

/**
 * @param {boolean} conPdf
 * @returns {Promise<boolean>}
 */
async function guardar(conPdf) {
  if (guardando) return false;
  const limpio = normalizarModelo(leerCrudo());
  const otros = await listarModelos();
  const revision = validarModelo(limpio, otros, actual && actual.id);
  pintarErrores(revision);
  if (!revision.valido) return false;
  const nuevo = !actual;
  guardando = true;
  try {
    const fresco = await guardarModelo(limpio, actual, autor);
    actual = fresco;
    if (conPdf) await descargarModeloPdf(fresco);
    mostrarExito(
      nuevo ? MT.creadoTitulo : MT.actualizadoTitulo,
      nuevo
        ? textoModeloCreado(fresco.numero)
        : textoModeloActualizado(fresco.numero),
      MT.volver,
      "#/modelos"
    );
    return true;
  } finally {
    guardando = false;
  }
}

/**
 * @param {Event} evento
 * @returns {void}
 */
function limpiarMarca(evento) {
  const campo = evento.target.closest("[data-campo]");
  if (campo) campo.classList.remove("invalido");
}

/**
 * @param {{valido: boolean, errores: string[], campos: object}} revision
 * @returns {void}
 */
function pintarErrores(revision) {
  const caja = porId("modelo-mensaje");
  caja.replaceChildren();
  porId("vista-modelo").querySelectorAll("[data-campo]").forEach((nodo) => {
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
 * @param {unknown} error
 * @returns {void}
 */
function fallo(error) {
  registrarError(error, "modelo");
  avisar(mensajeError(error), "error");
}
