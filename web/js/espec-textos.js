/**
 * Propósito: Textos de Especificaciones técnicas.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: ninguna
 */

export const ET = {
  tituloListado: "Especificaciones técnicas | DTS",
  tituloEdicion: "Especificaciones | DTS",
  titulo: "Especificaciones técnicas",
  ayuda: "Ficha técnica y clientes de cada equipo.",
  registros: "fichas",
  cargando: "Cargando fichas…",
  sinResultados: "No hay fichas con esos filtros.",
  vacio: "Todavía no hay modelos. Créalos en Modelos.",
  irModelos: "Ir a modelos",
  noEncontrado: "Ese modelo ya no está disponible.",
  modelo: "Modelo",
  tipo: "Tipo",
  campos: "Campos con datos",
  sinDatos: "Sin datos",
  sinImagen: "Sin imagen",
  pasarMouse: "Pasa el mouse para ver los datos",
  sinClientes: "Sin clientes registrados",
  clientes: "Clientes",
  exportarTodo: "Exportar PDF general",
  generandoTodo: "Generando PDF…",
  sinFichas: "No hay fichas para exportar.",
  tituloCatalogo: "Catálogo de especificaciones técnicas",
  subCatalogo: "DTS Autoservicio SpA · Uso interno",
  indice: "Índice de equipos",
  archivoCatalogo: "Especificaciones_tecnicas_DTS.pdf",
  colN: "N°",
  colModelo: "Modelo",
  colTipo: "Tipo",
  colClientes: "Clientes",
  imagen: "Imagen referencial",
  ayudaImagen: "PNG, JPG o WEBP. Se reduce automáticamente.",
  quitarImagen: "Quitar imagen",
  imagenInvalida: "El archivo no es una imagen válida.",
  imagenPesada: "No se pudo reducir la imagen. Prueba con otra.",
  sinModelo: "Sin modelo",
  abrir: "Abrir",
  pdf: "PDF",
  volver: "Volver a especificaciones",
  guardadoTitulo: "Ficha actualizada",
  volverBoton: "Volver a especificaciones",
  guardar: "Guardar",
  guardarPdf: "Guardar y descargar PDF",
  descargarPdf: "Descargar PDF",
  tituloPdf: "Especificaciones técnicas",
  usoInterno: "Uso interno",
  generado: "Documento generado el",
  ficha: "Ficha técnica"
};

/**
 * @param {number} llenos
 * @param {number} total
 * @returns {string}
 */
/** Filas del recuadro al pasar el mouse, en el orden de la planilla. */
export const FILAS_VISTA = [
  { id: "nombre", etiqueta: "Modelo", siempre: true },
  { id: "computador", etiqueta: "Computador", siempre: true },
  { id: "sistemaOperativo", etiqueta: "Sistema operativo" },
  { id: "pantalla", etiqueta: "Pantalla", siempre: true },
  { id: "tactil", etiqueta: "Táctil" },
  { id: "audio", etiqueta: "Audio" },
  { id: "conectores", etiqueta: "Conectores", siempre: true },
  { id: "impresora", etiqueta: "Impresora", siempre: true },
  { id: "conectividad", etiqueta: "Conectividad", siempre: true },
  { id: "alimentacion", etiqueta: "Fuente de Alimentación", siempre: true },
  { id: "consumo", etiqueta: "Consumo", siempre: true },
  { id: "dimensiones", etiqueta: "Dimensiones", siempre: true },
  { id: "peso", etiqueta: "Peso", siempre: true },
  { id: "accesorios", etiqueta: "Accesorios", siempre: true }
];

/**
 * Clientes en una línea corta, con «y N más» si son muchos.
 * @param {string[]} clientes
 * @param {number} visibles
 * @returns {string}
 */
export function textoClientes(clientes, visibles) {
  const lista = clientes || [];
  if (!lista.length) return ET.sinClientes;
  const primeros = lista.slice(0, visibles).join(", ");
  const resto = lista.length - visibles;
  return resto > 0 ? `${primeros} y ${resto} más` : primeros;
}

/**
 * @param {number} total
 * @returns {string}
 */
export function textoTotalEquipos(total) {
  return `${total} equipos`;
}

/**
 * @param {string} nombre
 * @returns {string}
 */
export function textoFoto(nombre) {
  return `Imagen de ${nombre}. ${ET.pasarMouse}.`;
}

/**
 * @param {string} nombre
 * @returns {string}
 */
export function textoFichaGuardada(nombre) {
  return `Se guardó la ficha técnica de ${nombre}.`;
}
