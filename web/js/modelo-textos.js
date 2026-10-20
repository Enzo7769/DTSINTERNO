/**
 * Propósito: Textos visibles del catálogo de modelos.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: ninguna
 */

export const MT = {
  tituloListado: "Modelos | DTS",
  tituloNuevo: "Nuevo modelo | DTS",
  tituloEdicion: "Editar modelo | DTS",
  nuevo: "Nuevo modelo",
  editar: "Editar modelo",
  sinGuardar: "Borrador todavía no guardado",
  registros: "modelos",
  cargando: "Cargando modelos…",
  sinResultados: "No hay modelos con esos filtros.",
  vacio: "El catálogo de modelos está vacío.",
  noEncontrado: "Ese modelo ya no está disponible.",
  confirmarEliminar:
    "Se eliminará este modelo del catálogo. Esta acción no se "
    + "puede deshacer.",
  eliminado: "Modelo eliminado.",
  creadoTitulo: "Modelo creado",
  actualizadoTitulo: "Modelo actualizado",
  volver: "Volver a modelos",
  tipo: "Tipo",
  leyendaTipo: "Tipo de modelo",
  nombre: "Modelo",
  otroNombre: "Otro nombre",
  estado: "Estado",
  clientes: "Clientes que tienen el equipo",
  ayudaClientes: "Un cliente por línea.",
  notas: "Notas",
  imagen: "Imagen referencial",
  ayudaImagen: "PNG, JPG o WEBP. Se reduce automáticamente.",
  quitarImagen: "Quitar imagen",
  imagenInvalida: "El archivo no es una imagen válida.",
  imagenPesada: "No se pudo reducir la imagen. Prueba con otra.",
  sinImagen: "Sin imagen",
  faltaTipo: "Elige el tipo de modelo.",
  faltaNombre: "Indica el nombre del modelo.",
  nombreDuplicado: "Ya existe un modelo con ese nombre.",
  tituloPdf: "Modelo de equipo",
  usoInterno: "Uso interno",
  generado: "Documento generado el",
  datosGenerales: "Datos generales",
  importar: "Importar planilla de referencia",
  confirmarImportar:
    "Se cargarán los modelos de la planilla «Resumen costos "
    + "Hardware». La ficha técnica queda en Especificaciones. "
    + "¿Continuar?",
  importando: "Importando…",
  guardarPdf: "Guardar y descargar PDF",
  descargarPdf: "Descargar PDF",
  sinClientes: "Sin clientes registrados",
  exportarTodo: "Exportar PDF general",
  generandoTodo: "Generando PDF…",
  sinModelosPdf: "No hay modelos para exportar.",
  tituloCatalogo: "Catálogo de modelos",
  subCatalogo: "DTS Autoservicio SpA · Uso interno",
  indice: "Índice de equipos",
  archivoCatalogo: "Modelos_DTS.pdf",
  colN: "N°",
  colModelo: "Modelo",
  colTipo: "Tipo",
  colEstado: "Estado",
  colClientes: "Clientes"
};

/**
 * @param {number} total
 * @returns {string}
 */
/**
 * @param {number} total
 * @returns {string}
 */
export function textoTotalModelos(total) {
  return `${total} modelos`;
}

/**
 * @param {number} total
 * @returns {string}
 */
export function textoModelosImportados(total) {
  return `Se importaron ${total} modelos.`;
}

/**
 * @param {number} numero
 * @returns {string}
 */
export function textoModeloCreado(numero) {
  return `El modelo N° ${numero} se agregó al catálogo.`;
}

/**
 * @param {string} primeros
 * @param {number} resto
 * @returns {string}
 */
export function textoClientesMas(primeros, resto) {
  return `${primeros} y ${resto} más`;
}

/**
 * @param {number} numero
 * @returns {string}
 */
export function textoModeloActualizado(numero) {
  return `El modelo N° ${numero} se actualizó correctamente.`;
}
