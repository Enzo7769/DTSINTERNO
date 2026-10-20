/**
 * Propósito: PDF de un costo y resumen PDF de la base de costos.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: costo-textos, fechas, hw-catalogo, pdf, pdf-comun,
 *   tipos-equipo
 */

import { resumenCategorias } from "./costeo.js";
import { cabeceraHistorial, filasHistorial } from "./costo-historial.js";
import { CT, textoLote } from "./costo-textos.js";
import { ahoraLegible, formatearFecha } from "./fechas.js";
import {
  CATEGORIAS_COSTO,
  LINEAS_PRODUCTO,
  etiquetaDe,
  formatoMonto
} from "./hw-catalogo.js";
import { generarPdf } from "./pdf.js";
import {
  archivoPdf,
  cabeceraPdf,
  div,
  subtitulo,
  tablaDatos,
  tablaPares
} from "./pdf-comun.js";
import { etiquetaTipo, TXT_TIPO } from "./tipos-equipo.js";

/**
 * @param {object} datos
 * @returns {Promise<void>}
 */
export function descargarCostoPdf(datos) {
  return generarPdf(
    (zona) => armarFicha(zona, datos),
    archivoPdf("Costo_HW", datos.modelo, datos.numero)
  );
}

/**
 * @param {object[]} lista ya filtrada y ordenada
 * @returns {Promise<void>}
 */
export function descargarResumenPdf(lista) {
  return generarPdf((zona) => armarResumen(zona, lista), CT.resumenArchivo);
}

/**
 * @param {HTMLElement} zona
 * @param {object} datos
 * @returns {void}
 */
function armarFicha(zona, datos) {
  const rotulo = datos.numero ? `N° ${datos.numero}` : CT.sinGuardar;
  zona.append(
    cabeceraPdf(CT.tituloPdf, CT.usoInterno, rotulo),
    tablaPares([
      [CT.linea, etiquetaDe(LINEAS_PRODUCTO, datos.linea)],
      [TXT_TIPO.leyenda, etiquetaTipo(datos.tipoEquipo)],
      [CT.modelo, datos.modelo],
      [CT.fechaActualizacion, formatearFecha(datos.fechaActualizacion)],
      [CT.referencia, datos.referencia]
    ])
  );
  zona.append(subtitulo(CT.parametros), tablaPares(parametros(datos)));
  const lineas = datos.lineas || [];
  if (lineas.length) {
    zona.append(
      subtitulo(CT.desglose),
      tablaComponentes(lineas, datos.moneda),
      subtitulo(CT.resumenCategorias),
      tablaDatos(
        [CT.categoria, CT.items, CT.subtotal, CT.porcentaje],
        resumenCategorias(lineas, datos.moneda).map((fila) => [
          fila.etiqueta,
          String(fila.items),
          formatoMonto(fila.subtotal, datos.moneda),
          `${numeroCorto(fila.porcentaje)} %`
        ]),
        new Set([1, 2, 3])
      )
    );
  }
  zona.append(
    div(
      "costo-pdf-total",
      `${CT.costoEquipo}: ${formatoMonto(datos.costo, datos.moneda)}`
    ),
    div(
      "costo-pdf-total costo-pdf-lote",
      `${CT.costoLote} (${textoLote(datos.cantidadEquipos || 1)}): `
        + formatoMonto(
          datos.costoLote || datos.costo,
          datos.moneda
        )
    )
  );
  if (datos.observaciones) {
    zona.append(div(
      "costo-pdf-obs",
      `${CT.observaciones}: ${datos.observaciones}`
    ));
  }
  const historial = datos.historial || [];
  if (historial.length) {
    zona.append(
      subtitulo(CT.historial),
      tablaDatos(
        cabeceraHistorial(),
        filasHistorial(historial),
        new Set([2, 3, 4, 5, 6])
      )
    );
  }
  zona.append(div("pdf-pie", `${CT.generado} ${ahoraLegible()}`));
}

/**
 * @param {object} datos
 * @returns {string[][]}
 */
function parametros(datos) {
  const cambio = datos.tipoCambio || {};
  const pares = [
    [CT.moneda, datos.moneda],
    [CT.cantidadEquipos, String(datos.cantidadEquipos || 1)]
  ];
  if (cambio.usd) pares.push([CT.dolar, `$ ${numeroCorto(cambio.usd)}`]);
  if (cambio.uf) pares.push([CT.uf, `$ ${numeroCorto(cambio.uf)}`]);
  return pares;
}

/**
 * Componentes agrupados por categoría, con una banda por grupo.
 * @param {object[]} lineas
 * @param {string} moneda
 * @returns {HTMLTableElement}
 */
function tablaComponentes(lineas, moneda) {
  const tabla = tablaDatos(
    [CT.concepto, CT.fabricante, CT.cantidadEquipo, CT.valor,
      CT.subtotalCosto],
    [],
    new Set([2, 3, 4])
  );
  CATEGORIAS_COSTO.forEach((categoria) => {
    const grupo = lineas.filter((linea) => linea.categoria === categoria.id);
    if (!grupo.length) return;
    const banda = document.createElement("tr");
    banda.className = "evitar-corte";
    const celda = document.createElement("td");
    celda.colSpan = 5;
    celda.className = "costo-pdf-banda";
    celda.textContent = categoria.etiqueta;
    banda.append(celda);
    tabla.append(banda);
    grupo.forEach((linea) => {
      const tr = document.createElement("tr");
      tr.className = "evitar-corte";
      tr.append(celdaConcepto(linea));
      [
        linea.fabricante || "—",
        numeroCorto(linea.cantidad),
        formatoMonto(linea.valor, linea.moneda || moneda),
        formatoMonto(linea.subtotalCosto ?? linea.subtotal, moneda)
      ].forEach((texto, indice) => {
        const td = document.createElement("td");
        td.textContent = texto;
        if (indice > 0) td.className = "pdf-derecha";
        tr.append(td);
      });
      tabla.append(tr);
    });
  });
  return tabla;
}

/**
 * Concepto con el link de cotización debajo, como texto.
 * @param {object} linea
 * @returns {HTMLTableCellElement}
 */
function celdaConcepto(linea) {
  const td = document.createElement("td");
  td.textContent = linea.concepto;
  if (linea.link) {
    const link = document.createElement("div");
    link.className = "costo-pdf-link";
    link.textContent = `${CT.cotizacion}: ${linea.link}`;
    td.append(link);
  }
  return td;
}

/**
 * @param {number} valor
 * @returns {string}
 */
function numeroCorto(valor) {
  return (Number(valor) || 0).toLocaleString("es-CL", {
    maximumFractionDigits: 2
  });
}

/**
 * @param {HTMLElement} zona
 * @param {object[]} lista
 * @returns {void}
 */
function armarResumen(zona, lista) {
  zona.append(
    cabeceraPdf(CT.tituloResumen, CT.usoInterno,
      `${lista.length} ${CT.registros}`),
    tablaDatos(
      ["N°", CT.linea, "Tipo", CT.modelo, CT.costo, "Actualizado"],
      lista.map((registro) => [
        String(registro.numero || ""),
        etiquetaDe(LINEAS_PRODUCTO, registro.linea),
        etiquetaTipo(registro.tipoEquipo),
        registro.modelo,
        formatoMonto(registro.costo, registro.moneda),
        formatearFecha(registro.fechaActualizacion)
      ]),
      new Set([4])
    ),
    div("pdf-pie", `${CT.generado} ${ahoraLegible()}`)
  );
}
