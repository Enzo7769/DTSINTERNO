/**
 * Propósito: Arranque, sesión y navegación del panel.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: cambios-pendientes, cartilla-form, cartilla-listado,
 *   cartilla-repositorio, costo-form, costo-listado,
 *   costo-repositorio, espec-form, espec-listado,
 *   modelo-form, modelo-listado, modelo-repositorio,
 *   config, constantes, demo, errores,
 *   firebase, formulario, listado, logger, repositorio, sanitizar, ui
 */

import { permitirCambioRuta } from "./cambios-pendientes.js";
import {
  definirAutorCartilla,
  iniciarCartilla,
  mostrarCartillaEdicion,
  mostrarCartillaNueva
} from "./cartilla-form.js";
import {
  iniciarListadoCartillas,
  invalidarCartillas,
  mostrarListadoCartillas
} from "./cartilla-listado.js";
import { sembrarCartillas } from "./cartilla-repositorio.js";
import {
  definirAutorCosto,
  iniciarCosto,
  mostrarCostoCopia,
  mostrarCostoEdicion,
  mostrarCostoNuevo
} from "./costo-form.js";
import {
  definirAutorListadoCostos,
  iniciarListadoCostos,
  invalidarCostos,
  mostrarListadoCostos
} from "./costo-listado.js";
import { sembrarCostos } from "./costo-repositorio.js";
import {
  definirAutorModelo,
  iniciarModelo,
  mostrarModeloEdicion,
  mostrarModeloNuevo
} from "./modelo-form.js";
import {
  definirAutorEspec,
  iniciarEspec,
  mostrarEspec
} from "./espec-form.js";
import {
  iniciarListadoEspecs,
  invalidarEspecs,
  mostrarListadoEspecs
} from "./espec-listado.js";
import {
  definirAutorListadoModelos,
  iniciarListadoModelos,
  invalidarModelos,
  mostrarListadoModelos
} from "./modelo-listado.js";
import { sembrarModelos } from "./modelo-repositorio.js";
import {
  definirAutorDetalleEnvio,
  iniciarDetalleEnvio,
  mostrarDetalleEnvio
} from "./ficha-cliente-detalle.js";
import {
  definirAutorEnvios,
  iniciarListadoEnvios,
  mostrarListadoEnvios
} from "./ficha-cliente-listado.js";
import {
  sembrarEnvios,
  semillaEnvios
} from "./ficha-cliente-repositorio.js";
import {
  mostrarFichaPublica,
  ocultarFichaPublica
} from "./ficha-publica.js";
import {
  definirAutorFicha,
  mostrarFicha
} from "./ficha-vista.js";
import { APP, FIREBASE_CONFIG, configLista } from "./config.js";
import { LIMITES, MODULOS, MSG } from "./constantes.js";
import {
  esLocal,
  pedidoDemo,
  semilla,
  semillaCartillas,
  semillaCostos,
  semillaModelos
} from "./demo.js";
import { mensajeError } from "./errores.js";
import {
  entrar,
  iniciarFirebase,
  observarSesion,
  salir
} from "./firebase-cliente.js";
import {
  definirAutor,
  iniciarFormulario,
  mostrarEdicion,
  mostrarNuevo
} from "./formulario.js";
import {
  iniciarListado,
  invalidarListado,
  mostrarListado
} from "./listado.js";
import { registrarError } from "./logger.js";
import { activarMemoria, leerPerfil } from "./repositorio.js";
import { correo, correoValido } from "./sanitizar.js";
import { avisar, mostrar, porId } from "./ui.js";

const CLAVE_INTENTOS = "dts_login_intentos";
const CLAVE_MENU = "dts_menu_cerrado";
const CLAVE_BLOQUEO = "dts_login_hasta";

let autor = null;
let uiLista = false;
let demo = false;

/**
 * Punto de entrada del panel.
 * @returns {Promise<void>}
 */
async function iniciar() {
  try {
    document.title = MSG.tituloDocumento;
    if (esRutaRellenar() && !pedidoDemo()) {
      await iniciarFirebase(FIREBASE_CONFIG);
      window.addEventListener("hashchange", () => {
        alCambiarRuta().catch((error) => {
          registrarError(error, "ruta");
        });
      });
      await mostrarFichaPublica(leerRuta().params.get("t"));
      return;
    }
    if (esLocal()) mostrar(porId("enlace-demo"), true);
    if (pedidoDemo()) {
      await entrarDemo();
      return;
    }
    enlazarLogin();
    enlazarSalir(porId("btn-salir-denegado"));
    if (!configLista()) {
      porId("login-mensaje").textContent = MSG.configIncompleta;
      porId("btn-entrar").disabled = true;
      mostrar(porId("pantalla-login"), true);
      return;
    }
    await iniciarFirebase(FIREBASE_CONFIG);
    observarSesion((usuario) => {
      resolver(usuario).catch((error) => {
        registrarError(error, "resolver");
        porId("login-mensaje").textContent = MSG.fallaInicio;
      });
    });
  } catch (error) {
    registrarError(error, "iniciar");
    mostrar(porId("pantalla-login"), true);
    porId("login-mensaje").textContent = MSG.firebaseFallo;
  }
}

/**
 * @returns {Promise<void>}
 */
async function entrarDemo() {
  demo = true;
  activarMemoria(semilla());
  sembrarCartillas(semillaCartillas());
  sembrarCostos(semillaCostos());
  sembrarModelos(semillaModelos());
  sembrarEnvios(semillaEnvios());
  autor = {
    uid: "demo",
    email: "preview@dts.local",
    nombre: ""
  };
  asegurarUi();
  mostrar(porId("aviso-demo"), true);
  porId("aviso-demo").textContent = MSG.vistaPrevia;
  mostrarApp();
  if (!location.hash || location.hash === "#/login") {
    location.hash = "#/listado";
  }
  await enrutar();
}

/**
 * @param {object|null} usuario
 * @returns {Promise<void>}
 */
async function resolver(usuario) {
  if (!usuario) {
    autor = null;
    mostrar(porId("pantalla-login"), true);
    mostrar(porId("pantalla-denegado"), false);
    mostrar(porId("pantalla-app"), false);
    return;
  }
  const perfil = await leerPerfil(usuario.uid);
  if (!perfil || perfil.rol !== "admin") {
    autor = null;
    mostrar(porId("pantalla-login"), false);
    mostrar(porId("pantalla-app"), false);
    mostrar(porId("pantalla-denegado"), true);
    porId("denegado-detalle").textContent = MSG.uidAyuda;
    porId("denegado-uid").textContent = usuario.uid;
    return;
  }
  autor = {
    uid: usuario.uid,
    email: usuario.email || "",
    nombre: perfil.nombre || ""
  };
  asegurarUi();
  mostrarApp();
  const ruta = leerRuta();
  if (!location.hash || ruta.path === "/login") {
    location.hash = "#/listado";
    return;
  }
  await enrutar();
}

/**
 * @returns {void}
 */
function mostrarApp() {
  mostrar(porId("pantalla-login"), false);
  mostrar(porId("pantalla-denegado"), false);
  mostrar(porId("pantalla-app"), true);
  porId("usuario-nombre").textContent = autor.nombre || autor.email;
}

/**
 * @returns {void}
 */
function asegurarUi() {
  definirAutor(autor);
  definirAutorCartilla(autor);
  definirAutorCosto(autor);
  definirAutorListadoCostos(autor);
  definirAutorModelo(autor);
  definirAutorListadoModelos(autor);
  definirAutorEspec(autor);
  definirAutorFicha(autor);
  definirAutorEnvios(autor);
  definirAutorDetalleEnvio(autor);
  if (uiLista) return;
  uiLista = true;
  iniciarFormulario(() => invalidarListado());
  iniciarListado();
  iniciarCartilla(() => invalidarCartillas());
  iniciarListadoCartillas();
  iniciarCosto(() => invalidarCostos());
  iniciarListadoCostos();
  iniciarModelo(() => {
    invalidarModelos();
    invalidarEspecs();
  }, () => invalidarCostos());
  iniciarListadoModelos();
  iniciarEspec(() => invalidarEspecs());
  iniciarListadoEspecs();
  iniciarListadoEnvios();
  iniciarDetalleEnvio();
  enlazarSalir(porId("btn-salir"));
  iniciarMenu();
  window.addEventListener("hashchange", () => {
    if (!permitirCambioRuta()) return;
    alCambiarRuta().catch((error) => {
      registrarError(error, "ruta");
      avisar(MSG.fallaInicio, "error");
    });
  });
}

/**
 * @returns {boolean}
 */
function esRutaRellenar() {
  return leerRuta().path === "/rellenar";
}

/**
 * @returns {Promise<void>}
 */
async function alCambiarRuta() {
  if (esRutaRellenar()) {
    await mostrarFichaPublica(leerRuta().params.get("t"));
    return;
  }
  ocultarFichaPublica();
  if (autor) {
    mostrar(porId("pantalla-app"), true);
    await enrutar();
  }
}

/**
 * @returns {Promise<void>}
 */
async function enrutar() {
  if (!autor) return;
  const ruta = leerRuta();
  pintarNav(ruta.path);
  if (ruta.path === "/checklist") {
    const id = ruta.params.get("id") || "";
    if (id) await mostrarEdicion(id);
    else await mostrarNuevo(autor.nombre);
    return;
  }
  if (ruta.path === "/cartillas") {
    await mostrarListadoCartillas();
    return;
  }
  if (ruta.path === "/cartilla") {
    const id = ruta.params.get("id") || "";
    if (id) await mostrarCartillaEdicion(id);
    else await mostrarCartillaNueva();
    return;
  }
  if (ruta.path === "/costos") {
    await mostrarListadoCostos();
    return;
  }
  if (ruta.path === "/costo") {
    const id = ruta.params.get("id") || "";
    const copia = ruta.params.get("copia") || "";
    if (id) await mostrarCostoEdicion(id);
    else if (copia) await mostrarCostoCopia(copia);
    else await mostrarCostoNuevo(ruta.params.get("modelo") || "");
    return;
  }
  if (ruta.path === "/modelos") {
    await mostrarListadoModelos();
    return;
  }
  if (ruta.path === "/modelo") {
    const id = ruta.params.get("id") || "";
    if (id) await mostrarModeloEdicion(id);
    else await mostrarModeloNuevo();
    return;
  }
  if (ruta.path === "/ficha") {
    await mostrarFicha();
    return;
  }
  if (ruta.path === "/fichas-envio") {
    await mostrarListadoEnvios();
    return;
  }
  if (ruta.path === "/ficha-envio") {
    const id = ruta.params.get("id") || "";
    if (id) await mostrarDetalleEnvio(id);
    else location.hash = "#/fichas-envio";
    return;
  }
  if (ruta.path === "/rellenar") {
    await mostrarFichaPublica(ruta.params.get("t"));
    return;
  }
  if (ruta.path === "/especificaciones") {
    await mostrarListadoEspecs();
    return;
  }
  if (ruta.path === "/especificacion") {
    const id = ruta.params.get("id") || "";
    if (id) await mostrarEspec(id);
    else location.hash = "#/especificaciones";
    return;
  }
  await mostrarListado();
}

/**
 * Dibuja el menú. Un módulo con «hijos» se muestra como grupo con
 * sus submenús debajo.
 * @param {string} path
 * @returns {void}
 */
function pintarNav(path) {
  const nav = porId("nav-modulos");
  nav.replaceChildren();
  MODULOS.forEach((modulo) => {
    if (modulo.hijos) {
      nav.append(grupoNav(modulo, path));
      return;
    }
    const boton = botonNav(modulo.etiqueta, "nav-item");
    if (!modulo.habilitado) {
      boton.disabled = true;
      const nota = document.createElement("small");
      nota.textContent = MSG.proximo;
      boton.append(nota);
    } else {
      if (modulo.rutas.includes(path)) boton.classList.add("activo");
      boton.addEventListener("click", () => {
        location.hash = modulo.destino;
      });
    }
    nav.append(boton);
  });
}

/**
 * @param {object} modulo
 * @param {string} path
 * @returns {HTMLElement}
 */
function grupoNav(modulo, path) {
  const grupo = document.createElement("div");
  grupo.className = "nav-grupo";
  const activo = modulo.hijos.some((hijo) => hijo.rutas.includes(path));
  const cabeza = botonNav(modulo.etiqueta, "nav-item nav-padre");
  cabeza.setAttribute("aria-expanded", "true");
  if (activo) cabeza.classList.add("abierto");
  cabeza.addEventListener("click", () => {
    location.hash = modulo.hijos[0].destino;
  });
  const lista = document.createElement("div");
  lista.className = "nav-hijos";
  modulo.hijos.forEach((hijo) => {
    const boton = botonNav(hijo.etiqueta, "nav-item nav-hijo");
    if (hijo.rutas.includes(path)) {
      boton.classList.add("activo");
      boton.setAttribute("aria-current", "page");
    }
    boton.addEventListener("click", () => {
      location.hash = hijo.destino;
    });
    lista.append(boton);
  });
  grupo.append(cabeza, lista);
  return grupo;
}

/**
 * @param {string} texto
 * @param {string} clase
 * @returns {HTMLButtonElement}
 */
function botonNav(texto, clase) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = clase;
  const etiqueta = document.createElement("span");
  etiqueta.textContent = texto;
  boton.append(etiqueta);
  return boton;
}

/**
 * @returns {{path: string, params: URLSearchParams}}
 */
function leerRuta() {
  const raw = (location.hash || "#/listado").replace(/^#/, "");
  const limpio = raw.startsWith("/") ? raw : "/listado";
  const partes = limpio.split("?");
  return {
    path: partes[0],
    params: new URLSearchParams(partes[1] || "")
  };
}

/**
 * @returns {void}
 */
function enlazarLogin() {
  porId("form-login").addEventListener("submit", (evento) => {
    evento.preventDefault();
    enviarLogin().catch((error) => {
      porId("login-mensaje").textContent = mensajeError(error);
    });
  });
}

/**
 * @returns {Promise<void>}
 */
async function enviarLogin() {
  const caja = porId("login-mensaje");
  caja.textContent = "";
  if (sesionBloqueada()) {
    caja.textContent = MSG.bloqueoLogin;
    return;
  }
  const email = correo(porId("login-email").value);
  const clave = porId("login-clave").value;
  if (!correoValido(email)) {
    caja.textContent = MSG.correoInvalido;
    return;
  }
  if (clave.length < LIMITES.claveMin) {
    caja.textContent = MSG.claveCorta;
    return;
  }
  porId("btn-entrar").disabled = true;
  porId("btn-entrar").textContent = MSG.entrando;
  try {
    await entrar(email, clave);
    sessionStorage.removeItem(CLAVE_INTENTOS);
    sessionStorage.removeItem(CLAVE_BLOQUEO);
  } catch (error) {
    registrarFalloLogin();
    throw error;
  } finally {
    porId("btn-entrar").disabled = false;
    porId("btn-entrar").textContent = MSG.entrar;
  }
}

/**
 * @returns {boolean}
 */
function sesionBloqueada() {
  const hasta = Number(sessionStorage.getItem(CLAVE_BLOQUEO) || "0");
  return Date.now() < hasta;
}

/**
 * @returns {void}
 */
function registrarFalloLogin() {
  const intentos = Number(
    sessionStorage.getItem(CLAVE_INTENTOS) || "0"
  ) + 1;
  sessionStorage.setItem(CLAVE_INTENTOS, String(intentos));
  if (intentos >= APP.maxIntentosLogin) {
    const hasta = Date.now() + APP.bloqueoLoginMs;
    sessionStorage.setItem(CLAVE_BLOQUEO, String(hasta));
    sessionStorage.setItem(CLAVE_INTENTOS, "0");
  }
}

/**
 * @param {HTMLElement} boton
 * @returns {void}
 */
function iniciarMenu() {
  const app = porId("pantalla-app");
  const boton = porId("btn-menu");
  const cerrado = localStorage.getItem(CLAVE_MENU) === "1";
  pintarMenu(app, boton, cerrado);
  boton.addEventListener("click", () => {
    const siguiente = !app.classList.contains("menu-cerrado");
    localStorage.setItem(CLAVE_MENU, siguiente ? "1" : "0");
    pintarMenu(app, boton, siguiente);
  });
}

/**
 * @param {HTMLElement} app
 * @param {HTMLButtonElement} boton
 * @param {boolean} cerrado
 * @returns {void}
 */
function pintarMenu(app, boton, cerrado) {
  app.classList.toggle("menu-cerrado", cerrado);
  const texto = cerrado ? MSG.abrirMenu : MSG.contraerMenu;
  boton.setAttribute("aria-expanded", cerrado ? "false" : "true");
  boton.setAttribute("aria-label", texto);
  boton.querySelector(".btn-menu-texto").textContent = texto;
}

/**
 * @param {HTMLElement} boton
 * @returns {void}
 */
function enlazarSalir(boton) {
  boton.addEventListener("click", () => {
    cerrarSesion().catch((error) => {
      registrarError(error, "cerrarSesion");
      avisar(MSG.errorGenerico, "error");
    });
  });
}

/**
 * @returns {Promise<void>}
 */
async function cerrarSesion() {
  if (demo) {
    location.href = location.pathname;
    return;
  }
  await salir();
  location.hash = "#/login";
}

iniciar().catch((error) => {
  registrarError(error, "iniciar");
});
