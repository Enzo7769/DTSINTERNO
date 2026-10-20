/**
 * Propósito: Detalle admin de una ficha enviada: historial,
 *   plazo y el mismo formulario de configuración.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-14
 * Dependencias: fechas.js, ficha-cliente-*.js, ficha-cliente-pdf.js,
 *   ficha-vista.js, logger.js, ui.js
 */

import { formatearFechaHora } from "./fechas.js";
import { abrirPdfEnvio } from "./ficha-cliente-pdf.js";
import { invalidarEnvios } from "./ficha-cliente-listado.js";
import {
  ampliarPlazo,
  eliminarEnvio,
  guardarEnvioAdmin,
  obtenerEnvio
} from "./ficha-cliente-repositorio.js";
import {
  etiquetaEstado,
  restoPlazo,
  urlPublica
} from "./ficha-cliente-validacion.js";
import {
  montarFichaEn,
  obtenerDatosFicha
} from "./ficha-vista.js";
import { registrarError } from "./logger.js";
import {
  avisar,
  mostrarVista,
  pedirConfirmacion,
  porId
} from "./ui.js";

const TXT = {
  titulo: "Ficha enviada al cliente",
  noHay: "No se encontró esa ficha.",
  guardada: "Cambios guardados.",
  plazoOk: "Plazo actualizado. Si estaba finalizada, "
    + "el cliente ya puede volver a editar.",
  copiado: "Enlace copiado.",
  pdf: "Descargar PDF",
  pdfFallo: "No se pudo descargar el PDF.",
  fallo: "No se pudo guardar.",
  eliminar: "Eliminar licitación",
  confirmarTitulo: "Eliminar licitación",
  confirmarOk: "Eliminar",
  confirmarCancelar: "Cancelar",
  confirmarTexto:
    "Se eliminará la licitación «{nombre}». "
    + "El enlace del cliente dejará de funcionar. "
    + "Esta acción no se puede deshacer.",
  eliminada: "Licitación eliminada.",
  falloEliminar: "No se pudo eliminar la licitación."
};

const ACCION = {
  creada: "Ficha generada",
  guardada: "Guardó la ficha",
  finalizada: "Marcó la ficha como finalizada",
  plazo: "Modificó el plazo",
  reabierta: "Reabrió la ficha al ampliar el plazo"
};

let actual = null;
let autor = null;
let listo = false;

/**
 * @param {{uid: string, email: string}|null} sesion
 * @returns {void}
 */
export function definirAutorDetalleEnvio(sesion) {
  autor = sesion;
}

/**
 * @returns {void}
 */
export function iniciarDetalleEnvio() {
  if (listo) return;
  listo = true;
  porId("btn-envio-volver").addEventListener("click", () => {
    location.hash = "#/fichas-envio";
  });
  porId("btn-envio-copiar").addEventListener("click", () => {
    if (!actual) return;
    navigator.clipboard.writeText(urlPublica(actual.token));
    avisar(TXT.copiado, "ok");
  });
  porId("btn-envio-guardar").addEventListener("click", () => {
    guardar().catch((error) => {
      registrarError(error, "envio.detalle");
      avisar(TXT.fallo, "error");
    });
  });
  porId("btn-envio-plazo").addEventListener("click", () => {
    sumarDias().catch((error) => {
      registrarError(error, "envio.plazo");
      avisar(TXT.fallo, "error");
    });
  });
  porId("btn-envio-pdf").addEventListener("click", () => {
    if (!actual) return;
    abrirPdfEnvio({
      ...actual,
      ...obtenerDatosFicha()
    }).catch((error) => {
      registrarError(error, "envio.pdf");
      avisar(TXT.pdfFallo, "error");
    });
  });
  porId("btn-envio-eliminar").addEventListener("click", () => {
    pedirBorrar();
  });
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function mostrarDetalleEnvio(id) {
  document.title = TXT.titulo;
  mostrarVista("vista-ficha-envio");
  actual = await obtenerEnvio(id);
  if (!actual) {
    porId("envio-detalle-aviso").textContent = TXT.noHay;
    porId("btn-envio-pdf").hidden = true;
    return;
  }
  pintarMeta();
  pintarHistorial();
  montarFichaEn(porId("envio-ficha-cuerpo"), actual, {
    embebido: true,
    internosEditables: actual.estado === "finalizado"
  });
}

/**
 * @returns {void}
 */
function pintarMeta() {
  const resto = restoPlazo(actual.plazoHasta);
  porId("envio-detalle-aviso").textContent = "";
  porId("envio-meta-licitacion").textContent = actual.licitacion || "";
  porId("envio-meta-quien").textContent = actual.rellenadoPor || "—";
  porId("envio-meta-estado").textContent = etiquetaEstado(actual);
  porId("envio-meta-creado").textContent =
    formatearFechaHora(actual.creadoEn);
  porId("envio-meta-modificado").textContent =
    formatearFechaHora(actual.actualizadoEn);
  porId("envio-meta-fin").textContent =
    formatearFechaHora(actual.finalizadoEn) || "—";
  porId("envio-meta-plazo").textContent =
    formatearFechaHora(actual.plazoHasta);
  porId("envio-meta-resto").textContent = resto.texto;
  porId("envio-detalle-enlace").value = urlPublica(actual.token);
  const hayPdf = actual.estado === "finalizado"
    || Boolean(actual.pdfUrl);
  porId("btn-envio-pdf").hidden = !hayPdf;
  porId("btn-envio-pdf").textContent = TXT.pdf;
}

/**
 * @returns {void}
 */
function pintarHistorial() {
  const caja = porId("envio-historial");
  caja.replaceChildren();
  const lista = [...(actual.historial || [])].reverse();
  if (!lista.length) {
    const p = document.createElement("p");
    p.className = "ayuda";
    p.textContent = "Sin modificaciones todavía.";
    caja.append(p);
    return;
  }
  lista.forEach((item) => {
    const li = document.createElement("li");
    const cuando = formatearFechaHora(item.fecha);
    const que = ACCION[item.accion] || item.accion;
    li.textContent = `${cuando} · ${item.quien} · ${que}`;
    caja.append(li);
  });
}

/**
 * @returns {Promise<void>}
 */
async function guardar() {
  if (!actual) return;
  const fresco = await guardarEnvioAdmin(
    obtenerDatosFicha(),
    actual,
    autor || { uid: "", email: "" }
  );
  actual = fresco;
  pintarMeta();
  pintarHistorial();
  avisar(TXT.guardada, "ok");
}

/**
 * @returns {Promise<void>}
 */
async function sumarDias() {
  if (!actual) return;
  const extra = Number(porId("envio-extra-dias").value);
  if (!Number.isFinite(extra) || extra <= 0) return;
  const ms = actual.plazoHasta && actual.plazoHasta.toMillis
    ? actual.plazoHasta.toMillis()
    : Number(actual.plazoHasta) || Date.now();
  const origen = ms > Date.now() ? ms : Date.now();
  actual = await ampliarPlazo(
    actual,
    origen + extra * 86400000,
    autor || { uid: "", email: "" }
  );
  pintarMeta();
  pintarHistorial();
  montarFichaEn(porId("envio-ficha-cuerpo"), actual, {
    embebido: true,
    internosEditables: actual.estado === "finalizado"
  });
  avisar(TXT.plazoOk, "ok");
}

/**
 * @returns {void}
 */
function pedirBorrar() {
  if (!actual) return;
  const nombre = actual.licitacion || "esta licitación";
  pedirConfirmacion({
    titulo: TXT.confirmarTitulo,
    texto: TXT.confirmarTexto.replace("{nombre}", nombre),
    ok: TXT.confirmarOk,
    cancelar: TXT.confirmarCancelar,
    onOk: () => {
      borrar().catch((error) => {
        registrarError(error, "envio.eliminar");
        avisar(TXT.falloEliminar, "error");
      });
    }
  });
}

/**
 * @returns {Promise<void>}
 */
async function borrar() {
  if (!actual) return;
  await eliminarEnvio(actual.id || actual.token);
  invalidarEnvios();
  avisar(TXT.eliminada, "ok");
  location.hash = "#/fichas-envio";
}
