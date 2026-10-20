/**
 * Propósito: Armar y descargar el PDF del checklist.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: catalogo.js, constantes.js, fechas.js, logger.js
 */

import { SECCIONES, tituloCierre, tituloSeccion } from "./catalogo.js";
import { itemAplica } from "./validacion.js";
import { ETIQUETA_ESTADO, MSG, URL_HTML2PDF } from "./constantes.js";
import { ahoraLegible, formatearFecha } from "./fechas.js";
import { etiquetaTipo, TXT_TIPO } from "./tipos-equipo.js";
import { registrarError } from "./logger.js";

const COLUMNA_ITEM = {
  monitoreo: "Ítem / configuración",
  pantalla: "Ítem / hardware",
  impresora: "Ítem / periférico",
  red: "Ítem / componente",
  sistema: "Ítem / componente",
  aplicacion: "Ítem / componente"
};

let carga = null;

/**
 * Descarga el checklist en PDF. Si falla, abre imprimir.
 * @param {object} datos
 * @returns {Promise<void>}
 */
export function descargarPdf(datos) {
  return generarPdf(
    (zona) => construir(zona, datos),
    nombreArchivo(datos)
  );
}

/**
 * Arma el contenido con la función dada y lo descarga en A4.
 * Si falla, abre la ventana de impresión.
 * @param {(zona: HTMLElement) => void} armar
 * @param {string} nombre
 * @returns {Promise<void>}
 */
export async function generarPdf(armar, nombre) {
  const zona = document.getElementById("zona-pdf");
  const cortina = document.getElementById("cortina");
  try {
    await prepararPdf(zona, cortina, armar);
    await window.html2pdf().set(opciones(nombre)).from(zona).save();
  } catch (error) {
    registrarError(error, "descargarPdf");
    window.alert(MSG.errorPdf);
    document.body.classList.add("imprimir");
    window.print();
    document.body.classList.remove("imprimir");
  } finally {
    ocultarZonaPdf(zona, cortina);
  }
}

/**
 * Misma composición que generarPdf, pero entrega el Blob.
 * @param {(zona: HTMLElement) => void} armar
 * @param {string} nombre
 * @returns {Promise<Blob>}
 */
export async function blobPdf(armar, nombre) {
  const zona = document.getElementById("zona-pdf");
  const cortina = document.getElementById("cortina");
  try {
    await prepararPdf(zona, cortina, armar);
    const worker = window.html2pdf()
      .set(opciones(nombre))
      .from(zona);
    const pdf = await worker.toPdf().get("pdf");
    const blob = pdf && pdf.output("blob");
    if (!(blob instanceof Blob)) {
      throw new Error("PDF sin blob");
    }
    return blob;
  } catch (error) {
    registrarError(error, "blobPdf");
    throw error;
  } finally {
    ocultarZonaPdf(zona, cortina);
  }
}

/**
 * @param {HTMLElement} zona
 * @param {HTMLElement} cortina
 * @param {(zona: HTMLElement) => void} armar
 * @returns {Promise<void>}
 */
async function prepararPdf(zona, cortina, armar) {
  cortina.hidden = false;
  zona.replaceChildren();
  armar(zona);
  zona.hidden = false;
  await esperarImagenes(zona);
  await cargarLibreria();
}

/**
 * @param {HTMLElement} zona
 * @param {HTMLElement} cortina
 * @returns {void}
 */
function ocultarZonaPdf(zona, cortina) {
  zona.hidden = true;
  cortina.hidden = true;
}

/**
 * @param {string} nombre
 * @returns {object}
 */
function opciones(nombre) {
  return {
    margin: [8, 8, 10, 8],
    filename: nombre,
    image: { type: "jpeg", quality: 0.96 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait"
    },
    pagebreak: {
      mode: ["css", "legacy"],
      before: [".salto-pagina"],
      avoid: [".evitar-corte"]
    }
  };
}

/**
 * @param {HTMLElement} zona
 * @param {object} datos
 * @returns {void}
 */
function construir(zona, datos) {
  zona.replaceChildren();
  zona.append(cabecera(datos));
  zona.append(tablaDatos(datos));
  SECCIONES.forEach((seccion) => {
    const bloque = tablaSeccion(seccion, datos);
    if (bloque) zona.append(bloque);
  });
  zona.append(cierre(datos));
  zona.append(firmas(datos));
  zona.append(pie());
}

/**
 * @param {object} datos
 * @returns {HTMLElement}
 */
function cabecera(datos) {
  const tabla = document.createElement("table");
  tabla.className = "pdf-marca evitar-corte";
  const fila = document.createElement("tr");
  const logoCelda = document.createElement("td");
  const logo = document.createElement("img");
  logo.src = "./assets/logo-dts.png";
  logo.alt = "DTS Autoservicio";
  logo.className = "pdf-logo";
  logoCelda.append(logo);
  const texto = document.createElement("td");
  const titulo = document.createElement("div");
  titulo.className = "pdf-titulo";
  titulo.textContent = MSG.tituloPdf;
  const sub = document.createElement("div");
  sub.className = "pdf-sub";
  sub.textContent = MSG.subtituloPdf;
  const numero = document.createElement("div");
  numero.className = "pdf-num";
  numero.textContent = datos.numero
    ? `${MSG.columnaNumero} ${datos.numero}`
    : MSG.borradorPdf;
  texto.append(titulo, sub, numero);
  fila.append(logoCelda, texto);
  tabla.append(fila);
  return tabla;
}

/**
 * @param {object} datos
 * @returns {HTMLElement}
 */
function tablaDatos(datos) {
  const bloque = document.createElement("section");
  bloque.className = "evitar-corte";
  const titulo = document.createElement("h2");
  titulo.textContent = MSG.seccionDatos;
  const tabla = document.createElement("table");
  tabla.className = "pdf-tabla pdf-ficha";
  tabla.append(filaTipo(datos.tipoEquipo));
  const filas = [
    [
      MSG.proyecto,
      datos.proyecto,
      MSG.fechaInspeccion,
      fecha(datos.fechaInspeccion)
    ],
    [MSG.cliente, datos.cliente, MSG.tecnico, datos.tecnico],
    [MSG.serie, datos.numeroSerie, MSG.mac, datos.mac],
    [MSG.ip, datos.ip, MSG.fechaSalida, fecha(datos.fechaSalida)]
  ];
  filas.forEach((par) => {
    tabla.append(filaDoble(par));
  });
  bloque.append(titulo, tabla);
  return bloque;
}

/**
 * @param {string} tipo
 * @returns {HTMLTableRowElement}
 */
function filaTipo(tipo) {
  const tr = document.createElement("tr");
  tr.className = "evitar-corte";
  const titulo = document.createElement("th");
  titulo.textContent = TXT_TIPO.leyenda;
  const valor = document.createElement("td");
  valor.colSpan = 3;
  valor.textContent = etiquetaTipo(tipo) || "—";
  tr.append(titulo, valor);
  return tr;
}

/**
 * @param {object} seccion
 * @param {object} datos
 * @returns {HTMLElement|null}
 */
function tablaSeccion(seccion, datos) {
  const bloque = document.createElement("section");
  const titulo = document.createElement("h2");
  titulo.textContent = tituloSeccion(seccion, datos.tipoEquipo);
  const tabla = document.createElement("table");
  tabla.className = "pdf-tabla";
  const cabeza = document.createElement("tr");
  const etiquetas = [
    MSG.colMarca,
    COLUMNA_ITEM[seccion.id] || "Ítem",
    MSG.colDetalle
  ];
  etiquetas.forEach((texto) => {
    const th = document.createElement("th");
    th.className = "pdf-col";
    th.textContent = texto;
    cabeza.append(th);
  });
  tabla.append(cabeza);
  const visibles = seccion.items.filter((item) =>
    itemAplica(item, datos.items, datos.tipoEquipo)
  );
  if (!visibles.length) return null;
  visibles.forEach((item) => {
    tabla.append(filaItem(item, datos));
  });
  bloque.append(titulo, tabla);
  return bloque;
}

/**
 * @param {object} item
 * @param {object} datos
 * @returns {HTMLTableRowElement}
 */
function filaItem(item, datos) {
  const fila = (datos.items && datos.items[item.id]) || {};
  const tr = document.createElement("tr");
  tr.className = "evitar-corte";
  const ok = document.createElement("td");
  ok.className = "pdf-ok";
  ok.append(marcaItem(fila, item));
  const nombre = document.createElement("td");
  nombre.className = "pdf-item";
  nombre.textContent = item.nombre;
  const detalle = document.createElement("td");
  const ayuda = document.createElement("div");
  ayuda.textContent = item.ayuda;
  detalle.append(ayuda);
  if (item.extra) {
    const extra = document.createElement("div");
    extra.className = "pdf-extra";
    const valor = fila.extra || "—";
    extra.textContent = `${item.extra.etiqueta}: ${valor}`;
    detalle.append(extra);
  }
  if (fila.ok) {
    (item.extras || []).forEach((campo) => {
      detalle.append(lineaExtra(campo, fila.extras || {}));
    });
  }
  tr.append(ok, nombre, detalle);
  return tr;
}

/**
 * @param {object} datos
 * @returns {HTMLElement}
 */
function cierre(datos) {
  const bloque = document.createElement("section");
  bloque.className = "evitar-corte";
  const titulo = document.createElement("h2");
  titulo.textContent = tituloCierre(datos.tipoEquipo);
  const estado = document.createElement("div");
  estado.className = "pdf-estado evitar-corte";
  estado.append(opcionEstado(
    datos.estado === "aprobado",
    ETIQUETA_ESTADO.aprobado
  ));
  estado.append(opcionEstado(
    datos.estado === "rechazado",
    ETIQUETA_ESTADO.rechazado
  ));
  const rotulo = document.createElement("div");
  rotulo.className = "pdf-rotulo";
  rotulo.textContent = MSG.observaciones;
  const observaciones = document.createElement("div");
  observaciones.className = "pdf-obs";
  observaciones.textContent = datos.observaciones || "";
  bloque.append(titulo, estado, rotulo, observaciones);
  return bloque;
}

/**
 * @param {object} datos
 * @returns {HTMLElement}
 */
function firmas(datos) {
  const tabla = document.createElement("table");
  tabla.className = "pdf-firmas evitar-corte";
  const fila = document.createElement("tr");
  fila.append(cajaFirma(MSG.firmaTecnico, datos.firmaTecnico));
  fila.append(cajaFirma(MSG.firmaCalidad, datos.firmaCalidad));
  tabla.append(fila);
  return tabla;
}

/**
 * @param {string} etiqueta
 * @param {{nombre?: string, imagen?: string}|undefined} firma
 * @returns {HTMLElement}
 */
function cajaFirma(etiqueta, firma) {
  const celda = document.createElement("td");
  if (firma && firma.imagen) {
    const img = document.createElement("img");
    img.src = firma.imagen;
    img.alt = etiqueta;
    img.className = "pdf-firma";
    celda.append(img);
  } else {
    const espacio = document.createElement("div");
    espacio.className = "pdf-espacio";
    celda.append(espacio);
  }
  const linea = document.createElement("div");
  linea.className = "pdf-linea";
  const nombre = document.createElement("div");
  nombre.className = "pdf-nombre";
  nombre.textContent = (firma && firma.nombre) || "";
  const rol = document.createElement("div");
  rol.textContent = etiqueta;
  celda.append(linea, nombre, rol);
  return celda;
}

/**
 * @param {{etiqueta: string, id: string}} campo
 * @param {Record<string, string>} mapa
 * @returns {HTMLElement}
 */
function lineaExtra(campo, mapa) {
  const extra = document.createElement("div");
  extra.className = "pdf-extra";
  extra.textContent = `${campo.etiqueta}: ${mapa[campo.id] || "—"}`;
  return extra;
}

/**
 * @param {{ok?: boolean, resultado?: string}} fila
 * @param {{aceptaNo?: boolean}} item
 * @returns {HTMLElement}
 */
function marcaItem(fila, item) {
  const caja = document.createElement("span");
  caja.className = "pdf-caja";
  if (fila.resultado === "malo" && item.aceptaNo) {
    caja.textContent = "No";
  } else if (fila.resultado === "malo") {
    caja.classList.add("pdf-malo");
    caja.textContent = "✗";
  } else if (fila.ok) {
    caja.textContent = "✓";
  }
  return caja;
}

/**
 * @param {boolean} marcado
 * @returns {HTMLElement}
 */
function cajaMarca(marcado) {
  const caja = document.createElement("span");
  caja.className = "pdf-caja";
  caja.textContent = marcado ? "X" : "";
  return caja;
}

/**
 * @param {boolean} marcado
 * @param {string} texto
 * @returns {HTMLElement}
 */
function opcionEstado(marcado, texto) {
  const opcion = document.createElement("span");
  opcion.className = "pdf-opcion";
  opcion.append(cajaMarca(marcado));
  opcion.append(document.createTextNode(` ${texto}`));
  return opcion;
}

/**
 * @param {string} iso
 * @returns {string}
 */
function fecha(iso) {
  return formatearFecha(iso) || "—";
}

/**
 * @param {string[]} celdas
 * @returns {HTMLTableRowElement}
 */
function filaDoble(celdas) {
  const tr = document.createElement("tr");
  tr.className = "evitar-corte";
  celdas.forEach((valor, indice) => {
    const celda = indice % 2 === 0
      ? document.createElement("th")
      : document.createElement("td");
    celda.textContent = valor || "—";
    tr.append(celda);
  });
  return tr;
}

/**
 * @returns {HTMLElement}
 */
function pie() {
  const p = document.createElement("p");
  p.className = "pdf-pie";
  p.textContent = `${MSG.documentoGenerado} ${ahoraLegible()}`;
  return p;
}

/**
 * @param {object} datos
 * @returns {string}
 */
function nombreArchivo(datos) {
  const serie = String(datos.numeroSerie || "sin-serie")
    .replace(/[^\w\-]+/g, "_")
    .slice(0, 40);
  const fechaSalida = datos.fechaSalida || "sin-fecha";
  return `Checklist_Salida_${serie}_${fechaSalida}.pdf`;
}

/**
 * @returns {Promise<void>}
 */
function cargarLibreria() {
  if (window.html2pdf) return Promise.resolve();
  if (carga) return carga;
  carga = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = URL_HTML2PDF;
    script.onload = () => resolve();
    script.onerror = () => {
      carga = null;
      reject(new Error("pdf-lib"));
    };
    document.head.append(script);
  });
  return carga;
}

/**
 * @param {HTMLElement} raiz
 * @returns {Promise<void>}
 */
function esperarImagenes(raiz) {
  const imagenes = [...raiz.querySelectorAll("img")];
  return Promise.all(imagenes.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  })).then(() => undefined);
}
