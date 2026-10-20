/**
 * Propósito: Textos visibles de la Base de costos HW.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: ninguna
 */

export const CT = {
  tituloListado: "Base de costos HW | DTS",
  tituloNuevo: "Nuevo costo | DTS",
  tituloEdicion: "Editar costo | DTS",
  nueva: "Nuevo costo de hardware",
  editar: "Editar costo de hardware",
  sinGuardar: "Borrador todavía no guardado",
  registros: "costos",
  cargando: "Cargando costos…",
  sinResultados: "No hay costos con esos filtros.",
  vacio: "La base de costos está vacía.",
  noEncontrado: "Ese costo ya no está disponible.",
  confirmarEliminar:
    "Se eliminará este costo. Esta acción no se puede deshacer.",
  eliminado: "Costo eliminado.",
  creadoTitulo: "Costo creado",
  actualizadoTitulo: "Costo actualizado",
  volver: "Volver a la base de costos",
  linea: "Línea de producto",
  modelo: "Modelo",
  configuracion: "Cliente / configuración",
  moneda: "Moneda",
  costo: "Costo actualizado",
  fechaActualizacion: "Fecha de actualización",
  referencia: "Documento de costeo",
  observaciones: "Observaciones",
  concepto: "Componente o concepto",
  cantidad: "Cantidad",
  valor: "Valor unitario",
  subtotal: "Subtotal",
  total: "Total",
  agregar: "Agregar componente",
  maxLineas: "Se alcanzó el máximo de 200 componentes por costo.",
  quitar: "Quitar",
  desglose: "Desglose del costo",
  ayudaDesglose:
    "Opcional. Si agregas componentes, el costo es la suma.",
  ayudaCosto: "Usa coma para los decimales. Ej.: 1.277,20",
  costoCalculado: "Calculado desde el desglose",
  faltaLinea: "Elige la línea de producto.",
  faltaModelo: "Indica el modelo.",
  faltaConfiguracion: "Indica el cliente o la configuración.",
  faltaMoneda: "Elige la moneda.",
  faltaCosto: "Indica un costo mayor que cero.",
  fechaInvalida: "La fecha de actualización no es válida.",
  faltaConcepto: "indica el componente.",
  cantidadInvalida: "la cantidad debe ser mayor que cero (máx. 9999).",
  faltaDolar:
    "Indica el valor del dólar: hay componentes en otra moneda.",
  faltaUf: "Indica el valor de la UF: hay componentes en otra moneda.",
  categoria: "Categoría",
  monedaLinea: "Moneda",
  cantidadEquipo: "Cant. por equipo",
  subtotalCosto: "Subtotal",
  porcentaje: "% del total",
  items: "Ítems",
  parametros: "Parámetros del costeo",
  cantidadEquipos: "Cantidad de equipos",
  dolar: "Dólar (CLP por 1 USD)",
  uf: "UF (CLP por 1 UF)",
  resumenCategorias: "Resumen por categoría",
  costoEquipo: "Costo por equipo",
  costoLote: "Costo total del lote",
  equivale: "Equivale a",
  sinCambio: "sin tipo de cambio",
  comoUsar: "¿Cómo se usa esta hoja de costeo?",
  fabricante: "Fabricante",
  link: "Link de cotización",
  linkEjemplo: "https://…",
  abrirLink: "Abrir",
  abrirLinkTitulo: "Abrir el link de cotización en otra pestaña",
  incluir: "Incluir",
  incluirTitulo: "Marca para incluir este componente en el costo",
  conceptoManual: "Describe el componente",
  agregarManual: "Agregar componente manual",
  buscarPestana: "Buscar en esta pestaña",
  soloSeleccionados: "Solo seleccionados",
  subtotalPestana: "Subtotal de la pestaña",
  pestanaVacia:
    "Esta pestaña no tiene lista. Agrega los componentes a mano.",
  sinFiltro: "Ningún componente coincide con la búsqueda.",
  cargandoLista: "Cargando lista de componentes…",
  manual: "Manual",
  cotizacion: "Cotización",
  conversion: "Convertido con el tipo de cambio",
  tituloPdf: "Ficha de costo de hardware",
  tituloResumen: "Resumen de costos de hardware",
  usoInterno: "Uso interno · Confidencial",
  generado: "Documento generado el",
  kpiRegistros: "Costos registrados",
  kpiModelos: "Modelos costeados",
  kpiActualizado: "Última actualización",
  clienteCotizacion: "Cliente de la cotización",
  clienteAyuda:
    "Al elegirlo se agregan las piezas que ese cliente usa, "
    + "con cantidad 1.",
  clienteVacio:
    "Ese cliente no tiene piezas marcadas en la planilla.",
  sinCliente: "Sin cliente",
  clientesCreados: "Creados en la app",
  planilla: "Planilla",
  clienteFaltaNombre: "Escribe el nombre del cliente.",
  clienteSinPiezas:
    "Marca al menos una pieza o las HH antes de guardar el cliente.",
  clienteNombrePlanilla:
    "Ese nombre ya existe en la planilla. Usa otro nombre.",
  clienteReemplazar:
    "Ya creaste un cliente con ese nombre. ¿Reemplazar sus piezas "
    + "por las de este costo?",
  clienteConfirmarEliminar:
    "Se eliminará este cliente de la lista. Los costos ya guardados "
    + "no cambian. ¿Continuar?",
  clienteEliminado: "Cliente eliminado de la lista.",
  clienteFalloGuardar:
    "No se pudo guardar el cliente. Revisa la conexión o publica "
    + "las reglas de Firestore.",
  copiaTitulo: "Nuevo costo (copia)",
  duplicar: "Duplicar",
  historial: "Historial de cotización",
  historialAyuda:
    "Cada vez que guardas con otro costo, dólar, UF o cantidad de "
    + "equipos, queda una línea con la fecha y los valores.",
  historialNuevo: "Se registrará la primera cotización al guardar.",
  histFecha: "Fecha",
  histMovimiento: "Movimiento",
  histCreado: "Creado",
  histActualizado: "Actualizado",
  histDolar: "Dólar",
  histUf: "UF",
  histVariacion: "Variación",
  histUsuario: "Registrado por",
  kpiDolar: "Dólar del día",
  elegirDiaDolar: "Día de la cotización del dólar",
  consultandoDolar: "Consultando…",
  diaDolarInvalido: "Elige un día de hoy o anterior.",
  dolarNoDisponible: "No disponible",
  alDolar: "al dólar del",
  alDolarHoy: "al dólar de hoy",
  sinFecha: "Sin fecha",
  exportarCsv: "Exportar CSV",
  resumenPdf: "Resumen PDF",
  importar: "Importar planilla de referencia",
  confirmarImportar:
    "Se cargarán los costos de la planilla «Resumen costos "
    + "Hardware». ¿Continuar?",
  importando: "Importando…",
  sinDatos: "No hay datos para exportar.",
  verModelo: "Ver modelo",
  modeloCatalogo: "Modelo del catálogo.",
  modeloLibre:
    "No está en el catálogo. Puedes agregarlo en «Modelos y "
    + "especificaciones técnicas».",
  csvArchivo: "Base_costos_HW.csv",
  resumenArchivo: "Resumen_costos_HW.pdf",
  hhIncluir: "Incluir HH en este costo",
  hhAyuda:
    "Igual que la planilla: horas por equipo × valor en UF × 1,2 "
    + "(+20 %). Si el cliente lleva HH, se incluye solo. Si no, "
    + "las horas quedan en 0 hasta que marques esta casilla.",
  hhActivar: "Activar",
  hhTipo: "Tipo",
  hhComponente: "Componente",
  hhDescripcion: "Descripción",
  hhPorEquipo: "Cantidad HH por 1 equipo",
  hhValorUf: "Valor HH en UF",
  hhValorEquipo: "Valor por equipo (UF) +20 %",
  hhTotal: "Total",
  hhOtras: "Otras"
};

/**
 * Guía de la hoja de costeo: un paso por campo u operación.
 * Se muestra en el formulario dentro de «¿Cómo se usa…?».
 */
export const AYUDA_COSTEO = [
  {
    titulo: "1. Moneda del costo",
    texto: "Es la moneda en que quedará el costo final (normalmente "
      + "USD). Todo se convierte a esta moneda."
  },
  {
    titulo: "2. Cantidad de equipos",
    texto: "Cuántos equipos iguales se fabrican. Los componentes se "
      + "ingresan por 1 equipo; el lote se calcula solo "
      + "(costo por equipo × cantidad)."
  },
  {
    titulo: "3. Dólar y UF",
    texto: "Cuántos pesos vale 1 USD y 1 UF. Al crear un costo se "
      + "proponen los del día. En el dólar puedes elegir otra fecha "
      + "y se completan el dólar y la UF de ese día. En la base, "
      + "cada costo muestra su equivalente con la fecha elegida."
  },
  {
    titulo: "4. Pestañas",
    texto: "Dispositivos, Arneses, Metalmecánica, Logística, "
      + "Ferretería, Insumos, SW, HH y Otros. Cada pestaña muestra "
      + "su lista completa; el número junto al nombre indica "
      + "cuántos componentes están incluidos. Usa «Buscar en esta "
      + "pestaña» o «Solo seleccionados» para encontrar rápido."
  },
  {
    titulo: "5. Incluir componentes",
    texto: "Marca la casilla de lo que lleva el equipo. Al escribir "
      + "un valor unitario la casilla se marca sola. Lo que no está "
      + "marcado no suma. Si algo no está en la lista, usa "
      + "«Agregar componente manual» en esa pestaña."
  },
  {
    titulo: "6. Fabricante y link de cotización",
    texto: "Quién fabrica el componente (Epson, Beelink, Bticino…) y "
      + "la página donde lo cotizaste (debe empezar con https://). "
      + "«Abrir» lleva a esa página para revisar el precio."
  },
  {
    titulo: "7. Cantidad por equipo",
    texto: "Unidades que usa 1 equipo. Acepta decimales: 0,25 HH, "
      + "3 m de cable o 0,33 de un litro de alcohol."
  },
  {
    titulo: "8. Moneda y valor unitario",
    texto: "El precio de 1 unidad tal como lo cotizaste: en CLP, "
      + "USD o UF. Escribe los decimales con coma (189,26)."
  },
  {
    titulo: "9. Subtotal",
    texto: "Se calcula solo: cantidad × valor unitario, convertido a "
      + "la moneda del costo. El costo por equipo es la suma de "
      + "todos los subtotales."
  },
  {
    titulo: "10. HH (mano de obra)",
    texto: "La pestaña HH usa la tabla de la planilla: cada tarea "
      + "tiene sus horas y su valor en UF. El costo es horas × "
      + "valor UF × 1,2 (+20 %). Al elegir un cliente que lleva "
      + "HH, la tabla se suma sola."
  }
];

/**
 * @param {number} n equipos del lote
 * @returns {string}
 */
export function textoHhPorEquipo(n) {
  const equipos = n === 1 ? "1 equipo" : `${n} equipos`;
  return `Cantidad HH del lote (${equipos})`;
}

/**
 * @param {number} n equipos del lote
 * @returns {string}
 */
export function textoHhValorLote(n) {
  const equipos = n === 1 ? "1 equipo" : `${n} equipos`;
  return `Valor del lote, ${equipos} (UF) +20 %`;
}

/**
 * @param {string} nombre
 * @returns {string}
 */
export function textoClienteGuardado(nombre) {
  const corto = String(nombre || "").slice(0, 80);
  return `Cliente «${corto}» guardado. Ya aparece en la lista.`;
}

/**
 * @param {number|string} numero N° del costo copiado
 * @returns {string}
 */
export function textoCopiaDe(numero) {
  return `Copia del costo N° ${numero || "—"}, todavía no guardada. `
    + "Cambia el modelo, el cliente o las piezas y guarda.";
}

/**
 * @param {number} n
 * @returns {string}
 */
export function textoClientePiezas(n) {
  const palabra = n === 1 ? "pieza" : "piezas";
  return `Se agregaron ${n} ${palabra} de ese cliente.`;
}

export function textoLinkInvalido(concepto) {
  const nombre = String(concepto || "").slice(0, 60) || "Componente";
  return `${nombre}: el link debe empezar con http:// o https://.`;
}

/**
 * @param {number} n
 * @returns {string}
 */
export function textoLote(n) {
  return n === 1 ? "1 equipo" : `${n} equipos`;
}

/**
 * @param {number} numero
 * @returns {string}
 */
export function textoCreado(numero) {
  return `El costo N° ${numero} se agregó a la base.`;
}

/**
 * @param {number} numero
 * @returns {string}
 */
export function textoActualizado(numero) {
  return `El costo N° ${numero} se actualizó correctamente.`;
}

/**
 * @param {number} n
 * @param {string} problema
 * @returns {string}
 */
export function textoLinea(n, problema) {
  return `Componente ${n}: ${problema}`;
}

/**
 * @param {number} n
 * @returns {string}
 */
export function textoImportados(n) {
  return `Se importaron ${n} registros.`;
}
