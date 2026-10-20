/**
 * Propósito: Lienzo de firma con mouse y touch.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: config.js
 */

import { APP } from "./config.js";

/**
 * Conecta un canvas y devuelve limpiar, exportar y cargar.
 * @param {HTMLCanvasElement} canvas
 * @returns {object}
 */
export function crearFirma(canvas) {
  const ctx = canvas.getContext("2d");
  let dibujando = false;
  let huboTrazo = false;
  let grande = false;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#163042";
  limpiar();

  canvas.addEventListener("pointerdown", (evento) => {
    dibujando = true;
    canvas.setPointerCapture(evento.pointerId);
    const p = punto(evento);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  });

  canvas.addEventListener("pointermove", (evento) => {
    if (!dibujando) return;
    const p = punto(evento);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    huboTrazo = true;
  });

  const soltar = () => {
    dibujando = false;
  };
  canvas.addEventListener("pointerup", soltar);
  canvas.addEventListener("pointercancel", soltar);
  canvas.addEventListener("pointerleave", soltar);

  return {
    limpiar,
    exportar,
    cargar,
    esGrande: () => grande
  };

  /**
   * @returns {void}
   */
  function limpiar() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    huboTrazo = false;
    grande = false;
  }

  /**
   * @returns {string}
   */
  function exportar() {
    grande = false;
    if (!huboTrazo) return "";
    const dato = canvas.toDataURL("image/png");
    if (dato.length > APP.maxImagen) {
      grande = true;
      return "";
    }
    return dato;
  }

  /**
   * @param {string} src
   * @returns {Promise<void>}
   */
  function cargar(src) {
    return new Promise((resolve) => {
      limpiar();
      if (!src) {
        resolve();
        return;
      }
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        huboTrazo = true;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });
  }

  /**
   * @param {PointerEvent} evento
   * @returns {{x: number, y: number}}
   */
  function punto(evento) {
    const rect = canvas.getBoundingClientRect();
    const escalaX = canvas.width / rect.width;
    const escalaY = canvas.height / rect.height;
    return {
      x: (evento.clientX - rect.left) * escalaX,
      y: (evento.clientY - rect.top) * escalaY
    };
  }
}
