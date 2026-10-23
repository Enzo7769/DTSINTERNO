/**
 * Propósito: Secciones e ítems de la cartilla de ruta.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: ninguna
 *
 * Tipos de sección:
 * - fija: todos los ítems aparecen siempre.
 * - seleccionable: el usuario marca qué ítems lleva el equipo.
 * - obligatoria: hay que completar el apartado para guardar. Un ítem
 *   con opcional: true se marca solo si el equipo lo usa.
 * - agregar: la sección suma filas libres con el botón +.
 * La numeración sigue la cartilla en papel.
 */

export const SECCIONES_CARTILLA = [
  {
    id: "metalmecanica",
    banda: "Pre-producción",
    numero: "1",
    titulo: "Metalmecánica y piezas (Mecánica)",
    tipo: "fija",
    items: [
      {
        id: "recepcionChasis",
        n: "1.1",
        nombre: "Recepción de chasis y piezas (Mecánica)"
      }
    ]
  },
  {
    id: "recopilar",
    banda: "",
    numero: "2",
    titulo: "Recopilar información (Integraciones)",
    tipo: "fija",
    items: [
      {
        id: "busquedaInformacion",
        n: "2.1",
        nombre: "Búsqueda de información (Integraciones)"
      }
    ]
  },
  {
    id: "perifericos",
    banda: "Periféricos",
    numero: "3",
    titulo: "Periféricos (Integración)",
    tipo: "seleccionable",
    agregar: true,
    items: [
      { id: "perPantalla", nombre: "Pantalla" },
      {
        id: "perMiniPc",
        nombre: "Mini PC",
        extras: [
          { id: "procesador", etiqueta: "Procesador" },
          { id: "ram", etiqueta: "RAM" },
          { id: "almacenamiento", etiqueta: "Almacenamiento" }
        ]
      },
      { id: "perImpresora", nombre: "Impresora" },
      { id: "perLectorCodigo", nombre: "Lector de código de barras" },
      { id: "perLectorTarjeta", nombre: "Lector de tarjetas / RFID" },
      { id: "perPinpad", nombre: "Pinpad / POS" },
      { id: "perCamara", nombre: "Cámara" },
      { id: "perParlantes", nombre: "Parlantes" },
      { id: "perTeclado", nombre: "Teclado" },
      { id: "perMouse", nombre: "Mouse" },
      { id: "perLectorHuella", nombre: "Lector de huella" },
      { id: "perEscaner", nombre: "Escáner de documentos" },
      { id: "perRouter", nombre: "Router / switch" },
      { id: "perUps", nombre: "UPS" }
    ]
  },
  {
    id: "armado",
    banda: "Armado",
    numero: "4",
    titulo: "Armado, ruteo y conexionado",
    tipo: "fija",
    items: [
      {
        id: "montajeDispositivos",
        n: "4.1",
        nombre: "Montaje de dispositivos y ruteo de módulos "
          + "(Integración)"
      }
    ]
  },
  {
    id: "sistema",
    banda: "Configuraciones del sistema",
    numero: "6",
    titulo: "Configuraciones del sistema (Integración)",
    tipo: "fija",
    obligatoria: true,
    items: [
      {
        id: "biosEncendido",
        n: "6.1",
        nombre: "BIOS encendido automático"
      }
    ]
  },
  {
    id: "testing",
    banda: "Registro de datos",
    numero: "7",
    titulo: "Testing y registros",
    tipo: "seleccionable",
    items: [
      { id: "tesTesting", nombre: "Testing" },
      { id: "tesWindows", nombre: "Activación de Windows 11 Pro" },
      { id: "tesMac", nombre: "MAC" },
      { id: "tesAnydesk", nombre: "AnyDesk" },
      { id: "tesInstanweb", nombre: "Instanweb" },
      { id: "tesImpresion", nombre: "Prueba de impresión" },
      { id: "tesTouch", nombre: "Prueba de pantalla táctil" },
      {
        id: "tesOtro",
        nombre: "Otro registro",
        nombreLibre: true
      }
    ]
  },
  {
    id: "cliente",
    banda: "Configuraciones del cliente",
    numero: "9",
    titulo: "Configuraciones del cliente (según manual o ficha "
      + "de configuración)",
    tipo: "seleccionable",
    obligatoria: true,
    columnaObs: "Valores de configuración",
    items: [
      { id: "cliIp", nombre: "IP", formato: "ip" },
      { id: "cliMask", nombre: "MASK", formato: "ip" },
      { id: "cliGw", nombre: "GW", formato: "ip" },
      { id: "cliDns1", nombre: "DNS1", formato: "ip" },
      { id: "cliDns2", nombre: "DNS2", formato: "ip", opcional: true },
      { id: "cliHostname", nombre: "Hostname" },
      { id: "cliProxy", nombre: "Proxy", opcional: true },
      {
        id: "cliOtro",
        nombre: "Otra configuración",
        nombreLibre: true
      }
    ]
  },
  {
    id: "mecanica",
    banda: "",
    numero: "10",
    titulo: "Mecánica y cierre",
    tipo: "fija",
    saltoPdf: true,
    items: [
      { id: "terminaciones", n: "10.1", nombre: "Terminaciones (Mecánica)" },
      {
        id: "encuadre",
        n: "10.2",
        nombre: "Encuadre y cierre (Mecánica)"
      },
      {
        id: "inspeccionGeneral",
        n: "10.3",
        nombre: "Inspección general del equipo (Calidad)"
      }
    ]
  },
  {
    id: "revisionFinal",
    banda: "Revisión final",
    numero: "11",
    titulo: "Certificación de recepción conforme y verificación "
      + "de entrega",
    tipo: "fija",
    items: [
      { id: "partesMoviles", n: "11.1", nombre: "Partes móviles (Calidad)" },
      {
        id: "piezasAcrilicas",
        n: "11.2",
        nombre: "Piezas acrílicas y adicionales (Calidad)"
      },
      { id: "limpieza", n: "11.3", nombre: "Limpieza (Calidad)" },
      { id: "pantallaCalidad", n: "11.4", nombre: "Pantalla (Calidad)" },
      { id: "namePlate", n: "11.5", nombre: "Name plate (Calidad)" },
      {
        id: "tarjetaServible",
        n: "11.6",
        nombre: "Tarjeta servible (Calidad)"
      }
    ]
  },
  {
    id: "externos",
    banda: "Elementos externos",
    numero: "12",
    titulo: "Certificación de elementos externos",
    tipo: "fija",
    items: [
      { id: "cablePoder", n: "12.1", nombre: "Cable de poder" },
      { id: "cableRed", n: "12.2", nombre: "Cable de red" },
      { id: "llaveDts", n: "12.3", nombre: "Llave y llavero DTS" }
    ]
  }
];

export const PREFIJO_LIBRE = "perLibre-";

/**
 * Id de un periférico agregado con el botón +.
 * @param {string} id
 * @returns {boolean}
 */
export function idLibreValido(id) {
  return /^perLibre-\d{1,4}$/.test(String(id || ""));
}

/**
 * @param {string[]} ids
 * @returns {string[]}
 */
export function ordenarLibres(ids) {
  return [...ids].sort((a, b) => numeroLibre(a) - numeroLibre(b));
}

/**
 * @param {string} id
 * @returns {number}
 */
function numeroLibre(id) {
  return Number(String(id).slice(PREFIJO_LIBRE.length)) || 0;
}

export const FINALIZACION = [
  { id: "entregadoPor", n: "1.0", nombre: "Equipo terminado entregado por" },
  { id: "aprobadoPor", n: "1.1", nombre: "Equipo aprobado por" },
  { id: "recibidoPor", n: "1.2", nombre: "Equipo recibido conforme por" }
];

/**
 * Lista plana de ítems con su sección.
 * @returns {{item: object, seccion: object}[]}
 */
export function itemsCartilla() {
  const lista = [];
  SECCIONES_CARTILLA.forEach((seccion) => {
    seccion.items.forEach((item) => {
      lista.push({ item, seccion });
    });
  });
  return lista;
}

/**
 * Número que se muestra para un ítem seleccionable según su orden.
 * @param {object} seccion
 * @param {number} indice
 * @returns {string}
 */
export function numeroItem(seccion, indice) {
  const item = seccion.items[indice];
  if (item && item.n) return item.n;
  return `${seccion.numero}.${indice + 1}`;
}
