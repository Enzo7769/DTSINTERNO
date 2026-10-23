/**
 * Propósito: Textos visibles, errores y límites de la interfaz.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: ninguna
 */

export const MSG = {
  tituloDocumento: "Checklist de salida | DTS",
  tituloListado: "Checklists de salida | DTS",
  tituloFormulario: "Nuevo checklist | DTS",
  tituloEdicion: "Editar checklist | DTS",
  ok: "OK",
  marcaMalo: "Mal",
  marcaSi: "Sí",
  marcaNo: "No",
  colMarca: "Marca",
  entrar: "Entrar",
  entrando: "Entrando…",
  salir: "Cerrar sesión",
  contraerMenu: "Contraer menú",
  abrirMenu: "Abrir menú",
  configIncompleta:
    "Falta Firebase. Completa web/js/config.js, activa el "
    + "acceso por correo y crea el perfil admin.",
  firebaseFallo:
    "No se pudo conectar con Firebase. Revisa la "
    + "configuración y la red.",
  accesoDenegado:
    "Este usuario no tiene perfil de administrador.",
  uidAyuda:
    "En Firestore crea el documento usuarios/{uid} "
    + "con el campo rol = admin.",
  correoInvalido: "Ingresa un correo válido.",
  claveCorta: "La contraseña es demasiado corta.",
  credenciales: "Correo o contraseña incorrectos.",
  muchosIntentos:
    "Demasiados intentos. Espera un minuto e inténtalo "
    + "de nuevo.",
  bloqueoLogin: "Acceso bloqueado un momento por intentos.",
  errorRed: "Sin conexión. Revisa la red e inténtalo de nuevo.",
  errorPermiso: "No tienes permiso para esta operación.",
  errorGenerico: "No se pudo completar la operación.",
  errorPdf:
    "No se pudo armar el PDF. Se abrirá la ventana de "
    + "impresión.",
  generandoPdf: "Generando PDF…",
  guardando: "Guardando…",
  guardado: "Checklist guardado.",
  creadoTitulo: "Checklist creado",
  actualizadoTitulo: "Checklist actualizado",
  volverListado: "Volver al listado",
  columnaNumero: "N°",
  eliminado: "Checklist eliminado.",
  confirmarEliminar:
    "Se eliminará este checklist. Esta acción no se "
    + "puede deshacer.",
  cargando: "Cargando registros…",
  sinResultados: "No hay checklists con esos filtros.",
  sinGuardar: "Borrador todavía no guardado",
  registro: "Registro",
  faltaProyecto: "Indica el proyecto o la licitación.",
  faltaCliente: "Indica el cliente o destino.",
  faltaTecnico: "Indica el técnico responsable.",
  faltaSerie: "Indica el número de serie.",
  faltaMac:
    "Indica la MAC del equipo. Ejemplo: AA:BB:CC:DD:EE:FF.",
  faltaIp: "Indica la IP del equipo. Ejemplo: 192.168.1.10.",
  faltaFechaInspeccion: "Indica una fecha de inspección válida.",
  faltaFechaSalida: "Indica una fecha de salida válida.",
  macInvalida:
    "La MAC no tiene un formato válido: son 6 pares de 0-9 o A-F. "
    + "Ejemplo: AA:BB:CC:DD:EE:FF.",
  ipInvalida:
    "La IP no es válida: son 4 números de 0 a 255 separados por "
    + "punto. Ejemplo: 192.168.1.10.",
  inspeccionFutura: "La fecha de inspección no puede ser posterior a hoy.",
  salidaAntes:
    "La fecha de salida no puede ser anterior a la de inspección.",
  confirmarSerieDuplicada:
    "Ya hay otro checklist con este número de serie. ¿Guardar igual?",
  faltaEstado: "Selecciona el estado de evaluación.",
  noAprobado:
    "Solo puedes aprobar si todos los ítems están en OK.",
  observacionesRechazo:
    "Si rechazas la salida, escribe el motivo "
    + "(mínimo 10 caracteres).",
  faltaFirma: "Firma con el nombre del técnico responsable.",
  extraObligatorio: "complétalo si marcas el ítem como OK.",
  firmaGrande: "La firma es demasiado pesada. Limpia y repite.",
  serieDuplicada:
    "Ya existe un checklist con esta serie. Puedes "
    + "continuar si es una nueva salida.",
  noEncontrado: "Ese checklist ya no está disponible.",
  marcarSeccion: "Marcar sección",
  marcarTodo: "Marcar todo OK",
  responderPregunta: "Falta que respondas Sí o No en:",
  limpiarMarcas: "Limpiar marcas",
  limpiarFirma: "Limpiar firma",
  guardar: "Guardar",
  guardarPdf: "Guardar y descargar PDF",
  descargarPdf: "Descargar PDF",
  volver: "Volver al listado",
  nuevo: "Nuevo checklist",
  editar: "Editar checklist",
  registros: "registros",
  limpiarFiltros: "Limpiar filtros",
  abrir: "Abrir",
  eliminar: "Eliminar",
  pdf: "PDF",
  sugerido: "Sugerido",
  avance: "Ítems OK",
  aprobado: "Aprobado para salida",
  rechazado: "Rechazado / requiere ajustes",
  todos: "Todos",
  proximo: "Próximamente",
  notaCalidad:
    "La firma de control de calidad puede completarse "
    + "después.",
  documentoGenerado: "Documento generado el",
  borradorPdf: "Borrador sin guardar",
  fallaInicio: "No se pudo abrir el panel.",
  vistaPrevia: "Vista previa local (no se guarda en Firebase).",
  demoEnlace: "Ver vista previa en este equipo",
  tituloPdf: "Checklist de salida de equipos hardware",
  subtituloPdf:
    "DTS Autoservicio SpA | Control de calidad y salida "
    + "a terreno",
  proyecto: "Proyecto / licitación",
  fechaInspeccion: "Fecha de inspección",
  cliente: "Cliente / destino",
  tecnico: "Técnico responsable",
  serie: "Número de serie",
  mac: "MAC del equipo",
  ip: "IP del equipo",
  fechaSalida: "Fecha de salida",
  estado: "Estado de evaluación",
  observaciones: "Observaciones adicionales",
  firmaTecnico: "Firma técnico responsable (DTS)",
  firmaCalidad: "Firma control de calidad / recepción",
  colDetalle: "Verificación",
  seccionDatos: "1. Información del proyecto y registro",
  seccionCierre: "Control de cierre y aprobación de salida"
};

export const ETIQUETA_ESTADO = {
  aprobado: MSG.aprobado,
  rechazado: MSG.rechazado
};

export const URL_HTML2PDF =
  "https://cdnjs.cloudflare.com/ajax/libs/"
  + "html2pdf.js/0.10.1/html2pdf.bundle.min.js";

export const MODULOS = [
  {
    id: "checklist-salida",
    etiqueta: "Checklist de salida",
    rutas: ["/listado", "/checklist"],
    destino: "#/listado",
    habilitado: true
  },
  {
    id: "cartilla-ruta",
    etiqueta: "Cartilla de ruta",
    rutas: ["/cartillas", "/cartilla"],
    destino: "#/cartillas",
    habilitado: true
  },
  {
    id: "costos-hardware",
    etiqueta: "Costos hardware",
    habilitado: true,
    hijos: [
      {
        id: "base-costos",
        etiqueta: "Base de costos HW",
        rutas: ["/costos", "/costo"],
        destino: "#/costos"
      },
    ]
  },
  {
    id: "modelos-hw",
    etiqueta: "Modelos",
    rutas: ["/modelos", "/modelo"],
    destino: "#/modelos",
    habilitado: true
  },
  {
    id: "ficha-config",
    etiqueta: "Ficha de configuración",
    habilitado: true,
    hijos: [
      {
        id: "ficha-editor",
        etiqueta: "Editar ficha",
        rutas: ["/ficha"],
        destino: "#/ficha"
      },
      {
        id: "fichas-envio",
        etiqueta: "Fichas de licitaciones",
        rutas: ["/fichas-envio", "/ficha-envio"],
        destino: "#/fichas-envio"
      }
    ]
  },
  {
    id: "especificaciones-hw",
    etiqueta: "Especificaciones técnicas",
    rutas: ["/especificaciones", "/especificacion"],
    destino: "#/especificaciones",
    habilitado: true
  },
  {
    id: "recepcion",
    etiqueta: "Recepción de equipos",
    rutas: [],
    habilitado: false
  },
  {
    id: "usuarios",
    etiqueta: "Usuarios",
    rutas: [],
    habilitado: false
  }
];

export const LIMITES = {
  proyecto: 160,
  cliente: 160,
  tecnico: 120,
  serie: 80,
  mac: 17,
  ip: 15,
  observaciones: 2000,
  firma: 120,
  claveMin: 6
};

/**
 * Arma el texto de un dato extra obligatorio.
 * @param {string} etiqueta
 * @returns {string}
 */
export function mensajeExtra(etiqueta) {
  return `${etiqueta}: ${MSG.extraObligatorio}`;
}

/**
 * @param {number} numero
 * @returns {string}
 */
export function mensajeCreado(numero) {
  return `El checklist N° ${numero} se creó correctamente.`;
}

/**
 * @param {number} numero
 * @returns {string}
 */
export function mensajeActualizado(numero) {
  return `El checklist N° ${numero} se actualizó correctamente.`;
}
