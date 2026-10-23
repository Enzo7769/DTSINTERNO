/**
 * Propósito: Escena animada de la simulación: el tótem imprime el
 *   ticket, el papel sale por la ranura y la vista se acerca hasta
 *   leer el número y los detalles.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-23
 * Dependencias: ninguna
 *
 * Es una animación hecha con CSS (no un archivo de video): no pesa,
 * usa los datos reales del ticket y respeta «reducir movimiento».
 */

const TXT = {
  titulo: "Impresión del ticket",
  imprimiendo: "Imprimiendo su ticket…",
  retire: "Retire su ticket",
  leyendas: [
    "El tótem imprime el ticket…",
    "El ticket sale por la ranura",
    "Así lo recibe la persona"
  ],
  repetir: "Repetir",
  cerrar: "Cerrar",
  bienvenida: "Bienvenido",
  suNumero: "Su número de atención",
  tramite: "Trámite",
  atencion: "Atención",
  rut: "RUT",
  totem: "Tótem",
  fecha: "Fecha",
  antes: "Personas antes que usted",
  pie: "Espere su llamado en la pantalla.",
  sinRut: "Sin RUT",
  marca: "DTS",
  submarca: "AUTOSERVICIO"
};

/** Duración de cada etapa en ms; deben calzar con app.css. */
const ETAPAS = [0, 1900, 3500];

let actual = null;

/**
 * @typedef {object} DatosTicket
 * @property {string} codigo ej.: A-007
 * @property {string} tramite
 * @property {string} sub
 * @property {string} rut ya formateado; vacío si fue sin RUT
 * @property {string} atencion General o Preferente
 * @property {string} totem
 * @property {string} fecha dd/mm/aaaa hh:mm
 * @property {number} antes personas en espera
 */

/**
 * Abre la escena y la reproduce desde el comienzo.
 * @param {DatosTicket} datos
 * @returns {void}
 */
export function reproducirTicket(datos) {
  cerrarTicket();
  const fondo = document.createElement("div");
  fondo.className = "sim-cine";
  fondo.setAttribute("role", "dialog");
  fondo.setAttribute("aria-modal", "true");
  fondo.setAttribute("aria-label", TXT.titulo);
  const escena = document.createElement("div");
  escena.className = "sim-cine-escena";
  escena.append(totem(datos));
  const leyenda = document.createElement("p");
  leyenda.className = "sim-cine-leyenda";
  leyenda.setAttribute("aria-live", "polite");
  const barra = document.createElement("div");
  barra.className = "sim-cine-barra";
  const progreso = document.createElement("div");
  progreso.className = "sim-cine-progreso";
  progreso.append(document.createElement("span"));
  const repetir = boton(TXT.repetir, "boton boton-secundario");
  const cerrar = boton(TXT.cerrar, "boton");
  barra.append(progreso, repetir, cerrar);
  fondo.append(escena, leyenda, barra);
  document.body.append(fondo);

  const temporizadores = [];
  const reproducir = () => {
    temporizadores.splice(0).forEach((t) => window.clearTimeout(t));
    fondo.classList.remove("reproduciendo");
    void fondo.offsetWidth;
    fondo.classList.add("reproduciendo");
    ETAPAS.forEach((ms, i) => {
      temporizadores.push(window.setTimeout(() => {
        leyenda.textContent = TXT.leyendas[i];
      }, ms));
    });
  };
  const alTecla = (evento) => {
    if (evento.key === "Escape") cerrarTicket();
  };
  repetir.addEventListener("click", reproducir);
  cerrar.addEventListener("click", cerrarTicket);
  fondo.addEventListener("click", (evento) => {
    if (evento.target === fondo) cerrarTicket();
  });
  document.addEventListener("keydown", alTecla);
  actual = { fondo, temporizadores, alTecla, previo: document.activeElement };
  reproducir();
  cerrar.focus();
}

/**
 * @returns {void}
 */
export function cerrarTicket() {
  if (!actual) return;
  actual.temporizadores.forEach((t) => window.clearTimeout(t));
  document.removeEventListener("keydown", actual.alTecla);
  actual.fondo.remove();
  const previo = actual.previo;
  actual = null;
  if (previo instanceof HTMLElement) previo.focus();
}

/**
 * Dibujo del tótem con su pantalla, la ranura y el papel.
 * @param {DatosTicket} datos
 * @returns {HTMLElement}
 */
function totem(datos) {
  const cuerpo = document.createElement("div");
  cuerpo.className = "sim-cine-totem";
  const cabeza = document.createElement("div");
  cabeza.className = "sim-cine-cabeza";
  cabeza.textContent = TXT.marca;
  const pantalla = document.createElement("div");
  pantalla.className = "sim-cine-pantalla";
  const imprime = document.createElement("p");
  imprime.className = "sim-cine-imprime";
  imprime.textContent = TXT.imprimiendo;
  const retire = document.createElement("p");
  retire.className = "sim-cine-retire";
  retire.textContent = `${TXT.retire} · ${datos.codigo}`;
  pantalla.append(imprime, retire);
  const impresora = document.createElement("div");
  impresora.className = "sim-cine-impresora";
  const led = document.createElement("span");
  led.className = "sim-cine-led";
  const ranura = document.createElement("div");
  ranura.className = "sim-cine-ranura";
  const papel = document.createElement("div");
  papel.className = "sim-cine-papel";
  papel.append(ticket(datos));
  ranura.append(papel);
  impresora.append(led, ranura);
  const base = document.createElement("div");
  base.className = "sim-cine-base";
  cuerpo.append(cabeza, pantalla, impresora, base);
  return cuerpo;
}

/**
 * El ticket impreso, como lo recibe la persona.
 * @param {DatosTicket} datos
 * @returns {HTMLElement}
 */
function ticket(datos) {
  const caja = document.createElement("div");
  caja.className = "ticket";
  const marca = document.createElement("div");
  marca.className = "ticket-marca";
  const img = document.createElement("img");
  img.src = "./assets/logo-dts.png";
  img.alt = "";
  const nombre = document.createElement("div");
  const fuerte = document.createElement("strong");
  fuerte.textContent = TXT.marca;
  const sub = document.createElement("small");
  sub.textContent = TXT.submarca;
  nombre.append(fuerte, sub);
  marca.append(img, nombre);
  const hola = parrafo(TXT.bienvenida, "ticket-hola");
  const etq = parrafo(TXT.suNumero, "ticket-etq");
  const num = parrafo(datos.codigo, "ticket-num");
  const tramite = parrafo(
    datos.sub ? `${datos.tramite} · ${datos.sub}` : datos.tramite,
    "ticket-tramite"
  );
  const lista = document.createElement("dl");
  lista.className = "ticket-datos";
  [
    [TXT.atencion, datos.atencion],
    [TXT.rut, datos.rut || TXT.sinRut],
    [TXT.totem, datos.totem],
    [TXT.fecha, datos.fecha],
    [TXT.antes, String(datos.antes)]
  ].forEach(([dt, dd]) => {
    const fila = document.createElement("div");
    const t = document.createElement("dt");
    t.textContent = dt;
    const d = document.createElement("dd");
    d.textContent = dd || "—";
    fila.append(t, d);
    lista.append(fila);
  });
  const pie = parrafo(TXT.pie, "ticket-pie");
  const barras = document.createElement("div");
  barras.className = "ticket-barras";
  barras.setAttribute("aria-hidden", "true");
  caja.append(marca, hola, etq, num, tramite, lista, pie, barras);
  return caja;
}

/**
 * @param {string} texto
 * @param {string} clase
 * @returns {HTMLParagraphElement}
 */
function parrafo(texto, clase) {
  const p = document.createElement("p");
  p.className = clase;
  p.textContent = texto;
  return p;
}

/**
 * @param {string} texto
 * @param {string} clase
 * @returns {HTMLButtonElement}
 */
function boton(texto, clase) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = clase;
  b.textContent = texto;
  return b;
}
