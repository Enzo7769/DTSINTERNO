/**
 * Propósito: Datos de referencia de «Resumen costos Hardware.xlsx».
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: ninguna
 *
 * Los nombres de modelo se unificaron para que cada costo apunte a
 * un modelo del catálogo (p. ej. «T22 ELQUI» → «T22-M40 Elqui»).
 */

const CONECTORES_BASE = "Conector de poder C14\nConector de red RJ45";
const RED_TOTEM =
  "Bluetooth 5.0\nWiFi 2,4 + 5,8 GHz\nEthernet 1000 Mbps LAN";
const PODER_NACIONAL =
  "Cable de poder\nEnchufe nacional o italiano\n220 V 50 Hz";
const PODER_C13 = "Cable de poder C13 a nacional 220 V 50 Hz";
const IMPRESORA_T20 = "Impresora térmica Epson TM-T20III L 80 mm";
const DIM_ANDES =
  "Base: 41,5 x 45 cm; altura: 140 cm (versión inclusiva)";
const PESO_ANDES = "30 kg (versión movilidad reducida)";
const ACC_BASE = "Llave\nCable de poder\nCable de red";
const SOPORTE_VISOR = "Soporte de pared o cielo\nCable de poder\n"
  + "Cable de red";
const CPU_N5095 = "CPU Intel Celeron N5095 (2,0 a 2,9 GHz)\n"
  + "RAM 8 GB\nAlmacenamiento 128 GB / 256 GB";

/** @type {object[]} */
export const PLANILLA_MODELOS = [
  {
    tipo: "totem",
    nombre: "T27 Cañete",
    otroNombre: "T22 - Arauco (versión Essbio 2025)",
    clientes: ["Enjoy", "Essbio", "Essbio 2025"]
  },
  { tipo: "totem", nombre: "Patagonia", clientes: ["Walmart"] },
  {
    tipo: "totem",
    nombre: "T22 Dalcahue",
    clientes: ["DTS - Equipo base (China)", "Servipag"],
    ficha: {
      computador: "Beelink Mini PC EQI12\nIntel Core i3-1220P "
        + "(12.ª generación)\nRAM 16 GB DDR4\nAlmacenamiento 500 GB",
      sistemaOperativo: "Windows 11 Pro\nAntivirus Kaspersky",
      pantalla: "Módulo de pantalla + touch M21HGK-L30 (original)",
      impresora: "Impresora térmica Epson TM-m30II",
      conectividad: "USB 3.0 (4 puertos)\nBluetooth 5.0\nWiFi\n"
        + "Ethernet 1000 Mbps LAN",
      conectores: CONECTORES_BASE,
      alimentacion: PODER_NACIONAL,
      consumo: "48 W",
      dimensiones: "Alto 177 cm; base 40 x 48 cm",
      peso: "75 kg",
      audio: "Parlantes / módulo de audio",
      accesorios: ACC_BASE
    }
  },
  {
    tipo: "totem",
    nombre: "T22-M40 Elqui",
    clientes: [
      "DTS - Equipo base", "Municipalidad de Vitacura",
      "Cesfam Raúl Yazigi", "Cesfam Santa Anita",
      "Cesfam Carlos Avendaño", "Hospital Curacaví", "Cesfam Andes"
    ],
    ficha: {
      computador: "CPU Intel Core i5 (4 núcleos)\nRAM 8 GB DDR4\n"
        + "Almacenamiento 240 GB SSD SATA III",
      sistemaOperativo: "Windows 11 Pro",
      pantalla: "LCD 21,5\" 1920 x 1080",
      tactil: "Capacitivo de 10 puntos",
      impresora: IMPRESORA_T20,
      conectores: CONECTORES_BASE,
      alimentacion: PODER_C13,
      consumo: "Típico 78,32 W\nMáximo 241,25 W",
      dimensiones: "Alto 1,63 m; base 0,6 x 0,4 m",
      peso: "76 kg",
      accesorios: "Llave\nCable de poder\nCable de red\nAntena WiFi\n"
        + "Pernos de anclaje"
    }
  },
  {
    tipo: "totem",
    nombre: "T15-M02 Andes",
    clientes: ["DTS", "Puerto Montt", "Quirihue"],
    ficha: {
      computador: CPU_N5095,
      sistemaOperativo: "Windows 11 Pro",
      pantalla: "LCD 15,6\" 1920 x 1080 (FHD)",
      impresora: IMPRESORA_T20,
      conectividad: RED_TOTEM,
      conectores: CONECTORES_BASE,
      alimentacion: "Cable de poder\nC13 a nacional o Magic\n220 V 50 Hz",
      consumo: "48 W",
      dimensiones: DIM_ANDES,
      peso: PESO_ANDES,
      accesorios: ACC_BASE
    }
  },
  {
    tipo: "totem",
    nombre: "T15-M03 Andes",
    clientes: ["DTS - Equipo base con UPS"],
    notas: "Variante del T15-M02 Andes que incluye UPS.",
    ficha: {
      computador: CPU_N5095,
      sistemaOperativo: "Windows 11 Pro",
      pantalla: "LCD 15,6\" 1920 x 1080 (FHD)",
      impresora: IMPRESORA_T20,
      conectividad: RED_TOTEM,
      conectores: CONECTORES_BASE,
      alimentacion: PODER_NACIONAL,
      consumo: "48 W",
      dimensiones: DIM_ANDES,
      peso: PESO_ANDES,
      accesorios: `${ACC_BASE}\nUPS Forza SL Series`
    }
  },
  { tipo: "totem", nombre: "T22-M42 Aconcagua", clientes: ["Las Condes"] },
  {
    tipo: "totem",
    nombre: "T22-M41 Aconcagua",
    clientes: ["DTS - Equipo base", "Las Condes"],
    ficha: {
      computador: "AMD Ryzen 7 6800U (2,7 a 4,7 GHz, 8C/16T, "
        + "L2 4 MB, L3 16 MB)\nRAM 24 GB / 32 GB DDR4\n"
        + "Almacenamiento 500 GB / 1 TB",
      sistemaOperativo: "Windows 11 Pro",
      pantalla: "Monitor LCD 22\" + touch",
      impresora: "Impresora térmica Epson TM-T88V",
      conectividad: RED_TOTEM,
      conectores: CONECTORES_BASE,
      alimentacion: PODER_NACIONAL,
      consumo: "48 W",
      dimensiones: DIM_ANDES,
      peso: PESO_ANDES,
      accesorios: ACC_BASE
    }
  },
  {
    tipo: "totem",
    nombre: "P-19 Austral",
    clientes: ["Corp. Des. Social Providencia"]
  },
  {
    tipo: "totem",
    nombre: "Mercadata",
    clientes: ["Mercadata"],
    notas: "Tótem de consulta de precio."
  },
  { tipo: "locker", nombre: "Paine", otroNombre: "E-Locker",
    clientes: ["Tricot"] },
  { tipo: "locker", nombre: "Modular Gery", otroNombre: "E-Locker",
    clientes: ["Base"] },
  {
    tipo: "visor",
    nombre: "Visor Cumbre 32\"",
    clientes: ["Puerto Montt", "Hospital Curacaví", "Cesfam Andes"],
    notas: "Ficha técnica de la versión Samsung.",
    ficha: {
      pantalla: "32\" HD (1366 x 768)",
      sistemaOperativo: "Smart Tizen",
      conectividad: "WiFi\nEthernet\nHDMI",
      audio: "Parlantes estéreo 10 W en total",
      conectores: `${CONECTORES_BASE}\n1 x USB-A\n2 x HDMI`,
      alimentacion: PODER_C13,
      consumo: "Típico 80 W\nMáximo 120 W",
      dimensiones: "732,9 x 440,3 x 78,5 mm",
      peso: "8,8 kg",
      accesorios: `${SOPORTE_VISOR}\nControl remoto`
    }
  },
  {
    tipo: "visor",
    nombre: "Visor Cumbre 43\"",
    clientes: ["Puerto Montt", "Quirihue"],
    notas: "Ficha técnica de la versión LG.",
    ficha: {
      pantalla: "IPS 43\" UHD, uso 16/7",
      sistemaOperativo: "LG webOS",
      conectividad: "RS232C\nWiFi\nEthernet\nHDMI",
      audio: "Parlantes estéreo 20 W en total",
      conectores: CONECTORES_BASE,
      alimentacion: PODER_C13,
      consumo: "Típico 80 W\nMáximo 120 W",
      dimensiones: "96,7 x 56,4 x 5,71 cm",
      peso: "8,8 kg",
      accesorios: SOPORTE_VISOR
    }
  },
  {
    tipo: "visor",
    nombre: "Visor Cumbre 50\"",
    estado: "descontinuado",
    clientes: [],
    notas: "Versión LG profesional descontinuada."
  },
  {
    tipo: "visor",
    nombre: "Visor Cumbre 65\"",
    clientes: [],
    notas: "Ficha técnica de la versión Samsung.",
    ficha: {
      pantalla: "65\" UHD 4K (3840 x 2160)",
      sistemaOperativo: "One UI Tizen",
      conectividad: "WiFi\nEthernet\nBluetooth",
      audio: "Parlantes estéreo 20 W",
      conectores: `${CONECTORES_BASE}\n1 x USB-A\n3 x HDMI`,
      alimentacion: PODER_C13,
      consumo: "Máximo 175 W",
      dimensiones: "1444,1 x 831,2 x 76,8 mm",
      peso: "14,5 kg",
      accesorios: `${SOPORTE_VISOR}\nControl remoto`
    }
  },
  {
    tipo: "componente",
    nombre: "Beelink T5",
    otroNombre: "Mini PC",
    clientes: ["Puerto Montt", "Quirihue"],
    ficha: {
      computador: "CPU Intel Celeron N4020\nRAM 4 GB DDR4\n"
        + "Almacenamiento 64 GB",
      sistemaOperativo: "Windows 11 Pro",
      conectores: "HDMI 2.0\nLAN (RJ-45)\nUSB 3.0",
      alimentacion: "Fuente de alimentación 220 V a 5 V",
      consumo: "Típico 10 W\nMáximo 25 W",
      dimensiones: "Alto 2 cm; base 10 x 10 cm",
      peso: "0,3 kg",
      accesorios: "Fuente de alimentación\nCable de red\nCable HDMI"
    }
  }
];

/**
 * @param {string} linea
 * @param {string} tipo
 * @param {string} modelo
 * @param {string} configuracion
 * @param {number} monto
 * @param {string} referencia
 * @param {string} [observaciones]
 * @returns {object}
 */
function costo(linea, tipo, modelo, configuracion, monto, referencia,
  observaciones) {
  return {
    linea,
    tipoEquipo: tipo,
    modelo,
    configuracion,
    moneda: "USD",
    costo: String(monto),
    referencia,
    observaciones: observaciones || ""
  };
}

const REF_CANETE = "T27 Cañete Costos Operacionales";
const REF_VISOR = "Visor Cumbre Costos Operacionales";

/** @type {object[]} */
export const PLANILLA_COSTOS = [
  costo("autoservicio", "totem", "T27 Cañete", "Enjoy", 3840.69,
    REF_CANETE),
  costo("autoservicio", "totem", "T27 Cañete", "Essbio", 4017.62,
    REF_CANETE),
  costo("autoservicio", "totem", "T27 Cañete", "Essbio 2025", 4105.66,
    REF_CANETE),
  costo("autoservicio", "totem", "T22-M41 Aconcagua",
    "DTS - Equipo base", 1277.2, "T22 Aconcagua Costos Operacionales"),
  costo("cleverq", "totem", "T22-M40 Elqui", "DTS - Equipo base",
    1271.77, "The Real Costo Operacional Base T22 Elqui.xlsx"),
  costo("cleverq", "totem", "T15-M02 Andes", "DTS - Equipo base",
    866.04, "T15 Andes Costos Operacionales"),
  costo("cleverq", "totem", "T22-M42 Aconcagua", "Las Condes", 985.86,
    "T15 Andes Costos Operacionales",
    "En la planilla original figuraba como «T22-M42 ANDES»."),
  costo("cleverq", "visor", "Visor Cumbre 32\"", "LG (no profesional)",
    354.68, REF_VISOR),
  costo("cleverq", "visor", "Visor Cumbre 32\"",
    "Samsung (no profesional)", 375.55, REF_VISOR),
  costo("cleverq", "visor", "Visor Cumbre 43\"", "LG (no profesional)",
    469.51, REF_VISOR),
  costo("cleverq", "visor", "Visor Cumbre 50\"",
    "LG descontinuado (profesional)", 599.94, REF_VISOR),
  costo("cleverq", "visor", "Visor Cumbre 65\"", "Samsung", 667.19,
    REF_VISOR),
  costo("cleverq", "totem", "T22-M41 Aconcagua", "Las Condes", 1125.68,
    "The Real Costo Operacional Base T22 Aconcagua.xlsx"),
  costo("autoservicio", "totem", "T22 Dalcahue", "Servipag", 1172.68,
    "The Real Costo Operacional Base T22 Dalcahue")
];
