/**
 * Propósito: Tabla de fichas enviadas al cliente, al
 *   estilo del listado de checklists de salida.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-14
 * Dependencias: fechas.js, ficha-cliente-pdf.js,
 *   ficha-cliente-repositorio.js, ficha-cliente-validacion.js,
 *   ficha-datos.js, logger.js, ui.js
 */

import { APP } from "./config.js";
import { formatearFechaHora } from "./fechas.js";
import { abrirPdfEnvio } from "./ficha-cliente-pdf.js";
import {
  ampliarPlazo,
  crearEnvio,
  eliminarEnvio,
  listarEnvios
} from "./ficha-cliente-repositorio.js";
import {
  etiquetaEstado,
  plazoDeCampo,
  plazoDesdeDias,
  restoPlazo,
  urlPublica,
  validarEnvio
} from "./ficha-cliente-validacion.js";
import { fichaEnBlanco } from "./ficha-datos.js";
import { registrarError } from "./logger.js";
import { avisar, mostrarVista, pedirConfirmacion, porId } from "./ui.js";

const TXT = {
  titulo: "Fichas de licitaciones",
  kicker: "Configuración para el cliente",
  registros: "fichas",
  cargando: "Cargando fichas…",
  vacio: "Aún no hay fichas enviadas al cliente.",
  generar: "Generar ficha",
  copiado: "Enlace copiado.",
  creada: "Ficha generada. Copia el enlace para el cliente.",
  fallo: "No se pudo generar la ficha. Publica "
    + "firestore.rules en Firebase e inténtalo de nuevo.",
  plazoOk: "Plazo actualizado.",
  ver: "Ver",
  copiar: "Copiar enlace",
  ampliar: "Sumar días",
  pdf: "PDF",
  pdfFallo: "No se pudo descargar el PDF.",
  eliminar: "Eliminar",
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

let cache = null;
let autor = null;
let listo = false;

/**
 * @param {{uid: string, email: string}|null} sesion
 * @returns {void}
 */
export function definirAutorEnvios(sesion) {
  autor = sesion;
}

/**
 * @returns {void}
 */
export function invalidarEnvios() {
  cache = null;
}

/**
 * @returns {void}
 */
export function iniciarListadoEnvios() {
  if (listo) return;
  listo = true;
  porId("form-envio-nueva").addEventListener("submit", (evento) => {
    evento.preventDefault();
  });
  porId("btn-envio-generar").addEventListener("click", () => {
    generar().catch((error) => {
      registrarError(error, "envio.generar");
      avisar(TXT.fallo, "error");
    });
  });
  porId("envio-cuerpo").addEventListener("click", (evento) => {
    const btn = evento.target.closest("[data-envio]");
    if (!btn) return;
    alAccion(btn.dataset.envio, btn.dataset.id).catch((error) => {
      registrarError(error, "envio.accion");
    });
  });
}

/**
 * @returns {Promise<void>}
 */
export async function mostrarListadoEnvios() {
  document.title = TXT.titulo;
  mostrarVista("vista-fichas-envio");
  porId("estado-envios").textContent = TXT.cargando;
  porId("estado-envios").hidden = false;
  cache = await listarEnvios();
  pintar();
}

/**
 * @returns {void}
 */
function pintar() {
  const lista = cache || [];
  const cuerpo = porId("envio-cuerpo");
  cuerpo.replaceChildren();
  porId("conteo-envios").textContent =
    `${lista.length} ${TXT.registros}`;
  if (!lista.length) {
    porId("estado-envios").textContent = TXT.vacio;
    porId("estado-envios").hidden = false;
    return;
  }
  porId("estado-envios").hidden = true;
  lista.forEach((fila) => cuerpo.append(crearFila(fila)));
}

/**
 * @returns {Promise<void>}
 */
async function generar() {
  const licitacion = porId("envio-licitacion").value.trim();
  const dias = Number(porId("envio-dias").value)
    || APP.plazoFichaDias;
  const fecha = plazoDeCampo(porId("envio-limite").value);
  const plazoHasta = fecha || plazoDesdeDias(dias);
  const revision = validarEnvio({
    ...fichaEnBlanco(licitacion),
    licitacion,
    plazoHasta,
    estado: "pendiente",
    rellenadoPor: "",
    historial: []
  });
  if (!revision.ok) {
    avisar(revision.mensaje, "error");
    return;
  }
  const guardado = await crearEnvio(
    revision.datos,
    autor || { uid: "", email: "" }
  );
  cache = null;
  porId("envio-enlace").value = urlPublica(guardado.token);
  avisar(TXT.creada, "ok");
  await mostrarListadoEnvios();
}

/**
 * @param {string} accion
 * @param {string} id
 * @returns {Promise<void>}
 */
async function alAccion(accion, id) {
  if (accion === "ver") {
    location.hash = `#/ficha-envio?id=${encodeURIComponent(id)}`;
    return;
  }
  if (accion === "copiar") {
    await navigator.clipboard.writeText(urlPublica(id));
    avisar(TXT.copiado, "ok");
    return;
  }
  if (accion === "pdf") {
    const fila = (cache || []).find((item) => item.id === id);
    if (!fila) return;
    try {
      await abrirPdfEnvio(fila);
    } catch (error) {
      registrarError(error, "envio.pdf");
      avisar(TXT.pdfFallo, "error");
    }
    return;
  }
  if (accion === "eliminar") {
    pedirBorrar(id);
    return;
  }
  if (accion === "ampliar") {
    const extra = Number(prompt("¿Cuántos días sumar?", "3"));
    if (!Number.isFinite(extra) || extra <= 0) return;
    const fila = (cache || []).find((item) => item.id === id);
    if (!fila) return;
    const ms = fila.plazoHasta && fila.plazoHasta.toMillis
      ? fila.plazoHasta.toMillis()
      : (Number(fila.plazoHasta) || Date.now());
    const origen = ms > Date.now() ? ms : Date.now();
    await ampliarPlazo(
      fila,
      origen + extra * 86400000,
      autor || { uid: "", email: "" }
    );
    cache = null;
    avisar(TXT.plazoOk, "ok");
    await mostrarListadoEnvios();
  }
}

/**
 * @param {object} fila
 * @returns {HTMLTableRowElement}
 */
function crearFila(fila) {
  const tr = document.createElement("tr");
  const resto = restoPlazo(fila.plazoHasta);
  const celdas = [
    String(fila.numero || ""),
    fila.licitacion || "",
    fila.rellenadoPor || "—",
    formatearFechaHora(fila.creadoEn),
    formatearFechaHora(fila.actualizadoEn),
    formatearFechaHora(fila.finalizadoEn) || "—",
    formatearFechaHora(fila.plazoHasta),
    resto.texto,
    etiquetaEstado(fila)
  ];
  celdas.forEach((texto) => {
    const td = document.createElement("td");
    td.textContent = texto;
    tr.append(td);
  });
  tr.append(acciones(fila));
  return tr;
}

/**
 * @param {object} fila
 * @returns {HTMLTableCellElement}
 */
function acciones(fila) {
  const td = document.createElement("td");
  td.className = "tabla-acciones";
  const botones = [
    [TXT.ver, "ver"],
    [TXT.copiar, "copiar"],
    [TXT.ampliar, "ampliar"]
  ];
  if (fila.estado === "finalizado" || fila.pdfUrl) {
    botones.push([TXT.pdf, "pdf"]);
  }
  botones.push([TXT.eliminar, "eliminar"]);
  botones.forEach(([texto, accion]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = accion === "eliminar"
      ? "boton boton-peligro"
      : "boton boton-secundario";
    btn.textContent = texto;
    btn.dataset.envio = accion;
    btn.dataset.id = fila.id;
    td.append(btn);
  });
  return td;
}

/**
 * @param {string} id
 * @returns {void}
 */
function pedirBorrar(id) {
  const fila = (cache || []).find((item) => item.id === id);
  const nombre = (fila && fila.licitacion) || "esta licitación";
  pedirConfirmacion({
    titulo: TXT.confirmarTitulo,
    texto: textoBorrar(nombre),
    ok: TXT.confirmarOk,
    cancelar: TXT.confirmarCancelar,
    onOk: () => {
      borrar(id).catch((error) => {
        registrarError(error, "envio.eliminar");
        avisar(TXT.falloEliminar, "error");
      });
    }
  });
}

/**
 * @param {string} nombre
 * @returns {string}
 */
function textoBorrar(nombre) {
  return TXT.confirmarTexto.replace("{nombre}", nombre);
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
async function borrar(id) {
  await eliminarEnvio(id);
  cache = null;
  avisar(TXT.eliminada, "ok");
  await mostrarListadoEnvios();
}
