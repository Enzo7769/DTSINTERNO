/**
 * Propósito: Reducir la imagen referencial de un modelo.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: config
 */

import { APP } from "./config.js";

const TIPOS_ACEPTADOS = new Set(["image/png", "image/jpeg", "image/webp"]);
const LADO_MAXIMO = 640;
const CALIDADES = [0.85, 0.72, 0.6, 0.48];
const BYTES_ORIGEN_MAX = 10 * 1024 * 1024;

/**
 * Devuelve un JPEG en data URL bajo el tope de Firestore, o "".
 * @param {File} archivo
 * @returns {Promise<string>}
 */
export async function reducirImagen(archivo) {
  if (!archivo || !TIPOS_ACEPTADOS.has(archivo.type)) return "";
  if (archivo.size > BYTES_ORIGEN_MAX) return "";
  const bitmap = await createImageBitmap(archivo);
  try {
    const escala = Math.min(
      1,
      LADO_MAXIMO / Math.max(bitmap.width, bitmap.height)
    );
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.max(1, Math.round(bitmap.width * escala));
    lienzo.height = Math.max(1, Math.round(bitmap.height * escala));
    const ctx = lienzo.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    ctx.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
    for (const calidad of CALIDADES) {
      const dato = lienzo.toDataURL("image/jpeg", calidad);
      if (dato.length <= APP.maxImagen) return dato;
    }
    return "";
  } finally {
    bitmap.close();
  }
}
