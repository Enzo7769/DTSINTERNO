/**
 * Propósito: Pruebas de validación, fechas y filtros.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: web/js/validacion.js, filtros.js, fechas.js, demo.js
 */

import {
  normalizarCartilla,
  validarCartilla
} from "../web/js/cartilla-validacion.js";
import {
  normalizarCosto,
  validarCosto
} from "../web/js/costo-validacion.js";
import {
  semilla,
  semillaCartillas,
  semillaCostos,
  semillaModelos
} from "../web/js/demo.js";
import {
  textoAvance,
  textoCostosModelo
} from "../web/js/espec-textos.js";
import {
  CAMPOS_FICHA,
  GRUPOS_FICHA,
  avanceFicha,
  formatoMonto,
  leerMonto
} from "../web/js/hw-catalogo.js";
import {
  normalizarModelo,
  validarModelo
} from "../web/js/modelo-validacion.js";
import { fechaValida, formatearFecha } from "../web/js/fechas.js";
import {
  claveLicitacion,
  validarFicha
} from "../web/js/ficha-validacion.js";
import {
  nombrePdfFicha,
  paresPortada,
  rutaPdfFicha
} from "../web/js/ficha-cliente-pdf.js";
import {
  crearToken,
  clientePuedeEditar,
  clientePuedeVer,
  etiquetaEstado,
  normalizarEnvio,
  restoPlazo,
  validarEnvio,
  validarNombreCliente
} from "../web/js/ficha-cliente-validacion.js";
import {
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
  sincronizarMenuTotems,
  sincronizarRedEquipos,
  totemsDelSector,
  tramitesDeMenu,
  tramitesDeSector
} from "../web/js/ficha-datos.js";
import {
  componerIp,
  ipLista,
  partirIp
} from "../web/js/ficha-ip.js";
import { indicesBarra } from "../web/js/ficha-pestanas.js";
import {
  claveSegura,
  detalleFaltantes,
  faltantesFicha,
  faltantesPorGrupo,
  nivelClave,
  partirHorario,
  usuarioValido
} from "../web/js/ficha-seguridad.js";
import {
  aplicarMenu,
  claseTeclado,
  esGuardarTotem
} from "../web/js/ficha-menu-vista.js";
import { preservarRedInterna } from "../web/js/ficha-red-vista.js";
import {
  esSi,
  faseTrasDescanso,
  formatearRut,
  mensajeTicket
} from "../web/js/ficha-sim-totem.js";
import { aplicarFiltros, ordenarPorSalida } from "../web/js/filtros.js";
import {
  SECCIONES,
  tituloCierre,
  tituloSeccion
} from "../web/js/catalogo.js";
import { normalizarChecklist, validarDatos } from "../web/js/validacion.js";

let fallos = 0;

/**
 * @param {boolean} condicion
 * @param {string} mensaje
 * @returns {void}
 */
function afirmar(condicion, mensaje) {
  if (condicion) {
    console.log("ok", mensaje);
    return;
  }
  fallos += 1;
  console.error("FALLO", mensaje);
}

const registros = semilla();
afirmar(registros.length === 2, "la vista previa trae 2 registros");
afirmar(validarDatos(registros[0]).valido, "el aprobado de prueba es válido");
afirmar(registros[0].tipoEquipo === "totem", "el de prueba es un tótem");
const sinTipo = normalizarChecklist({
  ...registros[0],
  tipoEquipo: "kiosco"
});
afirmar(
  !validarDatos(sinTipo).valido && sinTipo.tipoEquipo === "",
  "solo acepta tótem, visor o locker"
);
afirmar(validarDatos(registros[1]).valido, "el rechazado de prueba es válido");

const incompleto = normalizarChecklist({
  ...registros[0],
  estado: "aprobado",
  items: {
    ...registros[0].items,
    wizardApp: { ok: false, extra: "" }
  }
});
afirmar(
  !validarDatos(incompleto).valido,
  "no se aprueba con un ítem pendiente"
);

const sinMotivo = normalizarChecklist({
  ...registros[1],
  estado: "rechazado",
  observaciones: "corto"
});
afirmar(
  !validarDatos(sinMotivo).valido,
  "el rechazo exige un motivo"
);

const sinId = normalizarChecklist({
  ...registros[0],
  items: {
    ...registros[0].items,
    anydeskInstalacion: { ok: true, extra: "" }
  }
});
afirmar(
  !validarDatos(sinId).valido,
  "AnyDesk OK exige el ID"
);

const sinBam = normalizarChecklist({
  ...registros[0],
  items: {
    ...registros[0].items,
    tieneBam: { ok: true, resultado: "ok", extra: "", extras: {} }
  }
});
afirmar(
  !validarDatos(sinBam).valido,
  "BAM en OK exige SSID, WiFi key y password"
);
const bamMal = normalizarChecklist({
  ...registros[0],
  estado: "rechazado",
  observaciones: "El BAM no responde en la red del sitio.",
  items: {
    ...registros[0].items,
    tieneBam: { ok: false, resultado: "malo", extra: "", extras: {} }
  }
});
afirmar(
  validarDatos(bamMal).valido
    && bamMal.items.tieneBam.resultado === "malo"
    && bamMal.items.tieneBam.ok === false,
  "la cruz marca el ítem como malo y no pide el WiFi"
);
const sinBamAprobado = normalizarChecklist({
  ...registros[0],
  estado: "aprobado",
  items: {
    ...registros[0].items,
    tieneBam: { ok: false, resultado: "malo", extra: "", extras: {} },
    conectaBam: { ok: false, resultado: "", extra: "", extras: {} }
  }
});
afirmar(
  validarDatos(sinBamAprobado).valido,
  "un equipo sin BAM se puede aprobar"
);
const bamSinPrueba = normalizarChecklist({
  ...registros[0],
  estado: "aprobado",
  items: {
    ...registros[0].items,
    conectaBam: { ok: false, resultado: "", extra: "", extras: {} }
  }
});
afirmar(
  !validarDatos(bamSinPrueba).valido,
  "con BAM hay que probar que se conecta al desconectarse"
);

const vacio = { ok: false, resultado: "", extra: "", extras: {} };
const visorOk = normalizarChecklist({
  ...registros[0],
  tipoEquipo: "visor",
  estado: "aprobado",
  items: {
    ...registros[0].items,
    pantallaTouch: vacio,
    impresoraInstalacion: vacio,
    impresoraFuncionamiento: vacio,
    impresoraInsumos: vacio,
    impresoraCableado: vacio,
    pantallaResolucion: {
      ok: true, resultado: "ok", extra: "", extras: {}
    }
  }
});
afirmar(
  validarDatos(visorOk).valido,
  "el visor no exige táctil ni impresora"
);
const visorSinZoom = normalizarChecklist({
  ...visorOk,
  items: { ...visorOk.items, pantallaResolucion: vacio }
});
afirmar(
  !validarDatos(visorSinZoom).valido,
  "el visor exige resolución y zoom según la pantalla"
);
const totemSinZoom = normalizarChecklist({
  ...registros[0],
  items: { ...registros[0].items, pantallaResolucion: vacio }
});
afirmar(
  validarDatos(totemSinZoom).valido,
  "el tótem no pide la resolución del visor"
);
const red = SECCIONES.find((seccion) => seccion.id === "red");
const sistema = SECCIONES.find((seccion) => seccion.id === "sistema");
afirmar(
  tituloSeccion(red, "visor").startsWith("4.")
    && tituloSeccion(sistema, "visor").startsWith("5.")
    && tituloSeccion(red, "totem").startsWith("5."),
  "el visor numera seguido y no salta del 3 al 5"
);
afirmar(
  tituloCierre("visor").startsWith("7.")
    && tituloCierre("totem").startsWith("8.")
    && tituloCierre("locker").startsWith("8."),
  "el cierre del visor es 7 y en tótem o locker es 8"
);

afirmar(!fechaValida("2026-02-31"), "rechaza el 31 de febrero");
afirmar(fechaValida("2026-10-01"), "acepta el 1 de octubre");
afirmar(
  formatearFecha("2026-10-01") === "01/10/2026",
  "muestra la fecha como DD/MM/AAAA"
);

const porCliente = aplicarFiltros(registros, { cliente: "norte" });
afirmar(porCliente.length === 1, "filtra por cliente");
const porSerie = aplicarFiltros(registros, { serie: "demo-001" });
afirmar(porSerie.length === 1, "filtra por serie sin distinguir mayúsculas");
const porFecha = aplicarFiltros(registros, {
  fechaSalida: "2026-09-30"
});
afirmar(porFecha.length === 1, "filtra por fecha de salida");
const orden = ordenarPorSalida(registros);
afirmar(
  orden[0].numeroSerie === "DTS-DEMO-001",
  "ordena por la salida más reciente"
);

const cartilla = semillaCartillas()[0];
afirmar(validarCartilla(cartilla).valido, "la cartilla de prueba es válida");
afirmar(
  !cartilla.filas.perUps && Boolean(cartilla.filas.perPantalla),
  "solo guarda los periféricos seleccionados"
);
afirmar(
  Boolean(cartilla.filas.recepcionChasis && cartilla.filas.llaveDts),
  "las secciones fijas siempre quedan"
);
const ipMala = normalizarCartilla({
  ...cartilla,
  filas: { cliIp: { incluido: true, obs: "999.1.1.1" } }
});
afirmar(
  validarCartilla(ipMala).campos["fila:cliIp"] === true,
  "rechaza una IP de cliente inválida"
);
const libre = normalizarCartilla({
  ...cartilla,
  filas: {
    ...cartilla.filas,
    "perLibre-1": { incluido: true, obs: "Lector QR" }
  }
});
afirmar(Boolean(libre.filas["perLibre-1"]), "guarda el periférico agregado");
afirmar(
  !validarCartilla(libre).valido,
  "pide el nombre del periférico agregado"
);
const sinObligatorios = validarCartilla(normalizarCartilla({
  cliente: "A",
  modelo: "B",
  numeroSerie: "C",
  creadaPorNombre: "D"
}));
const exigeSecciones = sinObligatorios.campos["fila:biosEncendido"]
  === true && sinObligatorios.campos["fila:cliIp"] === true;
afirmar(exigeSecciones, "exige completar el N° 6 y el N° 9");
const vacia = validarCartilla(normalizarCartilla({}));
afirmar(
  ["c-cliente", "c-modelo", "c-serie", "c-creada", "c-tipo"]
    .every((campo) => vacia.campos[campo]),
  "pide cliente, modelo, serie, creador y tipo"
);

const costos = semillaCostos();
afirmar(costos.length === 14, "la base trae los 14 costos de la planilla");
afirmar(
  costos.every((item) => validarCosto(item).valido),
  "todos los costos de la planilla son válidos"
);
afirmar(costos[0].costo === 3840.69, "conserva los decimales en USD");
const dalcahue = costos.find((item) => item.modelo === "T22 Dalcahue");
afirmar(
  dalcahue.lineas.length === 3 && dalcahue.costo === 1172.68,
  "el desglose suma el costo"
);
afirmar(leerMonto("1.277,20", 2) === 1277.2, "lee 1.277,20");
afirmar(leerMonto("1277.20", 2) === 1277.2, "lee 1277.20");
afirmar(leerMonto("730.000", 0) === 730000, "lee 730.000 en CLP");
afirmar(
  formatoMonto(3840.69, "USD") === "USD 3.840,69",
  "muestra USD con formato chileno"
);
const costoSinTipo = validarCosto(normalizarCosto({
  linea: "cleverq",
  modelo: "A",
  configuracion: "B",
  moneda: "USD",
  costo: "10"
}));
afirmar(
  costoSinTipo.campos["k-tipo"] === true,
  "el costo exige tótem, visor o locker"
);
const costoVacio = validarCosto(normalizarCosto({}));
afirmar(
  ["k-linea", "k-modelo", "k-moneda", "k-costo"]
    .every((campo) => costoVacio.campos[campo])
    && !costoVacio.campos["k-configuracion"],
  "pide línea, modelo, moneda y costo (ya no cliente)"
);
const { CLIENTES_COTIZACION } = await import(
  "../web/js/clientes-cotizacion.js"
);
const equipoBase = CLIENTES_COTIZACION.find(
  (cliente) => cliente.id === "equipo-base"
);
const categoriasBase = new Set(
  equipoBase.componentes.map((pieza) => pieza.categoria)
);
const clavesPieza = CLIENTES_COTIZACION.flatMap((cliente) =>
  cliente.componentes.map((pieza) =>
    `${cliente.id}|${pieza.categoria}|${pieza.concepto}`
  )
);
const santaCruz = CLIENTES_COTIZACION.find(
  (cliente) => cliente.id === "santa-cruz"
);
const logitech = santaCruz.componentes.find((pieza) =>
  pieza.concepto.includes("Logitech")
);
afirmar(
  Boolean(equipoBase)
    && equipoBase.componentes.some((pieza) =>
      pieza.concepto.includes("22\" LCD"))
    && ["arneses", "metalmecanica", "ferreteria", "insumos"]
      .every((id) => categoriasBase.has(id))
    && equipoBase.componentes.every((pieza) => pieza.valor > 0)
    && new Set(clavesPieza).size === clavesPieza.length
    && logitech.cantidad === 2,
  "cada cliente trae precios de todas sus categorías, sin ítems repetidos"
);
const {
  normalizarClienteCotizacion,
  validarClienteCotizacion
} = await import("../web/js/cliente-cotizacion-validacion.js");
const receta = normalizarClienteCotizacion({
  etiqueta: "  Municipalidad de Maipú ",
  anio: "2026",
  incluyeHh: true,
  componentes: [
    { categoria: "dispositivos", concepto: "Monitor 22", cantidad: 2,
      moneda: "CLP", valor: 248804 },
    { categoria: "manoObra", concepto: "Clonación", cantidad: 0.5,
      moneda: "UF", valor: 0.12 },
    { categoria: "x", concepto: "", cantidad: 1 }
  ]
});
afirmar(
  receta.etiqueta === "Municipalidad de Maipú"
    && receta.anio === 2026
    && receta.incluyeHh === true
    && receta.componentes.length === 1
    && receta.componentes[0].cantidad === 2
    && validarClienteCotizacion(receta, []).valido,
  "un cliente nuevo guarda sus piezas sin HH sueltas ni filas vacías"
);
const clientePlanilla = normalizarClienteCotizacion({
  etiqueta: "Equipo Base",
  componentes: [{ categoria: "otros", concepto: "x" }]
});
afirmar(
  !validarClienteCotizacion(normalizarClienteCotizacion({}), []).valido
    && !validarClienteCotizacion(
      clientePlanilla,
      [clientePlanilla.etiquetaClave]
    ).valido,
  "pide nombre y piezas, y no repite un cliente de la planilla"
);
const { TAREAS_HH, montoTareaUf } = await import(
  "../web/js/hh-tareas.js"
);
const sumaUf = TAREAS_HH.reduce(
  (acc, tarea) => acc + montoTareaUf(tarea.horas, tarea.valorUf, true),
  0
);
const muro = CLIENTES_COTIZACION.find(
  (cliente) => cliente.id === "papa-johns-para-muro"
);
afirmar(
  TAREAS_HH.length === 15
    && Math.abs(sumaUf - 0.5874) < 0.00001
    && equipoBase.incluyeHh === true
    && muro.incluyeHh === false,
  "HH suma 0,5874 UF y solo algunos clientes la traen"
);
const hhFina = normalizarCosto({
  linea: "autoservicio",
  tipoEquipo: "totem",
  modelo: "T",
  moneda: "UF",
  costo: "1",
  tipoCambio: { usd: "900", uf: "40000" },
  lineas: [{
    categoria: "manoObra",
    concepto: "Clonación",
    cantidad: "0,04",
    moneda: "UF",
    valor: "0,12"
  }]
});
afirmar(
  hhFina.lineas[0].subtotal === 0.0048,
  "una HH chica no se redondea a cero"
);
const { historialAlGuardar, historialVisible } = await import(
  "../web/js/costo-historial.js"
);
const base = normalizarCosto({
  linea: "autoservicio", tipoEquipo: "totem", modelo: "T22",
  moneda: "USD", costo: "1.000", tipoCambio: { usd: "950", uf: "" }
});
const h1 = historialAlGuardar(null, base, "2026-09-01", "a@dts.cl");
afirmar(
  h1.length === 1 && h1[0].accion === "creado" && h1[0].usd === 950
    && h1[0].costo === 1000 && h1[0].fecha === "2026-09-01",
  "al crear guarda fecha, dólar y costo"
);
const igual = historialAlGuardar({ ...base, historial: h1 }, base,
  "2026-09-02", "a@dts.cl");
afirmar(igual.length === 1, "sin cambios no repite la cotización");
const subio = normalizarCosto({ ...base, costo: "1.100",
  tipoCambio: { usd: "980", uf: "" } });
const h2 = historialAlGuardar({ ...base, historial: h1 }, subio,
  "2026-10-06", "b@dts.cl");
afirmar(
  h2.length === 2 && h2[1].accion === "actualizado" && h2[1].usd === 980,
  "al cambiar costo o dólar agrega una línea"
);
const viejo = historialVisible({ ...base, historial: undefined,
  fechaActualizacion: "2025-05-10", creadoPorEmail: "x@dts.cl" });
afirmar(
  viejo.length === 1 && viejo[0].fecha === "2025-05-10",
  "un costo antiguo muestra su cotización inicial"
);

const costeo = normalizarCosto({
  linea: "autoservicio",
  tipoEquipo: "totem",
  modelo: "T22-M41 Aconcagua",
  configuracion: "DTS - Equipo base",
  moneda: "USD",
  cantidadEquipos: "5",
  tipoCambio: { usd: "1.000", uf: "40.000" },
  lineas: [
    { categoria: "dispositivos", concepto: "Pantalla", cantidad: "1",
      moneda: "CLP", valor: "200.000" },
    { categoria: "dispositivos", concepto: "Mini PC", cantidad: "1",
      moneda: "USD", valor: "300" },
    { categoria: "manoObra", concepto: "HH integración", cantidad: "0,5",
      moneda: "UF", valor: "2" }
  ]
});
afirmar(
  costeo.costo === 540 && costeo.costoLote === 2700,
  "convierte CLP y UF a USD y multiplica por el lote"
);
afirmar(
  costeo.lineas[2].cantidad === 0.5 && costeo.lineas[2].subtotal === 1,
  "acepta cantidades con decimales"
);
afirmar(validarCosto(costeo).valido, "la hoja de costeo es válida");
const sinDolar = validarCosto(normalizarCosto({
  ...costeo,
  tipoCambio: { usd: "", uf: "40.000" }
}));
afirmar(
  sinDolar.campos["k-cambio-usd"] === true,
  "exige el dólar si hay componentes en otra moneda"
);
const antiguo = normalizarCosto({
  moneda: "USD",
  lineas: [{ concepto: "Viejo", cantidad: "2", valor: "10" }]
});
afirmar(
  antiguo.lineas[0].categoria === "otros"
    && antiguo.lineas[0].moneda === "USD" && antiguo.costo === 20
    && antiguo.cantidadEquipos === 1,
  "los costos antiguos siguen funcionando"
);

const { COMPONENTES } = await import(
  "../web/js/catalogo-componentes.js"
);
const { conceptoDe, equivalenteDia, linkSeguro, parUsdClp } =
  await import("../web/js/costeo.js");
const {
  fechaConsultable,
  monedasGael,
  puntoHasta,
  serieMindicador
} = await import("../web/js/tipo-cambio-dia.js");
afirmar(
  equivalenteDia(1000, "USD", { usd: 977.25, uf: 0 })
    ?.valor === 977250,
  "pasa un costo en USD a pesos con el dólar del día"
);
afirmar(
  equivalenteDia(977250, "CLP", { usd: 977.25, uf: 0 })
    ?.valor === 1000,
  "pasa un costo en pesos a dólares con el dólar del día"
);
afirmar(
  equivalenteDia(1, "UF", { usd: 1000, uf: 0 }) === null,
  "no convierte UF si falta el valor de la UF"
);
const par = parUsdClp(10, "USD", { usd: 1000, uf: 40000 });
const parUf = parUsdClp(1, "UF", { usd: 1000, uf: 40000 });
afirmar(
  par.length === 2 && par[0].valor === 10 && par[1].valor === 10000
    && parUf[0].valor === 40 && parUf[1].valor === 40000,
  "el subtotal se expresa en dólares y en pesos"
);
afirmar(
  serieMindicador({
    serie: [{ valor: 977.25, fecha: "2026-10-06T04:00:00.000Z" }]
  })?.valor === 977.25,
  "lee el dólar observado y su fecha"
);
afirmar(
  serieMindicador({ serie: [{ valor: -1, fecha: "2026-10-06" }] })
    === null,
  "rechaza un dólar que no es un monto válido"
);
afirmar(
  puntoHasta([
    { valor: 900, fecha: "2026-10-02T04:00:00.000Z" },
    { valor: 910, fecha: "2026-10-06T04:00:00.000Z" }
  ], "2026-10-04")?.valor === 900,
  "en un feriado usa el último dólar hábil"
);
afirmar(
  fechaConsultable("2026-10-07", "2026-10-06") === false,
  "no consulta un dólar de un día futuro"
);
afirmar(
  monedasGael(
    [{ Codigo: "USD", Valor: "977,25" },
      { Codigo: "UF", Valor: "41106,35" }],
    "2026-10-06"
  )?.usd === 977.25,
  "lee el dólar del día en el formato chileno"
);
afirmar(
  linkSeguro("https://www.spdigital.cl/x?a=1", 500) !== ""
    && linkSeguro("javascript:alert(1)", 500) === ""
    && linkSeguro("ftp://x.cl", 500) === "",
  "solo acepta links http y https"
);
const { CATEGORIAS_COSTO } = await import("../web/js/hw-catalogo.js");
const categoriasValidas = new Set(CATEGORIAS_COSTO.map((c) => c.id));
afirmar(
  Object.keys(COMPONENTES).every((id) => categoriasValidas.has(id))
    && COMPONENTES.dispositivos.length === 41
    && COMPONENTES.manoObra.length > 100,
  "el catálogo de componentes usa categorías válidas"
);
afirmar(
  conceptoDe("dispositivos", COMPONENTES.dispositivos[1])
    === "Placa Madre: ASUS PRIME H510M-K"
    && conceptoDe("ferreteria", COMPONENTES.ferreteria[1])
      === "Golilla Plana M4 · Conjunto Cerradura"
    && conceptoDe("manoObra", COMPONENTES.manoObra[0])
      === "Planificación de Proyecto",
  "hereda tipo y componente y arma el concepto de cada categoría"
);

const modelos = semillaModelos();
afirmar(modelos.length === 17, "el catálogo trae los 17 modelos");
afirmar(
  modelos.every((item) => validarModelo(item).valido),
  "todos los modelos de la planilla son válidos"
);
const claves = new Set(modelos.map((item) => item.nombreClave));
afirmar(
  costos.every((item) => claves.has(item.modeloClave)),
  "cada costo apunta a un modelo del catálogo"
);
const repetido = validarModelo(
  normalizarModelo({ tipo: "totem", nombre: "t22-m41 aconcagua" }),
  modelos
);
afirmar(
  repetido.campos["m-nombre"] === true,
  "no permite dos modelos con el mismo nombre"
);
const conRaros = normalizarModelo({
  tipo: "visor",
  nombre: "X",
  clientes: "A\n a \nB\n",
  imagen: "javascript:alert(1)",
  ficha: { pantalla: "32\"", inventado: "no" }
});
afirmar(
  conRaros.clientes.length === 2 && conRaros.imagen === ""
    && !("inventado" in conRaros.ficha),
  "limpia clientes repetidos, imagen insegura y campos extra"
);

afirmar(
  claveLicitacion("  SURALIS  2026 ") === "suralis-2026",
  "la licitación se guarda con una clave estable"
);
const sinNombre = validarFicha({ ...FICHA_PRUEBA, licitacion: " " });
afirmar(!sinNombre.ok, "exige el nombre de la licitación");
const conNombre = validarFicha(FICHA_PRUEBA);
afirmar(
  conNombre.ok
    && conNombre.datos.licitacion === "SURALIS"
    && conNombre.datos.oficinas.length === 2
    && conNombre.datos.ejecutivos[0].filas[0].modulo === ""
    && conNombre.datos.totems[0].ip === "10.253.107.20"
    && conNombre.datos.visores[0].visor === "VISOR 1",
  "normaliza la ficha de prueba por licitación"
);
afirmar(
  OPCIONES_FICHA.enchufe.includes("Magic")
    && OPCIONES_FICHA.distancia.includes("2 metros")
    && OPCIONES_FICHA.instalacion.includes(
      "Muro con brazo extensible"
    )
    && OPCIONES_FICHA.pisos.length === 10
    && clavePregunta("¿Qué tipo de enchufe?") === "enchufe",
  "las preguntas físicas tienen listas fijas"
);
afirmar(
  conNombre.datos.equipos[0].pares[0].claveIzq === "enchufe"
    && conNombre.datos.equipos[0].pares[0].respuestaIzq === "Magic"
    && conNombre.datos.equipos[2].pares[1].claveIzq === "instalacion",
  "conserva el enchufe y la clave de cada pregunta"
);
const tresTotems = [
  { tipo: "totem", titulo: "TÓTEM N°1" },
  { tipo: "totem", titulo: "TÓTEM N°2" },
  { tipo: "totem", titulo: "TÓTEM N°3" },
  { tipo: "visor", titulo: "VISOR N°1" }
];
tresTotems.splice(1, 1);
const corridos = numerarEquipos(tresTotems);
afirmar(
  corridos[0].titulo === "TÓTEM N°1"
    && corridos[1].titulo === "TÓTEM N°2"
    && corridos[2].titulo === "VISOR N°1",
  "al borrar un tótem el siguiente toma su número"
);
const filaTotems = [
  { totem: "TÓTEM 1" },
  { totem: "TÓTEM 2" },
  { totem: "TÓTEM 3" }
];
filaTotems.splice(1, 1);
afirmar(
  numerarCampo(filaTotems, "totem", "TÓTEM")[1].totem === "TÓTEM 2",
  "la lista de tótems también cierra el hueco"
);
afirmar(
  nombreSiguiente(
    [{ modulo: "MÓDULO 1" }, { modulo: "MÓDULO 2" }],
    "modulo",
    "MÓDULO"
  ) === "MÓDULO 3",
  "el módulo nuevo toma el siguiente número"
);
afirmar(
  nombreSiguiente(
    [{ modulo: "MÓDULO 1" }, { modulo: "PAGO" }, { modulo: "MÓDULO 4" }],
    "modulo",
    "MÓDULO"
  ) === "MÓDULO 5",
  "no pisa un módulo cuyo nombre ya se editó"
);
const usuarios = [
  { numero: "USUARIO 1" },
  { numero: "USUARIO 2" },
  { numero: "USUARIO 3" }
];
usuarios.splice(1, 1);
afirmar(
  numerarCampo(usuarios, "numero", "USUARIO")[1].numero === "USUARIO 2",
  "el N° de usuario se recorre y no queda hueco"
);
afirmar(
  nombresUnicos(FICHA_PRUEBA.oficinas).length === 2
    && nombresUnicos(
      FICHA_PRUEBA.sectores.map((fila) => fila.sector)
    ).includes("ACCESO OSORNO"),
  "oficinas y sectores quedan listos para elegirse"
);
const fichaSector = structuredClone(FICHA_PRUEBA);
fichaSector.menu.totems[0].tramites = [
  { texto: "SOLO PM", hijos: ["SUB PM"] }
];
fichaSector.menu.totems[1].tramites = [
  { texto: "SOLO OS", hijos: [] }
];
afirmar(
  tramitesDeSector(fichaSector, "ACCESO PUERTO MONTT")
    .join(",") === "SOLO PM,SUB PM"
    && tramitesDeSector(fichaSector, "ACCESO OSORNO")
      .join(",") === "SOLO OS"
    && tramitesDeSector(fichaSector, "").length === 0
    && !tramitesDeSector(FICHA_PRUEBA, "ACCESO OSORNO")
      .includes("SOLO PM"),
  "el UAC solo lista trámites del sector"
);
const fichaSuelta = {
  totems: [{ totem: "TÓTEM 1", sector: "" }],
  sectores: [{ sector: "sector 1", totem: "" }],
  menu: {
    totems: [{
      totem: "TÓTEM 1",
      tramites: [{
        texto: "tramite 1",
        hijos: ["tramite 1.1"]
      }]
    }]
  }
};
const fichaNombre = {
  totems: [{ totem: "TÓTEM 2", sector: "" }],
  sectores: [{ sector: "Acceso Norte", totem: "totem 2" }],
  menu: {
    totems: [{
      totem: "TÓTEM 2",
      tramites: [{ texto: "tramite 11", hijos: [] }]
    }]
  }
};
afirmar(
  tramitesDeSector(fichaSuelta, "sector 1").join(",")
    === "tramite 1,tramite 1.1"
    && tramitesDeSector(fichaNombre, "acceso norte")
      .join(",") === "tramite 11",
  "el UAC encuentra trámites aunque el sector esté suelto"
);
afirmar(
  modulosDeSector(FICHA_PRUEBA, "ACCESO PUERTO MONTT")
    .includes("MÓDULO 1")
    && !modulosDeSector(FICHA_PRUEBA, "ACCESO OSORNO")
      .includes("NO EXISTE")
    && totemsDelSector(FICHA_PRUEBA, "ACCESO OSORNO")
      .includes("TÓTEM 2")
    && !totemsDelSector(FICHA_PRUEBA, "ACCESO OSORNO")
      .includes("TÓTEM 1")
    && equipoFisicoListo(FICHA_PRUEBA.equipos[0])
    && !equipoFisicoListo(equipoVacio("totem"))
    && indicesBarra(5, 3).join(",") === "0,1,3",
  "módulos, tótems del sector y pestañas físicas"
);
const horas = partirHorario("08:30 A 16:30 HRS");
afirmar(
  horas.entrada === "08:30"
    && horas.salida === "16:30"
    && claveSegura("Suralis2026#")
    && !claveSegura("clave")
    && nivelClave("Suralis2026#").clave === "muy"
    && usuarioValido("cbrito")
    && !usuarioValido("cb rito")
    && faltantesFicha({
      totems: [{ totem: "TÓTEM 1" }]
    }).some((t) => t.includes("entrada"))
    && detalleFaltantes({
      totems: [{ totem: "TÓTEM 1" }]
    })[0].ruta === "totems.0.horaEntrada"
    && detalleFaltantes({
      totems: [{ totem: "TÓTEM 1" }, { totem: "TÓTEM 2" }],
      red: [],
      menu: { totems: [{ totem: "TÓTEM 1", listo: false }] }
    }).some((item) => String(item.ruta).startsWith("red."))
    && detalleFaltantes({
      totems: [{ totem: "TÓTEM 1" }],
      menu: {
        totems: [{
          totem: "TÓTEM 1",
          listo: false,
          tramites: [{ texto: "", hijos: [""] }]
        }]
      }
    }).some((item) => item.texto.includes("no está listo"))
    && faltantesPorGrupo([
      { texto: "a", ruta: "totems.0.ip" },
      { texto: "b", ruta: "menu.totems.0" },
      { texto: "c", ruta: "red.0.ip" }
    ]).length === 3,
  "horario, contraseña segura y usuario sin espacios"
);
afirmar(
  conNombre.datos.menu.teclado === "Arriba"
    && conNombre.datos.menu.totems.length === 2
    && conNombre.datos.menu.totems[0].tramites[0].texto
      === "PAGOS, CONVENIOS, COPIA DOCTOS."
    && conNombre.datos.menu.totems[0].tramites[0].hijos[0]
      === "PAGO DE CUENTAS"
    && conNombre.datos.menu.totems[0].tramites[1].hijos[0]
      === "DEUDA Y FECHA DE CORTE",
  "el submenú 1 son los 1.1 del trámite 1"
);
const menuViejo = tramitesDeMenu({
  columnas: [
    { items: ["A", "B"] },
    { items: ["A1", "A2"] },
    { items: ["B1"] }
  ]
});
afirmar(
  menuViejo[0].hijos[1] === "A2" && menuViejo[1].hijos[0] === "B1",
  "un menú viejo en columnas pasa a 1.1 y 2.1"
);
afirmar(
  claseTeclado("Abajo") === "teclado-abajo"
    && claseTeclado("Centrado") === "teclado-centrado",
  "la vista previa mueve el teclado según la opción"
);
afirmar(
  conNombre.datos.red.length === 4
    && conNombre.datos.red[0].ip === "10.253.107.20"
    && conNombre.datos.red[3].equipo === "Visor 2 - 32\"",
  "la hoja 2 guarda la red de cada equipo"
);
const menuSel = {
  menu: {
    totems: [
      { totem: "TÓTEM 1", listo: false, tramites: [] },
      { totem: "TÓTEM 2", listo: false, tramites: [] }
    ]
  },
  totems: []
};
afirmar(
  aplicarMenu(menuSel, "menu:elegir:1")
    && aplicarMenu(menuSel, "menu:guardarTotem:1")
    && menuSel.menu.totems[1].listo === true
    && menuSel.menu.totems[0].listo === false
    && esGuardarTotem("menu:guardarTotem:1")
    && conNombre.datos.menu.totems[0].listo === false,
  "cada tótem se guarda aparte y el check queda en listo"
);
afirmar(
  esSi("Sí") && faseTrasDescanso({
    tipoPreferente: "Sí",
    ingresoRut: "Sí"
  }) === "preferente"
    && faseTrasDescanso({
      tipoPreferente: "No",
      ingresoRut: "Sí"
    }) === "rut"
    && formatearRut("123456785") === "12345678-5"
    && mensajeTicket("12.345.678-5", "PAGOS", "PAGO DE CUENTAS", 1)
      .includes("ticket N° 1"),
  "la simulación emite el ticket con RUT y trámite"
);
const envioOk = validarEnvio({
  ...fichaEnBlanco("SURALIS"),
  licitacion: "SURALIS",
  plazoHasta: Date.now() + 3600000
});
afirmar(
  crearToken().length === 32
    && validarNombreCliente("Ana Pérez").ok
    && !validarNombreCliente("A").ok
    && envioOk.ok
    && restoPlazo(Date.now() - 1000).vencido
    && !restoPlazo(Date.now() + 60000).vencido
    && etiquetaEstado({
      estado: "en_curso",
      plazoHasta: Date.now() + 60000
    }) === "En proceso"
    && etiquetaEstado({
      estado: "pendiente",
      plazoHasta: Date.now() - 1
    }) === "Vencida"
    && sincronizarMenuTotems({
      totems: [{ totem: "TÓTEM 1" }, { totem: "TÓTEM 3" }],
      menu: { totems: [{ totem: "TÓTEM 1", listo: true }] }
    }).menu.totems.length === 2
    && fichaEnBlanco("X").oficinas.length === 0
    && preservarRedInterna(
      [{ ip: "10.0.0.1", serie: "" }],
      [{ serie: "2026-014", anydesk: "1" }]
    )[0].serie === "2026-014"
    && clientePuedeVer({ plazoHasta: Date.now() + 60000 })
    && !clientePuedeVer({ plazoHasta: Date.now() - 1 })
    && !clientePuedeEditar({
      estado: "finalizado",
      plazoHasta: Date.now() + 60000
    })
    && clientePuedeVer({
      estado: "finalizado",
      plazoHasta: Date.now() + 60000
    }),
  "el enlace del cliente tiene plazo, nombre e historial"
);
const envioPdf = normalizarEnvio({
  ...fichaEnBlanco("SURALIS"),
  licitacion: "SURALIS",
  plazoHasta: Date.now() + 3600000,
  pdfUrl: "https://ejemplo.test/f.pdf",
  pdfRuta: "fichasCliente/abc/respuestas.pdf",
  pdfNombre: "respuestas.pdf"
});
afirmar(
  rutaPdfFicha("abc123def4567890")
    === "fichasCliente/abc123def4567890/respuestas.pdf"
    && !rutaPdfFicha("abc/../x").includes("..")
    && nombrePdfFicha({ licitacion: "SURALIS", numero: 3 })
      .startsWith("Ficha_N3_SURALIS")
    && paresPortada({
      licitacion: "SURALIS",
      cliente: "C"
    })[0][1] === "SURALIS"
    && envioPdf.pdfUrl === "https://ejemplo.test/f.pdf"
    && envioPdf.pdfRuta.startsWith("fichasCliente/"),
  "el PDF de la ficha tiene nombre, ruta y resguardo"
);
const redSync = sincronizarRedEquipos(
  structuredClone(FICHA_PRUEBA)
);
afirmar(
  partirIp("10.253.107.20")[0] === "10"
    && componerIp(["10", "253", "107", "20"])
      === "10.253.107.20"
    && ipLista("10.253.107.20")
    && !ipLista("10.253..20")
    && redSync.red.length === 4
    && redSync.red[0].equipo === "TÓTEM 1"
    && redSync.red[0].ip === "10.253.107.20"
    && redSync.red[2].equipo === "VISOR 1"
    && sincronizarRedEquipos({
      totems: [{ totem: "TÓTEM 1", oficina: "PM" }],
      visores: [{ visor: "VISOR 1" }],
      red: []
    }).red.length === 2,
  "la red se arma por tótem y visor con IP por octetos"
);

const parcial = avanceFicha({ pantalla: "LCD 22\"", peso: "  ", audio: "x" });
const llena = Object.fromEntries(CAMPOS_FICHA.map((campo) => [campo.id, "s"]));
afirmar(
  parcial.llenos === 2 && parcial.total === CAMPOS_FICHA.length
    && avanceFicha(null).llenos === 0
    && avanceFicha(llena).llenos === CAMPOS_FICHA.length
    && avanceFicha(parcial, GRUPOS_FICHA[0].campos).total === 2
    && CAMPOS_FICHA.every((campo) => campo.ejemplo)
    && textoAvance(2, 13) === "2 de 13 datos completos",
  "la ficha técnica cuenta sus datos completos y trae ejemplos"
);
afirmar(
  textoCostosModelo([]) === "Sin costos registrados"
    && textoCostosModelo([{ costo: 10, moneda: "USD" }])
      === "1 costo · USD 10,00 por equipo"
    && textoCostosModelo([
      { costo: 10, moneda: "USD" },
      { costo: 9, moneda: "USD" }
    ]).startsWith("2 costos · el más reciente, USD 10,00"),
  "la ficha resume los costos de su modelo"
);

const AHORA = Date.UTC(2026, 9, 23);
const nuevoEnvio = (licitacion, plazoHasta) => validarEnvio({
  ...fichaEnBlanco(licitacion),
  licitacion,
  plazoHasta
}, AHORA);
afirmar(
  nuevoEnvio("Pendiente", AHORA + 3600000).ok
    && !nuevoEnvio("", AHORA + 3600000).ok
    && !nuevoEnvio("###", AHORA + 3600000).ok
    && !nuevoEnvio("SURALIS", AHORA - 1000).ok,
  "un enlace nuevo pide nombre con letras y un plazo futuro"
);
afirmar(
  leerMonto(0.125, 3) === 0.125
    && leerMonto(1172.68, 2) === 1172.68
    && leerMonto("1.277,20", 2) === 1277.2
    && leerMonto("3.840", 2) === 3840,
  "un monto ya guardado con 3 decimales no se lee como miles"
);

const checklistBase = semilla()[0];
const revisar = (cambios, crudo) => validarDatos(
  normalizarChecklist({ ...checklistBase, ...cambios }),
  { ...checklistBase, ...cambios, ...crudo }
);
const salidaAntes = revisar({
  fechaInspeccion: "2026-09-28",
  fechaSalida: "2026-09-20"
});
const macMala = revisar({ mac: "ZZ:11" });
afirmar(
  !salidaAntes.valido && salidaAntes.campos.fechaSalida
    && !revisar({ fechaInspeccion: "2999-01-01",
      fechaSalida: "2999-01-02" }).campos.fechaSalida
    && revisar({ fechaInspeccion: "2999-01-01" }).campos.fechaInspeccion
    && macMala.errores.some((texto) => texto.includes("formato válido"))
    && revisar({ mac: "" }).errores
      .some((texto) => texto.startsWith("Indica la MAC")),
  "el checklist revisa el orden de las fechas y explica la MAC inválida"
);

if (fallos > 0) {
  process.exitCode = 1;
} else {
  console.log("Todas las pruebas pasaron.");
}
