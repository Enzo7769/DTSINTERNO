/**
 * Propósito: Editar solo la ficha técnica de un modelo existente.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: errores, espec-textos, hw-catalogo,
 *   imagen-modelo, logger, modelo-pdf, modelo-repositorio,
 *   modelo-validacion, ui
 *
 * No cambia nombre, tipo ni clientes. La foto sí se guarda aquí.
 */

import { mensajeError } from "./errores.js";
import { ET, textoFichaGuardada } from "./espec-textos.js";
import { reducirImagen } from "./imagen-modelo.js";
import { GRUPOS_FICHA, TIPOS_MODELO, etiquetaDe } from "./hw-catalogo.js";
import { registrarError } from "./logger.js";
import { descargarEspecPdf } from "./modelo-pdf.js";
import { guardarModelo, obtenerModelo } from "./modelo-repositorio.js";
import { LIMITES_MODELO } from "./modelo-validacion.js";
import { avisar, mostrarExito, mostrarVista, porId } from "./ui.js";

const PREFIJO = "espec-";

let autor = { uid: "", email: "" };
let actual = null;
let imagen = "";
let guardando = false;

/**
 * @param {() => void} alGuardar
 * @returns {void}
 */
export function iniciarEspec(alGuardar) {
  pintarCampos();
  porId("e-imagen").addEventListener("change", () => {
    cargarImagen().catch(fallo);
  });
  porId("btn-espec-quitar-imagen").addEventListener("click", () => {
    pintarImagen("");
  });
  porId("btn-espec-volver").addEventListener("click", () => {
    location.hash = "#/especificaciones";
  });
  const alTerminar = (ok) => {
    if (ok) alGuardar();
  };
  porId("btn-espec-guardar").addEventListener("click", () => {
    guardar(false).then(alTerminar).catch(fallo);
  });
  porId("btn-espec-guardar-pdf").addEventListener("click", () => {
    guardar(true).then(alTerminar).catch(fallo);
  });
  porId("btn-espec-pdf").addEventListener("click", () => {
    if (!actual) return;
    const datos = { ...actual, ficha: leerFicha(), imagen };
    descargarEspecPdf(datos).catch(fallo);
  });
}

/**
 * @param {{uid: string, email: string}} sesion
 * @returns {void}
 */
export function definirAutorEspec(sesion) {
  autor = sesion;
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function mostrarEspec(id) {
  const registro = await obtenerModelo(id);
  if (!registro) {
    avisar(ET.noEncontrado, "error");
    location.hash = "#/especificaciones";
    return;
  }
  actual = registro;
  porId("espec-titulo").textContent = registro.nombre || ET.titulo;
  porId("espec-meta").textContent = etiquetaDe(TIPOS_MODELO, registro.tipo);
  document.title = ET.tituloEdicion;
  escribirFicha(registro.ficha || {});
  porId("e-imagen").value = "";
  pintarImagen(registro.imagen || "");
  mostrarVista("vista-especificacion");
}

/**
 * @returns {void}
 */
function pintarCampos() {
  const raiz = porId("e-ficha");
  raiz.replaceChildren();
  GRUPOS_FICHA.forEach((grupo) => {
    const caja = document.createElement("fieldset");
    caja.className = "ficha-grupo";
    const leyenda = document.createElement("legend");
    leyenda.textContent = grupo.titulo;
    caja.append(leyenda);
    grupo.campos.forEach((campo) => {
      const lab = document.createElement("label");
      lab.className = "campo";
      const rotulo = document.createElement("span");
      rotulo.textContent = campo.etiqueta;
      const area = document.createElement("textarea");
      area.id = `${PREFIJO}${campo.id}`;
      area.rows = 2;
      area.maxLength = LIMITES_MODELO.campoFicha;
      lab.append(rotulo, area);
      caja.append(lab);
    });
    raiz.append(caja);
  });
}

/**
 * @param {object} ficha
 * @returns {void}
 */
function escribirFicha(ficha) {
  GRUPOS_FICHA.forEach((grupo) => {
    grupo.campos.forEach((campo) => {
      const area = porId(`${PREFIJO}${campo.id}`);
      area.value = ficha[campo.id] || "";
      area.rows = Math.max(2, area.value.split("\n").length);
    });
  });
}

/**
 * @returns {object}
 */
function leerFicha() {
  const ficha = {};
  GRUPOS_FICHA.forEach((grupo) => {
    grupo.campos.forEach((campo) => {
      ficha[campo.id] = porId(`${PREFIJO}${campo.id}`).value;
    });
  });
  return ficha;
}

/**
 * @returns {Promise<void>}
 */
async function cargarImagen() {
  const archivo = porId("e-imagen").files[0];
  if (!archivo) return;
  if (!archivo.type.startsWith("image/")) {
    avisar(ET.imagenInvalida, "error");
    porId("e-imagen").value = "";
    return;
  }
  const dato = await reducirImagen(archivo);
  if (!dato) {
    avisar(ET.imagenPesada, "error");
    porId("e-imagen").value = "";
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
  const vista = porId("e-imagen-vista");
  vista.hidden = !dato;
  if (dato) vista.src = dato;
  else vista.removeAttribute("src");
  porId("e-imagen-vacia").hidden = Boolean(dato);
  porId("btn-espec-quitar-imagen").hidden = !dato;
  if (!dato) porId("e-imagen").value = "";
}

/**
 * @param {boolean} conPdf
 * @returns {Promise<boolean>}
 */
async function guardar(conPdf) {
  if (guardando || !actual) return false;
  guardando = true;
  try {
    const fresco = await guardarModelo(
      { ...actual, ficha: leerFicha(), imagen },
      actual,
      autor
    );
    actual = fresco;
    if (conPdf) await descargarEspecPdf(fresco);
    mostrarExito(
      ET.guardadoTitulo,
      textoFichaGuardada(fresco.nombre),
      ET.volverBoton,
      "#/especificaciones"
    );
    return true;
  } finally {
    guardando = false;
  }
}

/**
 * @param {unknown} error
 * @returns {void}
 */
function fallo(error) {
  registrarError(error, "especificacion");
  avisar(mensajeError(error), "error");
}
