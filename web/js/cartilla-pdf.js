/**
 * Propósito: PDF de la cartilla de ruta con el formato en papel.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: cartilla-catalogo, cartilla-textos, fechas, pdf
 */

import {
  FINALIZACION,
  idLibreValido,
  numeroItem,
  ordenarLibres,
  SECCIONES_CARTILLA
} from "./cartilla-catalogo.js";
import { TXT } from "./cartilla-textos.js";
import { ahoraLegible, formatearFecha } from "./fechas.js";
import { etiquetaTipo, TXT_TIPO } from "./tipos-equipo.js";
import { generarPdf } from "./pdf.js";

/**
 * Descarga la cartilla en PDF.
 * @param {object} datos
 * @returns {Promise<void>}
 */
export function descargarCartillaPdf(datos) {
  return generarPdf((zona) => armar(zona, datos), nombreArchivo(datos));
}

/**
 * @param {HTMLElement} zona
 * @param {object} datos
 * @returns {void}
 */
function armar(zona, datos) {
  zona.append(cabecera(datos));
  zona.append(banda(TXT.datosGenerales));
  zona.append(datosGenerales(datos));
  SECCIONES_CARTILLA.forEach((seccion) => {
    if (seccion.saltoPdf) {
      const salto = document.createElement("div");
      salto.className = "salto-pagina";
      zona.append(salto);
    }
    if (seccion.banda) zona.append(banda(seccion.banda));
    zona.append(tablaSeccion(seccion, datos.filas || {}));
  });
  zona.append(banda(TXT.finalizacion));
  zona.append(tablaFinal(datos.finalizacion || {}));
  const pie = document.createElement("p");
  pie.className = "pdf-pie";
  pie.textContent = `${TXT.generado} ${ahoraLegible()}`;
  zona.append(pie);
}

/**
 * @param {object} datos
 * @returns {HTMLElement}
 */
function cabecera(datos) {
  const tabla = tablaBase("cr-cabeza");
  const fila = document.createElement("tr");
  const logo = celda("td", "", "cr-logo");
  logo.rowSpan = 2;
  const img = document.createElement("img");
  img.src = "./assets/logo-dts.png";
  img.alt = "DTS";
  logo.append(img);
  fila.append(logo);
  fila.append(celda("td", TXT.usoInterno, "cr-centro"));
  fila.append(celda("th", TXT.creadaPor));
  fila.append(celda("td", datos.creadaPorNombre));
  const fila2 = document.createElement("tr");
  const numero = datos.numero ? ` · N° ${datos.numero}` : "";
  fila2.append(celda("td", `${TXT.cartillaRuta}${numero}`, "cr-centro"));
  fila2.append(celda("th", TXT.aprobadaPor));
  fila2.append(celda("td", datos.aprobadaPorNombre));
  tabla.append(fila, fila2);
  return tabla;
}

/**
 * @param {object} datos
 * @returns {HTMLElement}
 */
function datosGenerales(datos) {
  const tabla = tablaBase("cr-datos");
  tabla.append(filaTipoCartilla(datos.tipoEquipo));
  const filas = [
    [TXT.cliente, datos.cliente, TXT.serie, datos.numeroSerie],
    [TXT.modelo, datos.modelo, TXT.parte, datos.numeroParte]
  ];
  filas.forEach((valores) => {
    const tr = document.createElement("tr");
    valores.forEach((valor, indice) => {
      tr.append(celda(indice % 2 === 0 ? "th" : "td", valor));
    });
    tabla.append(tr);
  });
  return tabla;
}

/**
 * @param {string} tipo
 * @returns {HTMLTableRowElement}
 */
function filaTipoCartilla(tipo) {
  const tr = document.createElement("tr");
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
 * @param {object} filas
 * @returns {HTMLElement}
 */
function tablaSeccion(seccion, filas) {
  const tabla = tablaBase("cr-seccion");
  const cabeza = document.createElement("tr");
  cabeza.className = "cr-encabezado";
  cabeza.append(celda("th", `N°${seccion.numero}`, "cr-n"));
  cabeza.append(celda("th", seccion.titulo, "cr-item"));
  cabeza.append(celda("th", seccion.columnaObs || TXT.observaciones));
  cabeza.append(celda("th", TXT.nombreFirma, "cr-nombre"));
  cabeza.append(celda("th", TXT.fecha, "cr-fecha"));
  cabeza.append(celda("th", TXT.si, "cr-sn"));
  cabeza.append(celda("th", TXT.no, "cr-sn"));
  tabla.append(cabeza);
  let orden = 0;
  seccion.items.forEach((item, indice) => {
    const dato = filas[item.id];
    if (seccion.tipo === "seleccionable" && !dato) return;
    orden += 1;
    const n = seccion.tipo === "fija"
      ? numeroItem(seccion, indice)
      : `${seccion.numero}.${orden}`;
    tabla.append(filaItem(n, item, dato || {}));
  });
  if (seccion.agregar) orden = agregarLibres(tabla, seccion, filas, orden);
  if (orden === 0) {
    const tr = document.createElement("tr");
    const vacia = celda("td", TXT.sinElementos, "cr-vacia");
    vacia.colSpan = 7;
    tr.append(vacia);
    tabla.append(tr);
  }
  return tabla;
}

/**
 * Agrega los periféricos creados con el botón + y devuelve el orden.
 * @param {HTMLTableElement} tabla
 * @param {object} seccion
 * @param {object} filas
 * @param {number} orden
 * @returns {number}
 */
function agregarLibres(tabla, seccion, filas, orden) {
  const ids = ordenarLibres(Object.keys(filas).filter(idLibreValido));
  let actual = orden;
  ids.forEach((id) => {
    actual += 1;
    const item = {
      nombre: "",
      soloNombre: true,
      nombreLibre: true
    };
    tabla.append(filaItem(`${seccion.numero}.${actual}`, item, filas[id]));
  });
  return actual;
}

/**
 * @param {object} item
 * @param {object} dato
 * @returns {string}
 */
function textoItem(item, dato) {
  if (dato.nombreLibre) return `${item.nombre}: ${dato.nombreLibre}`;
  return item.nombre;
}

/**
 * @param {string} n
 * @param {object} item
 * @param {object} dato
 * @returns {HTMLTableRowElement}
 */
function filaItem(n, item, dato) {
  const tr = document.createElement("tr");
  tr.className = "evitar-corte";
  tr.append(celda("td", n, "cr-n cr-num"));
  const nombre = celda("td", "", "cr-item");
  const titulo = document.createElement("div");
  titulo.className = "cr-titulo-item";
  titulo.textContent = item.soloNombre
    ? (dato.nombreLibre || TXT.perifericoNuevo)
    : textoItem(item, dato);
  nombre.append(titulo);
  (item.extras || []).forEach((extra) => {
    const linea = document.createElement("div");
    const valor = (dato.extras && dato.extras[extra.id]) || "—";
    linea.textContent = `${extra.etiqueta}: ${valor}`;
    nombre.append(linea);
  });
  tr.append(nombre);
  tr.append(celda("td", dato.obs, "cr-obs"));
  tr.append(celda("td", dato.nombre));
  tr.append(celda("td", formatearFecha(dato.fecha)));
  tr.append(celda("td", dato.aprobado === "si" ? "X" : "", "cr-sn"));
  tr.append(celda("td", dato.aprobado === "no" ? "X" : "", "cr-sn"));
  return tr;
}

/**
 * @param {object} fin
 * @returns {HTMLElement}
 */
function tablaFinal(fin) {
  const tabla = tablaBase("cr-seccion");
  const cabeza = document.createElement("tr");
  cabeza.className = "cr-encabezado";
  cabeza.append(celda("th", "N°", "cr-n"));
  cabeza.append(celda("th", TXT.item, "cr-item"));
  cabeza.append(celda("th", TXT.nombre));
  cabeza.append(celda("th", TXT.fecha, "cr-fecha"));
  cabeza.append(celda("th", TXT.firma, "cr-firma"));
  tabla.append(cabeza);
  FINALIZACION.forEach((paso) => {
    const dato = fin[paso.id] || {};
    const tr = document.createElement("tr");
    tr.className = "evitar-corte";
    tr.append(celda("td", paso.n, "cr-n cr-num"));
    tr.append(celda("td", paso.nombre, "cr-item cr-negrita"));
    tr.append(celda("td", dato.nombre));
    tr.append(celda("td", formatearFecha(dato.fecha)));
    const firma = celda("td", "", "cr-firma");
    if (dato.firma) {
      const img = document.createElement("img");
      img.src = dato.firma;
      img.alt = TXT.firma;
      firma.append(img);
    }
    tr.append(firma);
    tabla.append(tr);
  });
  return tabla;
}

/**
 * @param {string} texto
 * @returns {HTMLElement}
 */
function banda(texto) {
  const nodo = document.createElement("div");
  nodo.className = "cr-banda evitar-corte";
  nodo.textContent = texto;
  return nodo;
}

/**
 * @param {string} clase
 * @returns {HTMLTableElement}
 */
function tablaBase(clase) {
  const tabla = document.createElement("table");
  tabla.className = `cr-tabla ${clase}`;
  return tabla;
}

/**
 * @param {"td"|"th"} tipo
 * @param {string} texto
 * @param {string} [clase]
 * @returns {HTMLTableCellElement}
 */
function celda(tipo, texto, clase) {
  const nodo = document.createElement(tipo);
  nodo.textContent = texto || "";
  if (clase) nodo.className = clase;
  return nodo;
}

/**
 * @param {object} datos
 * @returns {string}
 */
function nombreArchivo(datos) {
  const serie = String(datos.numeroSerie || "sin-serie")
    .replace(/[^\w\-]+/g, "_")
    .slice(0, 40);
  const numero = datos.numero ? `N${datos.numero}_` : "";
  return `Cartilla_Ruta_${numero}${serie}.pdf`;
}
