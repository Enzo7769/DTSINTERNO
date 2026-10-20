/**
 * Propósito: Campo IPv4 con los puntos fijos; solo
 *   se rellenan los números de cada octeto.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-19
 * Dependencias: ninguna
 */

/**
 * @param {unknown} valor
 * @returns {string[]}
 */
export function partirIp(valor) {
  const partes = String(valor || "").trim().split(".");
  const out = ["", "", "", ""];
  for (let i = 0; i < 4; i += 1) {
    out[i] = limpioOcteto(partes[i]);
  }
  return out;
}

/**
 * @param {unknown[]} partes
 * @returns {string}
 */
export function componerIp(partes) {
  const lista = Array.isArray(partes) ? partes : [];
  return [0, 1, 2, 3].map((i) => limpioOcteto(lista[i])).join(".");
}

/**
 * Cuatro octetos 0–255. Vacío o incompleto no vale.
 * @param {unknown} valor
 * @returns {boolean}
 */
export function ipLista(valor) {
  const partes = partirIp(valor);
  return partes.every((oct) => {
    if (!oct) return false;
    const n = Number(oct);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
}

/**
 * @param {HTMLElement} caja
 * @returns {string}
 */
export function valorIp(caja) {
  return componerIp(
    [...caja.querySelectorAll("input")].map((n) => n.value)
  );
}

/**
 * Limpia el octeto y pasa al siguiente si ya tiene 3 dígitos.
 * @param {HTMLInputElement} campo
 * @param {HTMLElement} caja
 * @returns {string}
 */
export function alEscribirIp(campo, caja) {
  campo.value = limpioOcteto(campo.value);
  if (campo.value.length === 3) {
    const i = Number(campo.dataset.octeto);
    const next = caja.querySelectorAll("input")[i + 1];
    if (next) next.focus();
  }
  return valorIp(caja);
}

/**
 * @param {string} valor
 * @param {string} ruta
 * @returns {HTMLElement}
 */
export function campoIp(valor, ruta) {
  const caja = document.createElement("div");
  caja.className = "ficha-ip";
  caja.dataset.ruta = ruta;
  caja.dataset.ip = "1";
  partirIp(valor).forEach((oct, i) => {
    if (i) {
      const punto = document.createElement("span");
      punto.className = "ficha-ip-punto";
      punto.textContent = ".";
      caja.append(punto);
    }
    caja.append(octeto(oct, i, caja));
  });
  return caja;
}

/**
 * @param {unknown} valor
 * @returns {string}
 */
function limpioOcteto(valor) {
  const n = String(valor || "").replace(/\D/g, "").slice(0, 3);
  if (!n) return "";
  const num = Number(n);
  if (num > 255) return "255";
  return n;
}

/**
 * @param {string} valor
 * @param {number} indice
 * @param {HTMLElement} caja
 * @returns {HTMLInputElement}
 */
function octeto(valor, indice, caja) {
  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.maxLength = 3;
  input.value = valor;
  input.autocomplete = "off";
  input.dataset.octeto = String(indice);
  input.addEventListener("keydown", (ev) => {
    teclaIp(ev, caja, indice);
  });
  return input;
}

/**
 * @param {KeyboardEvent} ev
 * @param {HTMLElement} caja
 * @param {number} indice
 * @returns {void}
 */
function teclaIp(ev, caja, indice) {
  const inputs = caja.querySelectorAll("input");
  if (ev.key === "." || ev.key === " ") {
    ev.preventDefault();
    if (inputs[indice + 1]) inputs[indice + 1].focus();
    return;
  }
  if (ev.key !== "Backspace") return;
  const actual = inputs[indice];
  if (actual && actual.value) return;
  if (inputs[indice - 1]) inputs[indice - 1].focus();
}
