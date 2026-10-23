/**
 * Propósito: Pantallas de recepción de equipos devueltos: panel por
 *   contrato (avance, regiones, novedades, locales) y ficha de cada
 *   local con sus equipos y la revisión por componente.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-23
 * Dependencias: cambios-pendientes, errores, exportar-csv, fechas,
 *   logger, recepcion-catalogo, recepcion-datos,
 *   recepcion-repositorio, ui
 */

import {
  cambiosGuardados,
  marcarCambios,
  vigilarCambios
} from "./cambios-pendientes.js";
import { mensajeError } from "./errores.js";
import { descargarCsv } from "./exportar-csv.js";
import { formatearFecha, hoyIso } from "./fechas.js";
import { registrarError } from "./logger.js";
import {
  CHECKLIST_RECEPCION,
  ESTADOS_COMPONENTE,
  ETAPAS,
  ITEMS_RECEPCION,
  REGIONES,
  RESULTADOS,
  TIPOS_RECEPCION,
  etiquetaDeLista,
  itemsDeTipo
} from "./recepcion-catalogo.js";
import {
  avance,
  avancePorRegion,
  claveCodigo,
  etapaLocal,
  leerPlanillaLocales,
  normalizarLocal,
  novedades,
  nuevoUid,
  pendientesRevision,
  resultadoEquipo,
  validarLocal
} from "./recepcion-datos.js";
import {
  eliminarLocal,
  guardarLocal,
  listarLocales,
  obtenerLocal
} from "./recepcion-repositorio.js";
import {
  avisar,
  mostrarExito,
  mostrarVista,
  pedirConfirmacion,
  porId,
  textoConteo
} from "./ui.js";

const TXT = {
  titulo: "Recepción de equipos | DTS",
  tituloLocal: "Local | Recepción | DTS",
  cargando: "Cargando locales…",
  vacio:
    "Aún no hay locales. Crea uno con «Nuevo local» o pega la lista "
    + "desde Excel con «Importar desde Excel».",
  sinFiltro: "No hay locales con esos filtros.",
  noEncontrado: "No se encontró ese local.",
  rapidoNada: "No hay ningún equipo ni local con ese dato.",
  nuevo: "Nuevo local",
  guardadoTitulo: "Local guardado",
  volver: "Volver a recepción",
  borrarTitulo: "Eliminar local",
  borrarTexto:
    "Se eliminará el local {codigo} con sus equipos y revisiones. "
    + "Esta acción no se puede deshacer.",
  eliminado: "Local eliminado.",
  sinNovedades: "Sin faltantes ni daños en los equipos revisados.",
  abrir: "Abrir",
  equipo: "Equipo",
  quitarEquipo: "Quitar equipo",
  confirmarQuitar: "¿Quitar este equipo y su revisión del local?",
  todoOk: "Marcar pendientes como OK",
  enciende: "¿Enciende?",
  si: "Sí",
  no: "No",
  revisar: "Revisión de componentes",
  pendientes: "Faltan por revisar",
  sinRevisar: "Sin revisar",
  importados: "Se importaron {n}. Ya aparecen en el panel.",
  importarRepetidos:
    "{n} ya existen en el contrato y se omitirán.",
  csv: "Recepcion_equipos.csv",
  kpiLocales: "Locales",
  kpiRecibidos: "Equipos recibidos",
  kpiRevisados: "Revisados",
  kpiNovedades: "Con novedades"
};

/** Colores de etapa: un solo azul de claro a oscuro (orden). */
const COLOR_ETAPA = {
  pendiente: "#dfe5ea",
  transito: "#86b6ef",
  recibido: "#2a78d6",
  revisado: "#184f95"
};

const ICONO_RESULTADO = { ok: "✓", danado: "⚠", incompleto: "✕" };

let autor = { uid: "", email: "", nombre: "" };
let locales = [];
let contrato = "";
let actual = null;
let equipos = [];
let pendientesImportar = [];
let listo = false;

/**
 * @param {{uid: string, email: string, nombre?: string}} sesion
 * @returns {void}
 */
export function definirAutorRecepcion(sesion) {
  autor = sesion;
}

/**
 * @returns {void}
 */
export function iniciarRecepcion() {
  if (listo) return;
  listo = true;
  llenar(porId("rcf-region"), REGIONES);
  llenar(porId("rcf-etapa"), ETAPAS);
  llenar(porId("r-region"), REGIONES);
  vigilarCambios("vista-recepcion-local");
  porId("rc-contrato").addEventListener("change", () => {
    contrato = porId("rc-contrato").value;
    pintarPanel();
  });
  ["rcf-region", "rcf-etapa", "rcf-resultado"].forEach((id) => {
    porId(id).addEventListener("change", pintarTablaLocales);
  });
  porId("rcf-texto").addEventListener("input", pintarTablaLocales);
  porId("form-filtros-rc").addEventListener("submit", (e) => {
    e.preventDefault();
  });
  porId("btn-rcf-limpiar").addEventListener("click", () => {
    ["rcf-region", "rcf-etapa", "rcf-resultado", "rcf-texto"]
      .forEach((id) => { porId(id).value = ""; });
    pintarTablaLocales();
  });
  porId("btn-rc-nuevo").addEventListener("click", () => {
    location.hash = "#/recepcion-local";
  });
  porId("btn-rc-csv").addEventListener("click", exportarCsv);
  porId("btn-rc-rapido").addEventListener("click", buscarRapido);
  porId("rc-rapido").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarRapido();
    }
  });
  iniciarImportar();
  iniciarLocal();
}

/* ======================= Panel ======================= */

/**
 * @returns {Promise<void>}
 */
export async function mostrarRecepcion() {
  iniciarRecepcion();
  document.title = TXT.titulo;
  mostrarVista("vista-recepcion");
  const estado = porId("rc-estado");
  estado.textContent = TXT.cargando;
  estado.hidden = false;
  try {
    locales = await listarLocales();
    pintarContratos();
    pintarPanel();
  } catch (error) {
    fallo(error, "recepcion.panel");
  }
}

/**
 * @returns {void}
 */
function pintarContratos() {
  const nombres = [...new Set(locales.map((l) => l.contrato))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "es"));
  if (!nombres.includes(contrato)) contrato = nombres[0] || "";
  const select = porId("rc-contrato");
  select.replaceChildren(...nombres.map((nombre) => {
    const op = document.createElement("option");
    op.value = nombre;
    op.textContent = `${nombre} (${textoConteo(
      locales.filter((l) => l.contrato === nombre).length, "local",
      "locales")})`;
    return op;
  }));
  select.value = contrato;
  select.disabled = nombres.length < 2;
  porId("rc-contratos-lista").replaceChildren(...nombres.map((nombre) => {
    const op = document.createElement("option");
    op.value = nombre;
    return op;
  }));
}

/**
 * @returns {object[]}
 */
function delContrato() {
  return locales.filter((l) => !contrato || l.contrato === contrato);
}

/**
 * @returns {void}
 */
function pintarPanel() {
  const lista = delContrato();
  const estado = porId("rc-estado");
  estado.hidden = lista.length > 0;
  estado.textContent = TXT.vacio;
  porId("rc-contenido").hidden = lista.length === 0;
  if (!lista.length) return;
  pintarKpis(avance(lista));
  pintarRegiones(lista);
  pintarNovedades(novedades(lista, ITEMS_RECEPCION));
  pintarTablaLocales();
}

/**
 * @param {object} a
 * @returns {void}
 */
function pintarKpis(a) {
  const pct = (n) => (a.equipos ? Math.round((n / a.equipos) * 100) : 0);
  porId("rc-kpis").replaceChildren(
    kpi(TXT.kpiLocales, String(a.locales),
      `${a.localesListos} con todo revisado`),
    kpi(TXT.kpiRecibidos, `${a.recibidos} de ${a.equipos}`,
      `${pct(a.recibidos)} % · ${a.transito} en tránsito`,
      pct(a.recibidos)),
    kpi(TXT.kpiRevisados, `${a.revisados} de ${a.equipos}`,
      `${a.ok} completos y OK`, pct(a.revisados)),
    kpi(TXT.kpiNovedades, String(a.danados + a.incompletos),
      `${a.incompletos} incompletos · ${a.danados} con daños`)
  );
}

/**
 * @param {string} titulo
 * @param {string} valor
 * @param {string} detalle
 * @param {number} [pct] barra de avance
 * @returns {HTMLElement}
 */
function kpi(titulo, valor, detalle, pct) {
  const caja = document.createElement("div");
  caja.className = "kpi";
  const t = document.createElement("span");
  t.textContent = titulo;
  const v = document.createElement("strong");
  v.textContent = valor;
  caja.append(t, v);
  if (pct !== undefined) {
    const barra = document.createElement("div");
    barra.className = "avance-barra completa";
    barra.setAttribute("role", "progressbar");
    barra.setAttribute("aria-valuenow", String(pct));
    barra.setAttribute("aria-valuemin", "0");
    barra.setAttribute("aria-valuemax", "100");
    const fill = document.createElement("span");
    fill.style.width = `${pct}%`;
    barra.append(fill);
    caja.append(barra);
  }
  const d = document.createElement("small");
  d.textContent = detalle;
  caja.append(d);
  return caja;
}

/**
 * Barra apilada por región: revisados, recibidos, en tránsito y
 * pendientes, con los números escritos.
 * @param {object[]} lista
 * @returns {void}
 */
function pintarRegiones(lista) {
  porId("rc-leyenda").replaceChildren(...ETAPAS.map((etapa) => {
    const li = document.createElement("li");
    const i = document.createElement("i");
    i.style.background = COLOR_ETAPA[etapa.id];
    li.append(i, document.createTextNode(etapa.corto));
    return li;
  }));
  const max = Math.max(...avancePorRegion(lista).map((f) => f.equipos), 1);
  porId("rc-regiones").replaceChildren(...avancePorRegion(lista)
    .map((fila) => {
      const propios = lista.filter((l) => l.region === fila.region);
      const cuenta = { pendiente: 0, transito: 0, recibido: 0, revisado: 0 };
      propios.forEach((l) => l.equipos.forEach((e) => {
        cuenta[e.etapa] += 1;
      }));
      const caja = document.createElement("button");
      caja.type = "button";
      caja.className = "rc-region";
      caja.title = "Filtrar por esta región";
      caja.addEventListener("click", () => {
        porId("rcf-region").value = fila.region;
        pintarTablaLocales();
        porId("form-filtros-rc").scrollIntoView({ behavior: "smooth" });
      });
      const nombre = document.createElement("span");
      nombre.className = "rc-region-nombre";
      nombre.textContent = fila.etiqueta;
      const pista = document.createElement("span");
      pista.className = "rc-region-pista";
      pista.style.width = `${(fila.equipos / max) * 100}%`;
      ["revisado", "recibido", "transito", "pendiente"].forEach((id) => {
        if (!cuenta[id]) return;
        const tramo = document.createElement("span");
        tramo.style.flexGrow = String(cuenta[id]);
        tramo.style.background = COLOR_ETAPA[id];
        tramo.title = `${etiquetaDeLista(ETAPAS, id)}: ${cuenta[id]}`;
        pista.append(tramo);
      });
      const dato = document.createElement("span");
      dato.className = "rc-region-dato";
      dato.textContent = `${fila.revisados}/${fila.equipos} revisados`;
      caja.append(nombre, pista, dato);
      return caja;
    }));
}

/**
 * @param {object[]} lista
 * @returns {void}
 */
function pintarNovedades(lista) {
  const raiz = porId("rc-novedades");
  if (!lista.length) {
    const p = document.createElement("p");
    p.className = "ayuda rc-ok";
    p.textContent = TXT.sinNovedades;
    raiz.replaceChildren(p);
    return;
  }
  const tabla = document.createElement("table");
  tabla.className = "rc-tabla-novedades";
  tabla.innerHTML = "<thead><tr><th>Componente</th>"
    + "<th class=\"derecha\">Faltan</th>"
    + "<th class=\"derecha\">Dañados</th><th>Locales</th></tr></thead>";
  const cuerpo = document.createElement("tbody");
  lista.forEach((fila) => {
    const tr = document.createElement("tr");
    [
      [fila.nombre, "fuerte"],
      [fila.falta ? String(fila.falta) : "—", "derecha"],
      [fila.danado ? String(fila.danado) : "—", "derecha"],
      [fila.donde.join(", "), ""]
    ].forEach(([texto, clase]) => {
      const td = document.createElement("td");
      td.textContent = texto;
      if (clase) td.className = clase;
      tr.append(td);
    });
    cuerpo.append(tr);
  });
  tabla.append(cuerpo);
  raiz.replaceChildren(tabla);
}

/**
 * @returns {object[]}
 */
function filtrados() {
  const region = porId("rcf-region").value;
  const etapa = porId("rcf-etapa").value;
  const resultado = porId("rcf-resultado").value;
  const q = claveCodigo(porId("rcf-texto").value).toLowerCase();
  return delContrato()
    .filter((l) => !region || l.region === region)
    .filter((l) => !etapa || l.equipos.some((e) => e.etapa === etapa))
    .filter((l) => !resultado
      || l.equipos.some((e) => resultadoEquipo(e) === resultado))
    .filter((l) => !q || [l.codigo, l.nombre, l.comuna,
      ...l.equipos.map((e) => e.serie)]
      .some((v) => claveCodigo(v).toLowerCase().includes(q)))
    .sort((a, b) => a.codigo.localeCompare(b.codigo, "es",
      { numeric: true }));
}

/**
 * @returns {void}
 */
function pintarTablaLocales() {
  const lista = filtrados();
  porId("rc-conteo").textContent = textoConteo(lista.length, "local",
    "locales");
  const cuerpo = porId("rc-cuerpo");
  if (!lista.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 9;
    td.className = "ayuda";
    td.textContent = TXT.sinFiltro;
    tr.append(td);
    cuerpo.replaceChildren(tr);
    return;
  }
  cuerpo.replaceChildren(...lista.map((local) => {
    const tr = document.createElement("tr");
    const etapa = etapaLocal(local);
    [
      [local.codigo, "numero nowrap"],
      [local.nombre || "—", "fuerte texto"],
      [local.comuna || "—", ""],
      [etiquetaDeLista(REGIONES, local.region) || "—", ""],
      [String(local.equipos.length), "derecha"]
    ].forEach(([texto, clase]) => {
      const td = document.createElement("td");
      td.textContent = texto;
      if (clase) td.className = clase;
      tr.append(td);
    });
    const tdEtapa = document.createElement("td");
    tdEtapa.append(pillEtapa(etapa));
    const tdRev = document.createElement("td");
    tdRev.className = "nowrap";
    tdRev.append(resumenRevision(local));
    const tdRetiro = document.createElement("td");
    tdRetiro.className = "nowrap";
    tdRetiro.textContent = local.retiroProgramado
      ? formatearFecha(local.retiroProgramado)
      : "—";
    const tdAcc = document.createElement("td");
    tdAcc.className = "acciones";
    const a = document.createElement("a");
    a.className = "boton boton-secundario";
    a.href = `#/recepcion-local?id=${encodeURIComponent(local.id)}`;
    a.textContent = TXT.abrir;
    tdAcc.append(a);
    tr.append(tdEtapa, tdRev, tdRetiro, tdAcc);
    return tr;
  }));
}

/**
 * @param {string} etapa
 * @returns {HTMLSpanElement}
 */
function pillEtapa(etapa) {
  const span = document.createElement("span");
  span.className = `pill rc-etapa rc-etapa-${etapa}`;
  span.textContent = etiquetaDeLista(ETAPAS, etapa);
  return span;
}

/**
 * «✓ 1 · ⚠ 1 · 1 sin revisar».
 * @param {object} local
 * @returns {HTMLElement}
 */
function resumenRevision(local) {
  const caja = document.createElement("span");
  caja.className = "rc-revision";
  const cuenta = { ok: 0, danado: 0, incompleto: 0, sin: 0 };
  local.equipos.forEach((e) => {
    const r = resultadoEquipo(e);
    cuenta[r || "sin"] += 1;
  });
  ["ok", "danado", "incompleto"].forEach((id) => {
    if (!cuenta[id]) return;
    const s = document.createElement("span");
    s.className = `rc-res rc-res-${id}`;
    s.textContent = `${ICONO_RESULTADO[id]} ${cuenta[id]}`;
    s.title = etiquetaDeLista(RESULTADOS, id);
    caja.append(s);
  });
  if (cuenta.sin) {
    const s = document.createElement("span");
    s.className = "rc-res rc-res-sin";
    s.textContent = `${cuenta.sin} ${TXT.sinRevisar.toLowerCase()}`;
    caja.append(s);
  }
  return caja;
}

/**
 * Bodega: escribe la serie (o el código) y abre el local en ese
 * equipo.
 * @returns {void}
 */
function buscarRapido() {
  const q = claveCodigo(porId("rc-rapido").value);
  if (!q) return;
  for (const local of locales) {
    const i = local.equipos.findIndex((e) => claveCodigo(e.serie) === q);
    if (i >= 0) {
      location.hash = `#/recepcion-local?id=${encodeURIComponent(
        local.id)}&equipo=${i}`;
      return;
    }
  }
  const local = locales.find((l) => l.codigoClave === q
    && (!contrato || l.contrato === contrato))
    || locales.find((l) => l.codigoClave === q);
  if (local) {
    location.hash = `#/recepcion-local?id=${encodeURIComponent(local.id)}`;
    return;
  }
  avisar(TXT.rapidoNada, "aviso");
}

/**
 * Un renglón por equipo, para Excel.
 * @returns {void}
 */
function exportarCsv() {
  const filas = [];
  filtrados().forEach((local) => {
    const base = [local.contrato, local.codigo, local.nombre,
      etiquetaDeLista(REGIONES, local.region), local.comuna,
      local.direccion];
    if (!local.equipos.length) {
      filas.push([...base, "", "", "", "", "", "", "", ""]);
      return;
    }
    local.equipos.forEach((e) => {
      const problemas = Object.entries(e.checklist)
        .filter(([, f]) => f.estado === "falta" || f.estado === "danado")
        .map(([id, f]) => `${nombreItem(id)}: `
          + `${etiquetaDeLista(ESTADOS_COMPONENTE, f.estado)}`
          + `${f.nota ? ` (${f.nota})` : ""}`)
        .join(" | ");
      filas.push([...base,
        etiquetaDeLista(TIPOS_RECEPCION, e.tipo), e.modelo, e.serie,
        etiquetaDeLista(ETAPAS, e.etapa),
        e.fechaRecepcion ? formatearFecha(e.fechaRecepcion) : "",
        etiquetaDeLista(RESULTADOS, resultadoEquipo(e)),
        problemas, e.observaciones]);
    });
  });
  if (!filas.length) {
    avisar(TXT.sinFiltro, "aviso");
    return;
  }
  descargarCsv(["Contrato", "Código", "Local", "Región", "Comuna",
    "Dirección", "Tipo", "Modelo", "Serie", "Etapa", "Recepción",
    "Resultado", "Faltantes y daños", "Observaciones"], filas, TXT.csv);
}

/**
 * @param {string} id
 * @returns {string}
 */
function nombreItem(id) {
  return (ITEMS_RECEPCION.find((i) => i.id === id) || {}).nombre || id;
}

/* ======================= Importar ======================= */

/**
 * @returns {void}
 */
function iniciarImportar() {
  const dialogo = porId("rc-importar");
  porId("btn-rc-importar").addEventListener("click", () => {
    porId("rc-imp-contrato").value = contrato || "";
    porId("rc-imp-texto").value = "";
    porId("rc-imp-vista").replaceChildren();
    porId("btn-rc-imp-ok").disabled = true;
    pendientesImportar = [];
    dialogo.showModal();
  });
  porId("btn-rc-imp-cancelar").addEventListener("click", () => {
    dialogo.close();
  });
  porId("btn-rc-imp-revisar").addEventListener("click", revisarImportar);
  porId("rc-imp-texto").addEventListener("input", () => {
    porId("btn-rc-imp-ok").disabled = true;
  });
  porId("btn-rc-imp-ok").addEventListener("click", () => {
    importar().catch((error) => fallo(error, "recepcion.importar"));
  });
}

/**
 * Muestra qué se va a crear antes de guardar.
 * @returns {void}
 */
function revisarImportar() {
  const nombre = porId("rc-imp-contrato").value.trim();
  const vista = porId("rc-imp-vista");
  if (!nombre) {
    vista.textContent = "Indica el contrato.";
    return;
  }
  const { locales: nuevos, avisos } = leerPlanillaLocales(
    porId("rc-imp-texto").value, nombre);
  const existentes = new Set(locales
    .filter((l) => claveCodigo(l.contrato) === claveCodigo(nombre))
    .map((l) => l.codigoClave));
  const repetidos = nuevos.filter((l) => existentes.has(l.codigoClave));
  pendientesImportar = nuevos.filter((l) => !existentes.has(l.codigoClave));
  const sinRegion = pendientesImportar.filter((l) => !l.region).length;
  const partes = [];
  const equiposN = pendientesImportar
    .reduce((acc, l) => acc + l.equipos.length, 0);
  partes.push(`Se crearán ${textoConteo(pendientesImportar.length,
    "local", "locales")} con ${textoConteo(equiposN, "equipo")}.`);
  if (repetidos.length) {
    partes.push(TXT.importarRepetidos.replace("{n}",
      textoConteo(repetidos.length, "código", "códigos")));
  }
  if (sinRegion) {
    partes.push(`${sinRegion} sin región: complétala después en cada `
      + "local.");
  }
  const ul = document.createElement("ul");
  [...partes, ...avisos.slice(0, 8)].forEach((texto) => {
    const li = document.createElement("li");
    li.textContent = texto;
    ul.append(li);
  });
  const muestra = document.createElement("p");
  muestra.className = "ayuda";
  muestra.textContent = pendientesImportar.slice(0, 6)
    .map((l) => `${l.codigo} · ${l.nombre || "sin nombre"} · `
      + `${etiquetaDeLista(REGIONES, l.region) || "sin región"} · `
      + `${textoConteo(l.equipos.length, "equipo")}`)
    .join("\n");
  vista.replaceChildren(ul, muestra);
  porId("btn-rc-imp-ok").disabled = pendientesImportar.length === 0;
}

/**
 * Guarda los locales revisados. Los que vienen sin región no se
 * importan (la región es obligatoria) y se avisa cuántos quedaron.
 * @returns {Promise<void>}
 */
async function importar() {
  const validos = pendientesImportar.filter((l) => l.region);
  const boton = porId("btn-rc-imp-ok");
  boton.disabled = true;
  let n = 0;
  for (const local of validos) {
    await guardarLocal(local, null, autor);
    n += 1;
  }
  porId("rc-importar").close();
  const omitidos = pendientesImportar.length - validos.length;
  avisar(TXT.importados.replace("{n}", textoConteo(n, "local", "locales"))
    + (omitidos ? ` ${omitidos} sin región no se importaron.` : ""),
  omitidos ? "aviso" : "ok");
  contrato = porId("rc-imp-contrato").value.trim();
  await mostrarRecepcion();
}

/* ======================= Ficha del local ======================= */

const CAMPOS = {
  contrato: "r-contrato",
  codigo: "r-codigo",
  nombre: "r-nombre",
  region: "r-region",
  comuna: "r-comuna",
  direccion: "r-direccion",
  contacto: "r-contacto",
  retiroProgramado: "r-retiro",
  transportista: "r-transportista",
  guia: "r-guia",
  notas: "r-notas"
};

/**
 * @returns {void}
 */
function iniciarLocal() {
  porId("btn-rl-agregar").addEventListener("click", () => {
    leerEquipos();
    equipos.push({
      uid: nuevoUid(), tipo: "totem", modelo: "", serie: "",
      etapa: "pendiente", checklist: {}
    });
    pintarEquipos(equipos.length - 1);
  });
  porId("btn-rl-guardar").addEventListener("click", () => {
    guardar().catch((error) => fallo(error, "recepcion.guardar"));
  });
  porId("btn-rl-eliminar").addEventListener("click", pedirEliminar);
  const zona = porId("rl-equipos");
  zona.addEventListener("click", alPulsarEquipo);
  zona.addEventListener("change", (e) => {
    if (e.target.matches("[data-k=tipo], [data-ck], [data-k=enciende]")) {
      leerEquipos();
      pintarEquipos(indiceDe(e.target), true);
    }
  });
  porId("r-region").addEventListener("change", pintarComunas);
}

/**
 * @param {string} [id]
 * @param {number} [enfocar] índice del equipo a abrir
 * @returns {Promise<void>}
 */
export async function mostrarLocalRecepcion(id, enfocar) {
  iniciarRecepcion();
  mostrarVista("vista-recepcion-local");
  limpiarErrores();
  try {
    if (!locales.length) locales = await listarLocales();
    actual = id ? await obtenerLocal(id) : null;
  } catch (error) {
    fallo(error, "recepcion.local");
    return;
  }
  if (id && !actual) {
    avisar(TXT.noEncontrado, "error");
    location.hash = "#/recepcion";
    return;
  }
  const datos = actual || normalizarLocal({ contrato });
  document.title = TXT.tituloLocal;
  porId("rl-titulo").textContent = actual
    ? `${actual.codigo}${actual.nombre ? ` · ${actual.nombre}` : ""}`
    : TXT.nuevo;
  porId("rl-kicker").textContent = datos.contrato || "Recepción de equipos";
  porId("rl-meta").textContent = actual
    ? `N° ${actual.numero || "—"} · ${actual.creadoPorEmail || ""}`
    : "Borrador todavía no guardado";
  Object.entries(CAMPOS).forEach(([clave, campoId]) => {
    porId(campoId).value = datos[clave] || "";
  });
  pintarComunas();
  porId("btn-rl-eliminar").hidden = !actual;
  equipos = structuredClone(datos.equipos || []);
  if (!actual) {
    equipos.push({
      uid: nuevoUid(), tipo: "totem", modelo: "", serie: "",
      etapa: "pendiente", checklist: {}
    });
  }
  pintarEquipos(Number.isInteger(enfocar) ? enfocar : -1);
  cambiosGuardados("vista-recepcion-local");
}

/**
 * Sugiere comunas ya usadas en la región.
 * @returns {void}
 */
function pintarComunas() {
  const region = porId("r-region").value;
  const comunas = [...new Set(locales
    .filter((l) => !region || l.region === region)
    .map((l) => l.comuna).filter(Boolean))].sort();
  porId("rl-comunas").replaceChildren(...comunas.map((c) => {
    const op = document.createElement("option");
    op.value = c;
    return op;
  }));
}

/**
 * @param {Element} nodo
 * @returns {number}
 */
function indiceDe(nodo) {
  const card = nodo.closest("[data-equipo]");
  return card ? Number(card.dataset.equipo) : -1;
}

/**
 * Botones de cada equipo: etapa, OK masivo, quitar.
 * @param {MouseEvent} e
 * @returns {void}
 */
function alPulsarEquipo(e) {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const i = indiceDe(boton);
  leerEquipos();
  const equipo = equipos[i];
  if (!equipo) return;
  const accion = boton.dataset.accion;
  if (accion === "etapa") {
    equipo.etapa = boton.dataset.etapa;
    const llego = ["recibido", "revisado"].includes(equipo.etapa);
    if (llego && !equipo.fechaRecepcion) equipo.fechaRecepcion = hoyIso();
    if (llego && !equipo.recibidoPor) {
      equipo.recibidoPor = autor.nombre || autor.email || "";
    }
  } else if (accion === "todoOk") {
    itemsDeTipo(equipo.tipo).forEach((item) => {
      const fila = equipo.checklist[item.id] || {};
      if (!fila.estado) {
        equipo.checklist[item.id] = { ...fila, estado: "ok" };
      }
    });
  } else if (accion === "quitar") {
    if (!window.confirm(TXT.confirmarQuitar)) return;
    equipos.splice(i, 1);
  }
  pintarEquipos(accion === "quitar" ? -1 : i, true);
  marcarCambios("vista-recepcion-local");
}

/**
 * Pasa al estado lo que está escrito en cada tarjeta.
 * @returns {void}
 */
function leerEquipos() {
  porId("rl-equipos").querySelectorAll("[data-equipo]").forEach((card) => {
    const i = Number(card.dataset.equipo);
    const eq = equipos[i];
    if (!eq) return;
    card.querySelectorAll("[data-k]").forEach((campo) => {
      if (campo.type === "radio" && !campo.checked) return;
      eq[campo.dataset.k] = campo.value;
    });
    card.querySelectorAll("[data-ck]:checked").forEach((radio) => {
      const id = radio.dataset.ck;
      eq.checklist[id] = { ...(eq.checklist[id] || {}), estado: radio.value };
    });
    card.querySelectorAll("[data-nota]").forEach((nota) => {
      const id = nota.dataset.nota;
      if (!eq.checklist[id]) eq.checklist[id] = { estado: "" };
      eq.checklist[id].nota = nota.value;
    });
  });
}

/**
 * @param {number} abierto índice que queda desplegado (-1 ninguno)
 * @param {boolean} [mantenerScroll]
 * @returns {void}
 */
function pintarEquipos(abierto, mantenerScroll) {
  const y = window.scrollY;
  const zona = porId("rl-equipos");
  zona.replaceChildren(...equipos.map((eq, i) => tarjetaEquipo(eq, i,
    i === abierto || equipos.length === 1)));
  const normal = equipos.map((eq) => normalizarLocal({ equipos: [eq] })
    .equipos[0]);
  const a = avance([{ equipos: normal }]);
  porId("rl-resumen").textContent = `${textoConteo(a.equipos, "equipo")}`
    + ` · ${a.recibidos} recibidos · ${a.revisados} revisados`;
  if (mantenerScroll) window.scrollTo(0, y);
  else if (abierto >= 0) {
    zona.querySelector(`[data-equipo="${abierto}"]`)
      ?.scrollIntoView({ block: "start" });
  }
}

/**
 * @param {object} eq
 * @param {number} i
 * @param {boolean} abierto
 * @returns {HTMLElement}
 */
function tarjetaEquipo(eq, i, abierto) {
  const limpio = normalizarLocal({ equipos: [eq] }).equipos[0];
  const resultado = resultadoEquipo(limpio);
  const card = document.createElement("details");
  card.className = "rl-equipo";
  card.dataset.equipo = String(i);
  card.open = abierto;
  const sum = document.createElement("summary");
  const titulo = document.createElement("strong");
  titulo.textContent = `${TXT.equipo} ${i + 1} · `
    + `${etiquetaDeLista(TIPOS_RECEPCION, eq.tipo)}`
    + `${eq.serie ? ` · ${eq.serie}` : ""}`;
  sum.append(titulo, pillEtapa(eq.etapa));
  if (resultado) {
    const r = document.createElement("span");
    r.className = `rc-res rc-res-${resultado}`;
    r.textContent = `${ICONO_RESULTADO[resultado]} `
      + etiquetaDeLista(RESULTADOS, resultado);
    sum.append(r);
  }
  card.append(sum);
  const cuerpo = document.createElement("div");
  cuerpo.className = "rl-cuerpo";
  cuerpo.append(pasos(eq), datosEquipo(eq));
  if (["recibido", "revisado"].includes(eq.etapa)) {
    cuerpo.append(recepcion(eq));
  }
  if (eq.etapa === "revisado") cuerpo.append(revision(eq, limpio));
  const pie = document.createElement("div");
  pie.className = "rl-pie";
  pie.append(botonAccion(TXT.quitarEquipo, "quitar",
    "boton boton-secundario ficha-quitar"));
  cuerpo.append(pie);
  card.append(cuerpo);
  return card;
}

/**
 * Las cuatro etapas como pasos que se tocan.
 * @param {object} eq
 * @returns {HTMLElement}
 */
function pasos(eq) {
  const caja = document.createElement("div");
  caja.className = "rl-pasos";
  caja.setAttribute("role", "group");
  caja.setAttribute("aria-label", "Etapa del equipo");
  const actualIdx = ETAPAS.findIndex((e) => e.id === eq.etapa);
  ETAPAS.forEach((etapa, n) => {
    const b = botonAccion(`${n + 1}. ${etapa.corto}`, "etapa",
      "rl-paso");
    b.dataset.etapa = etapa.id;
    if (n < actualIdx) b.classList.add("hecho");
    if (n === actualIdx) {
      b.classList.add("actual");
      b.setAttribute("aria-pressed", "true");
    }
    caja.append(b);
  });
  return caja;
}

/**
 * @param {object} eq
 * @returns {HTMLElement}
 */
function datosEquipo(eq) {
  const caja = document.createElement("div");
  caja.className = "rejilla rl-grid";
  const tipo = document.createElement("select");
  tipo.dataset.k = "tipo";
  TIPOS_RECEPCION.forEach((t) => {
    const op = document.createElement("option");
    op.value = t.id;
    op.textContent = t.etiqueta;
    tipo.append(op);
  });
  tipo.value = eq.tipo || "totem";
  caja.append(
    campo("Tipo", tipo),
    campo("Modelo", input("modelo", eq.modelo, 80, "Ej.: T22-M41")),
    campo("N° de serie", input("serie", eq.serie, 60, "Ej.: DTS-L001"))
  );
  return caja;
}

/**
 * @param {object} eq
 * @returns {HTMLElement}
 */
function recepcion(eq) {
  const caja = document.createElement("div");
  caja.className = "rejilla rl-grid";
  const fecha = input("fechaRecepcion", eq.fechaRecepcion, 10);
  fecha.type = "date";
  fecha.max = hoyIso();
  caja.append(
    campo("Fecha de recepción *", fecha),
    campo("Recibido por", input("recibidoPor", eq.recibidoPor, 80))
  );
  return caja;
}

/**
 * Revisión por componente: OK, Dañado, Falta o No aplica, con nota
 * cuando hay un problema.
 * @param {object} eq
 * @param {object} limpio
 * @returns {HTMLElement}
 */
function revision(eq, limpio) {
  const caja = document.createElement("div");
  caja.className = "rl-revision";
  const cabeza = document.createElement("div");
  cabeza.className = "rl-revision-cabeza";
  const h = document.createElement("h3");
  h.textContent = TXT.revisar;
  const faltan = pendientesRevision(limpio);
  const info = document.createElement("span");
  info.className = faltan.length ? "rl-faltan" : "rl-listo";
  info.textContent = faltan.length
    ? `${TXT.pendientes}: ${faltan.length}`
    : "✓ Todo revisado";
  cabeza.append(h, info, botonAccion(TXT.todoOk, "todoOk",
    "boton boton-secundario rl-todo-ok"));
  caja.append(cabeza);
  const enciende = document.createElement("div");
  enciende.className = "rl-item rl-enciende";
  const et = document.createElement("strong");
  et.textContent = `${TXT.enciende} *`;
  enciende.append(et, opciones(`enc-${eq.uid}`, [
    { id: "si", etiqueta: TXT.si },
    { id: "no", etiqueta: TXT.no }
  ], eq.enciende || "", (radio) => { radio.dataset.k = "enciende"; }));
  caja.append(enciende);
  CHECKLIST_RECEPCION.forEach((grupo) => {
    const items = grupo.items.filter((item) => !item.solo
      || item.solo.includes(eq.tipo));
    if (!items.length) return;
    const g = document.createElement("fieldset");
    g.className = "rl-grupo";
    const leyenda = document.createElement("legend");
    leyenda.textContent = grupo.titulo;
    g.append(leyenda);
    items.forEach((item) => {
      const fila = (eq.checklist || {})[item.id] || {};
      const linea = document.createElement("div");
      linea.className = `rl-item${fila.estado ? ` es-${fila.estado}` : ""}`;
      const texto = document.createElement("div");
      const nombre = document.createElement("strong");
      nombre.textContent = item.nombre;
      const ayuda = document.createElement("small");
      ayuda.textContent = item.ayuda;
      texto.append(nombre, ayuda);
      linea.append(texto, opciones(`ck-${eq.uid}-${item.id}`,
        ESTADOS_COMPONENTE, fila.estado || "",
        (radio) => { radio.dataset.ck = item.id; }));
      if (fila.estado === "falta" || fila.estado === "danado"
        || fila.nota) {
        const nota = document.createElement("input");
        nota.maxLength = 160;
        nota.dataset.nota = item.id;
        nota.value = fila.nota || "";
        nota.placeholder = fila.estado === "falta"
          ? "¿Qué falta? Ej.: sin llaves"
          : "Describe el daño";
        nota.className = "rl-nota";
        linea.append(nota);
      }
      g.append(linea);
    });
    caja.append(g);
  });
  const obs = document.createElement("textarea");
  obs.dataset.k = "observaciones";
  obs.rows = 2;
  obs.maxLength = 600;
  obs.value = eq.observaciones || "";
  caja.append(campo("Observaciones del equipo", obs));
  return caja;
}

/**
 * Grupo de opciones tipo botón (radio).
 * @param {string} nombre
 * @param {{id: string, etiqueta: string}[]} lista
 * @param {string} valor
 * @param {(radio: HTMLInputElement) => void} marcar
 * @returns {HTMLElement}
 */
function opciones(nombre, lista, valor, marcar) {
  const caja = document.createElement("div");
  caja.className = "rl-opciones";
  lista.forEach((op) => {
    const lab = document.createElement("label");
    lab.className = `rl-op rl-op-${op.id}`;
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = nombre;
    radio.value = op.id;
    radio.checked = valor === op.id;
    marcar(radio);
    const span = document.createElement("span");
    span.textContent = op.etiqueta;
    lab.append(radio, span);
    caja.append(lab);
  });
  return caja;
}

/**
 * @param {string} texto
 * @param {HTMLElement} control
 * @returns {HTMLLabelElement}
 */
function campo(texto, control) {
  const lab = document.createElement("label");
  lab.className = "campo";
  const span = document.createElement("span");
  span.textContent = texto;
  lab.append(span, control);
  return lab;
}

/**
 * @param {string} clave
 * @param {string} valor
 * @param {number} max
 * @param {string} [ejemplo]
 * @returns {HTMLInputElement}
 */
function input(clave, valor, max, ejemplo) {
  const el = document.createElement("input");
  el.dataset.k = clave;
  el.maxLength = max;
  el.value = valor || "";
  el.autocomplete = "off";
  if (ejemplo) el.placeholder = ejemplo;
  return el;
}

/**
 * @param {string} texto
 * @param {string} accion
 * @param {string} clase
 * @returns {HTMLButtonElement}
 */
function botonAccion(texto, accion, clase) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = clase;
  b.dataset.accion = accion;
  b.textContent = texto;
  return b;
}

/**
 * @returns {Promise<void>}
 */
async function guardar() {
  leerEquipos();
  const crudo = { equipos };
  Object.entries(CAMPOS).forEach(([clave, campoId]) => {
    crudo[clave] = porId(campoId).value;
  });
  const limpio = normalizarLocal(crudo);
  const revisionDatos = validarLocal(limpio, locales, actual && actual.id);
  pintarErrores(revisionDatos);
  if (!revisionDatos.valido) return;
  const nuevo = !actual;
  const fresco = await guardarLocal(limpio, actual, autor);
  actual = fresco;
  locales = await listarLocales();
  contrato = fresco.contrato;
  cambiosGuardados("vista-recepcion-local");
  mostrarExito(
    TXT.guardadoTitulo,
    `${nuevo ? "Se creó" : "Se actualizó"} el local ${fresco.codigo}.`,
    TXT.volver,
    "#/recepcion"
  );
}

/**
 * @returns {void}
 */
function pedirEliminar() {
  if (!actual) return;
  pedirConfirmacion({
    titulo: TXT.borrarTitulo,
    texto: TXT.borrarTexto.replace("{codigo}", actual.codigo),
    onOk: () => {
      eliminarLocal(actual.id)
        .then(() => {
          cambiosGuardados("vista-recepcion-local");
          avisar(TXT.eliminado, "ok");
          location.hash = "#/recepcion";
        })
        .catch((error) => fallo(error, "recepcion.eliminar"));
    }
  });
}

/**
 * @param {{valido: boolean, errores: string[], campos: object}} rev
 * @returns {void}
 */
function pintarErrores(rev) {
  const caja = porId("rl-mensaje");
  porId("vista-recepcion-local").querySelectorAll("[data-campo]")
    .forEach((nodo) => {
      nodo.classList.toggle("invalido",
        Boolean(rev.campos[nodo.dataset.campo]));
    });
  porId("rl-equipos").querySelectorAll("[data-equipo]").forEach((card) => {
    card.classList.toggle("invalido",
      Boolean(rev.campos[`eq-${card.dataset.equipo}`]));
    if (rev.campos[`eq-${card.dataset.equipo}`]) card.open = true;
  });
  caja.hidden = rev.valido;
  if (rev.valido) {
    caja.replaceChildren();
    return;
  }
  const ul = document.createElement("ul");
  rev.errores.forEach((texto) => {
    const li = document.createElement("li");
    li.textContent = texto;
    ul.append(li);
  });
  caja.replaceChildren(ul);
  caja.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * @returns {void}
 */
function limpiarErrores() {
  pintarErrores({ valido: true, errores: [], campos: {} });
}

/**
 * @param {HTMLSelectElement} select
 * @param {{id: string, etiqueta: string}[]} lista
 * @returns {void}
 */
function llenar(select, lista) {
  lista.forEach((item) => {
    const op = document.createElement("option");
    op.value = item.id;
    op.textContent = item.etiqueta;
    select.append(op);
  });
}

/**
 * @param {unknown} error
 * @param {string} contexto
 * @returns {void}
 */
function fallo(error, contexto) {
  registrarError(error, contexto);
  avisar(mensajeError(error), "error");
}
