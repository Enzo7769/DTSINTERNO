/**
 * Propósito: Pestaña de la ficha de configuración, hoja
 *   «1. Datos de Config.», con los datos de prueba editables.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-13
 * Dependencias: cambios-pendientes.js, ficha-datos.js,
 *   ficha-repositorio.js,
 *   ficha-validacion.js, logger.js, ui.js
 */

import {
  cambiosGuardados,
  confirmarDescarte,
  marcarCambios,
  vigilarCambios
} from "./cambios-pendientes.js";
import {
  asegurarMenu,
  asegurarRed,
  clavePregunta,
  equipoFisicoListo,
  equipoVacio,
  FICHA_PRUEBA,
  fichaEnBlanco,
  modulosDeSector,
  nombreSiguiente,
  nombresUnicos,
  numerarCampo,
  numerarEquipos,
  OPCIONES_FICHA,
  plantillaFicha,
  sincronizarSectoresTotem,
  totemsDelSector,
  tramitesDeSector
} from "./ficha-datos.js";
import { crearBarraPestanas } from "./ficha-pestanas.js";
import {
  asegurarHorarios,
  componerHorario,
  grupoDeRuta,
  nivelClave
} from "./ficha-seguridad.js";
import {
  aplicarMenu,
  dibujarConfigMenu,
  elegirIndiceMenu,
  esGuardarTotem,
  marcarTotemPendiente,
  moverTeclado,
  pintarItemVista
} from "./ficha-menu-vista.js";
import { alEscribirIp, campoIp } from "./ficha-ip.js";
import { alPulsarSim } from "./ficha-sim-totem.js";
import {
  aplicarRed,
  dibujarDatosRed
} from "./ficha-red-vista.js";
import {
  eliminarFicha,
  guardarFicha,
  listarFichas,
  obtenerFicha
} from "./ficha-repositorio.js";
import { validarFicha } from "./ficha-validacion.js";
import { registrarError } from "./logger.js";
import {
  avisar,
  mostrarVista,
  pedirConfirmacion,
  porId
} from "./ui.js";

/** Valor del selector que carga los datos de ejemplo (SURALIS). */
const EJEMPLO = "__ejemplo";

const TXT = {
  kicker: "Clever Q2",
  titulo: "Ficha de configuración",
  ayuda:
    "Cada ficha se guarda con el nombre de su licitación. "
    + "«Ejemplo SURALIS» muestra una ficha completa de referencia.",
  ejemplo: "Ejemplo SURALIS (referencia)",
  copiaLista:
    "Copia lista, todavía sin guardar. Cambia el nombre de la "
    + "licitación y guarda.",
  sufijoCopia: " (copia)",
  borrarTitulo: "Eliminar ficha",
  borrarTexto:
    "Se eliminará la ficha «{nombre}». Esta acción no se puede "
    + "deshacer.",
  borrarOk: "Eliminar",
  borrada: "Ficha eliminada.",
  falloBorrar: "No se pudo eliminar la ficha.",
  licitacion: "Licitación",
  guardadas: "Fichas guardadas",
  nueva: "Nueva ficha",
  guardar: "Guardar ficha",
  faltaLicitacion: "Indica el nombre de la licitación.",
  yaExiste: "Ya hay una ficha para esa licitación.",
  guardada: "Ficha guardada para la licitación ",
  fallo: "No se pudo guardar la ficha.",
  nota:
    "1 país, 2 oficinas, 3 UDT y 4 trámites en 1.1 "
    + "Config. menú.",
  notaSectores:
    "(PUEDE SER UN (1) SECTOR POR TÓTEM Y VARIOS "
    + "TÓTEM POR UN (1) SECTOR)",
  pasoDatos: "1. Datos de config.",
  pasoMenu: "1.1 Config. menú",
  pasoRed: "2. Datos de red",
  irMenu: "Ir a 1.1 Config. menú",
  pais: "País",
  oficina: "Oficina",
  sector: "Sector",
  totem: "Tótem",
  ip: "Dirección IP",
  menu: "Trámites del menú principal",
  horario: "Horario de atención",
  horaEntrada: "Entrada",
  horaSalida: "Salida",
  usuarioSinEspacio: "El usuario no puede tener espacios.",
  claveReq:
    "Mínimo 8 caracteres, una mayúscula, una "
    + "minúscula, un número y un símbolo.",
  mostrarTramites: "Trámites que atiende",
  ocultarTramites: "Ocultar trámites",
  modulo: "Módulo de atención",
  tramites: "Trámites que atiende",
  todos: "TODOS",
  eligeSectorTramites:
    "Elige el sector para ver sus trámites.",
  sinTramitesSector:
    "Este sector no tiene trámites. "
    + "Créalos en 1.1 Config. menú.",
  nombre: "Nombre",
  usuario: "Usuario",
  clave: "Contraseña",
  numero: "N° usuario",
  moduloId: "Módulo que atiende (idUAC)",
  visor: "Visor",
  barra: "Texto de la barra (113 caracteres)",
  dato: "Dato",
  estado: "Respuesta",
  agregar: "Agregar",
  quitar: "Quitar",
  seleccionar: "Seleccionar",
  manual: "Ingresar manualmente",
  notaSalud: "Solo se rellena si es área de salud.",
  otrosTotem: "Ver otros tótem",
  ocultarOtros: "Ocultar otros",
  fisicoListo: "Listo",
  fisicoFalta: "Pendiente",
  fisicoVacio:
    "Agrega un tótem o visor para responder "
    + "las preguntas físicas."
};

const VAL_MANUAL = "__manual";

let datos = null;
/**
 * Lo que se edita en «Fichas guardadas». montarFichaEn (enlace del
 * cliente) usa `datos` para otra ficha; al volver se recupera esta.
 */
let datosEditor = null;
let actual = null;
let autor = null;
let controles = false;
let paso = "datos";
let raizActiva = null;
let modoPublico = false;
let modoEmbebido = false;
let soloLectura = false;
let internosRedEditables = true;
const modoManual = new Set();
let indiceFisico = 0;
let otrosFisicos = false;
/** @type {string[]} */
let rutasFaltantes = [];

/**
 * Recibe quién guarda la ficha.
 * @param {{uid: string, email: string}|null} sesion
 * @returns {void}
 */
export function definirAutorFicha(sesion) {
  autor = sesion;
}

/**
 * Muestra la ficha. Conserva lo editado en esta sesión.
 * @returns {Promise<void>}
 */
export async function mostrarFicha() {
  modoPublico = false;
  modoEmbebido = false;
  soloLectura = false;
  internosRedEditables = true;
  raizActiva = porId("ficha-cuerpo");
  if (!datosEditor) datosEditor = fichaEnBlanco("");
  datos = datosEditor;
  asegurarMenu(datos);
  asegurarRed(datos);
  asegurarHorarios(datos);
  enlazarControles();
  porId("ficha-ayuda").textContent = TXT.ayuda;
  porId("ficha-licitacion").value = datos.licitacion || "";
  dibujar(raizActiva);
  if (!raizActiva.dataset.listo) {
    raizActiva.dataset.listo = "1";
    raizActiva.addEventListener("input", alEditar);
    raizActiva.addEventListener("change", alCambiar);
    raizActiva.addEventListener("click", alPulsar);
  }
  mostrarVista("vista-ficha");
  await pintarLista(actual && actual.id);
}

/**
 * Dibuja el formulario de ficha en otro contenedor.
 * @param {HTMLElement} raiz
 * @param {object} inicial
 * @param {{publico?: boolean, soloLectura?: boolean,
 *   embebido?: boolean, internosEditables?: boolean}} [ops]
 * @returns {void}
 */
export function montarFichaEn(raiz, inicial, ops) {
  const opt = ops || {};
  modoPublico = Boolean(opt.publico);
  modoEmbebido = Boolean(opt.embebido) || modoPublico;
  soloLectura = Boolean(opt.soloLectura);
  internosRedEditables = modoPublico
    ? false
    : opt.internosEditables !== false;
  raizActiva = raiz;
  datos = structuredClone(inicial);
  asegurarMenu(datos);
  asegurarRed(datos);
  asegurarHorarios(datos);
  paso = "datos";
  if (!raiz.dataset.listo) {
    raiz.dataset.listo = "1";
    raiz.addEventListener("input", alEditar);
    raiz.addEventListener("change", alCambiar);
    raiz.addEventListener("click", alPulsar);
  }
  dibujar(raiz);
  aplicarSoloLectura(raiz);
  aplicarMarcasFaltantes();
}

/**
 * @returns {object|null}
 */
export function obtenerDatosFicha() {
  if (datos) asegurarRed(datos);
  return datos;
}

/**
 * Marca en rojo los campos que faltan.
 * @param {{ruta: string}[]} items
 * @returns {void}
 */
export function marcarCamposFaltantes(items) {
  rutasFaltantes = (items || []).map((item) => item.ruta);
  aplicarMarcasFaltantes();
}

/**
 * Limpia las marcas rojas.
 * @returns {void}
 */
export function limpiarMarcasFaltantes() {
  rutasFaltantes = [];
  aplicarMarcasFaltantes();
}

/**
 * Lleva al campo faltante y lo enfoca.
 * @param {string} ruta
 * @returns {void}
 */
export function irACampoFicha(ruta) {
  const dest = pasoDeRuta(ruta);
  const m = /^menu\.totems\.(\d+)/.exec(ruta || "");
  if (m) elegirIndiceMenu(Number(m[1]));
  if (dest && dest !== paso) {
    paso = dest;
    refrescar();
  } else if (m && paso === "menu") {
    refrescar();
  }
  window.requestAnimationFrame(() => enfocarRuta(ruta));
}

/**
 * @param {boolean} valor
 * @returns {void}
 */
export function marcarFichaSoloLectura(valor) {
  soloLectura = Boolean(valor);
  if (raizActiva) aplicarSoloLectura(raizActiva);
}

/**
 * Vuelve a dibujar sin subir al inicio de la página.
 * @returns {void}
 */
function refrescar() {
  const alto = window.scrollY;
  const raiz = raizActiva || porId("ficha-cuerpo");
  dibujar(raiz);
  aplicarSoloLectura(raiz);
  aplicarMarcasFaltantes();
  window.scrollTo(0, alto);
}

/**
 * @param {HTMLElement} raiz
 * @returns {void}
 */
function aplicarSoloLectura(raiz) {
  if (!raiz) return;
  const off = Boolean(soloLectura);
  raiz.querySelectorAll("input, select, textarea").forEach((n) => {
    n.disabled = off;
  });
  raiz.querySelectorAll("[data-accion]").forEach((n) => {
    n.disabled = off;
  });
}

/**
 * @param {HTMLElement} raiz
 * @returns {void}
 */
function dibujar(raiz) {
  if (datos) asegurarRed(datos);
  if (paso === "menu") {
    raiz.replaceChildren(pasosNav(), dibujarConfigMenu(datos));
    return;
  }
  if (paso === "red") {
    raiz.replaceChildren(pasosNav(), dibujarDatosRed(datos, {
      ocultarInternos: modoPublico,
      internosEditables: internosRedEditables
    }));
    return;
  }
  raiz.replaceChildren(
    pasosNav(),
    nota(),
    identificacion(datos),
    oficinas(datos),
    totems(datos),
    tramites(),
    modulos(datos),
    usuarios(datos),
    ejecutivos(datos),
    visores(datos),
    parametros(datos),
    fisicos(datos),
    requisitos(datos)
  );
}

/**
 * @returns {HTMLElement}
 */
function pasosNav() {
  const nav = document.createElement("nav");
  nav.className = "ficha-pasos";
  nav.setAttribute("aria-label", "Hojas de la ficha");
  [
    ["datos", TXT.pasoDatos],
    ["menu", TXT.pasoMenu],
    ["red", TXT.pasoRed]
  ].forEach(([id, texto]) => {
    const boton = document.createElement("button");
    boton.type = "button";
    const n = conteoFaltantesPaso(id);
    boton.className = "ficha-paso"
      + (paso === id ? " es-activo" : "")
      + (n ? " tiene-faltas" : "");
    boton.dataset.paso = id;
    boton.append(document.createTextNode(texto));
    if (n) {
      const marca = document.createElement("span");
      marca.className = "ficha-paso-falta";
      marca.textContent = String(n);
      boton.append(marca);
    }
    nav.append(boton);
  });
  return nav;
}

/**
 * @param {string} id
 * @returns {number}
 */
function conteoFaltantesPaso(id) {
  return rutasFaltantes.filter((ruta) => (
    grupoDeRuta(ruta) === id
  )).length;
}

/**
 * @param {Event} evento
 * @returns {void}
 */
function alEditar(evento) {
  const campo = evento.target;
  if (campo.tagName === "SELECT") return;
  const cajaIp = campo.closest("[data-ip]");
  if (cajaIp) {
    const ruta = cajaIp.dataset.ruta;
    asignar(datos, ruta, alEscribirIp(campo, cajaIp));
    return;
  }
  if (!campo.dataset || !campo.dataset.ruta) return;
  if (campo.dataset.usuario) {
    campo.value = String(campo.value).replace(/\s+/g, "");
  }
  asignar(datos, campo.dataset.ruta, campo.value);
  syncHorarioTotem(campo.dataset.ruta);
  marcarTotemPendiente(datos, campo.dataset.ruta);
  pintarItemVista(campo.dataset.ruta, campo.value);
  if (String(campo.dataset.ruta).startsWith("equipos.")) {
    pintarChecksFisicos();
  }
}

/**
 * Aplica la opción de una lista o abre el ingreso a mano.
 * @param {Event} evento
 * @returns {void}
 */
function alCambiar(evento) {
  const sel = evento.target;
  if (sel.dataset && sel.dataset.lote) {
    aplicarLoteTramites(sel);
    return;
  }
  if (sel.tagName !== "SELECT" || !sel.dataset.ruta) return;
  if (sel.dataset.combo) {
    if (sel.value === VAL_MANUAL) {
      modoManual.add(sel.dataset.ruta);
      asignar(datos, sel.dataset.ruta, "");
    } else {
      modoManual.delete(sel.dataset.ruta);
      asignar(datos, sel.dataset.ruta, sel.value);
    }
    refrescar();
    return;
  }
  asignar(datos, sel.dataset.ruta, sel.value);
  marcarTotemPendiente(datos, sel.dataset.ruta);
  if (sel.dataset.teclado) moverTeclado(sel.value);
  const ruta = sel.dataset.ruta;
  if (/^gruposModulo\.\d+\.sector$/.test(ruta)
    || /^totems\.\d+\.sector$/.test(ruta)
    || /^sectores\.\d+\.totem$/.test(ruta)
    || /^ejecutivos\.\d+\.sector$/.test(ruta)
    || /^visores\.\d+\.sector$/.test(ruta)) {
    if (/^gruposModulo\.\d+\.sector$/.test(ruta)) {
      limpiarTramitesFueraDeSector(ruta, sel.value);
    }
    sincronizarSectoresTotem(datos);
    asegurarMenu(datos);
    refrescar();
  }
}

/**
 * @param {Event} evento
 * @returns {void}
 */
function alPulsar(evento) {
  const acc = evento.target.closest("[data-acordeon]");
  if (acc) {
    alternarAcordeon(acc);
    return;
  }
  if (datos && datos.menu && alPulsarSim(evento, datos.menu)) {
    return;
  }
  const pasoBtn = evento.target.closest("[data-paso]");
  if (pasoBtn) {
    paso = pasoBtn.dataset.paso;
    refrescar();
    window.scrollTo(0, 0);
    return;
  }
  const boton = evento.target.closest("[data-accion]");
  if (!boton) return;
  const codigo = boton.dataset.accion;
  aplicarAccion(codigo);
  if (esGuardarTotem(codigo) && !modoEmbebido) {
    alGuardar().then(() => refrescar()).catch((error) => {
      registrarError(error, "ficha.guardarTotem");
      refrescar();
    });
    return;
  }
  refrescar();
}

/**
 * @param {string} codigo
 * @returns {void}
 */
function aplicarAccion(codigo) {
  if (aplicarMenu(datos, codigo)) return;
  if (aplicarFisico(codigo)) return;
  if (aplicarRed(datos, codigo)) return;
  const p = codigo.split(":");
  if (p[0] === "sumar" && p.length === 2) {
    datos[p[1]].push(plantillaFicha(p[1]));
  } else if (p[0] === "quitar" && p.length === 3) {
    datos[p[1]].splice(Number(p[2]), 1);
  } else if (p[3] === "filas" && p[0] === "sumar") {
    const clave = p[1] === "gruposModulo" ? "modulo" : "ejecutivo";
    datos[p[1]][Number(p[2])].filas.push(plantillaFicha(clave));
  } else if (p[3] === "filas" && p[0] === "quitar") {
    datos[p[1]][Number(p[2])].filas.splice(Number(p[4]), 1);
  } else if (p[0] === "sumar" && p[1] === "equipo") {
    datos.equipos.push(equipoVacio(p[2]));
  }
  if (p[1] === "equipo" || p[1] === "equipos") {
    datos.equipos = numerarEquipos(datos.equipos);
    modoManual.clear();
    if (p[0] === "sumar") {
      indiceFisico = datos.equipos.length - 1;
    } else if (indiceFisico >= datos.equipos.length) {
      indiceFisico = Math.max(0, datos.equipos.length - 1);
    }
  }
  if (p[1] === "totems") {
    datos.totems = numerarCampo(datos.totems, "totem", "TÓTEM");
  }
  if (p[1] === "visores") {
    datos.visores = numerarCampo(datos.visores, "visor", "VISOR");
  }
  numerarModulosYUsuarios(p);
}

/**
 * @param {object} obj
 * @param {string} ruta
 * @param {string} valor
 * @returns {void}
 */
/**
 * El módulo nuevo toma el siguiente nombre (editable).
 * El N° de usuario se reenumera siempre.
 * @param {string[]} p
 * @returns {void}
 */
function numerarModulosYUsuarios(p) {
  if (p[1] === "gruposModulo" && p[0] === "sumar") {
    const grupos = datos.gruposModulo;
    const filas = p[3] === "filas"
      ? grupos[Number(p[2])].filas
      : grupos[grupos.length - 1].filas;
    if (filas && filas.length) {
      const resto = filas.slice(0, -1);
      filas[filas.length - 1].modulo = nombreSiguiente(
        resto,
        "modulo",
        "MÓDULO"
      );
    }
  }
  if (p[1] === "ejecutivos") {
    const grupos = datos.ejecutivos;
    if (p[3] === "filas") {
      const g = Number(p[2]);
      grupos[g].filas = numerarCampo(
        grupos[g].filas,
        "numero",
        "USUARIO"
      );
    } else if (p[0] === "sumar") {
      const ultimo = grupos[grupos.length - 1];
      ultimo.filas = numerarCampo(ultimo.filas, "numero", "USUARIO");
    }
  }
}

/**
 * @param {object} obj
 * @param {string} ruta
 * @param {string} valor
 * @returns {void}
 */
function asignar(obj, ruta, valor) {
  const partes = ruta.split(".");
  let nodo = obj;
  for (let i = 0; i < partes.length - 1; i += 1) {
    nodo = nodo[partes[i]];
  }
  nodo[partes[partes.length - 1]] = valor;
}

/**
 * @returns {HTMLElement}
 */
function nota() {
  const p = document.createElement("p");
  p.className = "ficha-nota";
  p.textContent = TXT.nota;
  return p;
}

/**
 * @param {string} numero
 * @param {string} titulo
 * @param {string} [ayuda]
 * @returns {HTMLElement}
 */
function bloque(numero, titulo, ayuda) {
  const nodo = document.createElement("section");
  nodo.className = "tarjeta ficha-bloque";
  const h2 = document.createElement("h2");
  h2.textContent = `${numero}. ${titulo}`;
  nodo.append(h2);
  if (ayuda) {
    const p = document.createElement("p");
    p.className = "ayuda";
    p.textContent = ayuda;
    nodo.append(p);
  }
  return nodo;
}

/**
 * @param {string} valor
 * @param {string} ruta
 * @param {number} [max]
 * @returns {HTMLInputElement}
 */
function campo(valor, ruta, max) {
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = max || 160;
  input.value = valor == null ? "" : String(valor);
  input.autocomplete = "off";
  input.dataset.ruta = ruta;
  return input;
}

/**
 * @param {object} fila
 * @param {number} i
 * @returns {HTMLElement}
 */
function horarioTotem(fila, i) {
  const caja = document.createElement("div");
  caja.className = "ficha-horario";
  caja.append(
    campoHora(
      TXT.horaEntrada,
      fila.horaEntrada,
      `totems.${i}.horaEntrada`
    ),
    campoHora(
      TXT.horaSalida,
      fila.horaSalida,
      `totems.${i}.horaSalida`
    )
  );
  return caja;
}

/**
 * @param {string} etiqueta
 * @param {string} valor
 * @param {string} ruta
 * @returns {HTMLLabelElement}
 */
function campoHora(etiqueta, valor, ruta) {
  const lab = document.createElement("label");
  lab.className = "ficha-hora";
  const span = document.createElement("span");
  span.textContent = `${etiqueta} *`;
  const input = document.createElement("input");
  input.type = "time";
  input.required = true;
  input.value = valor || "";
  input.dataset.ruta = ruta;
  lab.append(span, input);
  return lab;
}

/**
 * @param {string} valor
 * @param {string} ruta
 * @returns {HTMLElement}
 */
function campoUsuario(valor, ruta) {
  const caja = document.createElement("div");
  caja.className = "ficha-usuario-caja";
  const input = campo(valor, ruta, 40);
  input.dataset.usuario = "1";
  const p = document.createElement("p");
  p.className = "ayuda";
  p.textContent = TXT.usuarioSinEspacio;
  caja.append(input, p);
  return caja;
}

/**
 * @param {string} valor
 * @param {string} ruta
 * @returns {HTMLElement}
 */
function campoClave(valor, ruta) {
  const caja = document.createElement("div");
  caja.className = "ficha-clave-caja";
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 80;
  input.value = valor || "";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.dataset.ruta = ruta;
  const req = document.createElement("p");
  req.className = "ficha-clave-req";
  req.textContent = TXT.claveReq;
  const barra = document.createElement("div");
  barra.className = "ficha-clave-barra";
  const fill = document.createElement("span");
  const et = document.createElement("small");
  et.className = "ficha-clave-eti";
  const pintar = () => {
    const n = nivelClave(input.value);
    fill.dataset.nivel = n.clave;
    fill.style.width = n.pct;
    et.textContent = n.texto;
  };
  fill.className = "ficha-clave-nivel";
  barra.append(fill);
  pintar();
  input.addEventListener("input", pintar);
  caja.append(input, req, barra, et);
  return caja;
}

/**
 * @param {string} ruta
 * @returns {void}
 */
function syncHorarioTotem(ruta) {
  const m = /^totems\.(\d+)\.hora(Entrada|Salida)$/.exec(ruta);
  if (!m || !datos) return;
  const fila = datos.totems[Number(m[1])];
  if (!fila) return;
  fila.horario = componerHorario(
    fila.horaEntrada,
    fila.horaSalida
  );
}

/**
 * @param {HTMLElement} btn
 * @returns {void}
 */
function alternarAcordeon(btn) {
  const caja = btn.closest(".ficha-tramites-mod");
  if (!caja) return;
  const cuerpo = caja.querySelector(".ficha-tramites-cuerpo");
  if (!cuerpo) return;
  const abrir = cuerpo.hidden;
  cuerpo.hidden = !abrir;
  btn.classList.toggle("es-abierto", abrir);
  const lote = caja.dataset.rutaLote;
  const valor = lote ? leerRuta(datos, lote) : "";
  btn.textContent = abrir
    ? TXT.ocultarTramites
    : resumenTramites(valor);
}

/**
 * @param {unknown} valor
 * @returns {string}
 */
function resumenTramites(valor) {
  const lista = parsearLista(valor);
  if (!lista.length) return TXT.mostrarTramites;
  if (lista.includes(TXT.todos)) {
    return `${TXT.mostrarTramites}: ${TXT.todos}`;
  }
  return `${TXT.mostrarTramites} (${lista.length})`;
}

/**
 * @param {string[]} columnas
 * @param {HTMLElement[][]} filas
 * @returns {HTMLTableElement}
 */
function tabla(columnas, filas) {
  const table = document.createElement("table");
  table.className = "ficha-tabla";
  const cabeza = document.createElement("tr");
  columnas.forEach((texto) => {
    const th = document.createElement("th");
    th.textContent = texto;
    cabeza.append(th);
  });
  const thead = document.createElement("thead");
  thead.append(cabeza);
  const cuerpo = document.createElement("tbody");
  filas.forEach((celdas) => {
    const tr = document.createElement("tr");
    celdas.forEach((celda) => {
      const td = document.createElement("td");
      td.append(celda);
      tr.append(td);
    });
    cuerpo.append(tr);
  });
  table.append(thead, cuerpo);
  return table;
}

/**
 * @param {string} texto
 * @param {string} accion
 * @returns {HTMLButtonElement}
 */
function botonAccion(texto, accion) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = accion.startsWith("quitar")
    ? "boton boton-secundario ficha-quitar"
    : "boton boton-secundario";
  boton.textContent = texto;
  boton.dataset.accion = accion;
  return boton;
}

/**
 * @param {string[][]} lista
 * @returns {HTMLElement}
 */
function barraAcciones(lista) {
  const caja = document.createElement("div");
  caja.className = "ficha-acciones";
  lista.forEach(([texto, accion]) => {
    caja.append(botonAccion(texto, accion));
  });
  return caja;
}

/**
 * @param {object} ficha
 * @returns {HTMLElement}
 */
function identificacion(ficha) {
  const nodo = bloque(
    "1",
    "Identificación de las oficinas",
    "País de las sucursales."
  );
  const pais = document.createElement("label");
  pais.className = "campo";
  const span = document.createElement("span");
  span.textContent = TXT.pais;
  pais.append(span, campo(ficha.pais, "pais", 40));
  nodo.append(pais);
  return nodo;
}

/**
 * @param {object} ficha
 * @returns {HTMLElement}
 */
function oficinas(ficha) {
  const nodo = bloque(
    "2",
    "Agregar oficinas",
    "Sucursales o sedes físicas."
  );
  ficha.oficinas.forEach((nombre, i) => {
    const linea = document.createElement("div");
    linea.className = "ficha-linea";
    const lab = document.createElement("label");
    lab.className = "campo";
    const et = document.createElement("span");
    et.textContent = `${TXT.oficina} ${i + 1}`;
    lab.append(et, campo(nombre, `oficinas.${i}`, 160));
    linea.append(lab, botonAccion(TXT.quitar, `quitar:oficinas:${i}`));
    nodo.append(linea);
  });
  nodo.append(barraAcciones([[
    `${TXT.agregar} oficina`,
    "sumar:oficinas"
  ]]));
  const sub = document.createElement("h3");
  sub.textContent = "Sectores";
  nodo.append(sub);
  const ayuda = document.createElement("p");
  ayuda.className = "ayuda";
  ayuda.textContent = TXT.notaSectores;
  nodo.append(ayuda);
  nodo.append(tabla(
    [TXT.oficina, TXT.sector, TXT.totem, ""],
    ficha.sectores.map((fila, i) => [
      listaCampo(fila.oficina, `sectores.${i}.oficina`, "oficina"),
      campo(fila.sector, `sectores.${i}.sector`),
      listaCampo(fila.totem, `sectores.${i}.totem`, "totem"),
      botonAccion(TXT.quitar, `quitar:sectores:${i}`)
    ])
  ));
  nodo.append(barraAcciones([[
    `${TXT.agregar} sector`,
    "sumar:sectores"
  ]]));
  return nodo;
}

/**
 * El detalle del menú vive en la hoja 1.1, todavía no en esta pestaña.
 * @returns {HTMLElement}
 */
function tramites() {
  const nodo = bloque(
    "4",
    "Trámites y subtrámites",
    "Crea primero los UDT. El menú de cada tótem "
    + "se completa en 1.1 Config. menú."
  );
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton boton-secundario";
  boton.dataset.paso = "menu";
  boton.textContent = TXT.irMenu;
  nodo.append(boton);
  return nodo;
}

/**
 * @param {object} ficha
 * @returns {HTMLElement}
 */
function totems(ficha) {
  asegurarHorarios(ficha);
  const nodo = bloque(
    "3",
    "UDT · Unidad dispensadora de tickets",
    "Tótem o kiosco para tomar un número."
  );
  nodo.dataset.ancla = "totems";
  nodo.append(tabla(
    [
      TXT.totem, TXT.oficina, TXT.sector, TXT.ip,
      TXT.horario, ""
    ],
    ficha.totems.map((fila, i) => [
      campo(fila.totem, `totems.${i}.totem`, 40),
      listaCampo(fila.oficina, `totems.${i}.oficina`, "oficina"),
      listaCampo(fila.sector, `totems.${i}.sector`, "sector"),
      campoIp(fila.ip, `totems.${i}.ip`),
      horarioTotem(fila, i),
      botonAccion(TXT.quitar, `quitar:totems:${i}`)
    ])
  ));
  nodo.append(barraAcciones([[
    `${TXT.agregar} tótem`,
    "sumar:totems"
  ]]));
  return nodo;
}

/**
 * @param {object} ficha
 * @returns {HTMLElement}
 */
function modulos(ficha) {
  asegurarMenu(ficha);
  const nodo = bloque(
    "5",
    "UAC · Módulos de atención",
    "Solo aparecen los trámites del sector, "
    + "creados en 1.1 Config. menú."
  );
  ficha.gruposModulo.forEach((grupo, g) => {
    nodo.append(cabezaGrupo(
      grupo.sector,
      `gruposModulo.${g}.sector`,
      `quitar:gruposModulo:${g}`,
      "sector"
    ));
    nodo.append(tabla(
      [TXT.modulo, TXT.tramites, ""],
      grupo.filas.map((fila, i) => [
        campo(fila.modulo, `gruposModulo.${g}.filas.${i}.modulo`, 40),
        listaTramitesModulo(
          fila.tramites,
          `gruposModulo.${g}.filas.${i}.tramites`,
          grupo.sector
        ),
        botonAccion(TXT.quitar, `quitar:gruposModulo:${g}:filas:${i}`)
      ])
    ));
    nodo.append(barraAcciones([[
      `${TXT.agregar} módulo`,
      `sumar:gruposModulo:${g}:filas`
    ]]));
  });
  nodo.append(barraAcciones([[
    `${TXT.agregar} sector UAC`,
    "sumar:gruposModulo"
  ]]));
  return nodo;
}

/**
 * @param {object} ficha
 * @returns {HTMLElement}
 */
function usuarios(ficha) {
  const nodo = bloque(
    "6",
    "Usuarios de administración Clever Q2"
  );
  const general = document.createElement("h3");
  general.textContent = "Administrador general";
  nodo.append(general);
  nodo.append(tabla(
    [TXT.nombre, TXT.usuario, TXT.clave, ""],
    ficha.admins.map((fila, i) => [
      campo(fila.nombre, `admins.${i}.nombre`),
      campoUsuario(fila.usuario, `admins.${i}.usuario`),
      campoClave(fila.clave, `admins.${i}.clave`),
      botonAccion(TXT.quitar, `quitar:admins:${i}`)
    ])
  ));
  nodo.append(barraAcciones([[
    `${TXT.agregar} administrador`,
    "sumar:admins"
  ]]));
  const sector = document.createElement("h3");
  sector.textContent = "Administrador de sector";
  nodo.append(sector);
  nodo.append(tabla(
    [TXT.sector, TXT.nombre, TXT.usuario, TXT.clave, ""],
    ficha.adminsSector.map((fila, i) => [
      listaCampo(fila.sector, `adminsSector.${i}.sector`, "sector"),
      campo(fila.nombre, `adminsSector.${i}.nombre`),
      campoUsuario(fila.usuario, `adminsSector.${i}.usuario`),
      campoClave(fila.clave, `adminsSector.${i}.clave`),
      botonAccion(TXT.quitar, `quitar:adminsSector:${i}`)
    ])
  ));
  nodo.append(barraAcciones([[
    `${TXT.agregar} administrador de sector`,
    "sumar:adminsSector"
  ]]));
  return nodo;
}

/**
 * @param {object} ficha
 * @returns {HTMLElement}
 */
function ejecutivos(ficha) {
  const nodo = bloque(
    "7",
    "Usuarios UAC",
    "Ejecutivos que atienden al público."
  );
  ficha.ejecutivos.forEach((grupo, g) => {
    nodo.append(cabezaGrupo(
      grupo.sector,
      `ejecutivos.${g}.sector`,
      `quitar:ejecutivos:${g}`,
      "sector"
    ));
    nodo.append(tabla(
      [TXT.numero, TXT.moduloId, TXT.nombre, TXT.usuario, TXT.clave, ""],
      grupo.filas.map((fila, i) => [
        textoFijo(fila.numero),
        listaDinamica(
          fila.modulo,
          `ejecutivos.${g}.filas.${i}.modulo`,
          () => modulosDeSector(datos, grupo.sector)
        ),
        campo(fila.nombre, `ejecutivos.${g}.filas.${i}.nombre`),
        campoUsuario(
          fila.usuario,
          `ejecutivos.${g}.filas.${i}.usuario`
        ),
        campoClave(fila.clave, `ejecutivos.${g}.filas.${i}.clave`),
        botonAccion(TXT.quitar, `quitar:ejecutivos:${g}:filas:${i}`)
      ])
    ));
    nodo.append(barraAcciones([[
      `${TXT.agregar} usuario`,
      `sumar:ejecutivos:${g}:filas`
    ]]));
  });
  nodo.append(barraAcciones([[
    `${TXT.agregar} sector de usuarios`,
    "sumar:ejecutivos"
  ]]));
  return nodo;
}

/**
 * @param {object} ficha
 * @returns {HTMLElement}
 */
function visores(ficha) {
  const nodo = bloque(
    "8",
    "Visores",
    "Puede haber más de un visor por tótem."
  );
  nodo.append(tabla(
    [TXT.sector, TXT.totem, TXT.visor, TXT.barra, ""],
    ficha.visores.map((fila, i) => [
      listaCampo(fila.sector, `visores.${i}.sector`, "sector"),
      listaDinamica(
        fila.totem,
        `visores.${i}.totem`,
        () => totemsDelSector(datos, fila.sector)
      ),
      campo(fila.visor, `visores.${i}.visor`, 40),
      campo(fila.texto, `visores.${i}.texto`, 113),
      botonAccion(TXT.quitar, `quitar:visores:${i}`)
    ])
  ));
  nodo.append(barraAcciones([[
    `${TXT.agregar} visor`,
    "sumar:visores"
  ]]));
  return nodo;
}

/**
 * @param {object} ficha
 * @returns {HTMLElement}
 */
function parametros(ficha) {
  const nodo = bloque(
    "9",
    "Parámetros de tipos de atención",
    TXT.notaSalud
  );
  nodo.append(parametro(
    "IdCentro",
    "Código del establecimiento. Ejemplo: 10-340.",
    ficha.idCentro,
    "idCentro",
    40
  ));
  nodo.append(parametro(
    "Mensaje de retiro atrasado",
    "Se muestra si pasan los minutos de tolerancia.",
    ficha.msgAtrasado,
    "msgAtrasado",
    200
  ));
  nodo.append(parametro(
    "Minutos de atraso tolerados",
    "Minutos después de la hora en que aún se registra.",
    ficha.minutosAtraso,
    "minutosAtraso",
    4
  ));
  nodo.append(parametro(
    "Minutos de adelanto tolerados",
    "Minutos antes de la hora en que ya se puede llegar.",
    ficha.minutosAdelanto,
    "minutosAdelanto",
    4
  ));
  nodo.append(parametro(
    "Mensaje de llegada anticipada",
    "Se muestra si llega antes del tiempo permitido.",
    ficha.msgTemprano,
    "msgTemprano",
    200
  ));
  return nodo;
}

/**
 * @param {string} titulo
 * @param {string} ayuda
 * @param {string} valor
 * @param {string} ruta
 * @param {number} max
 * @returns {HTMLElement}
 */
function parametro(titulo, ayuda, valor, ruta, max) {
  const lab = document.createElement("label");
  lab.className = "campo";
  const span = document.createElement("span");
  span.textContent = titulo;
  const p = document.createElement("small");
  p.className = "ayuda";
  p.textContent = ayuda;
  lab.append(span, p, campo(valor, ruta, max));
  return lab;
}

/**
 * @param {object} ficha
 * @returns {HTMLElement}
 */
function fisicos(ficha) {
  const nodo = bloque(
    "10",
    "Datos físicos del establecimiento"
  );
  const equipos = ficha.equipos || [];
  if (!equipos.length) {
    const p = document.createElement("p");
    p.className = "ayuda";
    p.textContent = TXT.fisicoVacio;
    nodo.append(p);
  } else {
    const i = indiceFisicoDe(equipos.length);
    nodo.append(crearBarraPestanas({
      items: equipos.map((eq) => ({
        titulo: eq.titulo,
        listo: equipoFisicoListo(eq)
      })),
      activo: i,
      otrosAbiertos: otrosFisicos,
      prefijo: "fisico",
      txtOtros: TXT.otrosTotem,
      txtOcultar: TXT.ocultarOtros,
      txtListo: TXT.fisicoListo,
      txtFalta: TXT.fisicoFalta
    }));
    nodo.append(cuerpoFisico(equipos[i], i));
  }
  nodo.append(barraAcciones([
    [`${TXT.agregar} tótem`, "sumar:equipo:totem"],
    [`${TXT.agregar} visor`, "sumar:equipo:visor"]
  ]));
  return nodo;
}

/**
 * @param {number} total
 * @returns {number}
 */
function indiceFisicoDe(total) {
  if (total < 1) return -1;
  if (indiceFisico < 0 || indiceFisico >= total) {
    indiceFisico = 0;
  }
  return indiceFisico;
}

/**
 * @param {object} equipo
 * @param {number} e
 * @returns {HTMLElement}
 */
function cuerpoFisico(equipo, e) {
  const caja = document.createElement("div");
  const cabeza = document.createElement("div");
  cabeza.className = "ficha-grupo-cabeza";
  const lab = document.createElement("label");
  lab.className = "campo ficha-subtitulo";
  const span = document.createElement("span");
  span.textContent = equipo.titulo;
  lab.append(span);
  cabeza.append(lab, botonAccion(TXT.quitar, `quitar:equipos:${e}`));
  caja.append(cabeza);
  const nro = numeroEquipo(equipo.titulo, e);
  equipo.pares.forEach((par, i) => {
    const rejilla = document.createElement("div");
    rejilla.className = "ficha-par";
    rejilla.append(pregunta(
      par.izquierda,
      par.respuestaIzq,
      `equipos.${e}.pares.${i}.respuestaIzq`,
      par.claveIzq,
      nro
    ));
    if (par.derecha) {
      rejilla.append(pregunta(
        par.derecha,
        par.respuestaDer,
        `equipos.${e}.pares.${i}.respuestaDer`,
        par.claveDer,
        nro
      ));
    }
    caja.append(rejilla);
  });
  return caja;
}

/**
 * @param {string} codigo
 * @returns {boolean}
 */
function aplicarFisico(codigo) {
  const p = String(codigo || "").split(":");
  if (p[0] !== "fisico") return false;
  if (p[1] === "elegir") {
    indiceFisico = Number(p[2]);
    return true;
  }
  if (p[1] === "verOtros") {
    otrosFisicos = true;
    return true;
  }
  if (p[1] === "ocultarOtros") {
    otrosFisicos = false;
    return true;
  }
  return true;
}

/**
 * Actualiza el check verde de datos físicos.
 * @returns {void}
 */
function pintarChecksFisicos() {
  if (!datos || !Array.isArray(datos.equipos)) return;
  datos.equipos.forEach((eq, i) => {
    const item = document.querySelector(
      `[data-accion="fisico:elegir:${i}"]`
    );
    if (!item) return;
    const listo = equipoFisicoListo(eq);
    item.classList.toggle("es-listo", listo);
    const marca = item.querySelector(".ficha-totem-check");
    if (marca) marca.textContent = listo ? "✓" : "";
    const est = item.querySelector(".ficha-totem-estado");
    if (est) {
      est.textContent = listo ? TXT.fisicoListo : TXT.fisicoFalta;
    }
  });
}

/**
 * Número del equipo a partir del título o del índice.
 * @param {string} titulo
 * @param {number} indice
 * @returns {string}
 */
function numeroEquipo(titulo, indice) {
  const hallado = String(titulo || "").match(/(\d+)/);
  return hallado ? hallado[1] : String(indice + 1);
}

/**
 * @param {string} texto
 * @param {string} valor
 * @param {string} ruta
 * @param {string} [clave]
 * @param {string} [numero]
 * @returns {HTMLElement}
 */
function pregunta(texto, valor, ruta, clave, numero) {
  const titulo = String(texto || "").replace("{n}", numero || "");
  const tipo = clavePregunta(titulo, clave);
  const lab = document.createElement("label");
  lab.className = "campo";
  const span = document.createElement("span");
  span.textContent = titulo;
  lab.append(
    span,
    tipo ? combo(valor, ruta, tipo) : campo(valor, ruta, 80)
  );
  return lab;
}

/**
 * Lista de opciones y, si hace falta, el campo a mano.
 * @param {string} valor
 * @param {string} ruta
 * @param {string} tipo
 * @returns {HTMLElement}
 */
function combo(valor, ruta, tipo) {
  const caja = document.createElement("div");
  caja.className = "ficha-combo";
  const lista = OPCIONES_FICHA[tipo] || [];
  const enLista = lista.includes(valor);
  const aMano = modoManual.has(ruta) || (!!valor && !enLista);
  const select = document.createElement("select");
  select.dataset.ruta = ruta;
  select.dataset.combo = tipo;
  select.append(opcion("", TXT.seleccionar));
  lista.forEach((item) => select.append(opcion(item, item)));
  select.append(opcion(VAL_MANUAL, TXT.manual));
  select.value = aMano ? VAL_MANUAL : (valor || "");
  caja.append(select);
  if (aMano) caja.append(campo(valor, ruta, 80));
  return caja;
}

/**
 * @param {string} valor
 * @param {string} etiqueta
 * @returns {HTMLOptionElement}
 */
function opcion(valor, etiqueta) {
  const nodo = document.createElement("option");
  nodo.value = valor;
  nodo.textContent = etiqueta;
  return nodo;
}

/**
 * @param {object} ficha
 * @returns {HTMLElement}
 */
function requisitos(ficha) {
  const nodo = bloque("11", "Requerimientos adicionales");
  nodo.append(tabla(
    ["Requerimiento", TXT.estado, ""],
    ficha.requisitos.map((fila, i) => [
      campo(fila.texto, `requisitos.${i}.texto`, 200),
      campo(fila.estado, `requisitos.${i}.estado`, 40),
      botonAccion(TXT.quitar, `quitar:requisitos:${i}`)
    ])
  ));
  nodo.append(barraAcciones([[
    `${TXT.agregar} requerimiento`,
    "sumar:requisitos"
  ]]));
  return nodo;
}

/**
 * @param {string} valor
 * @param {string} ruta
 * @param {string} accion
 * @param {string} [tipoLista]
 * @returns {HTMLElement}
 */
function cabezaGrupo(valor, ruta, accion, tipoLista) {
  const caja = document.createElement("div");
  caja.className = "ficha-grupo-cabeza";
  const lab = document.createElement("label");
  lab.className = "campo ficha-subtitulo";
  const span = document.createElement("span");
  span.textContent = TXT.sector;
  lab.append(
    span,
    tipoLista
      ? listaCampo(valor, ruta, tipoLista)
      : campo(valor, ruta)
  );
  caja.append(lab, botonAccion("Quitar sector", accion));
  return caja;
}

/**
 * @param {string} valor
 * @returns {HTMLElement}
 */
/**
 * @param {string} valor
 * @returns {string[]}
 */
function parsearLista(valor) {
  return String(valor || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * @param {string} valor
 * @param {string} ruta
 * @param {string} sector
 * @returns {HTMLElement}
 */
function listaTramitesModulo(valor, ruta, sector) {
  const caja = document.createElement("div");
  caja.className = "ficha-tramites-mod";
  caja.dataset.rutaLote = ruta;
  const clave = String(sector || "").trim();
  const opciones = clave ? tramitesDeSector(datos, clave) : [];
  if (!clave || !opciones.length) {
    const p = document.createElement("p");
    p.className = "ayuda";
    p.textContent = clave
      ? TXT.sinTramitesSector
      : TXT.eligeSectorTramites;
    caja.append(p);
    return caja;
  }
  const elegidos = new Set(parsearLista(valor));
  const todos = elegidos.has(TXT.todos);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ficha-tramites-acc";
  btn.dataset.acordeon = "1";
  btn.textContent = resumenTramites(valor);
  const cuerpo = document.createElement("div");
  cuerpo.className = "ficha-tramites-cuerpo";
  cuerpo.hidden = true;
  [TXT.todos, ...opciones].forEach((texto) => {
    cuerpo.append(opcionTramite(texto, todos, elegidos));
  });
  caja.append(btn, cuerpo);
  return caja;
}

/**
 * @param {string} texto
 * @param {boolean} todos
 * @param {Set<string>} elegidos
 * @returns {HTMLLabelElement}
 */
function opcionTramite(texto, todos, elegidos) {
  const lab = document.createElement("label");
  lab.className = "ficha-tramite-op";
  const ck = document.createElement("input");
  ck.type = "checkbox";
  ck.value = texto;
  ck.dataset.lote = "1";
  ck.checked = texto === TXT.todos
    ? todos
    : !todos && elegidos.has(texto);
  lab.append(ck, document.createTextNode(` ${texto}`));
  return lab;
}

/**
 * @param {HTMLInputElement} el
 * @returns {void}
 */
function aplicarLoteTramites(el) {
  const caja = el.closest("[data-ruta-lote]");
  if (!caja || !datos) return;
  const ruta = caja.dataset.rutaLote;
  const cajas = [
    ...caja.querySelectorAll("input[type=checkbox]")
  ];
  if (el.value === TXT.todos && el.checked) {
    cajas.forEach((n) => {
      if (n.value !== TXT.todos) n.checked = false;
    });
    asignar(datos, ruta, TXT.todos);
    pintarResumenTramites(caja, TXT.todos);
    return;
  }
  if (el.value !== TXT.todos && el.checked) {
    cajas.forEach((n) => {
      if (n.value === TXT.todos) n.checked = false;
    });
  }
  const vals = cajas
    .filter((n) => n.checked && n.value !== TXT.todos)
    .map((n) => n.value);
  asignar(datos, ruta, vals.join(", "));
  pintarResumenTramites(caja, vals.join(", "));
}

/**
 * @param {HTMLElement} caja
 * @param {string} valor
 * @returns {void}
 */
function pintarResumenTramites(caja, valor) {
  const acc = caja.querySelector("[data-acordeon]");
  if (!acc || acc.classList.contains("es-abierto")) return;
  acc.textContent = resumenTramites(valor);
}

/**
 * @param {string} rutaSector
 * @param {string} sector
 * @returns {void}
 */
function limpiarTramitesFueraDeSector(rutaSector, sector) {
  const i = Number(rutaSector.split(".")[1]);
  const grupo = datos.gruposModulo[i];
  if (!grupo) return;
  const ok = new Set(tramitesDeSector(datos, sector));
  (grupo.filas || []).forEach((fila) => {
    if (fila.tramites === TXT.todos) return;
    fila.tramites = parsearLista(fila.tramites)
      .filter((t) => ok.has(t))
      .join(", ");
  });
}

/**
 * @param {string} valor
 * @returns {HTMLElement}
 */
function textoFijo(valor) {
  const span = document.createElement("span");
  span.className = "ficha-fijo";
  span.textContent = valor || "";
  return span;
}

/**
 * Lee un valor por ruta punteada.
 * @param {object} obj
 * @param {string} ruta
 * @returns {unknown}
 */
function leerRuta(obj, ruta) {
  return ruta.split(".").reduce((nodo, clave) => (
    nodo == null ? undefined : nodo[clave]
  ), obj);
}

/**
 * @param {string} ruta
 * @returns {"datos"|"menu"|"red"|""}
 */
function pasoDeRuta(ruta) {
  const g = grupoDeRuta(ruta);
  return g === "cabecera" ? "" : g;
}

/**
 * @param {string} ruta
 * @returns {HTMLElement|null}
 */
function buscarCampo(ruta) {
  if (ruta === "pub-nombre") {
    return porId("pub-nombre");
  }
  const raiz = raizActiva;
  if (!raiz || !ruta) return null;
  if (ruta === "red" || ruta === "menu" || ruta === "totems") {
    return raiz.querySelector(`[data-ancla="${ruta}"]`);
  }
  const menu = /^menu\.totems\.(\d+)$/.exec(ruta);
  if (menu) {
    return raiz.querySelector(
      `[data-accion="menu:elegir:${menu[1]}"]`
    );
  }
  return raiz.querySelector(`[data-ruta="${ruta}"]`)
    || raiz.querySelector(`[data-ruta-lote="${ruta}"]`);
}

/**
 * @returns {void}
 */
function aplicarMarcasFaltantes() {
  const raiz = raizActiva;
  if (raiz) {
    raiz.querySelectorAll(".invalido").forEach((n) => {
      n.classList.remove("invalido");
    });
  }
  const nom = porId("pub-nombre");
  if (nom) {
    nom.classList.remove("invalido");
    const lab = nom.closest(".campo");
    if (lab) lab.classList.remove("invalido");
  }
  rutasFaltantes.forEach((ruta) => marcarUno(ruta));
  pintarConteoPasos();
}

/**
 * Número rojo en cada pestaña con faltantes.
 * @returns {void}
 */
function pintarConteoPasos() {
  const raiz = raizActiva;
  if (!raiz) return;
  raiz.querySelectorAll(".ficha-paso[data-paso]").forEach((btn) => {
    const n = conteoFaltantesPaso(btn.dataset.paso);
    btn.classList.toggle("tiene-faltas", n > 0);
    let marca = btn.querySelector(".ficha-paso-falta");
    if (!n) {
      if (marca) marca.remove();
      return;
    }
    if (!marca) {
      marca = document.createElement("span");
      marca.className = "ficha-paso-falta";
      btn.append(marca);
    }
    marca.textContent = String(n);
  });
}

/**
 * @param {string} ruta
 * @returns {void}
 */
function marcarUno(ruta) {
  const el = buscarCampo(ruta);
  if (!el) return;
  el.classList.add("invalido");
  const wrap = el.closest(
    "td, .ficha-clave-caja, .ficha-usuario-caja, "
    + ".ficha-horario, .ficha-tramites-mod, .campo, "
    + ".ficha-ip, .ficha-red-card"
  );
  if (wrap) wrap.classList.add("invalido");
}

/**
 * @param {string} ruta
 * @returns {void}
 */
function enfocarRuta(ruta) {
  const el = buscarCampo(ruta);
  if (!el) return;
  const lote = el.closest("[data-ruta-lote]");
  if (lote) {
    const cuerpo = lote.querySelector(".ficha-tramites-cuerpo");
    const btn = lote.querySelector("[data-acordeon]");
    if (cuerpo && cuerpo.hidden && btn) {
      alternarAcordeon(btn);
    }
  }
  marcarUno(ruta);
  const destino = el.matches(".ficha-ip")
    ? el.querySelector("input")
    : el;
  const foco = destino || el;
  foco.scrollIntoView({ behavior: "smooth", block: "center" });
  if (typeof foco.focus === "function") foco.focus();
}

/**
 * Oficinas o sectores ya creados, para elegirlos en otros bloques.
 * @param {"oficina"|"sector"|"totem"} tipo
 * @returns {string[]}
 */
function opcionesDe(tipo) {
  if (tipo === "oficina") return nombresUnicos(datos.oficinas);
  if (tipo === "totem") {
    return nombresUnicos(
      (datos.totems || []).map((fila) => fila.totem)
    );
  }
  return nombresUnicos((datos.sectores || []).map((fila) => fila.sector));
}

/**
 * Lista de oficinas o sectores ya cargados.
 * @param {string} valor
 * @param {string} ruta
 * @param {"oficina"|"sector"|"totem"} tipo
 * @returns {HTMLSelectElement}
 */
function listaCampo(valor, ruta, tipo) {
  return listaDinamica(valor, ruta, () => opcionesDe(tipo));
}

/**
 * @param {string} valor
 * @param {string} ruta
 * @param {() => string[]} obtener
 * @returns {HTMLSelectElement}
 */
function listaDinamica(valor, ruta, obtener) {
  const select = document.createElement("select");
  select.dataset.ruta = ruta;
  const pintar = () => {
    const actual = leerRuta(datos, ruta);
    const vigente = actual == null ? valor : String(actual);
    const lista = [...obtener()];
    if (vigente && !lista.includes(vigente)) lista.push(vigente);
    select.replaceChildren(opcion("", TXT.seleccionar));
    lista.forEach((item) => select.append(opcion(item, item)));
    select.value = vigente || "";
  };
  pintar();
  select.addEventListener("focus", pintar);
  return select;
}

/**
 * Liga la licitación y el guardado una sola vez.
 * @returns {void}
 */
function enlazarControles() {
  if (controles) return;
  controles = true;
  vigilarCambios("vista-ficha");
  porId("ficha-licitacion").addEventListener("input", () => {
    datos.licitacion = porId("ficha-licitacion").value;
  });
  porId("ficha-lista").addEventListener("change", () => {
    alElegir().catch((error) => registrarError(error, "ficha.elegir"));
  });
  porId("btn-ficha-guardar").addEventListener("click", () => {
    alGuardar().catch((error) => registrarError(error, "ficha.guardar"));
  });
  porId("btn-ficha-copia").addEventListener("click", copiarFicha);
  porId("btn-ficha-eliminar").addEventListener("click", pedirBorrarFicha);
}

/**
 * @param {string} [idMarcado]
 * @returns {Promise<void>}
 */
async function pintarLista(idMarcado) {
  const select = porId("ficha-lista");
  const lista = await listarFichas();
  select.replaceChildren();
  const vacia = document.createElement("option");
  vacia.value = "";
  vacia.textContent = TXT.nueva;
  select.append(vacia);
  lista
    .sort((a, b) => String(a.licitacion || "")
      .localeCompare(String(b.licitacion || ""), "es"))
    .forEach((ficha) => {
      const opcion = document.createElement("option");
      opcion.value = ficha.id;
      opcion.textContent = ficha.licitacion || ficha.id;
      select.append(opcion);
    });
  const ejemplo = document.createElement("option");
  ejemplo.value = EJEMPLO;
  ejemplo.textContent = TXT.ejemplo;
  select.append(ejemplo);
  select.value = idMarcado || "";
  pintarAccionesFicha();
}

/**
 * Copiar y eliminar solo tienen sentido con una ficha guardada.
 * @returns {void}
 */
function pintarAccionesFicha() {
  porId("btn-ficha-copia").hidden = !actual;
  porId("btn-ficha-eliminar").hidden = !actual;
}

/**
 * Deja en pantalla una copia sin guardar de la ficha abierta.
 * @returns {void}
 */
function copiarFicha() {
  if (!actual) return;
  datos = structuredClone(datos);
  datos.licitacion = `${datos.licitacion || ""}${TXT.sufijoCopia}`
    .slice(0, 160);
  datosEditor = datos;
  actual = null;
  porId("ficha-licitacion").value = datos.licitacion;
  porId("ficha-lista").value = "";
  porId("ficha-aviso").textContent = TXT.copiaLista;
  pintarAccionesFicha();
  marcarCambios("vista-ficha");
  porId("ficha-licitacion").focus();
}

/**
 * @returns {void}
 */
function pedirBorrarFicha() {
  if (!actual) return;
  const nombre = actual.licitacion || actual.id;
  pedirConfirmacion({
    titulo: TXT.borrarTitulo,
    texto: TXT.borrarTexto.replace("{nombre}", nombre),
    ok: TXT.borrarOk,
    onOk: () => {
      borrarFicha().catch((error) => {
        registrarError(error, "ficha.eliminar");
        avisar(TXT.falloBorrar, "error");
      });
    }
  });
}

/**
 * @returns {Promise<void>}
 */
async function borrarFicha() {
  await eliminarFicha(actual.id);
  actual = null;
  datos = fichaEnBlanco("");
  datosEditor = datos;
  asegurarMenu(datos);
  asegurarRed(datos);
  porId("ficha-licitacion").value = "";
  porId("ficha-aviso").textContent = "";
  cambiosGuardados("vista-ficha");
  modoManual.clear();
  refrescar();
  await pintarLista("");
  avisar(TXT.borrada, "ok");
}

/**
 * Carga la ficha elegida o una en blanco.
 * @returns {Promise<void>}
 */
async function alElegir() {
  const id = porId("ficha-lista").value;
  if (!confirmarDescarte("vista-ficha")) {
    porId("ficha-lista").value = actual ? actual.id : "";
    return;
  }
  if (!id || id === EJEMPLO) {
    actual = null;
    datos = id ? structuredClone(FICHA_PRUEBA) : fichaEnBlanco("");
  } else {
    const registro = await obtenerFicha(id);
    if (!registro) return;
    actual = registro;
    datos = sinAuditoria(registro);
  }
  datosEditor = datos;
  pintarAccionesFicha();
  asegurarMenu(datos);
  asegurarRed(datos);
  porId("ficha-licitacion").value = datos.licitacion || "";
  porId("ficha-aviso").textContent = "";
  modoManual.clear();
  refrescar();
}

/**
 * Crea o actualiza la ficha de la licitación escrita.
 * @returns {Promise<void>}
 */
async function alGuardar() {
  const aviso = porId("ficha-aviso");
  const revision = validarFicha(datos);
  if (!revision.ok) {
    aviso.textContent = revision.mensaje || TXT.faltaLicitacion;
    return;
  }
  const lista = await listarFichas();
  const clave = revision.datos.licitacionClave;
  const choque = lista.find((ficha) =>
    ficha.licitacionClave === clave
    && ficha.id !== (actual && actual.id));
  if (choque) {
    aviso.textContent = TXT.yaExiste;
    return;
  }
  try {
    const guardado = await guardarFicha(
      revision.datos,
      actual,
      autor || { uid: "", email: "" }
    );
    actual = guardado;
    datos = sinAuditoria(guardado);
    datosEditor = datos;
    cambiosGuardados("vista-ficha");
    porId("ficha-licitacion").value = datos.licitacion || "";
    await pintarLista(guardado.id);
    aviso.textContent = TXT.guardada + datos.licitacion + ".";
  } catch (error) {
    registrarError(error, "ficha.guardar");
    aviso.textContent = TXT.fallo;
  }
}

/**
 * @param {object} registro
 * @returns {object}
 */
function sinAuditoria(registro) {
  const copia = structuredClone(registro);
  [
    "id", "numero", "plantilla", "licitacionClave",
    "creadoEn", "creadoPor", "creadoPorEmail",
    "actualizadoEn", "actualizadoPor"
  ].forEach((clave) => {
    delete copia[clave];
  });
  return copia;
}
