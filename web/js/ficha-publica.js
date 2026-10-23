/**
 * Propósito: Página externa para que el cliente rellene
 *   solo la ficha de configuración, con plazo en vivo.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-14
 * Dependencias: ficha-cliente-*.js, ficha-vista.js, logger.js,
 *   ui.js
 */

import {
  bajarBlob,
  blobFichaPdf,
  descargarFichaPdf,
  nombrePdfFicha
} from "./ficha-cliente-pdf.js";
import {
  guardarEnvioCliente,
  obtenerEnvio
} from "./ficha-cliente-repositorio.js";
import { millisDe } from "./fechas.js";
import {
  clientePuedeEditar,
  clientePuedeVer,
  restoPlazo,
  validarNombreCliente
} from "./ficha-cliente-validacion.js";
import {
  detalleFaltantes,
  faltantesPorGrupo
} from "./ficha-seguridad.js";
import {
  irACampoFicha,
  limpiarMarcasFaltantes,
  marcarCamposFaltantes,
  marcarFichaSoloLectura,
  montarFichaEn,
  obtenerDatosFicha
} from "./ficha-vista.js";
import { registrarError } from "./logger.js";
import { mostrar, porId } from "./ui.js";

const TXT = {
  titulo: "Ficha de configuración",
  faltaToken: "Este enlace no es válido.",
  noHay: "No encontramos esta ficha.",
  vencido:
    "Este enlace ya no funciona. El plazo venció. "
    + "Si necesitas entrar de nuevo, pide más tiempo "
    + "al administrador.",
  soloLectura:
    "Ficha finalizada. Puedes revisar lo que enviaste "
    + "hasta que venza el plazo. Ya no se puede editar.",
  faltaNombre: "Escribe tu nombre antes de guardar.",
  guardada:
    "Cambios guardados. El estado queda en proceso. "
    + "Puedes seguir editando hasta el plazo o finalizar.",
  finalizada:
    "Ficha finalizada. Gracias. El PDF se descarga "
    + "una sola vez. Puedes revisar tus respuestas "
    + "hasta el plazo.",
  pdf: "Descargar PDF (solo una vez)",
  pdfFallo: "No se pudo generar el PDF.",
  pdfHecho: "El PDF ya se descargó. Queda en resguardo "
    + "del administrador.",
  reabierta:
    "El administrador amplió el plazo. "
    + "Ya puedes seguir editando y finalizar de nuevo.",
  fallo:
    "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo. "
    + "Si usas bloqueador de anuncios, permite este sitio.",
  rechazado:
    "No se pudo guardar: el plazo venció o el administrador "
    + "cerró la ficha. Recarga la página para ver su estado.",
  sinAcceso:
    "Este enlace ya no está disponible: el plazo venció o el "
    + "enlace no existe. Si necesitas entrar, pide más tiempo al "
    + "administrador.",
  seguro: "¿Está seguro de que quiere guardar?",
  faltanTitulo: "Faltan estos campos:",
  sinFaltan: "Se guardará el avance de la ficha.",
  notaPlazo:
    "Igual podrá seguir editando hasta el plazo "
    + "de tiempo.",
  continuar: "Continuar",
  seguir: "Continuar editando",
  faltanFinal: "Completa estos campos:"
};

let actual = null;
let tick = 0;
let pulso = 0;
/** @type {(() => void)|null} */
let dialogoOk = null;
/** @type {{blob: Blob, nombre: string}|null} */
let pdfLocal = null;
/** El cliente solo baja el PDF una vez por finalización. */
let pdfYaEntregado = false;

/**
 * @param {string} token
 * @returns {Promise<void>}
 */
export async function mostrarFichaPublica(token) {
  document.title = TXT.titulo;
  mostrar(porId("pantalla-login"), false);
  mostrar(porId("pantalla-denegado"), false);
  mostrar(porId("pantalla-app"), false);
  mostrar(porId("pantalla-publica"), true);
  detenerTick();
  porId("pub-aviso").textContent = "";
  ocultarFaltantes();
  if (!token) {
    porId("pub-aviso").textContent = TXT.faltaToken;
    ocultarFormularioVencido();
    return;
  }
  try {
    actual = await obtenerEnvio(token);
  } catch (error) {
    registrarError(error, "ficha.publica.abrir");
    actual = null;
    porId("pub-aviso").textContent = esPermiso(error)
      ? TXT.sinAcceso
      : TXT.fallo;
    ocultarFormularioVencido();
    return;
  }
  if (!actual) {
    porId("pub-aviso").textContent = TXT.noHay;
    cerrarEnlaceVencido(false);
    return;
  }
  pdfLocal = null;
  pdfYaEntregado = false;
  pulso = 0;
  pintarPaginaPublica();
  tick = window.setInterval(alTick, 1000);
  enlazar();
}

/**
 * @returns {void}
 */
export function ocultarFichaPublica() {
  detenerTick();
  mostrar(porId("pantalla-publica"), false);
}

/**
 * @returns {void}
 */
function enlazar() {
  const caja = porId("pantalla-publica");
  if (caja.dataset.listo) return;
  caja.dataset.listo = "1";
  porId("btn-pub-guardar").addEventListener("click", () => {
    pedirGuardar();
  });
  porId("btn-pub-finalizar").addEventListener("click", () => {
    pedirFinalizar();
  });
  porId("btn-pub-pdf").addEventListener("click", () => {
    bajarPdfCliente();
  });
  porId("pub-dialogo-ok").addEventListener("click", () => {
    const fn = dialogoOk;
    cerrarDialogo();
    if (fn) fn();
  });
  porId("pub-dialogo-edit").addEventListener("click", () => {
    cerrarDialogo();
  });
}

/**
 * @returns {void}
 */
function pedirGuardar() {
  if (!actual || !clientePuedeEditar(actual)) return;
  const nombre = validarNombreCliente(porId("pub-nombre").value);
  const faltan = detalleFaltantes(obtenerDatosFicha());
  if (!nombre.ok) {
    faltan.unshift({
      texto: TXT.faltaNombre,
      ruta: "pub-nombre"
    });
  }
  pintarFaltantesRojo(faltan, {
    titulo: TXT.seguro,
    extra: faltan.length ? TXT.faltanTitulo : TXT.sinFaltan,
    nota: TXT.notaPlazo,
    guardar: true
  });
}

/**
 * @returns {void}
 */
function pedirFinalizar() {
  if (!actual || !clientePuedeEditar(actual)) return;
  const nombre = validarNombreCliente(porId("pub-nombre").value);
  const faltan = detalleFaltantes(obtenerDatosFicha());
  if (!nombre.ok) {
    faltan.unshift({
      texto: TXT.faltaNombre,
      ruta: "pub-nombre"
    });
  }
  if (faltan.length) {
    pintarFaltantesRojo(faltan);
    return;
  }
  ocultarFaltantes();
  persistir(true).catch(fallo);
}

/**
 * Lista en rojo; cada línea lleva al campo.
 * @param {{texto: string, ruta: string}[]} faltan
 * @param {{titulo?: string, extra?: string,
 *   nota?: string, guardar?: boolean}} [ops]
 * @returns {void}
 */
function pintarFaltantesRojo(faltan, ops) {
  const opt = ops || {};
  porId("pub-aviso").textContent = "";
  const caja = porId("pub-faltan");
  caja.hidden = false;
  caja.replaceChildren();
  const tit = document.createElement("p");
  tit.className = "ficha-faltan-seguro";
  tit.textContent = opt.titulo || TXT.faltanFinal;
  caja.append(tit);
  if (opt.extra) {
    const extra = document.createElement("p");
    extra.className = "ficha-faltan-extra";
    extra.textContent = opt.extra;
    caja.append(extra);
  }
  faltantesPorGrupo(faltan).forEach((grupo, i) => {
    caja.append(bloqueFaltantes(grupo, i === 0));
  });
  if (opt.nota) {
    const nota = document.createElement("p");
    nota.className = "ayuda ficha-faltan-nota";
    nota.textContent = opt.nota;
    caja.append(nota);
  }
  if (opt.guardar) caja.append(accionesGuardar());
  marcarCamposFaltantes(faltan);
  caja.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Continuar guarda; Continuar editando deja la lista.
 * @returns {HTMLElement}
 */
function accionesGuardar() {
  const caja = document.createElement("div");
  caja.className = "ficha-faltan-acciones";
  const ok = document.createElement("button");
  ok.type = "button";
  ok.className = "boton";
  ok.textContent = TXT.continuar;
  ok.addEventListener("click", () => {
    persistir(false).catch(fallo);
  });
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "boton boton-secundario";
  edit.textContent = TXT.seguir;
  edit.addEventListener("click", () => seguirEditando());
  caja.append(ok, edit);
  return caja;
}

/**
 * No guarda. Si hay errores, deja el acordeón para ir al campo.
 * @returns {void}
 */
function seguirEditando() {
  const caja = porId("pub-faltan");
  caja.querySelectorAll(
    ".ficha-faltan-acciones, .ficha-faltan-nota, "
    + ".ficha-faltan-seguro, .ficha-faltan-extra"
  ).forEach((n) => n.remove());
  if (!caja.querySelector(".ficha-faltan-pagina")) {
    ocultarFaltantes();
  }
}

/**
 * @param {{titulo: string, items: {texto: string, ruta: string}[]}} grupo
 * @param {boolean} abierto
 * @returns {HTMLElement}
 */
function bloqueFaltantes(grupo, abierto) {
  const sec = document.createElement("section");
  sec.className = "ficha-faltan-pagina";
  if (abierto) sec.classList.add("es-abierto");
  const h = document.createElement("button");
  h.type = "button";
  h.className = "ficha-faltan-grupo";
  h.setAttribute("aria-expanded", abierto ? "true" : "false");
  h.textContent = `${grupo.titulo} (${grupo.items.length})`;
  const lista = document.createElement("div");
  lista.className = "ficha-faltan-lista";
  lista.hidden = !abierto;
  grupo.items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ficha-faltan-item";
    btn.textContent = item.texto;
    btn.addEventListener("click", () => {
      irACampoFicha(item.ruta);
    });
    lista.append(btn);
  });
  h.addEventListener("click", () => {
    alternarGrupoFaltan(sec, lista, h);
  });
  sec.append(h, lista);
  return sec;
}

/**
 * Una pestaña abierta a la vez. Si ya está abierta, se cierra.
 * @param {HTMLElement} sec
 * @param {HTMLElement} lista
 * @param {HTMLElement} btn
 * @returns {void}
 */
function alternarGrupoFaltan(sec, lista, btn) {
  const caja = sec.parentElement;
  const ya = !lista.hidden;
  if (caja) {
    caja.querySelectorAll(".ficha-faltan-pagina").forEach((n) => {
      n.classList.remove("es-abierto");
      const l = n.querySelector(".ficha-faltan-lista");
      const b = n.querySelector(".ficha-faltan-grupo");
      if (l) l.hidden = true;
      if (b) b.setAttribute("aria-expanded", "false");
    });
  }
  if (ya) return;
  lista.hidden = false;
  sec.classList.add("es-abierto");
  btn.setAttribute("aria-expanded", "true");
}

/**
 * @returns {void}
 */
function ocultarFaltantes() {
  const caja = porId("pub-faltan");
  caja.hidden = true;
  caja.replaceChildren();
  limpiarMarcasFaltantes();
}

/**
 * @param {{
 *   titulo: string,
 *   texto: string,
 *   faltan: string[],
 *   nota: string,
 *   ok: string,
 *   onOk: (() => void)|null
 * }} ops
 * @returns {void}
 */
function abrirDialogo(ops) {
  dialogoOk = ops.onOk;
  porId("pub-dialogo-titulo").textContent = ops.titulo;
  porId("pub-dialogo-texto").textContent = ops.texto;
  porId("pub-dialogo-nota").textContent = ops.nota || "";
  const ul = porId("pub-dialogo-faltan");
  ul.replaceChildren();
  (ops.faltan || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.append(li);
  });
  const ok = porId("pub-dialogo-ok");
  ok.hidden = !ops.ok;
  ok.textContent = ops.ok || TXT.continuar;
  porId("pub-dialogo").hidden = false;
}

/**
 * @returns {void}
 */
function cerrarDialogo() {
  porId("pub-dialogo").hidden = true;
  dialogoOk = null;
}

/**
 * @param {boolean} finalizar
 * @returns {Promise<void>}
 */
async function persistir(finalizar) {
  if (!actual || !clientePuedeEditar(actual)) return;
  const nombre = validarNombreCliente(porId("pub-nombre").value);
  if (!nombre.ok) {
    porId("pub-aviso").textContent = TXT.faltaNombre;
    return;
  }
  const plazo = actual.plazoHasta;
  const datos = obtenerDatosFicha();
  if (finalizar) {
    await intentarResguardo(datos, nombre.nombre);
  }
  actual = await guardarEnvioCliente(
    datos,
    actual,
    nombre.nombre,
    finalizar
  );
  if (plazo) actual.plazoHasta = plazo;
  ocultarFaltantes();
  if (!finalizar) {
    actual.estado = "en_curso";
    porId("pub-aviso").textContent = TXT.guardada;
    marcarFichaSoloLectura(false);
    bloquearCabecera(false);
    return;
  }
  actual.estado = "finalizado";
  porId("pub-aviso").textContent = TXT.finalizada;
  marcarFichaSoloLectura(true);
  bloquearCabecera(true);
  entregarPdfUnaVez();
  pintarAcciones();
}

/**
 * Arma el PDF en el navegador. No usa Firebase Storage.
 * @param {object} datos
 * @param {string} quien
 * @returns {Promise<void>}
 */
async function intentarResguardo(datos, quien) {
  const envio = {
    ...actual,
    ...datos,
    rellenadoPor: quien,
    estado: "finalizado",
    finalizadoEn: Date.now()
  };
  try {
    const blob = await blobFichaPdf(envio);
    pdfLocal = { blob, nombre: nombrePdfFicha(envio) };
  } catch (error) {
    registrarError(error, "ficha.pdf");
    pdfLocal = null;
  }
}

/**
 * @returns {Promise<void>}
 */
async function bajarPdfCliente() {
  if (pdfYaEntregado) {
    porId("pub-aviso").textContent = TXT.pdfHecho;
    mostrarPdfCliente(false);
    return;
  }
  try {
    if (pdfLocal && pdfLocal.blob) {
      bajarBlob(pdfLocal.blob, pdfLocal.nombre);
    } else {
      const envio = {
        ...actual,
        ...obtenerDatosFicha(),
        rellenadoPor: porId("pub-nombre").value
      };
      await descargarFichaPdf(envio);
    }
    pdfYaEntregado = true;
    mostrarPdfCliente(false);
    porId("pub-aviso").textContent = TXT.pdfHecho;
  } catch (error) {
    registrarError(error, "ficha.pdf");
    porId("pub-aviso").textContent = TXT.pdfFallo;
  }
}

/**
 * Al finalizar se baja una vez. Si el navegador lo
 * bloquea, queda el botón solo en esta sesión.
 * @returns {void}
 */
function entregarPdfUnaVez() {
  if (pdfYaEntregado) {
    mostrarPdfCliente(false);
    return;
  }
  if (pdfLocal && pdfLocal.blob) {
    bajarBlob(pdfLocal.blob, pdfLocal.nombre);
    pdfYaEntregado = true;
    mostrarPdfCliente(false);
    return;
  }
  mostrarPdfCliente(true);
}

/**
 * @param {boolean} ver
 * @returns {void}
 */
function mostrarPdfCliente(ver) {
  const btn = porId("btn-pub-pdf");
  btn.hidden = !ver;
  btn.textContent = TXT.pdf;
}

/**
 * @returns {void}
 */
function pintarAcciones() {
  const editar = clientePuedeEditar(actual);
  porId("btn-pub-guardar").hidden = !editar;
  porId("btn-pub-finalizar").hidden = !editar;
  mostrarPdfCliente(!pdfYaEntregado && Boolean(pdfLocal));
}

/**
 * Muestra la ficha o cierra el enlace si el plazo venció.
 * @returns {void}
 */
function pintarPaginaPublica() {
  if (!actual || !clientePuedeVer(actual)) {
    cerrarEnlaceVencido(true);
    return;
  }
  abrirBloqueForm();
  porId("pub-licitacion").textContent = actual.licitacion || "";
  porId("pub-nombre").value = actual.rellenadoPor || "";
  const editable = clientePuedeEditar(actual);
  montarFichaEn(porId("pub-ficha-cuerpo"), actual, {
    publico: true,
    soloLectura: !editable
  });
  bloquearCabecera(!editable);
  pintarAcciones();
  if (actual.estado === "finalizado") {
    porId("pub-aviso").textContent = TXT.soloLectura;
  }
  pintarPlazo();
}

/**
 * @param {boolean} avisar
 * @returns {void}
 */
function cerrarEnlaceVencido(avisar) {
  ocultarFormularioVencido();
  if (avisar) porId("pub-aviso").textContent = TXT.vencido;
  if (!actual) return;
  const resto = restoPlazo(actual.plazoHasta);
  const reloj = porId("pub-reloj");
  reloj.textContent = resto.texto;
  reloj.classList.toggle("es-vencido", resto.vencido);
}

/**
 * Quita la ficha del enlace. No deja ver respuestas.
 * @returns {void}
 */
function ocultarFormularioVencido() {
  mostrar(porId("pub-bloque-form"), false);
  porId("pub-ficha-cuerpo").replaceChildren();
  porId("pub-licitacion").textContent = "";
  mostrarPdfCliente(false);
}

/**
 * @returns {void}
 */
function abrirBloqueForm() {
  mostrar(porId("pub-bloque-form"), true);
}

/**
 * @returns {void}
 */
function alTick() {
  pintarPlazo();
  pulso += 1;
  if (pulso % 15 === 0) {
    sincronizar().catch(() => {});
  }
}

/**
 * @returns {void}
 */
function pintarPlazo() {
  if (!actual) return;
  const resto = restoPlazo(actual.plazoHasta);
  const reloj = porId("pub-reloj");
  reloj.textContent = resto.texto;
  reloj.classList.toggle("es-vencido", resto.vencido);
  if (resto.conocido && resto.vencido) {
    ocultarFormularioVencido();
    porId("pub-aviso").textContent = TXT.vencido;
    return;
  }
  if (actual.estado === "finalizado") {
    marcarFichaSoloLectura(true);
    bloquearCabecera(true);
    pintarAcciones();
  }
}

/**
 * Si el admin suma días, desbloquea Guardar y Finalizar.
 * @returns {Promise<void>}
 */
async function sincronizar() {
  if (!actual) return;
  const token = actual.token || actual.id;
  const fresco = await obtenerEnvio(token);
  if (!fresco) return;
  const podiaVer = clientePuedeVer(actual);
  const podiaEditar = clientePuedeEditar(actual);
  if (millisDe(fresco.plazoHasta)) {
    actual.plazoHasta = fresco.plazoHasta;
  }
  if (fresco.estado !== "finalizado" || actual.estado === "finalizado") {
    actual.estado = fresco.estado;
  }
  actual.finalizadoEn = fresco.finalizadoEn;
  if (fresco.pdfUrl) actual.pdfUrl = fresco.pdfUrl;
  if (fresco.pdfRuta) actual.pdfRuta = fresco.pdfRuta;
  if (!clientePuedeVer(actual)) {
    cerrarEnlaceVencido(true);
    return;
  }
  if (!podiaVer || (clientePuedeEditar(actual) && !podiaEditar)) {
    actual = fresco;
    if (clientePuedeEditar(actual) && !podiaEditar) {
      pdfLocal = null;
      pdfYaEntregado = false;
    }
    pintarPaginaPublica();
    if (clientePuedeEditar(actual) && !podiaEditar) {
      porId("pub-aviso").textContent = TXT.reabierta;
    }
    return;
  }
  pintarPlazo();
}

/**
 * @param {boolean} bloquear
 * @returns {void}
 */
function bloquearCabecera(bloquear) {
  porId("pub-nombre").disabled = bloquear;
  porId("btn-pub-guardar").disabled = bloquear;
  porId("btn-pub-finalizar").disabled = bloquear;
}

/**
 * @returns {void}
 */
function detenerTick() {
  if (tick) window.clearInterval(tick);
  tick = 0;
}

/**
 * @param {Error} error
 * @returns {void}
 */
function fallo(error) {
  registrarError(error, "ficha.publica");
  porId("pub-aviso").textContent = esPermiso(error)
    ? TXT.rechazado
    : TXT.fallo;
}

/**
 * Las reglas rechazan cuando el plazo venció o la ficha se cerró.
 * @param {unknown} error
 * @returns {boolean}
 */
function esPermiso(error) {
  return Boolean(error && typeof error === "object"
    && "code" in error && error.code === "permission-denied");
}
