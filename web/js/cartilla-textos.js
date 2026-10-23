/**
 * Propósito: Textos visibles del módulo de cartilla de ruta.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: ninguna
 */

export const TXT = {
  tituloListado: "Cartillas de ruta | DTS",
  tituloNueva: "Nueva cartilla | DTS",
  tituloEdicion: "Editar cartilla | DTS",
  nueva: "Nueva cartilla de ruta",
  editar: "Editar cartilla de ruta",
  sinGuardar: "Borrador todavía no guardado",
  cargando: "Cargando cartillas…",
  sinResultados: "No hay cartillas con esos filtros.",
  noEncontrada: "Esa cartilla ya no está disponible.",
  confirmarEliminar:
    "Se eliminará esta cartilla. Esta acción no se puede deshacer.",
  eliminada: "Cartilla eliminada.",
  creadaTitulo: "Cartilla creada",
  actualizadaTitulo: "Cartilla actualizada",
  volver: "Volver a cartillas",
  observaciones: "Observaciones",
  nombreFirma: "Nombre / firma",
  fecha: "Fecha",
  aprobado: "Aprobado",
  si: "SÍ",
  no: "NO",
  pendiente: "Pendiente",
  nombreLibre: "Nombre",
  seleccionados: "Seleccionados",
  ayudaSeleccion:
    "Toca un elemento para incluirlo en el equipo y completarlo. "
    + "Desmárcalo para quitarlo.",
  ayudaObligatoria:
    "Completa cada valor de este apartado para poder guardar.",
  obligatorio: "Obligatorio",
  agregarPeriferico: "Agregar periférico",
  perifericoNuevo: "Nuevo periférico",
  quitar: "Quitar",
  maxPerifericos: "Ya no se pueden agregar más periféricos.",
  faltaValor: "es obligatorio.",
  faltaCliente: "Indica el cliente.",
  faltaModelo: "Indica el modelo.",
  faltaSerie: "Indica el número de serie.",
  faltaCreadaPor: "Indica quién crea la cartilla.",
  fechaInvalida: "tiene una fecha que no es válida.",
  ipInvalida: "debe ser una dirección como 192.168.1.10.",
  faltaNombreLibre: "indica el nombre del elemento.",
  firmaGrande: "Una firma es demasiado pesada. Límpiala y repite.",
  usoInterno: "Uso interno",
  cartillaRuta: "Cartilla de ruta",
  creadaPor: "Creada por",
  aprobadaPor: "Aprobada por",
  datosGenerales: "Datos generales",
  cliente: "Cliente",
  modelo: "Modelo",
  serie: "N° de serie",
  parte: "N° de parte",
  finalizacion: "Datos de finalización del proceso",
  item: "Ítem",
  nombre: "Nombre",
  firma: "Firma",
  sinElementos: "Sin elementos seleccionados.",
  generado: "Documento generado el",
  borrador: "Borrador sin guardar"
};

/**
 * @param {number} numero
 * @returns {string}
 */
export function textoCreada(numero) {
  return `La cartilla de ruta N° ${numero} se creó correctamente.`;
}

/**
 * @param {number} numero
 * @returns {string}
 */
export function textoActualizada(numero) {
  return `La cartilla de ruta N° ${numero} se actualizó correctamente.`;
}

/**
 * @param {string} etiqueta
 * @param {string} problema
 * @returns {string}
 */
export function textoCampo(etiqueta, problema) {
  return `${etiqueta}: ${problema}`;
}
