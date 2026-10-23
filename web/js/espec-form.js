/**
 * Propósito: Editar solo la ficha técnica de un modelo existente.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: cambios-pendientes, costo-repositorio, errores,
 *   espec-textos, fechas, hw-catalogo, imagen-modelo, logger,
 *   modelo-pdf, modelo-repositorio, modelo-validacion, ui
 *
 * No cambia nombre, tipo ni clientes. La foto sí se guarda aquí.
 */

import {
  cambiosGuardados,
  vigilarCambios
} from "./cambios-pendientes.js";
import { listarCostos } from "./costo-repositorio.js";
import { mensajeError } from "./errores.js";
import {
  ET,
  textoAvance,
  textoCostosModelo,
  textoFichaGuardada
} from "./espec-textos.js";
import { formatearFecha } from "./fechas.js";
import { reducirImagen } from "./imagen-modelo.js";
import {
  GRUPOS_FICHA,
  LINEAS_PRODUCTO,
  TIPOS_MODELO,
  avanceFicha,
  etiquetaDe,
  formatoMonto
} from "./hw-catalogo.js";
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
  vigilarCambios("vista-especificacion");
  porId("e-ficha").addEventListener("input", pintarAvance);
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
  porId("espec-meta").textContent = [
    etiquetaDe(TIPOS_MODELO, registro.tipo),
    registro.otroNombre
  ].filter(Boolean).join(" · ");
  document.title = ET.tituloEdicion;
  const ruta = encodeURIComponent(registro.id);
  porId("btn-espec-modelo").href = `#/modelo?id=${ruta}`;
  porId("btn-espec-costo-nuevo").href = `#/costo?modelo=${ruta}`;
  porId("espec-clientes").textContent =
    (registro.clientes || []).join("\n") || ET.sinClientes;
  escribirFicha(registro.ficha || {});
  porId("e-imagen").value = "";
  pintarImagen(registro.imagen || "");
  pintarAvance();
  mostrarVista("vista-especificacion");
  cambiosGuardados("vista-especificacion");
  await pintarCostos(registro);
}

/**
 * Cuántos campos tienen datos, en total y por grupo.
 * @returns {void}
 */
function pintarAvance() {
  const ficha = leerFicha();
  const { llenos, total } = avanceFicha(ficha);
  const completa = llenos === total;
  porId("espec-avance-titulo").textContent = completa
    ? ET.fichaCompleta
    : ET.fichaPendiente;
  porId("espec-avance-detalle").textContent = textoAvance(llenos, total);
  const barra = porId("espec-avance-barra");
  barra.classList.toggle("completa", completa);
  barra.setAttribute("aria-valuemax", String(total));
  barra.setAttribute("aria-valuenow", String(llenos));
  barra.firstElementChild.style.width = `${(llenos / total) * 100}%`;
  GRUPOS_FICHA.forEach((grupo, indice) => {
    const cuenta = porId(`espec-grupo-${indice}`);
    const avance = avanceFicha(ficha, grupo.campos);
    cuenta.textContent = `${avance.llenos}/${avance.total}`;
    cuenta.classList.toggle("listo", avance.llenos === avance.total);
  });
}

/**
 * Costos de la base con el mismo nombre de modelo.
 * @param {object} modelo
 * @returns {Promise<void>}
 */
async function pintarCostos(modelo) {
  const cuerpo = porId("espec-costos-cuerpo");
  const tabla = porId("espec-costos-tabla");
  const vacio = porId("espec-costos-vacio");
  const resumen = porId("espec-costos");
  cuerpo.replaceChildren();
  tabla.hidden = true;
  vacio.hidden = true;
  resumen.textContent = ET.cargandoCostos;
  let costos = [];
  try {
    costos = (await listarCostos())
      .filter((costo) => costo.modeloClave === modelo.nombreClave)
      .sort((a, b) => String(b.fechaActualizacion || "")
        .localeCompare(String(a.fechaActualizacion || ""))
        || (Number(b.numero) || 0) - (Number(a.numero) || 0));
  } catch (error) {
    registrarError(error, "especificacion.costos");
    resumen.textContent = ET.costosNoDisponibles;
    return;
  }
  if (!actual || actual.id !== modelo.id) return;
  resumen.textContent = textoCostosModelo(costos);
  vacio.hidden = costos.length > 0;
  tabla.hidden = costos.length === 0;
  cuerpo.append(...costos.map(filaCosto));
}

/**
 * @param {object} costo
 * @returns {HTMLTableRowElement}
 */
function filaCosto(costo) {
  const tr = document.createElement("tr");
  [
    String(costo.numero || "—"),
    etiquetaDe(LINEAS_PRODUCTO, costo.linea) || "—",
    formatoMonto(costo.costo, costo.moneda),
    formatearFecha(costo.fechaActualizacion) || "—"
  ].forEach((texto, indice) => {
    const td = document.createElement("td");
    td.textContent = texto;
    if (indice === 2) td.className = "derecha";
    tr.append(td);
  });
  const td = document.createElement("td");
  const abrir = document.createElement("a");
  abrir.className = "boton boton-secundario";
  abrir.href = `#/costo?id=${encodeURIComponent(costo.id)}`;
  abrir.textContent = ET.abrirCosto;
  td.append(abrir);
  tr.append(td);
  return tr;
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
    const cuenta = document.createElement("small");
    cuenta.id = `espec-grupo-${GRUPOS_FICHA.indexOf(grupo)}`;
    leyenda.append(document.createTextNode(grupo.titulo), cuenta);
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
      area.placeholder = campo.ejemplo || "";
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
    cambiosGuardados("vista-especificacion");
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
