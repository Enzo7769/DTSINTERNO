/**
 * Propósito: Formulario de alta y edición del checklist.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: catalogo, constantes, fechas, firma, pdf,
 *   repositorio, sanitizar, ui, validacion, logger
 */

import {
  SECCIONES,
  buscarItem,
  tituloCierre,
  tituloSeccion
} from "./catalogo.js";
import {
  ETIQUETA_ESTADO,
  LIMITES,
  MSG,
  mensajeActualizado,
  mensajeCreado
} from "./constantes.js";
import { hoyIso } from "./fechas.js";
import { crearFirma } from "./firma.js";
import { mensajeError } from "./errores.js";
import { registrarError } from "./logger.js";
import { descargarPdf } from "./pdf.js";
import {
  buscarPorSerie,
  guardarChecklist,
  obtenerChecklist
} from "./repositorio.js";
import {
  normalizarIp,
  normalizarMac,
  normalizarSerie
} from "./sanitizar.js";
import {
  avisar,
  mostrarExito,
  mostrarVista,
  porId
} from "./ui.js";
import {
  GRUPO_CHECKLIST,
  leerTipo,
  marcarTipo,
  pintarTipo
} from "./tipos-equipo.js";
import {
  contarOk,
  estadoSugerido,
  itemAplica,
  itemCumplido,
  normalizarChecklist,
  validarDatos
} from "./validacion.js";

let autorForm = { uid: "", email: "", nombre: "" };
let registroActual = null;
let eleccionManual = false;
let firmaTecnico = null;
let firmaCalidad = null;
let timerSerie = 0;
let guardando = false;

/**
 * Dibuja las secciones y conecta los botones del formulario.
 * @param {() => void} alGuardar
 * @returns {void}
 */
export function iniciarFormulario(alGuardar) {
  pintarTipo(porId("tipo-checklist"), GRUPO_CHECKLIST, "tipoEquipo");
  pintarSecciones();
  firmaTecnico = crearFirma(porId("canvas-tecnico"));
  firmaCalidad = crearFirma(porId("canvas-calidad"));
  porId("tipo-checklist").addEventListener("change", actualizarResumen);
  porId("secciones").addEventListener("change", actualizarResumen);
  porId("secciones").addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-marcar]");
    if (!boton) return;
    marcarSeccion(boton.getAttribute("data-marcar"), true);
  });
  porId("btn-marcar-todo").addEventListener("click", () => {
    marcarTodos(true);
  });
  porId("btn-limpiar-marcas").addEventListener("click", () => {
    marcarTodos(false);
  });
  porId("estado-aprobado").addEventListener("change", () => {
    eleccionManual = true;
  });
  porId("estado-rechazado").addEventListener("change", () => {
    eleccionManual = true;
  });
  porId("btn-limpiar-firma-tecnico").addEventListener("click", () => {
    firmaTecnico.limpiar();
  });
  porId("btn-limpiar-firma-calidad").addEventListener("click", () => {
    firmaCalidad.limpiar();
  });
  porId("campo-serie").addEventListener("input", programarSerie);
  porId("campo-mac").addEventListener("blur", () => {
    const mac = normalizarMac(porId("campo-mac").value);
    if (mac) porId("campo-mac").value = mac;
  });
  porId("campo-ip").addEventListener("blur", () => {
    const ip = normalizarIp(porId("campo-ip").value);
    if (ip) porId("campo-ip").value = ip;
  });
  porId("btn-volver").addEventListener("click", () => {
    location.hash = "#/listado";
  });
  porId("btn-guardar").addEventListener("click", () => {
    guardar(false).then((ok) => {
      if (ok) alGuardar();
    }).catch(fallo);
  });
  porId("btn-guardar-pdf").addEventListener("click", () => {
    guardar(true).then((ok) => {
      if (ok) alGuardar();
    }).catch(fallo);
  });
  porId("btn-pdf").addEventListener("click", () => {
    const leido = leerCrudo();
    if (!leido) return;
    const datos = {
      ...normalizarChecklist(leido),
      id: idActual(),
      numero: registroActual ? registroActual.numero : 0
    };
    descargarPdf(datos).catch(fallo);
  });
  porId("btn-marcar-todo").textContent = MSG.marcarTodo;
  porId("btn-limpiar-marcas").textContent = MSG.limpiarMarcas;
  porId("btn-limpiar-firma-tecnico").textContent = MSG.limpiarFirma;
  porId("btn-limpiar-firma-calidad").textContent = MSG.limpiarFirma;
}

/**
 * Abre un checklist nuevo con la fecha de hoy.
 * @param {string} nombreTecnico
 * @returns {Promise<void>}
 */
export async function mostrarNuevo(nombreTecnico) {
  try {
    registroActual = null;
    eleccionManual = false;
    limpiarMensajes();
    porId("titulo-formulario").textContent = MSG.nuevo;
    document.title = MSG.tituloFormulario;
    porId("meta-registro").textContent = MSG.sinGuardar;
    marcarTipo(GRUPO_CHECKLIST, "");
    porId("campo-proyecto").value = "";
    porId("campo-cliente").value = "";
    porId("campo-tecnico").value = nombreTecnico || "";
    porId("campo-serie").value = "";
    porId("campo-mac").value = "";
    porId("campo-ip").value = "";
    porId("campo-fecha-inspeccion").value = hoyIso();
    porId("campo-fecha-salida").value = hoyIso();
    porId("campo-observaciones").value = "";
    porId("firma-tecnico-nombre").value = nombreTecnico || "";
    porId("firma-calidad-nombre").value = "";
    aplicarItems({});
    firmaTecnico.limpiar();
    firmaCalidad.limpiar();
    porId("estado-aprobado").checked = false;
    porId("estado-rechazado").checked = false;
    actualizarResumen();
    mostrarVista("vista-formulario");
  } catch (error) {
    registrarError(error, "mostrarNuevo");
    throw error;
  }
}

/**
 * Carga un checklist guardado.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function mostrarEdicion(id) {
  try {
    const registro = await obtenerChecklist(id);
    if (!registro) {
      avisar(MSG.noEncontrado, "error");
      location.hash = "#/listado";
      return;
    }
    registroActual = registro;
    eleccionManual = true;
    limpiarMensajes();
    porId("titulo-formulario").textContent = MSG.editar;
    document.title = MSG.tituloEdicion;
    porId("meta-registro").textContent = textoMeta(registro);
    marcarTipo(GRUPO_CHECKLIST, registro.tipoEquipo || "");
    porId("campo-proyecto").value = registro.proyecto || "";
    porId("campo-cliente").value = registro.cliente || "";
    porId("campo-tecnico").value = registro.tecnico || "";
    porId("campo-serie").value = registro.numeroSerie || "";
    porId("campo-mac").value = registro.mac || "";
    porId("campo-ip").value = registro.ip || "";
    porId("campo-fecha-inspeccion").value =
      registro.fechaInspeccion || "";
    porId("campo-fecha-salida").value = registro.fechaSalida || "";
    porId("campo-observaciones").value = registro.observaciones || "";
    porId("firma-tecnico-nombre").value =
      (registro.firmaTecnico && registro.firmaTecnico.nombre) || "";
    porId("firma-calidad-nombre").value =
      (registro.firmaCalidad && registro.firmaCalidad.nombre) || "";
    aplicarItems(registro.items || {});
    await firmaTecnico.cargar(
      (registro.firmaTecnico && registro.firmaTecnico.imagen) || ""
    );
    await firmaCalidad.cargar(
      (registro.firmaCalidad && registro.firmaCalidad.imagen) || ""
    );
    porId("estado-aprobado").checked = registro.estado === "aprobado";
    porId("estado-rechazado").checked = registro.estado === "rechazado";
    actualizarResumen();
    mostrarVista("vista-formulario");
  } catch (error) {
    registrarError(error, "mostrarEdicion");
    throw error;
  }
}

/**
 * @returns {void}
 */
function pintarSecciones() {
  const raiz = porId("secciones");
  raiz.replaceChildren();
  SECCIONES.forEach((seccion) => {
    raiz.append(crearSeccion(seccion));
  });
}

/**
 * @param {object} seccion
 * @returns {HTMLElement}
 */
function crearSeccion(seccion) {
  const nodo = document.createElement("section");
  nodo.className = "tarjeta";
  nodo.dataset.seccion = seccion.id;
  const cabeza = document.createElement("div");
  cabeza.className = "cabeza-seccion";
  const titulo = document.createElement("h2");
  titulo.dataset.tituloSeccion = seccion.id;
  titulo.textContent = tituloSeccion(seccion, "");
  const cuenta = document.createElement("span");
  cuenta.className = "cuenta-seccion";
  cuenta.dataset.cuenta = seccion.id;
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton boton-secundario";
  boton.dataset.marcar = seccion.id;
  boton.textContent = MSG.marcarSeccion;
  cabeza.append(titulo, cuenta, boton);
  nodo.append(cabeza);
  seccion.items.forEach((item) => {
    nodo.append(crearItem(item));
  });
  return nodo;
}

/**
 * @param {object} item
 * @returns {HTMLElement}
 */
function crearItem(item) {
  const articulo = document.createElement("article");
  articulo.className = "item";
  articulo.dataset.item = item.id;
  if (item.dependeDe) {
    articulo.dataset.depende = item.dependeDe;
    articulo.hidden = true;
  }
  const cuerpo = document.createElement("div");
  const nombre = document.createElement("h3");
  nombre.textContent = item.nombre;
  const ayuda = document.createElement("p");
  ayuda.textContent = item.ayuda;
  cuerpo.append(nombre, ayuda);
  if (item.extra) cuerpo.append(crearExtra(item));
  if (item.extras) cuerpo.append(crearExtras(item));
  articulo.append(crearMarcas(item), cuerpo);
  return articulo;
}

/**
 * @param {object} item
 * @returns {HTMLElement}
 */
function crearMarcas(item) {
  const caja = document.createElement("div");
  caja.className = "opciones-check";
  const positivo = item.aceptaNo ? MSG.marcaSi : MSG.ok;
  const negativo = item.aceptaNo ? MSG.marcaNo : MSG.marcaMalo;
  const signoNo = item.aceptaNo ? "–" : "✗";
  caja.append(
    crearMarca(item.id, "ok", "✓", positivo, false),
    crearMarca(item.id, "malo", signoNo, negativo, item.aceptaNo)
  );
  return caja;
}

/**
 * @param {string} id
 * @param {"ok"|"malo"} valor
 * @param {string} simbolo
 * @param {string} etiqueta
 * @param {boolean} neutra
 * @returns {HTMLElement}
 */
function crearMarca(id, valor, simbolo, etiqueta, neutra) {
  const lab = document.createElement("label");
  const extra = neutra ? " opcion-neutra" : "";
  lab.className = `opcion-check opcion-${valor}${extra}`;
  const input = document.createElement("input");
  input.type = "radio";
  input.name = `marca-${id}`;
  input.value = valor;
  input.dataset.marca = id;
  const signo = document.createElement("span");
  signo.className = "opcion-signo";
  signo.textContent = simbolo;
  const leyenda = document.createElement("span");
  leyenda.className = "opcion-texto";
  leyenda.textContent = etiqueta;
  lab.append(input, signo, leyenda);
  return lab;
}

/**
 * @param {object} item
 * @returns {HTMLElement}
 */
function crearExtras(item) {
  const caja = document.createElement("div");
  caja.className = "extras-item";
  caja.dataset.extras = item.id;
  caja.hidden = true;
  item.extras.forEach((campo) => {
    caja.append(crearCampoExtra(item.id, campo));
  });
  return caja;
}

/**
 * @param {string} idItem
 * @param {{id: string, etiqueta: string, max: number}} campo
 * @returns {HTMLElement}
 */
function crearCampoExtra(idItem, campo) {
  const lab = document.createElement("label");
  lab.className = "campo campo-extra";
  lab.dataset.campo = `extra:${idItem}:${campo.id}`;
  const span = document.createElement("span");
  span.textContent = campo.etiqueta;
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = campo.max;
  input.dataset.extraCampo = `${idItem}:${campo.id}`;
  input.autocomplete = "off";
  lab.append(span, input);
  return lab;
}

/**
 * @param {object} item
 * @returns {HTMLElement}
 */
function crearExtra(item) {
  const lab = document.createElement("label");
  lab.className = "campo campo-extra";
  lab.dataset.campo = `extra:${item.id}`;
  const span = document.createElement("span");
  span.textContent = item.extra.etiqueta;
  const campo = document.createElement("input");
  campo.type = "text";
  campo.maxLength = item.extra.max;
  campo.dataset.extra = item.id;
  campo.autocomplete = "off";
  lab.append(span, campo);
  return lab;
}

/**
 * @param {Record<string, object>} items
 * @returns {void}
 */
function aplicarItems(items) {
  SECCIONES.forEach((seccion) => {
    seccion.items.forEach((item) => {
      const fila = items[item.id] || {};
      const resultado = fila.resultado === "malo"
        ? "malo"
        : (fila.ok ? "ok" : "");
      fijarMarcaItem(item.id, resultado);
      const extra = document.querySelector(
        `[data-extra="${item.id}"]`
      );
      if (extra) extra.value = fila.extra || "";
      const mapa = fila.extras || {};
      (item.extras || []).forEach((campo) => {
        const nodo = document.querySelector(
          `[data-extra-campo="${item.id}:${campo.id}"]`
        );
        if (nodo) nodo.value = mapa[campo.id] || "";
      });
    });
  });
}

/**
 * @param {string} id
 * @param {string} valor
 * @returns {void}
 */
function fijarMarcaItem(id, valor) {
  document.querySelectorAll(`[data-marca="${id}"]`).forEach((input) => {
    input.checked = input.value === valor;
  });
}

/**
 * @param {string} id
 * @returns {string}
 */
function leerMarca(id) {
  const elegido = document.querySelector(
    `[data-marca="${id}"]:checked`
  );
  return elegido ? elegido.value : "";
}

/**
 * @returns {object}
 */
function leerItems() {
  const items = {};
  SECCIONES.forEach((seccion) => {
    seccion.items.forEach((item) => {
      const resultado = leerMarca(item.id);
      const extra = document.querySelector(
        `[data-extra="${item.id}"]`
      );
      const ok = resultado === "ok";
      items[item.id] = {
        ok,
        resultado: ok ? "ok" : (resultado === "malo" ? "malo" : ""),
        extra: extra ? extra.value : "",
        extras: leerExtras(item, ok)
      };
    });
  });
  return items;
}

/**
 * @param {object} item
 * @param {boolean} activo
 * @returns {Record<string, string>}
 */
function leerExtras(item, activo) {
  const extras = {};
  (item.extras || []).forEach((campo) => {
    const nodo = document.querySelector(
      `[data-extra-campo="${item.id}:${campo.id}"]`
    );
    extras[campo.id] = activo && nodo ? nodo.value : "";
  });
  return extras;
}

/**
 * @param {string} id
 * @param {boolean} valor
 * @returns {void}
 */
function marcarSeccion(id, valor) {
  const raiz = document.querySelector(`[data-seccion="${id}"]`);
  if (!raiz) return;
  raiz.querySelectorAll("[data-item]").forEach((nodo) => {
    if (nodo.hidden) return;
    fijarMarcaItem(nodo.dataset.item, valor ? "ok" : "");
  });
  actualizarResumen();
}

/**
 * @param {boolean} valor
 * @returns {void}
 */
function marcarTodos(valor) {
  document.querySelectorAll("[data-item]").forEach((nodo) => {
    if (nodo.hidden) return;
    fijarMarcaItem(nodo.dataset.item, valor ? "ok" : "");
  });
  actualizarResumen();
}

/**
 * @returns {void}
 */
function actualizarResumen() {
  const items = leerItems();
  const tipo = leerTipo(GRUPO_CHECKLIST);
  const cuenta = contarOk(items, tipo);
  const sugerido = estadoSugerido(items, tipo);
  porId("resumen-cuenta").textContent =
    `${MSG.avance}: ${cuenta.ok} / ${cuenta.total}`;
  porId("resumen-sugerido").textContent =
    `${MSG.sugerido}: ${ETIQUETA_ESTADO[sugerido]}`;
  const pct = cuenta.total
    ? Math.round((cuenta.ok / cuenta.total) * 100)
    : 0;
  porId("barra-avance").style.width = `${pct}%`;
  const completo = cuenta.ok === cuenta.total;
  const aprobado = porId("estado-aprobado");
  const rechazado = porId("estado-rechazado");
  aprobado.disabled = !completo;
  if (!completo) {
    aprobado.checked = false;
    rechazado.checked = true;
  } else if (!eleccionManual && !aprobado.checked) {
    aprobado.checked = true;
  }
  document.querySelectorAll(".item").forEach((nodo) => {
    const resultado = leerMarca(nodo.dataset.item);
    nodo.classList.toggle("ok", resultado === "ok");
    nodo.classList.toggle("malo", resultado === "malo");
    const caja = nodo.querySelector("[data-extras]");
    if (caja) caja.hidden = resultado !== "ok";
    const def = buscarItem(nodo.dataset.item);
    if (def) nodo.hidden = !itemAplica(def, items, tipo);
  });
  porId("titulo-cierre").textContent = tituloCierre(tipo);
  SECCIONES.forEach((seccion) => {
    const marca = document.querySelector(
      `[data-cuenta="${seccion.id}"]`
    );
    const tarjeta = document.querySelector(
      `[data-seccion="${seccion.id}"]`
    );
    const encabezado = tarjeta
      ? tarjeta.querySelector("[data-titulo-seccion]")
      : null;
    if (encabezado) {
      encabezado.textContent = tituloSeccion(seccion, tipo);
    }
    if (!marca) return;
    let ok = 0;
    let total = 0;
    seccion.items.forEach((item) => {
      if (!itemAplica(item, items, tipo)) return;
      total += 1;
      if (itemCumplido(item, items[item.id])) ok += 1;
    });
    marca.textContent = `${ok} / ${total}`;
    if (tarjeta) tarjeta.hidden = total === 0;
  });
}

/**
 * @returns {object|null}
 */
function leerCrudo() {
  if (firmaTecnico.esGrande() || firmaCalidad.esGrande()) {
    avisar(MSG.firmaGrande, "error");
    return null;
  }
  const imagenTecnico = firmaTecnico.exportar();
  const imagenCalidad = firmaCalidad.exportar();
  if (firmaTecnico.esGrande() || firmaCalidad.esGrande()) {
    avisar(MSG.firmaGrande, "error");
    return null;
  }
  return {
    tipoEquipo: leerTipo(GRUPO_CHECKLIST),
    proyecto: porId("campo-proyecto").value,
    fechaInspeccion: porId("campo-fecha-inspeccion").value,
    cliente: porId("campo-cliente").value,
    tecnico: porId("campo-tecnico").value,
    numeroSerie: porId("campo-serie").value,
    mac: porId("campo-mac").value,
    ip: porId("campo-ip").value,
    fechaSalida: porId("campo-fecha-salida").value,
    items: leerItems(),
    estado: porId("estado-aprobado").checked ? "aprobado" : "rechazado",
    observaciones: porId("campo-observaciones").value,
    firmaTecnico: {
      nombre: porId("firma-tecnico-nombre").value,
      imagen: imagenTecnico
    },
    firmaCalidad: {
      nombre: porId("firma-calidad-nombre").value,
      imagen: imagenCalidad
    }
  };
}

/**
 * @param {boolean} conPdf
 * @returns {Promise<boolean>}
 */
async function guardar(conPdf) {
  if (guardando) return false;
  const crudo = leerCrudo();
  if (!crudo) return false;
  const limpio = normalizarChecklist(crudo);
  const revision = validarDatos(limpio);
  pintarErrores(revision);
  if (!revision.valido) return false;
  const eraNuevo = !registroActual;
  guardando = true;
  textoBotones(true);
  try {
    const fresco = await guardarChecklist(
      limpio,
      registroActual,
      autorForm
    );
    registroActual = fresco;
    if (conPdf) await descargarPdf(fresco);
    abrirModal(fresco, eraNuevo);
    return true;
  } finally {
    guardando = false;
    textoBotones(false);
  }
}

/**
 * @param {{valido: boolean, errores: string[], campos: object}} revision
 * @returns {void}
 */
function pintarErrores(revision) {
  const caja = porId("mensaje-formulario");
  caja.replaceChildren();
  document.querySelectorAll("[data-campo]").forEach((nodo) => {
    const clave = nodo.getAttribute("data-campo");
    const malo = Boolean(revision.campos[clave]);
    nodo.classList.toggle("invalido", malo);
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
function programarSerie() {
  window.clearTimeout(timerSerie);
  timerSerie = window.setTimeout(() => {
    revisarSerie().catch((error) => registrarError(error, "serie"));
  }, 400);
}

/**
 * @returns {Promise<void>}
 */
async function revisarSerie() {
  const aviso = porId("aviso-serie");
  const serie = normalizarSerie(porId("campo-serie").value);
  if (serie.length < 3) {
    aviso.hidden = true;
    return;
  }
  const hallados = await buscarPorSerie(serie, idActual());
  if (!hallados.length) {
    aviso.hidden = true;
    return;
  }
  aviso.textContent = MSG.serieDuplicada;
  aviso.hidden = false;
}

/**
 * @param {object} registro
 * @returns {string}
 */
function textoMeta(registro) {
  const correo = registro.creadoPorEmail || "";
  return `${MSG.registro} ${registro.id} · ${correo}`;
}

/**
 * @returns {string}
 */
function idActual() {
  return registroActual && registroActual.id ? registroActual.id : "";
}

/**
 * @returns {void}
 */
function limpiarMensajes() {
  const caja = porId("mensaje-formulario");
  caja.replaceChildren();
  caja.hidden = true;
  porId("aviso-serie").hidden = true;
  document.querySelectorAll("[data-campo]").forEach((nodo) => {
    nodo.classList.remove("invalido");
  });
}

/**
 * @param {boolean} ocupado
 * @returns {void}
 */
function textoBotones(ocupado) {
  const guardar = porId("btn-guardar");
  const guardarPdf = porId("btn-guardar-pdf");
  guardar.disabled = ocupado;
  guardarPdf.disabled = ocupado;
  guardar.textContent = ocupado ? MSG.guardando : MSG.guardar;
  guardarPdf.textContent = ocupado
    ? MSG.guardando
    : MSG.guardarPdf;
}

/**
 * @param {object} registro
 * @param {boolean} nuevo
 * @returns {void}
 */
function abrirModal(registro, nuevo) {
  mostrarExito(
    nuevo ? MSG.creadoTitulo : MSG.actualizadoTitulo,
    nuevo
      ? mensajeCreado(registro.numero)
      : mensajeActualizado(registro.numero),
    MSG.volverListado,
    "#/listado"
  );
}

/**
 * @param {unknown} error
 * @returns {void}
 */
function fallo(error) {
  registrarError(error, "formulario");
  avisar(mensajeError(error), "error");
}

/**
 * Actualiza el autor que firmará el guardado.
 * @param {{uid: string, email: string, nombre: string}} sesion
 * @returns {void}
 */
export function definirAutor(sesion) {
  autorForm = sesion;
}
