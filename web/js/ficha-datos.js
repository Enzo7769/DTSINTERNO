/**
 * Propósito: Datos de prueba de la ficha SURALIS, hoja
 *   «1. Datos de Config.» de Clever Q2.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-13
 * Dependencias: ninguna
 */

const CLAVE = "Suralis2026#";

export const OPCIONES_FICHA = {
  enchufe: ["Magic", "Nacional"],
  distancia: ["1 metro", "2 metros", "3 metros"],
  anclado: ["Sí", "No"],
  instalacion: [
    "Techo",
    "Muro",
    "Muro con brazo extensible"
  ],
  material: [
    "Cerámica",
    "Hormigón",
    "Cerámica / Hormigón",
    "Volcanita",
    "Yeso cartón",
    "Madera",
    "Alfombra",
    "Porcelanato",
    "Vinílico",
    "Metal",
    "Ladrillo",
    "Estuco / Pintura",
    "Vidrio"
  ],
  pisos: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
};

const PREG_TOTEM = [
  [
    "¿Qué tipo de enchufe debe llevar el tótem?",
    "enchufe",
    "¿De qué material es el recubrimiento del piso "
      + "donde se ancla el tótem?",
    "material"
  ],
  [
    "¿A qué distancia del punto de red y poder queda "
      + "el tótem? Máximo 3 metros.",
    "distancia",
    "¿De qué material es el piso donde se instala "
      + "el tótem?",
    "material"
  ],
  [
    "¿El tótem va anclado a piso? El modelo Elqui no.",
    "anclado",
    "¿Cuántos pisos tiene el establecimiento?",
    "pisos"
  ]
];

const PREG_VISOR = [
  [
    "¿Qué tipo de enchufe debe llevar el visor?",
    "enchufe",
    "¿A qué altura se ubica el visor? Máximo 1,8 m.",
    ""
  ],
  [
    "¿El visor se instala en el techo, muro o muro "
      + "con brazo extensible?",
    "instalacion",
    "Si va al techo, ¿cuál es la altura del local?",
    ""
  ],
  [
    "¿De qué material es el área donde se instalará "
      + "el visor n° {n}?",
    "material",
    "¿A qué distancia queda del punto de red y poder? "
      + "Máximo 3 metros.",
    "distancia"
  ],
  [
    "¿Cuántos pisos tiene el establecimiento?",
    "pisos",
    "",
    ""
  ]
];

/**
 * @param {string[][]} preguntas
 * @param {string[][]} respuestas
 * @returns {object[]}
 */
function pares(preguntas, respuestas) {
  return preguntas.map((par, indice) => ({
    izquierda: par[0],
    claveIzq: par[1] || "",
    respuestaIzq: respuestas[indice][0],
    derecha: par[2],
    claveDer: par[3] || "",
    respuestaDer: respuestas[indice][1]
  }));
}

const RESP_TOTEM = [
  ["Magic", "Cerámica / Hormigón"],
  ["2 metros", "Cerámica / Hormigón"],
  ["Sí", "Primer piso"]
];

const RESP_VISOR = [
  ["Nacional", "1,8 mts"],
  ["Muro", ""],
  ["Volcanita", "3 metros"],
  ["Primer piso", ""]
];

/**
 * @param {string} sector
 * @param {string[][]} filas
 * @returns {object}
 */
function ejecutivos(sector, filas) {
  return {
    sector,
    filas: filas.map((fila) => ({
      numero: fila[0],
      modulo: fila[1],
      nombre: fila[2],
      usuario: fila[3],
      clave: fila[4]
    }))
  };
}

const MENU_SUR = {
  principal: [
    "PAGOS, CONVENIOS, COPIA DOCTOS.",
    "ATENCION COMERCIAL",
    "ATENCIÓN TÉCNICA",
    "OTROS"
  ],
  sub1: [
    "PAGO DE CUENTAS",
    "COPIA DE BOLETAS",
    "CERTIFICADOS",
    "CONVENIOS DE PAGO"
  ],
  sub2: [
    "DEUDA Y FECHA DE CORTE",
    "ESTADO DE REQUERIMIENTOS",
    "ACTUALIZACIÓN DE DATOS",
    "PROBLEMAS DE FACTURACIÓN",
    "SUBSIDIO AGUA POTABLE"
  ],
  sub3: [
    "PROBLEMAS DE AGUA POTABLE",
    "PROBLEMAS DE ALCANTARILLADO",
    "OTROS"
  ]
};

export const FICHA_PRUEBA = {
  licitacion: "SURALIS",
  cliente: "SURALIS",
  sistema: "Fila Clever Q2",
  pais: "CHILE",
  oficinas: [
    "OFICINA ATENCION CLIENTES PUERTO MONTT",
    "OFICINA ATENCION CLIENTES OSORNO"
  ],
  sectores: [
    {
      oficina: "PUERTO MONTT",
      sector: "ACCESO PUERTO MONTT",
      totem: "TÓTEM 1"
    },
    {
      oficina: "OSORNO",
      sector: "ACCESO OSORNO",
      totem: "TÓTEM 2"
    }
  ],
  totems: [
    {
      totem: "TÓTEM 1",
      oficina: "PUERTO MONTT",
      sector: "ACCESO PUERTO MONTT",
      ip: "10.253.107.20",
      menu: "Menú Principal Tótem 1",
      horario: "08:30 A 16:30",
      horaEntrada: "08:30",
      horaSalida: "16:30"
    },
    {
      totem: "TÓTEM 2",
      oficina: "OSORNO",
      sector: "ACCESO OSORNO",
      ip: "10.253.195.20",
      menu: "Menú Principal Tótem 2",
      horario: "08:30 A 16:30",
      horaEntrada: "08:30",
      horaSalida: "16:30"
    }
  ],
  gruposModulo: [
    {
      sector: "ACCESO PUERTO MONTT",
      filas: modulos()
    },
    {
      sector: "ACCESO OSORNO",
      filas: modulos()
    }
  ],
  admins: [
    { nombre: "HECTOR ALVARADO", usuario: "halvaradoadmin", clave: CLAVE },
    { nombre: "CLAUDIA VEGA", usuario: "cvegaadmin", clave: CLAVE }
  ],
  adminsSector: [
    {
      sector: "ACCESO PUERTO MONTT",
      nombre: "CONSUELO BRITO",
      usuario: "cbrito",
      clave: CLAVE
    },
    {
      sector: "ACCESO OSORNO",
      nombre: "CARLOS SANTANA",
      usuario: "csantana",
      clave: CLAVE
    }
  ],
  ejecutivos: [
    ejecutivos("ACCESO PUERTO MONTT", [
      ["USUARIO 1", "", "MARCIA SUSANA SCHOPF CATALÁN", "mschopf", CLAVE],
      ["USUARIO 2", "", "NANCY ESTER GARCIA SANDOVAL", "ngarcia", CLAVE],
      ["USUARIO 3", "", "XIMENA VALERIA IBAZETA GARRIDO", "xibazeta", CLAVE],
      ["USUARIO 4", "", "ANA MARIA LEAL RUPERTUS", "aleal", CLAVE],
      ["USUARIO 5", "", "", "", ""]
    ]),
    ejecutivos("ACCESO OSORNO", [
      ["USUARIO 1", "", "JESSICA PAOLA CASANOVA RAPIMAN", "jcasanova", CLAVE],
      ["USUARIO 2", "", "MIREYA SUSANA BAHAMONDE TOLEDO", "mbahamonde", CLAVE],
      [
        "USUARIO 3",
        "",
        "YENIFER LORETO ASCENCIO MANCILLA",
        "yascencio",
        CLAVE
      ],
      ["USUARIO 4", "", "", "", ""],
      ["USUARIO 5", "", "", "", ""]
    ])
  ],
  visores: [
    {
      sector: "ACCESO PUERTO MONTT",
      totem: "TÓTEM 1",
      visor: "VISOR 1",
      texto: "¡ BIENVENIDO A SURALIS, SELECCIONE SU ATENCIÓN."
    },
    {
      sector: "ACCESO OSORNO",
      totem: "TÓTEM 2",
      visor: "VISOR 2",
      texto: "¡ BIENVENIDO A SURALIS, SELECCIONE SU ATENCIÓN."
    }
  ],
  idCentro: "10-340",
  msgAtrasado:
    "Ha excedido el tiempo máximo para registrar su llegada. "
    + "Debe reagendar su cita",
  minutosAtraso: "10",
  minutosAdelanto: "30",
  msgTemprano: "Aún no podemos registrar su llegada",
  equipos: [
    {
      tipo: "totem",
      titulo: "TÓTEM N°1",
      pares: pares(PREG_TOTEM, RESP_TOTEM)
    },
    {
      tipo: "totem",
      titulo: "TÓTEM N°2",
      pares: pares(PREG_TOTEM, RESP_TOTEM)
    },
    {
      tipo: "visor",
      titulo: "VISOR N°1",
      pares: pares(PREG_VISOR, RESP_VISOR)
    },
    {
      tipo: "visor",
      titulo: "VISOR N°2",
      pares: pares(PREG_VISOR, RESP_VISOR)
    }
  ],
  requisitos: [
    { texto: "Manual de marca (logos y colores)", estado: "" },
    {
      texto: "Videos publicitarios para el tótem y el visor",
      estado: ""
    },
    {
      texto: "Puntos de red y energía operativos para cada equipo",
      estado: "SI"
    },
    {
      texto: "Fotografías y plano del lugar de instalación",
      estado: ""
    },
    {
      texto: "¿Cuántos pisos tiene el establecimiento?",
      estado: "1"
    }
  ],
  menu: {
    teclado: "Arriba",
    totems: [
      menuTotemPrueba("TÓTEM 1"),
      menuTotemPrueba("TÓTEM 2")
    ]
  },
  red: redPrueba()
};

/**
 * Fila en blanco para agregar en la ficha.
 * @param {string} clave
 * @returns {object|string}
 */
export function plantillaFicha(clave) {
  if (clave === "oficinas") return "";
  return structuredClone(VACIOS[clave]);
}

/**
 * Equipo físico nuevo, con las preguntas y sin respuestas.
 * @param {"totem"|"visor"} tipo
 * @returns {object}
 */
export function equipoVacio(tipo) {
  const clase = tipo === "visor" ? "visor" : "totem";
  const origen = clase === "visor"
    ? FICHA_PRUEBA.equipos[2]
    : FICHA_PRUEBA.equipos[0];
  const copia = structuredClone(origen);
  copia.tipo = clase;
  copia.titulo = nombreEquipo(clase, 1);
  copia.pares.forEach((par) => {
    par.respuestaIzq = "";
    par.respuestaDer = "";
  });
  return copia;
}

/**
 * @param {"totem"|"visor"} tipo
 * @param {number} numero
 * @returns {string}
 */
export function nombreEquipo(tipo, numero) {
  const prefijo = tipo === "visor" ? "VISOR" : "TÓTEM";
  return `${prefijo} N°${numero}`;
}

/**
 * @param {object} equipo
 * @returns {"totem"|"visor"}
 */
export function tipoEquipo(equipo) {
  if (equipo && equipo.tipo === "visor") return "visor";
  if (equipo && equipo.tipo === "totem") return "totem";
  const t = String(equipo && equipo.titulo || "").toLowerCase();
  return t.includes("visor") ? "visor" : "totem";
}

/**
 * Recorre tótems y visores por separado y cierra los huecos.
 * @param {object[]} lista
 * @returns {object[]}
 */
export function numerarEquipos(lista) {
  const conteo = { totem: 0, visor: 0 };
  return (lista || []).map((equipo) => {
    const tipo = tipoEquipo(equipo);
    conteo[tipo] += 1;
    return {
      ...equipo,
      tipo,
      titulo: nombreEquipo(tipo, conteo[tipo])
    };
  });
}

/**
 * @param {object[]} lista
 * @param {string} campo
 * @param {string} prefijo
 * @returns {object[]}
 */
export function numerarCampo(lista, campo, prefijo) {
  return (lista || []).map((fila, i) => ({
    ...fila,
    [campo]: `${prefijo} ${i + 1}`
  }));
}

/**
 * Nombre siguiente sin pisar los que ya se editaron.
 * @param {object[]} lista
 * @param {string} campo
 * @param {string} prefijo
 * @returns {string}
 */
export function nombreSiguiente(lista, campo, prefijo) {
  let maximo = 0;
  (lista || []).forEach((fila) => {
    const hallado = String(fila && fila[campo] || "").match(/(\d+)\s*$/);
    if (hallado) maximo = Math.max(maximo, Number(hallado[1]));
  });
  return `${prefijo} ${maximo + 1}`;
}

/**
 * Clave comparable: sin tildes, minúsculas y un espacio.
 * @param {unknown} valor
 * @returns {string}
 */
export function claveTxt(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Último número del nombre (TÓTEM 1 → 1).
 * @param {unknown} valor
 * @returns {string}
 */
function numeroDeNombre(valor) {
  const hallado = String(valor || "").trim().match(/(\d+)\s*$/);
  return hallado ? hallado[1] : "";
}

/**
 * Nombre de tótem como está en el UDT o en el menú.
 * @param {object} ficha
 * @param {string} nombre
 * @returns {string}
 */
function canonTotem(ficha, nombre) {
  const k = claveTxt(nombre);
  if (!k) return "";
  const filas = [
    ...(ficha.totems || []),
    ...((ficha.menu && ficha.menu.totems) || [])
  ];
  for (let i = 0; i < filas.length; i += 1) {
    const n = String(filas[i].totem || "").trim();
    if (claveTxt(n) === k) return n;
  }
  return String(nombre || "").trim();
}

/**
 * Si el UDT no tiene sector, lo toma de la fila de sectores.
 * @param {object} ficha
 * @returns {object}
 */
export function sincronizarSectoresTotem(ficha) {
  if (!ficha) return ficha;
  const porTotem = new Map();
  (ficha.sectores || []).forEach((fila) => {
    const k = claveTxt(fila.totem);
    const s = String(fila.sector || "").trim();
    if (k && s && !porTotem.has(k)) porTotem.set(k, s);
  });
  (ficha.totems || []).forEach((fila) => {
    const k = claveTxt(fila.totem);
    if (!k || !porTotem.has(k)) return;
    if (!String(fila.sector || "").trim()) {
      fila.sector = porTotem.get(k);
    }
  });
  return ficha;
}

/**
 * Textos de trámites y subtrámites de un menú de tótem.
 * @param {object} fila
 * @returns {string[]}
 */
export function textosMenuTotem(fila) {
  const salida = [];
  tramitesDeMenu(fila).forEach((item) => {
    const t = String(item.texto || "").trim();
    if (t) salida.push(t);
    (item.hijos || []).forEach((hijo) => {
      const h = String(hijo || "").trim();
      if (h) salida.push(h);
    });
  });
  return salida;
}

/**
 * UDT ligados a un sector, por la fila UDT o por sectores.
 * @param {object} ficha
 * @param {string} sector
 * @returns {Set<string>}
 */
function nombresTotemDeSector(ficha, sector) {
  const clave = claveTxt(sector);
  const nombres = new Set();
  const add = (nombre) => {
    const n = canonTotem(ficha, nombre);
    if (n) nombres.add(n);
  };
  (ficha.totems || []).forEach((fila) => {
    if (claveTxt(fila.sector) === clave) add(fila.totem);
  });
  (ficha.sectores || []).forEach((fila) => {
    if (claveTxt(fila.sector) !== clave) return;
    add(fila.totem);
  });
  if (nombres.size) return nombres;
  const num = numeroDeNombre(sector);
  if (!num) return nombres;
  const filas = [
    ...(ficha.totems || []),
    ...((ficha.menu && ficha.menu.totems) || [])
  ];
  filas.forEach((fila) => {
    if (numeroDeNombre(fila.totem) === num) add(fila.totem);
  });
  return nombres;
}

/**
 * Tótems del sector, para listas de visores y UAC.
 * @param {object} ficha
 * @param {string} sector
 * @returns {string[]}
 */
export function totemsDelSector(ficha, sector) {
  if (!ficha) return [];
  sincronizarSectoresTotem(ficha);
  const clave = String(sector || "").trim();
  return [...nombresTotemDeSector(ficha, clave)];
}

/**
 * Módulos UAC ya creados en ese sector.
 * @param {object} ficha
 * @param {string} sector
 * @returns {string[]}
 */
export function modulosDeSector(ficha, sector) {
  const clave = claveTxt(sector);
  if (!clave || !ficha) return [];
  const nombres = [];
  (ficha.gruposModulo || []).forEach((grupo) => {
    if (claveTxt(grupo.sector) !== clave) return;
    (grupo.filas || []).forEach((fila) => {
      const n = String(fila.modulo || "").trim();
      if (n) nombres.push(n);
    });
  });
  return nombresUnicos(nombres);
}

/**
 * True si todas las preguntas físicas tienen respuesta.
 * @param {object} equipo
 * @returns {boolean}
 */
export function equipoFisicoListo(equipo) {
  const pares = (equipo && equipo.pares) || [];
  if (!pares.length) return false;
  return pares.every((par) => {
    const izq = String(par.respuestaIzq || "").trim();
    if (!izq) return false;
    if (!par.derecha) return true;
    return Boolean(String(par.respuestaDer || "").trim());
  });
}

/**
 * Trámites del menú de los UDT de ese sector, no de otros.
 * @param {object} ficha
 * @param {string} sector
 * @returns {string[]}
 */
export function tramitesDeSector(ficha, sector) {
  const clave = String(sector || "").trim();
  if (!clave || !ficha) return [];
  sincronizarSectoresTotem(ficha);
  const totems = nombresTotemDeSector(ficha, clave);
  if (!totems.size) return [];
  const claves = new Set([...totems].map((n) => claveTxt(n)));
  const textos = [];
  const filas = (ficha.menu && ficha.menu.totems) || [];
  filas.forEach((fila) => {
    if (!claves.has(claveTxt(fila.totem))) return;
    textos.push(...textosMenuTotem(fila));
  });
  return nombresUnicos(textos);
}

/**
 * Nombres no vacíos y sin repetir, para armar las listas.
 * @param {unknown[]} lista
 * @returns {string[]}
 */
export function nombresUnicos(lista) {
  const vistos = new Set();
  const salida = [];
  (lista || []).forEach((item) => {
    const valor = String(item || "").trim();
    if (!valor || vistos.has(valor)) return;
    vistos.add(valor);
    salida.push(valor);
  });
  return salida;
}

const VACIOS = {
  sectores: { oficina: "", sector: "", totem: "" },
  totems: {
    totem: "",
    oficina: "",
    sector: "",
    ip: "",
    menu: "",
    horario: "",
    horaEntrada: "",
    horaSalida: ""
  },
  gruposModulo: {
    sector: "",
    filas: [{ modulo: "", tramites: "" }]
  },
  modulo: { modulo: "", tramites: "" },
  admins: { nombre: "", usuario: "", clave: "" },
  adminsSector: {
    sector: "",
    nombre: "",
    usuario: "",
    clave: ""
  },
  ejecutivos: {
    sector: "",
    filas: [{
      numero: "",
      modulo: "",
      nombre: "",
      usuario: "",
      clave: ""
    }]
  },
  ejecutivo: {
    numero: "",
    modulo: "",
    nombre: "",
    usuario: "",
    clave: ""
  },
  visores: { sector: "", totem: "", visor: "", texto: "" },
  requisitos: { texto: "", estado: "" }
};

/**
 * Tipo de lista de una pregunta física.
 * @param {string} texto
 * @param {string} [clave]
 * @returns {string}
 */
export function clavePregunta(texto, clave) {
  if (clave && OPCIONES_FICHA[clave]) return clave;
  const t = String(texto || "").toLowerCase();
  if (t.includes("enchufe")) return "enchufe";
  if (t.includes("distancia") && t.includes("punto")) {
    return "distancia";
  }
  if (t.includes("anclado")) return "anclado";
  if (t.includes("brazo")
    || (t.includes("techo") && t.includes("muro"))) {
    return "instalacion";
  }
  if (t.includes("material")) return "material";
  if (t.includes("cuántos pisos")
    || t.includes("cuantos pisos")
    || t.includes("más de un piso")
    || t.includes("mas de un piso")) {
    return "pisos";
  }
  return "";
}

/**
 * @returns {object[]}
 */
function modulos() {
  return [1, 2, 3, 4, 5].map((n) => ({
    modulo: `MÓDULO ${n}`,
    tramites: n === 5 ? "PAGO DE CUENTAS" : "TODOS"
  }));
}

/**
 * @param {string} [nombre]
 * @returns {object}
 */
export function menuTotemVacio(nombre) {
  return {
    totem: nombre || "",
    ingresoRut: "Sí",
    tipoPreferente: "Sí",
    ticketSinRut: "Sí",
    tramites: [{ texto: "", hijos: [] }],
    listo: false
  };
}

/**
 * Pasa columnas viejas a trámites con subtrámites 1.1, 2.1…
 * @param {object} fila
 * @returns {{texto: string, hijos: string[]}[]}
 */
export function tramitesDeMenu(fila) {
  const origen = fila || {};
  if (Array.isArray(origen.tramites) && origen.tramites.length) {
    return origen.tramites.map((item) => ({
      texto: item && item.texto ? String(item.texto) : "",
      hijos: Array.isArray(item && item.hijos)
        ? item.hijos.map((hijo) => String(hijo || ""))
        : []
    }));
  }
  const cols = origen.columnas || [];
  const principal = (cols[0] && cols[0].items) || [""];
  return principal.map((texto, i) => ({
    texto: String(texto || ""),
    hijos: ((cols[i + 1] && cols[i + 1].items) || [])
      .map((hijo) => String(hijo || ""))
  }));
}

/**
 * @returns {{teclado: string, totems: object[]}}
 */
export function menuVacio() {
  return { teclado: "Arriba", totems: [] };
}

/**
 * Ficha vacía para que el cliente la complete.
 * @param {string} licitacion
 * @returns {object}
 */
export function fichaEnBlanco(licitacion) {
  return {
    licitacion: licitacion || "",
    cliente: "",
    sistema: "",
    pais: "",
    oficinas: [],
    sectores: [],
    totems: [],
    gruposModulo: [],
    admins: [],
    adminsSector: [],
    ejecutivos: [],
    visores: [],
    idCentro: "",
    msgAtrasado: "",
    minutosAtraso: "",
    minutosAdelanto: "",
    msgTemprano: "",
    equipos: [],
    requisitos: [],
    menu: menuVacio(),
    red: []
  };
}

/**
 * Completa el menú si la ficha viene sin la hoja 1.1.
 * @param {object} ficha
 * @returns {object}
 */
export function asegurarMenu(ficha) {
  if (!ficha.menu) ficha.menu = menuVacio();
  if (!Array.isArray(ficha.menu.totems)) ficha.menu.totems = [];
  if (!ficha.menu.teclado) ficha.menu.teclado = "Arriba";
  sincronizarSectoresTotem(ficha);
  return sincronizarMenuTotems(ficha);
}

/**
 * Deja en 1.1 un menú por cada UDT ya creado.
 * @param {object} ficha
 * @returns {object}
 */
export function sincronizarMenuTotems(ficha) {
  if (!ficha.menu) ficha.menu = menuVacio();
  const nombres = (ficha.totems || [])
    .map((fila) => String(fila.totem || "").trim())
    .filter(Boolean);
  const previos = Array.isArray(ficha.menu.totems)
    ? ficha.menu.totems
    : [];
  const porNombre = new Map();
  previos.forEach((fila) => {
    const n = String(fila.totem || "").trim();
    if (n && !porNombre.has(n)) porNombre.set(n, fila);
  });
  ficha.menu.totems = nombres.map((nombre) => {
    const viejo = porNombre.get(nombre);
    if (!viejo) return menuTotemVacio(nombre);
    return {
      ...viejo,
      totem: nombre,
      tramites: tramitesDeMenu(viejo),
      listo: viejo.listo === true
    };
  });
  return ficha;
}

/**
 * @returns {object}
 */
export function filaRedVacia() {
  return {
    idCentro: "",
    tienda: "",
    equipo: "",
    ubicacion: "",
    idSitio: "",
    serie: "",
    idMonitoreo: "",
    anydesk: "",
    ip: "",
    mascara: "",
    gateway: "",
    dns1: "",
    dns2: ""
  };
}

/**
 * Completa la hoja de red y alinea filas con tótems y visores.
 * @param {object} ficha
 * @returns {object}
 */
export function asegurarRed(ficha) {
  if (!ficha) return ficha;
  if (!Array.isArray(ficha.red)) ficha.red = [];
  return sincronizarRedEquipos(ficha);
}

/**
 * Una fila de red por cada tótem y visor ya creado.
 * @param {object} ficha
 * @returns {object}
 */
export function sincronizarRedEquipos(ficha) {
  if (!ficha) return ficha;
  const equipos = equiposDeRed(ficha);
  const previos = Array.isArray(ficha.red) ? ficha.red : [];
  const usados = new Set();
  ficha.red = equipos.map((eq) => {
    const idx = indiceRedPrevia(previos, eq, usados);
    if (idx < 0) {
      return {
        ...filaRedVacia(),
        idCentro: ficha.idCentro || "",
        tienda: eq.tienda,
        equipo: eq.equipo,
        ip: eq.ip
      };
    }
    usados.add(idx);
    const viejo = previos[idx];
    return {
      ...viejo,
      equipo: eq.equipo,
      tienda: viejo.tienda || eq.tienda,
      ip: viejo.ip || eq.ip
    };
  });
  return ficha;
}

/**
 * @param {object[]} previos
 * @param {{equipo: string}} eq
 * @param {Set<number>} usados
 * @returns {number}
 */
function indiceRedPrevia(previos, eq, usados) {
  const k = claveTxt(eq.equipo);
  let i = previos.findIndex((fila, n) => (
    !usados.has(n) && claveTxt(fila.equipo) === k
  ));
  if (i >= 0) return i;
  i = previos.findIndex((fila, n) => {
    if (usados.has(n) || !k) return false;
    const nom = claveTxt(fila.equipo);
    return nom.startsWith(`${k} `)
      || nom.startsWith(`${k}-`)
      || nom.includes(k);
  });
  if (i >= 0) return i;
  return previos.findIndex((_, n) => !usados.has(n));
}

/**
 * @param {object} ficha
 * @returns {{equipo: string, tienda: string, ip: string}[]}
 */
function equiposDeRed(ficha) {
  const totems = (ficha.totems || [])
    .map((fila) => ({
      equipo: String(fila.totem || "").trim(),
      tienda: String(fila.oficina || "").trim(),
      ip: String(fila.ip || "").trim()
    }))
    .filter((item) => item.equipo);
  const visores = (ficha.visores || [])
    .map((fila) => ({
      equipo: String(fila.visor || "").trim(),
      tienda: oficinaDeSector(ficha, fila.sector),
      ip: ""
    }))
    .filter((item) => item.equipo);
  return [...totems, ...visores];
}

/**
 * @param {object} ficha
 * @param {unknown} sector
 * @returns {string}
 */
function oficinaDeSector(ficha, sector) {
  const clave = claveTxt(sector);
  if (!clave) return "";
  const sec = (ficha.sectores || []).find((fila) => (
    claveTxt(fila.sector) === clave
  ));
  if (sec && sec.oficina) return String(sec.oficina);
  const udt = (ficha.totems || []).find((fila) => (
    claveTxt(fila.sector) === clave
  ));
  return udt && udt.oficina ? String(udt.oficina) : "";
}

/**
 * @returns {object[]}
 */
function redPrueba() {
  const pm = "OFICINA ATENCION CLIENTES PUERTO MONTT";
  const os = "OFICINA ATENCION CLIENTES OSORNO";
  return [
    filaRed({
      tienda: pm,
      equipo: "Tótem 1 - T22-M41 ACONCAGUA",
      idSitio: "1",
      serie: "2026-014",
      idMonitoreo: "88100101",
      ip: "10.253.107.20",
      gateway: "10.253.107.10"
    }),
    filaRed({
      tienda: os,
      equipo: "Tótem 2 - T22-M41 ACONCAGUA",
      idSitio: "2",
      serie: "2026-015",
      idMonitoreo: "88100201",
      ip: "10.253.195.20",
      gateway: "10.253.195.10"
    }),
    filaRed({
      tienda: pm,
      equipo: "Visor 1 - 32\"",
      idSitio: "1",
      serie: "2026-043",
      idMonitoreo: "88100102",
      ip: "10.253.107.21",
      gateway: "10.253.107.10"
    }),
    filaRed({
      tienda: os,
      equipo: "Visor 2 - 32\"",
      idSitio: "2",
      serie: "2026-044",
      idMonitoreo: "88100202",
      ip: "10.253.195.21",
      gateway: "10.253.195.10"
    })
  ];
}

/**
 * @param {object} extra
 * @returns {object}
 */
function filaRed(extra) {
  return {
    ...filaRedVacia(),
    ubicacion: "SALA DE ESPERA",
    anydesk: "DTS Completa",
    mascara: "255.255.255.0",
    dns1: "10.253.40.11",
    dns2: "10.253.40.24",
    ...extra
  };
}

/**
 * @param {string} nombre
 * @returns {object}
 */
function menuTotemPrueba(nombre) {
  const hijos = [MENU_SUR.sub1, MENU_SUR.sub2, MENU_SUR.sub3, []];
  return {
    totem: nombre,
    ingresoRut: "Sí",
    tipoPreferente: "Sí",
    ticketSinRut: "Sí",
    tramites: MENU_SUR.principal.map((texto, i) => ({
      texto,
      hijos: [...(hijos[i] || [])]
    })),
    listo: false
  };
}
