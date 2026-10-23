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
  claseEstado,
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
  titulo: "Enlaces para clientes | DTS",
  kicker: "Ficha de configuración",
  cargando: "Cargando fichas…",
  vacio: "Aún no hay fichas enviadas al cliente.",
  generar: "Generar enlace",
  copiado: "Enlace copiado.",
  creada: "Ficha generada. Copia el enlace para el cliente.",
  fallo: "No se pudo generar la ficha. Revisa la conexión e "
    + "inténtalo de nuevo.",
  diasPregunta: "¿Cuántos días sumar al plazo? (1 a 90)",
  diasReabrir: "Esta ficha está finalizada: al sumar días se reabre "
    + "y el cliente podrá volver a editarla. ¿Cuántos días? (1 a 90)",
  diasInvalidos: "Escribe entre 1 y 90 días.",
  repetida: "Ya hay una ficha enviada con ese nombre de licitación. "
    + "¿Generar otra igual?",
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
    lista.length === 1 ? "1 enlace" : `${lista.length} enlaces`;
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
  const repetida = (cache || []).some((fila) =>
    fila.licitacionClave === revision.datos.licitacionClave);
  if (repetida && !window.confirm(TXT.repetida)) return;
  const boton = porId("btn-envio-generar");
  boton.disabled = true;
  try {
    const guardado = await crearEnvio(
      revision.datos,
      autor || { uid: "", email: "" }
    );
    cache = null;
    porId("envio-licitacion").value = "";
    porId("envio-enlace").value = urlPublica(guardado.token);
    avisar(TXT.creada, "ok");
    await mostrarListadoEnvios();
  } finally {
    boton.disabled = false;
  }
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
    const fila = (cache || []).find((item) => item.id === id);
    if (!fila) return;
    const pregunta = fila.estado === "finalizado"
      ? TXT.diasReabrir
      : TXT.diasPregunta;
    const respuesta = window.prompt(pregunta, "3");
    if (respuesta === null) return;
    const extra = Number(respuesta);
    if (!Number.isInteger(extra) || extra < 1 || extra > 90) {
      avisar(TXT.diasInvalidos, "aviso");
      return;
    }
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
    [String(fila.numero || ""), "numero"],
    [fila.licitacion || "", "fuerte"],
    [fila.rellenadoPor || "—", ""],
    [formatearFechaHora(fila.creadoEn), "nowrap"],
    [formatearFechaHora(fila.actualizadoEn), "nowrap"],
    [formatearFechaHora(fila.finalizadoEn) || "—", "nowrap"],
    [formatearFechaHora(fila.plazoHasta), "nowrap"],
    [resto.texto, "nowrap"]
  ];
  celdas.forEach(([texto, clase]) => {
    const td = document.createElement("td");
    td.textContent = texto;
    if (clase) td.className = clase;
    tr.append(td);
  });
  const estado = document.createElement("td");
  const pill = document.createElement("span");
  pill.className = `pill ${claseEstado(fila)}`;
  pill.textContent = etiquetaEstado(fila);
  estado.append(pill);
  tr.append(estado, acciones(fila));
  return tr;
}

/**
 * @param {object} fila
 * @returns {HTMLTableCellElement}
 */
function acciones(fila) {
  const td = document.createElement("td");
  td.className = "acciones";
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
