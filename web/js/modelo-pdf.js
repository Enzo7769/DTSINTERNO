/**
 * Propósito: PDF del modelo y PDF de sus especificaciones.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: espec-textos, fechas, hw-catalogo, modelo-textos,
 *   pdf, pdf-comun
 */

import {
  ET,
  textoClientes,
  textoTotalEquipos
} from "./espec-textos.js";
import { ahoraLegible } from "./fechas.js";
import {
  ESTADOS_MODELO,
  GRUPOS_FICHA,
  TIPOS_MODELO,
  etiquetaDe
} from "./hw-catalogo.js";
import { MT, textoTotalModelos } from "./modelo-textos.js";
import { generarPdf } from "./pdf.js";
import {
  archivoPdf,
  cabeceraPdf,
  div,
  subtitulo,
  tablaDatos
} from "./pdf-comun.js";

/**
 * @param {object} modelo
 * @returns {Promise<void>}
 */
export function descargarModeloPdf(modelo) {
  return generarPdf(
    (zona) => armarModelo(zona, modelo),
    archivoPdf("Modelo", modelo.nombre, modelo.numero)
  );
}

/**
 * @param {object} modelo
 * @returns {Promise<void>}
 */
export function descargarEspecPdf(modelo) {
  return generarPdf(
    (zona) => armarEspec(zona, modelo),
    archivoPdf("Especificaciones", modelo.nombre, modelo.numero)
  );
}

/**
 * Catálogo de modelos: portada con índice y una página por equipo.
 * @param {object[]} modelos
 * @returns {Promise<void>}
 */
export function descargarCatalogoModelosPdf(modelos) {
  return generarPdf(
    (zona) => armarCatalogoModelos(zona, modelos),
    MT.archivoCatalogo
  );
}

/**
 * Catálogo completo: portada con índice y una página por equipo.
 * @param {object[]} modelos
 * @returns {Promise<void>}
 */
export function descargarCatalogoEspecPdf(modelos) {
  return generarPdf(
    (zona) => armarCatalogo(zona, modelos),
    ET.archivoCatalogo
  );
}

/**
 * @param {HTMLElement} zona
 * @param {object[]} modelos
 * @returns {void}
 */
function armarCatalogoModelos(zona, modelos) {
  zona.append(
    cabeceraPdf(
      MT.tituloCatalogo,
      MT.subCatalogo,
      textoTotalModelos(modelos.length)
    ),
    subtitulo(MT.indice),
    tablaDatos(
      [MT.colN, MT.colModelo, MT.colTipo, MT.colEstado, MT.colClientes],
      modelos.map((modelo, indice) => [
        String(indice + 1),
        modelo.nombre,
        etiquetaDe(TIPOS_MODELO, modelo.tipo),
        etiquetaDe(ESTADOS_MODELO, modelo.estado),
        textoClientes(modelo.clientes, 3)
      ])
    ),
    div("pdf-pie", `${MT.generado} ${ahoraLegible()}`)
  );
  modelos.forEach((modelo, indice) => {
    zona.append(paginaModelo(modelo, indice + 1));
  });
}

/**
 * @param {object} modelo
 * @param {number} n
 * @returns {HTMLElement}
 */
function paginaModelo(modelo, n) {
  const pagina = document.createElement("section");
  pagina.className = "salto-pagina catalogo-pagina";
  const cabeza = document.createElement("div");
  cabeza.className = "catalogo-cabeza";
  cabeza.append(
    div("catalogo-num", String(n).padStart(2, "0")),
    div("catalogo-nombre", modelo.nombre),
    div("catalogo-tipo", etiquetaDe(TIPOS_MODELO, modelo.tipo))
  );
  pagina.append(cabeza, fichaModelo(modelo));
  if (modelo.notas) {
    pagina.append(subtitulo(MT.notas), div("pdf-obs", modelo.notas));
  }
  return pagina;
}

/**
 * Foto fija a la izquierda y datos del modelo a la derecha.
 * @param {object} modelo
 * @returns {HTMLTableElement}
 */
function fichaModelo(modelo) {
  const tabla = document.createElement("table");
  tabla.className = "catalogo-resumen evitar-corte";
  const fila = document.createElement("tr");
  const foto = document.createElement("td");
  foto.className = "catalogo-foto";
  if (modelo.imagen) {
    const img = document.createElement("img");
    img.src = modelo.imagen;
    img.alt = MT.imagen;
    foto.append(img);
  } else {
    foto.textContent = MT.sinImagen;
  }
  const datos = document.createElement("td");
  datos.className = "catalogo-datos";
  datoPdf(datos, MT.estado, etiquetaDe(ESTADOS_MODELO, modelo.estado));
  datoPdf(
    datos,
    MT.colClientes,
    (modelo.clientes || []).join("\n") || MT.sinClientes
  );
  if (modelo.otroNombre) datoPdf(datos, MT.otroNombre, modelo.otroNombre);
  fila.append(foto, datos);
  tabla.append(fila);
  return tabla;
}

/**
 * @param {HTMLElement} padre
 * @param {string} rotulo
 * @param {string} valor
 * @returns {void}
 */
function datoPdf(padre, rotulo, valor) {
  padre.append(
    div("catalogo-rotulo", rotulo),
    div("pdf-multilinea", valor)
  );
}

/**
 * @param {HTMLElement} zona
 * @param {object[]} modelos
 * @returns {void}
 */
function armarCatalogo(zona, modelos) {
  zona.append(
    cabeceraPdf(
      ET.tituloCatalogo,
      ET.subCatalogo,
      textoTotalEquipos(modelos.length)
    ),
    subtitulo(ET.indice),
    tablaDatos(
      [ET.colN, ET.colModelo, ET.colTipo, ET.colClientes],
      modelos.map((modelo, indice) => [
        String(indice + 1),
        modelo.nombre,
        etiquetaDe(TIPOS_MODELO, modelo.tipo),
        textoClientes(modelo.clientes, 3)
      ])
    ),
    div("pdf-pie", `${ET.generado} ${ahoraLegible()}`)
  );
  modelos.forEach((modelo, indice) => {
    zona.append(paginaEquipo(modelo, indice + 1));
  });
}

/**
 * @param {object} modelo
 * @param {number} n
 * @returns {HTMLElement}
 */
function paginaEquipo(modelo, n) {
  const pagina = document.createElement("section");
  pagina.className = "salto-pagina catalogo-pagina";
  const cabeza = document.createElement("div");
  cabeza.className = "catalogo-cabeza";
  cabeza.append(
    div("catalogo-num", String(n).padStart(2, "0")),
    div("catalogo-nombre", modelo.nombre),
    div("catalogo-tipo", etiquetaDe(TIPOS_MODELO, modelo.tipo))
  );
  const resumenTabla = document.createElement("table");
  resumenTabla.className = "catalogo-resumen evitar-corte";
  const fila = document.createElement("tr");
  const foto = document.createElement("td");
  foto.className = "catalogo-foto";
  if (modelo.imagen) {
    const img = document.createElement("img");
    img.src = modelo.imagen;
    img.alt = ET.imagen;
    foto.append(img);
  } else {
    foto.textContent = ET.sinImagen;
  }
  const datos = document.createElement("td");
  datos.className = "catalogo-datos";
  datos.append(
    div("catalogo-rotulo", ET.clientes),
    div("pdf-multilinea", (modelo.clientes || []).join("\n")
      || ET.sinClientes)
  );
  if (modelo.otroNombre) {
    datos.append(
      div("catalogo-rotulo", MT.otroNombre),
      div("", modelo.otroNombre)
    );
  }
  fila.append(foto, datos);
  resumenTabla.append(fila);
  const ficha = tablaFicha(modelo.ficha || {});
  pagina.append(
    cabeza,
    resumenTabla,
    ficha || div("pdf-obs", ET.sinDatos)
  );
  return pagina;
}

/**
 * @param {HTMLElement} zona
 * @param {object} modelo
 * @returns {void}
 */
function armarModelo(zona, modelo) {
  zona.append(
    cabeceraPdf(MT.tituloPdf, MT.usoInterno, modelo.nombre || MT.nuevo),
    resumen(modelo)
  );
  if (modelo.notas) {
    zona.append(subtitulo(MT.notas), div("pdf-obs", modelo.notas));
  }
  zona.append(div("pdf-pie", `${MT.generado} ${ahoraLegible()}`));
}

/**
 * @param {HTMLElement} zona
 * @param {object} modelo
 * @returns {void}
 */
function armarEspec(zona, modelo) {
  const ficha = tablaFicha(modelo.ficha || {});
  zona.append(cabeceraPdf(
    ET.tituloPdf,
    ET.usoInterno,
    modelo.nombre || ET.sinModelo
  ));
  if (modelo.imagen) zona.append(fotoPdf(modelo.imagen));
  if (ficha) zona.append(ficha);
  else zona.append(div("pdf-obs", ET.sinDatos));
  zona.append(div("pdf-pie", `${ET.generado} ${ahoraLegible()}`));
}

/**
 * Imagen a la izquierda y datos generales a la derecha.
 * @param {object} modelo
 * @returns {HTMLTableElement}
 */
function resumen(modelo) {
  const tabla = document.createElement("table");
  tabla.className = "pdf-tabla pdf-ficha modelo-pdf-resumen evitar-corte";
  const pares = [
    [MT.tipo, etiquetaDe(TIPOS_MODELO, modelo.tipo)],
    [MT.nombre, modelo.nombre],
    [MT.otroNombre, modelo.otroNombre],
    [MT.estado, etiquetaDe(ESTADOS_MODELO, modelo.estado)],
    [MT.clientes, (modelo.clientes || []).join("\n")]
  ];
  pares.forEach(([rotulo, valor], indice) => {
    const tr = document.createElement("tr");
    if (indice === 0) tr.append(celdaImagen(modelo.imagen, pares.length));
    const th = document.createElement("th");
    th.textContent = rotulo;
    const td = document.createElement("td");
    td.className = "pdf-multilinea";
    td.textContent = valor || "—";
    tr.append(th, td);
    tabla.append(tr);
  });
  return tabla;
}

/**
 * @param {string} imagen
 * @param {number} filas
 * @returns {HTMLTableCellElement}
 */
function celdaImagen(imagen, filas) {
  const td = document.createElement("td");
  td.rowSpan = filas;
  td.className = "modelo-pdf-imagen";
  if (imagen) {
    const img = document.createElement("img");
    img.src = imagen;
    img.alt = "";
    td.append(img);
  } else {
    td.textContent = MT.sinImagen;
  }
  return td;
}

/**
 * @param {string} src
 * @returns {HTMLElement}
 */
function fotoPdf(src) {
  const marco = document.createElement("p");
  marco.className = "espec-pdf-foto";
  const img = document.createElement("img");
  img.src = src;
  img.alt = ET.imagen;
  marco.append(img);
  return marco;
}

/**
 * @param {object} ficha
 * @returns {HTMLTableElement|null}
 */
function tablaFicha(ficha) {
  const tabla = document.createElement("table");
  tabla.className = "pdf-tabla pdf-ficha";
  let filas = 0;
  GRUPOS_FICHA.forEach((grupo) => {
    const campos = grupo.campos.filter((campo) => ficha[campo.id]);
    if (!campos.length) return;
    const banda = document.createElement("tr");
    banda.className = "evitar-corte";
    const th = document.createElement("th");
    th.colSpan = 2;
    th.className = "pdf-col";
    th.textContent = grupo.titulo;
    banda.append(th);
    tabla.append(banda);
    campos.forEach((campo) => {
      const tr = document.createElement("tr");
      tr.className = "evitar-corte";
      const rotulo = document.createElement("th");
      rotulo.textContent = campo.etiqueta;
      const valor = document.createElement("td");
      valor.className = "pdf-multilinea";
      valor.textContent = ficha[campo.id];
      tr.append(rotulo, valor);
      tabla.append(tr);
      filas += 1;
    });
  });
  return filas ? tabla : null;
}
