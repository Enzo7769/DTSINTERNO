/**
 * Propósito: Componentes sugeridos por categoría en la hoja de
 *   costeo. Cada fila es [tipo, componente, descripción], tal como
 *   en las pestañas de «The Real Costo Operacional».
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-02
 * Dependencias: ninguna
 *
 * Para agregar un componente fijo, suma una fila en su categoría.
 * Los componentes puntuales se escriben a mano en el formulario.
 */

/** @type {Record<string, string[][]>} */
export const COMPONENTES = {
  dispositivos: [
    ["Módulo PC", "Placa Madre", "ASUS PRIME H510M-E"],
    ["Módulo PC", "Placa Madre", "ASUS PRIME H510M-K"],
    ["Módulo PC", "Procesador", "Intel I5 10400"],
    ["Módulo PC", "RAM", "Kingston FURY BEAST 8GB 3200MHz DDR4"],
    ["Módulo PC", "Disco Sólido", "KINGSTON A400 SSD 120GB"],
    [
      "Mini PC",
      "Mini PC Beelink EQR6",
      "AMD 6600H 16G/24GB - 500GB/1TB - Max Frec. 4,5 Ghz"
    ],
    [
      "Mini PC",
      "Beelink EQi12 12450H",
      "12th Gen Intel Core i5 12450H Max Turbo Frecuencia 4,4 Ghz"
    ],
    [
      "Módulo Pantalla 21,5\"",
      "Pantalla + Touch 21,5\"",
      "21.5 inch AUO IPS Panel / M270HVN02_V1 / GT-TM27"
    ],
    [
      "Módulo Pantalla 24\"",
      "Pantalla + Touch 24\"",
      "GreenTouch alta calidad 23,6 pulgadas pantalla táctil Lcd Android " +
      "Monitor con USB"
    ],
    [
      "Módulo Pantalla 27\"",
      "Pantalla + Touch 27\"",
      "27 inch AUO IPS Panel / M270HVN02_V1 / GT-TM27 (Greentouch)"
    ],
    [
      "Módulo Pantalla 10\"",
      "Pantalla + Touch 10\"",
      "Pantalla LCD IPS de 10.1 Pulgadas, Pantalla Táctil Capacitiva, " +
      "Resolución de 1280 * 800"
    ],
    ["Periférico", "Impresora BK-L216", "Imp. térmica SNBC BK-L216 A4, carta."],
    ["Periférico", "Impresora TICKET", "Impresora Térmica TMT20iii"],
    ["Periférico", "Impresora TICKET", "EPSON TM-T88V"],
    [
      "Periférico",
      "Impresora TICKET",
      "Star TUP900, 39469200 (TUP992-24) (c/presentador) 547 EU"
    ],
    ["Periférico", "Impresora TICKET", "STAR MICRONICS, TSP1045U-24 GRY"],
    [
      "Periférico",
      "Microcontrolador",
      "Arduino Nano V3.0 Comp. USB Tipo-C CH340 (SKU 207C2)"
    ],
    [
      "Periférico",
      "Shield Microcontrolador",
      "Tarjeta Expansión para Arduino NANO (SKU 605H1)"
    ],
    [
      "Periférico",
      "Sensor de Proximidad",
      "Sensor de Proximidad Infrarrojo E18-D80NK"
    ],
    [
      "Periférico",
      "Kit de audio y Amplif.",
      "Kit de audio + Amplificador PAM8610 10w x 2 con Potenciómetro"
    ],
    ["Periférico", "Parlantes", "Parlantes 4 Ohm 3 Watts 3\""],
    ["Periférico", "Micrófono", "Micrófono Trust Primo 21674 Condensador"],
    [
      "Periférico",
      "Micrófono",
      "Mic Condensador Mackie EM-91C (Cancelación por diseño)"
    ],
    [
      "Periférico",
      "Micrófono",
      "Mic. Inalámbrico Ultra Compacto y Portable Boya BY-V10, 2.4GHz, " +
      "Conector USB-C (Cancelación electrónica)"
    ],
    ["Periférico", "Panel Frontal de Audio", "Tarjeta, CABLE - 4775"],
    [
      "Periférico",
      "Panel Frontal de Audio",
      "USB 4 secciones, conmutador, 3,5mm, in/out estéreo 2 en 1"
    ],
    [
      "Periférico",
      "Altavoces Focalizados",
      "Parlante Componente Auto JBL 16 cm 300 watts"
    ],
    ["Periférico", "HUB USB", "HUB USB 3.0 4 Puertos UH4000 (Kensington)"],
    [
      "Periférico",
      "Adaptador WiFi-USB",
      "DWA-172. D-LINK 3dBi-fija 193mm 433/150mbps-2,4/5GHz 802.11ac USB " +
      "WIFI AC600"
    ],
    [
      "Periférico",
      "Cámara WEB",
      "Webcam Logitech C922 Pro Stream, Full HD 1080p USB"
    ],
    [
      "Periférico",
      "Cámara ojo de Pez",
      "ELP-cámara usb de ángulo WiFi de baja distorsión, 2MP, 125 grados, " +
      "1080P, OV2710, para ELP-USBFHD01M-H120 de automatización industrial"
    ],
    ["Periférico", "Scanner PDF", "HONEYWELL N5680SR"],
    [
      "Periférico",
      "Scanner PDF",
      "YHDAA Embedded Scanner USB TTL RS232 Reader 2D Qr"
    ],
    ["Periférico", "Lector de inserción", "CRT-288-K001-HEAY (CREATOR)"],
    ["Periférico", "Lector de Huella", "Digital Persona UareU 4500"],
    ["Periférico", "Lector sin contacto", "Lector NFC/CI Duali RFID Dragon"],
    [
      "Periférico",
      "Tarjeta de Video de 30GB",
      "ZOTAC Nvidia GeForce RTX 5090 SOLID, 32GB GDDR7"
    ],
    ["Periférico", "POS de Pago", "POS MercadoPago"],
    [
      "Potencia",
      "Alargador múltiple",
      "Alargador con interruptor 6 posiciones 1,5 m gris Bticino"
    ],
    ["Potencia", "Fuente PC", "Fuente de Poder Slim ATX 550W"],
    [
      "Potencia",
      "Isolator",
      "Aislador/filtro de voltaje HDCVI Dahua. (Código: PFM790)"
    ]
  ],
  arneses: [
    ["Arnés Botón", "Cable AWG 22 Rojo", "Cable para conectar el botón"],
    ["Arnés Botón", "Botón", "Botón encendido (pulsador)"],
    ["Arnés Botón", "Conector", "Housing Slim 2X1 2.54mm 71-253020"],
    [
      "Arnés Botón",
      "Terminal para conector Slim",
      "Terminal para conector Slim (DUPONT) 71-253000"
    ],
    [
      "Cable de alimentación General",
      "Conector Macho Poder 10A Chasis C14",
      "CONN AC RECEPT SCREW/SOLDER C14-)-M Qualtec"
    ],
    [
      "Cable de alimentación General",
      "Enchufe 2P+T hembra volante",
      "Enchufe Hembra Nacional Volante"
    ],
    [
      "Cable de alimentación General",
      "Cable de Alimentación",
      "Cable de Alimentación al C14"
    ],
    [
      "Cable de Poder Pantalla",
      "Cable de poder Pantalla",
      "Cable de poder nacional 1,8mt"
    ],
    [
      "Cable de Poder Fuente PC",
      "Cable Poder Fuente PC",
      "Cable de poder nacional, en ángulo"
    ],
    [
      "Cable de Poder Fuente TMT88V",
      "Cable de Poder Fuente TMT88-IV",
      "Cable de poder nacional 1,8mt"
    ],
    [
      "Cable de Poder Fuente Imp. Carta",
      "Cable de Poder Fuente Impresora Carta",
      "Cable de poder nacional 1,8mt"
    ],
    [
      "Cable de Poder Fuente Imp. Ticket",
      "Cable de Poder Fuente Imp. Ticket",
      "Cable de poder nacional 1,8mt"
    ],
    [
      "Arnés Micrófonos",
      "Cable Splitter 3.5 mm",
      "Cable Y de audio AV123-10780"
    ],
    [
      "Cable de audio auxiliar",
      "Cable Aux 3.5 mm",
      "Ugreen Jack 3.5mm Trenzado 1M Negro AV112"
    ],
    [
      "Cable alimentación Amplificadora",
      "Conector DC Macho 5,5 x 2,1 mm",
      "Conector volante"
    ],
    [
      "Cable alimentación Amplificadora",
      "Cable AWG 18 Amarillo",
      "Cable alimentación amplificadora TAC18YE"
    ],
    [
      "Cable alimentación Amplificadora",
      "Cable AWG 18 Negro",
      "Cable alimentación amplificadora TAC18YE"
    ],
    ["Arnés Sensor de Proximidad", "Pin Header 3x1", "Conector en línea 3X1"],
    [
      "Arnés Sensor de Proximidad",
      "Cable AWG 18 Rojo",
      "Rollo de Cable TAC 18AWG Rojo 100mts TAC18YE"
    ],
    [
      "Arnés Sensor de Proximidad",
      "Cable AWG 18 Negro",
      "Rollo de Cable TAC 18AWG Negro 100mts TAC18YE"
    ],
    [
      "Arnés Sensor de Proximidad",
      "Cable AWG 18 Amarillo",
      "Rollo de Cable TAC 18AWG Amarillo 100mts TAC18YE"
    ],
    [
      "Arnés Parlantes (X2)",
      "Cable AWG 18 Rojo",
      "Cable del parlante a la amplificadora TAC18YE"
    ],
    [
      "Arnés Parlantes (X2)",
      "Cable AWG 18 Negro",
      "Cable del parlante a la amplificadora TAC18YE"
    ],
    [
      "Arnés Parlantes (X2)",
      "Terminal de pino",
      "Conector del cable de parlante a la amplificadora"
    ],
    ["USB", "Extensión USB", "USB Type A - panel F to M (4 ft)"],
    ["USB", "USB Auxiliares", "USB Type A - panel F to M (4 ft)"],
    [
      "Extensión de Red",
      "Copla RJ45 Hembra",
      "COPLA RJ-45 H/H BLACK NW114 UGREEN"
    ],
    [
      "Arneses Red Interna",
      "Extensión RJ45 macho a hembra panel",
      "Cable RJ45 a la salida del equipo con RJ45 Hembra panel"
    ],
    [
      "Red Interna",
      "RJ45 Hembra de panel",
      "Conector RJ45 Hembra para chasis 2mt"
    ],
    [
      "Red Interna",
      "Conector RJ45 Macho",
      "Conector Rj-45 8 Pines Cat. 6a NET-TRONIC"
    ],
    [
      "Alimentación Externa",
      "Cordón",
      "GEN CABLE PODER COMPUTACION BLACK 3MTS 104770"
    ],
    [
      "Alimentación Externa",
      "Enchufe Magic",
      "Macho seguridad Magic 10A Bticino 314361"
    ]
  ],
  metalmecanica: [
    [
      "Fabricación",
      "Fab. Acrílicos",
      "Acrílico blanco lechoso 3 milímetros lateral Fpark (05EBLANCO3MM)"
    ],
    ["Fabricación", "Fab. TOTEM ID-T27", "Fabricación Tótem modelo Cañete"],
    ["Fabricación", "Fab. Pared Multimedia", "Fabricación de Tótem en Pared"],
    [
      "Cerradura",
      "Cerradura",
      "Cerr mueb INTER ANVER, botón, ext 10mm, Níquel (CEM039-0)"
    ],
    [
      "Cerradura",
      "Cerradura",
      "CILINDRO INT ANVER E232 C/TOPE SERVICIO DE (CIL980-0)"
    ],
    [
      "Ferretería",
      "Bisagra de Piano",
      "Bisagra Type 304 Stainless Steel Piano Hinge without Holes, .060\" " +
      "Thick, 1-1/4\" Wide, 1/8\" Pin Diameter, 6' Length (1658A6)"
    ],
    ["Cubierta", "Cubierta de Privacidad", ""],
    [
      "Cabina",
      "Cabina de Privacidad",
      "Compartimento, cabina telefónica, estudio de grabación, transmisión " +
      "en vivo, sala insonorizada, práctica de canto, piano, compartimento " +
      "silencioso, tambores"
    ]
  ],
  logistica: [
    ["Logística", "Transporte", "Transporte de Chasis desde Cameda"]
  ],
  ferreteria: [
    ["Ferretería", "Conjunto Cerradura", "Perno avellanado M4 X 12"],
    ["Ferretería", "Conjunto Cerradura", "Golilla Plana M4"],
    ["Ferretería", "Conjunto Cerradura", "Golilla Presión M4"],
    ["Ferretería", "Conjunto Cerradura", "Perno Pan M4 X 10"],
    ["Ferretería", "Ferretería Bisagra Superior", "Perno avellanado M4 X 10"],
    ["Ferretería", "Ferretería Bisagra Inferior", "Perno avellanado M4 X 10"],
    ["Ferretería", "Unión del Equipo a su Base", "Golilla Plana M5"],
    ["Ferretería", "Unión del Equipo a su Base", "Golilla Presión M5"],
    ["Ferretería", "Unión del Equipo a su Base", "Tuerca M5"],
    ["Ferretería", "Ferretería tapa trasera de cables", "Perno Pan M4 X 10"],
    ["Ferretería", "Fijación Módulo CPU", "Golilla Plana M4"],
    ["Ferretería", "Fijación Módulo CPU", "Golilla Presión M4"],
    ["Ferretería", "Fijación Módulo CPU", "Tuerca M4"],
    ["Ferretería", "Fijación Placa Madre", "Perno pan M3 X 8"],
    ["Ferretería", "Fijación Disco sólido", "Perno pan M3 X 8"],
    ["Ferretería", "Fijación Fuente PC", "Perno Pan Head 6-32x1/4\""],
    ["Ferretería", "Fijación Alargador múltiple (Zapatilla)", "Perno M4 X 10"],
    ["Ferretería", "Fijación Módulo Fuentes", "Golilla plana 4"],
    ["Ferretería", "Fijación Módulo Fuentes", "Golilla presión 4"],
    ["Ferretería", "Fijación Módulo Fuentes", "Tuerca M4"],
    ["Ferretería", "Fijación Shield", "Perno M4 X 10"],
    ["Ferretería", "Fijación Cámara", "Perno M6"],
    ["Ferretería", "Fijación Parlantes", "Perno pan M3 X 8"],
    ["Ferretería", "Fijación Amplificadora", "Perno pan M3 X 8"],
    ["Ferretería", "Fijación Impresora TMT88 V", "Golilla plana M3"],
    ["Ferretería", "Fijación Impresora TMT88 V", "Golilla presión M3"],
    ["Ferretería", "Fijación Impresora TMT88 V", "Perno para plástico"],
    ["Ferretería", "Fijación Módulo Impresora TMT88 V", "Golilla plana 4"],
    ["Ferretería", "Fijación Módulo Impresora TMT88 V", "Golilla presión 4"],
    ["Ferretería", "Fijación Módulo Impresora TMT88 V", "Perno M4 X 10"],
    ["Ferretería", "Fijación Impresora carta", "Golilla plana 3"],
    ["Ferretería", "Fijación Impresora carta", "Golilla presión 3"],
    ["Ferretería", "Fijación Impresora carta", "Roscalata"],
    [
      "Ferretería",
      "Fijación Soporte Impresora Carta",
      "Tornillo avellanado M3 X 12"
    ],
    ["Ferretería", "Fijación Soporte Impresora Carta", "Golilla plana M3"],
    [
      "Ferretería",
      "Fijación Soporte Impresora Carta",
      "Tuerca autofrenante M3"
    ],
    ["Ferretería", "Fijación Pantalla", "Tornillo M3 X 6"],
    ["Ferretería", "Fijación Pantalla", "Golilla Plana M3"],
    ["Ferretería", "Fijación Pantalla", "Golilla Presión M3"],
    ["Ferretería", "Soporte Módulo Pantalla", "Golilla plana M4"],
    ["Ferretería", "Soporte Módulo Pantalla", "Golilla presión M4"],
    ["Ferretería", "Soporte Módulo Pantalla", "Perno pan M4 x 10"],
    ["Ferretería", "Acrílico Lector de Inserción", "Golilla Plana M4"],
    ["Ferretería", "Acrílico Lector de Inserción", "Golilla Presión M4"],
    ["Ferretería", "Acrílico Lector de Inserción", "Tuerca M4"],
    ["Ferretería", "Acrílicos Transbank", "Golilla Plana M4"],
    ["Ferretería", "Acrílicos Transbank", "Golilla Presión M4"],
    ["Ferretería", "Acrílicos Transbank", "Tuerca M4"],
    ["Ferretería", "Ferretería puertos USB", "Perno Pan M3 X 12"],
    ["Ferretería", "Ferretería puertos USB", "Tuerca M3"],
    ["Ferretería", "Ferretería RJ45 Panel", "Perno Pan M3 X 12"]
  ],
  insumos: [
    [
      "Limpieza",
      "Alcohol Isopropílico",
      "Alcohol Isopropílico de Lt. (NU1219)"
    ],
    ["Limpieza", "Paños de limpieza", ""],
    [
      "Montaje",
      "Amarras Plásticas 150 X 2,5",
      "Amarra Plástica 150x2,5mm Negra BL100 Unid (I1000017)"
    ],
    [
      "Etiquetas",
      "Sellos de garantía y Calidad",
      "Sellos de garantía impresos en folia de seguridad"
    ],
    [
      "Etiquetas",
      "Nameplate",
      "Impreso en Papel Normal, plastificado y pegado con doble faz"
    ],
    ["Etiquetas", "Tarjeta Servible", "Tarjeta Servible"],
    ["Insumos Varios", "Llavero", "Identificador de llave X 100"],
    [
      "Rollos de Pruebas",
      "Rollos térmicos de 80",
      "Rollos Térmicos 80×80 48grs"
    ],
    [
      "Rollos de Pruebas",
      "Rollos térmicos tamaño carta",
      "Rollos Térmicos tamaño carta"
    ],
    ["Pegamento", "Cinta Doble Contacto Ventana Lector QR", ""],
    [
      "Cinta doble contacto",
      "Cinta doble contacto Touch",
      "76295A22 CINTA ADHESIVA"
    ],
    ["Branding", "Adhesivo publicitario", "Impresión e Instalación"],
    ["1/2 Branding", "Adhesivo publicitario (1/2)", "Impresión e Instalación"]
  ],
  licencias: [
    ["S.O.", "Licencia WIN", "Windows 11 Pro OEM Key"],
    ["S.O.", "Licencia WIN", "Windows 10 Pro OEM Key"]
  ],
  manoObra: [
    ["Etapa de Planificación", "Planificación de Proyecto", "Jefatura de HW"],
    ["Etapa de Planificación", "Planificación pre producción", "Jefatura"],
    ["Etapa de Planificación", "Planificación de producción", "Jefatura"],
    ["Etapa de Diseño Electrónico", "Fabricación de Prototipo", "Ingeniería"],
    ["Etapa de Diseño Electrónico", "Diagrama de Conexiones", "Ingeniería"],
    ["Etapa de Diseño Electrónico", "Cotización de Componentes", "Ingeniería"],
    [
      "Etapa de Diseño Mecánico",
      "Determinar Modificaciones del diseño",
      "Jefatura de HW, Mec."
    ],
    [
      "Etapa de Diseño Mecánico",
      "Coordinar con el proveedor los cambios de diseño requeridos",
      "Mecánica"
    ],
    [
      "Etapa de Diseño Mecánico",
      "Seguimiento al proceso de diseño del proveedor",
      "Jefatura de HW, Mec."
    ],
    [
      "Etapa de Diseño Mecánico",
      "Aprobación del diseño y gestión del traspaso de Planos según " +
      "estándares",
      "Jefatura de HW, Mec."
    ],
    [
      "Etapa de Diseño Mecánico",
      "Cotizar la fabricación de la metalmecánica",
      "Mecánica"
    ],
    [
      "Etapa de Diseño Mecánico",
      "Cotización de Piezas y Componentes Mecánicos",
      "Mecánica"
    ],
    ["Compras", "Cotización de Componentes (Compras)", "Jefatura Fab."],
    ["Compras", "Solicitud de Compras", "Jefatura Fab."],
    [
      "Gestionar la fabricación de la Metalmecánica",
      "Visita donde el proveedor 1",
      "Mecánica"
    ],
    [
      "Gestionar la fabricación de la Metalmecánica",
      "Visita donde el proveedor 2",
      "Mecánica"
    ],
    [
      "Gestionar la fabricación de la Metalmecánica",
      "Visita donde el proveedor 3",
      "Mecánica"
    ],
    [
      "Gestionar la fabricación de la Metalmecánica",
      "Gestionar el transporte y la llegada de piezas a DTS",
      "Mecánica"
    ],
    ["Inspección de Entrada", "Inspección de Metalmecánica en DTS", "Calidad"],
    ["Clonación de Discos", "Clonación de Discos", "Integración"],
    ["Armar cables, arneses y retrabajos", "Arnés de Botón", "Integración"],
    [
      "Armar cables, arneses y retrabajos",
      "Arnés de Parlante (X2)",
      "Integración"
    ],
    [
      "Armar cables, arneses y retrabajos",
      "Cable de red interno (X2)",
      "Integración"
    ],
    ["Armar cables, arneses y retrabajos", "Arnés Colicha", "Integración"],
    [
      "Armar cables, arneses y retrabajos",
      "Cable de Poder Fuente PC",
      "Integración"
    ],
    [
      "Armar cables, arneses y retrabajos",
      "Cable de poder Magic",
      "Integración"
    ],
    [
      "Armar cables, arneses y retrabajos",
      "Cable de red Externo",
      "Integración"
    ],
    [
      "Armar cables, arneses y retrabajos",
      "Arnés Micrófonos (X2)",
      "Integración"
    ],
    [
      "Armar cables, arneses y retrabajos",
      "Arnés Sensor - Arduino",
      "Integración"
    ],
    [
      "Armar cables, arneses y retrabajos",
      "Retrabajo tarjeta Frontal de Audio",
      "Integración"
    ],
    [
      "Armar cables, arneses y retrabajos",
      "Inspección de cables, arneses y retrabajos",
      "Calidad"
    ],
    [
      "Armado de Kit Placa Madre",
      "Montar Procesador y cooler en PM, RAM",
      "Integración"
    ],
    ["Armado de Kit Placa Madre", "Inspección de Kit Placa Madre", "Calidad"],
    ["Clonación de Imagen", "Clonación de Disco Sólido", "Integración"],
    ["Armado de Módulo Central", "Montar Fuente PC", "Integración"],
    ["Armado de Módulo Central", "Montar SSD", "Integración"],
    ["Armado de Módulo Central", "Montar Kit Placa Madre", "Integración"],
    ["Armado de Módulo Central", "Montar Kit Arduino", "Integración"],
    ["Armado de Módulo Central", "Montar Amplificadora", "Integración"],
    ["Armado de Módulo Central", "Montar Isolator", "Integración"],
    ["Armado de Módulo impresora TMT88V", "Montar Botón", "Integración"],
    [
      "Armado de Módulo impresora TMT88V",
      "Montar USB Frontales (X2)",
      "Integración"
    ],
    [
      "Armado de Módulo impresora TMT88V",
      "Montar Impresora TMT88V",
      "Integración"
    ],
    [
      "Armado de Módulo impresora Carta",
      "Montar Impresora Carta en sus piezas",
      "Integración"
    ],
    ["Armado de Módulo impresora Carta", "Montar Rieles", "Integración"],
    [
      "Armado de Módulo impresora Carta",
      "Retrabajo de aletas de la Impresora",
      "Integración"
    ],
    [
      "Armado de Módulo Impresora Ticket",
      "Montar Impresora Ticket en sus piezas",
      "Integración"
    ],
    [
      "Armado del Módulo Fuentes",
      "Montar Fuente Impresora TMT88V",
      "Integración"
    ],
    [
      "Armado del Módulo Fuentes",
      "Montar Fuente Impresora Carta",
      "Integración"
    ],
    [
      "Armado del Módulo Fuentes",
      "Montar Fuente Impresora de Ticket",
      "Integración"
    ],
    [
      "Armado del Módulo Pantalla",
      "Montar Pantalla en sus piezas",
      "Integración"
    ],
    ["Inspección de Módulos Armados", "Inspección Módulo Central", "Calidad"],
    [
      "Inspección de Módulos Armados",
      "Inspección Módulo impresora TMT88V",
      "Calidad"
    ],
    [
      "Inspección de Módulos Armados",
      "Inspección Módulo impresora Carta",
      "Calidad"
    ],
    ["Inspección de Módulos Armados", "Inspección Módulo Fuentes", "Calidad"],
    ["Inspección de Módulos Armados", "Inspección Módulo Pantalla", "Calidad"],
    [
      "Montaje de Módulos y Componentes",
      "Montaje del Módulo Central",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje del Módulo Impresora TMT88V",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje del Módulo Fuentes",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje del Módulo Pantalla",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje de la Zapatilla",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje de Scanner QR",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje del lector de inserción Creator",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje de Lector de Huella",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje de Lector sin Contacto DRAGON",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje de Parlantes (X2)",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje del Sensor de proximidad",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje de la Cámara Frontal",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje de la tarjeta de audio frontal",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje de Micrófonos (X2)",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje del Conector Colicha",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje de los USB Externos (X2)",
      "Integración"
    ],
    [
      "Montaje de Módulos y Componentes",
      "Montaje del Módulo Impresora Carta",
      "Integración"
    ],
    ["Ruteo del equipo", "Ruteo de cables y arneses", "Integración"],
    ["Inspección de armado", "Revisión de Cartilla de ruta", "Integración"],
    ["Inspección de armado", "Inspección de armado", "Integración"],
    ["Inspección de armado", "Encendido del Equipo", "Integración"],
    ["Configuración de BIOS", "Configurar fecha y Hora", "Integración"],
    ["Configuración de BIOS", "Configurar encendido automático", "Integración"],
    ["Configuraciones", "Configurar Impresora Carta", "Integración"],
    ["Configuraciones", "Configurar Impresora de ticket", "Integración"],
    ["Configuraciones", "Configurar sensor de proximidad", "Integración"],
    ["Configuraciones", "Prueba y ajuste de Cámara frontal", "Integración"],
    ["Configuraciones", "Configurar parámetros IP de prueba", "Integración"],
    ["Testing", "Probar Botón ON/OFF", "Integración"],
    ["Testing", "Prueba de Puertos USB frontales (X2)", "Integración"],
    ["Testing", "Prueba de Scanner", ""],
    ["Testing", "Prueba de Lector de inserción", ""],
    ["Testing", "Prueba de Lector de Huella", ""],
    ["Testing", "Prueba de tarjeta sin contacto", ""],
    ["Testing", "Prueba de Impresora TMT88V", "Integración"],
    ["Testing", "Prueba de Impresora Carta", "Integración"],
    ["Testing", "Prueba de Impresora de Ticket", "Integración"],
    ["Testing", "Prueba de audio", "Integración"],
    ["Testing", "Prueba de tarjeta frontal de audio", "Integración"],
    ["Testing", "Prueba de Micrófonos (X2)", "Integración"],
    ["Registros y Aplicaciones", "Registro de WIN10/11", "Integración"],
    ["Registros y Aplicaciones", "Instalar AnyDesk", "Integración"],
    ["Etiquetado", "Fabricar e instalar marcas", "Integración"],
    [
      "Prueba por equipo estacionario",
      "Prueba con App o periféricos",
      "Integración"
    ],
    ["Inspección Funcional", "Inspección Funcional", "Calidad"],
    ["Configuración Cliente", "Configuración Cliente", "Integración"],
    ["Terminaciones Mecánicas", "Retoques", "Mecánica"],
    ["Terminaciones Mecánicas", "Ajustes mecánicos", "Mecánica"],
    ["Terminaciones Mecánicas", "Cerrado del Equipo", "Mecánica"],
    ["Limpieza", "Limpieza general del equipo", "Integración"],
    ["Branding", "Gestionar la actividad", "Mecánica"],
    ["Inspección final", "Finalización del equipo", "Calidad"]
  ]
};
