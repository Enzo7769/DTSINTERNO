/**
 * Propósito: Ítems del checklist de salida de hardware.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-01
 * Dependencias: constantes.js
 */

import { MSG } from "./constantes.js";

export const SECCIONES = [
  {
    id: "monitoreo",
    numero: "2",
    titulo: "Prueba de conexión y monitoreo remoto",
    items: [
      {
        id: "anydeskInstalacion",
        nombre: "Instalación de AnyDesk",
        ayuda:
          "ID de AnyDesk anotado y registrado en la ficha "
          + "de configuración del proyecto.",
        extra: {
          id: "anydeskId",
          etiqueta: "ID de AnyDesk",
          max: 32,
          obligatorioSiOk: true
        }
      },
      {
        id: "anydeskPrueba",
        nombre: "Prueba de conexión AnyDesk",
        ayuda: "Acceso remoto activado y probado con éxito."
      },
      {
        id: "instanwebPrueba",
        nombre: "Prueba de monitoreo Instanweb",
        ayuda: "ID de Instanweb correctamente configurado.",
        extra: {
          id: "instanwebId",
          etiqueta: "ID de Instanweb",
          max: 64,
          obligatorioSiOk: true
        }
      },
      {
        id: "instanwebComponentes",
        nombre: "Revisión de componentes en Instanweb",
        ayuda:
          "Todos los componentes monitorean en estado "
          + "Normal."
      }
    ]
  },
  {
    id: "pantalla",
    numero: "3",
    titulo: "Pantalla y sistema táctil",
    titulos: { visor: "Pantalla" },
    items: [
      {
        id: "pantallaFisica",
        nombre: "Inspección física de pantalla",
        ayuda:
          "Panel limpio, sin fisuras, rayas ni píxeles "
          + "muertos."
      },
      {
        id: "pantallaTouch",
        nombre: "Funcionamiento touch (táctil)",
        salvo: ["visor"],
        ayuda:
          "Calibración verificada en centro y bordes. "
          + "Toques continuos sin interrupción."
      },
      {
        id: "pantallaResolucion",
        nombre: "Resolución y zoom de la pantalla",
        solo: ["visor"],
        ayuda:
          "La resolución y el zoom coinciden con el "
          + "modelo de la pantalla."
      },
      {
        id: "pantallaCables",
        nombre: "Cables de pantalla",
        ayuda:
          "Video (HDMI, DisplayPort o VGA) y USB táctil "
          + "en buen estado, sin falsos contactos."
      }
    ]
  },
  {
    id: "impresora",
    numero: "4",
    titulo: "Impresora",
    salvo: ["visor"],
    items: [
      {
        id: "impresoraInstalacion",
        nombre: "Instalación de impresora",
        ayuda: "Carga de drivers para la impresora."
      },
      {
        id: "impresoraFuncionamiento",
        nombre: "Funcionamiento de impresora",
        ayuda:
          "Página de prueba correcta. Impresora "
          + "predeterminada en el sistema."
      },
      {
        id: "impresoraInsumos",
        nombre: "Insumos y carga inicial",
        ayuda:
          "Papel térmico verificado. Carga inicial "
          + "realizada (1 rollo)."
      },
      {
        id: "impresoraCableado",
        nombre: "Cableado de impresora",
        ayuda:
          "USB o red RJ45 y transformador original "
          + "probados, sin estirar el cable."
      }
    ]
  },
  {
    id: "red",
    numero: "5",
    titulo: "Red, conectividad y sistema eléctrico",
    items: [
      {
        id: "redEnlace",
        nombre: "Red cableada / Wi-Fi",
        ayuda:
          "Puerto RJ45 con link activo. Wi-Fi configurada "
          + "e IP asignada según el proyecto."
      },
      {
        id: "alimentacion",
        nombre: "Alimentación eléctrica",
        ayuda:
          "Cables de poder y zapatillas probadas. Tensión "
          + "y compatibilidad del sitio verificadas."
      },
      {
        id: "ordenCables",
        nombre: "Orden de cables",
        ayuda: "Cinchos o velcros organizadores instalados."
      },
      {
        id: "tieneBam",
        nombre: "¿Tiene BAM?",
        aceptaNo: true,
        ayuda:
          "Solo algunos equipos lo traen. En No se puede "
          + "aprobar igual. En Sí, anota el WiFi.",
        extras: [
          {
            id: "ssid",
            etiqueta: "Nombre WiFi (SSID)",
            max: 64
          },
          {
            id: "wifiKey",
            etiqueta: "WiFi key",
            max: 64
          },
          {
            id: "password",
            etiqueta: "Password",
            max: 64
          }
        ]
      },
      {
        id: "conectaBam",
        nombre: "¿Se desconecta y se conecta a la BAM?",
        dependeDe: "tieneBam",
        ayuda:
          "Corta la red principal y comprueba que el "
          + "equipo queda conectado a la BAM."
      }
    ]
  },
  {
    id: "sistema",
    numero: "6",
    titulo: "Sistema operativo",
    items: [
      {
        id: "windowsLicencia",
        nombre: "Licencia de Windows",
        ayuda:
          "Licencia activada y registrada en la ficha de "
          + "configuración del proyecto.",
        extra: {
          id: "referenciaLicencia",
          etiqueta: "Referencia de licencia",
          max: 80,
          obligatorioSiOk: false
        }
      }
    ]
  },
  {
    id: "aplicacion",
    numero: "7",
    titulo: "Configuración de la aplicación",
    items: [
      {
        id: "wizardApp",
        nombre: "Configuración inicial",
        ayuda:
          "Configuración completa mediante el wizard, "
          + "si corresponde al equipo."
      }
    ]
  }
];

/**
 * Devuelve los identificadores de todos los ítems.
 * @returns {string[]}
 */
export function idsDeItems() {
  const ids = [];
  SECCIONES.forEach((seccion) => {
    seccion.items.forEach((item) => {
      ids.push(item.id);
    });
  });
  return ids;
}

/**
 * Busca la definición de un ítem.
 * @param {string} id
 * @returns {object|null}
 */
export function buscarItem(id) {
  for (let i = 0; i < SECCIONES.length; i += 1) {
    const seccion = SECCIONES[i];
    for (let j = 0; j < seccion.items.length; j += 1) {
      if (seccion.items[j].id === id) {
        return seccion.items[j];
      }
    }
  }
  return null;
}

/**
 * Título de la sección según el tipo de equipo.
 * @param {object} seccion
 * @param {string} tipo
 * @returns {string}
 */
export function tituloSeccion(seccion, tipo) {
  const mapa = seccion.titulos || {};
  const texto = mapa[tipo] || seccion.titulo;
  return `${numeroVisible(seccion, tipo)}. ${texto}`;
}

/**
 * Numera solo las secciones que el tipo de equipo muestra.
 * La 1 es la ficha del proyecto.
 * @param {object} seccion
 * @param {string} tipo
 * @returns {string}
 */
function numeroVisible(seccion, tipo) {
  let numero = 2;
  for (let i = 0; i < SECCIONES.length; i += 1) {
    const actual = SECCIONES[i];
    if (!seccionCabe(actual, tipo)) continue;
    if (actual.id === seccion.id) return String(numero);
    numero += 1;
  }
  return seccion.numero;
}

/**
 * El cierre va justo después de la última sección visible.
 * @param {string} tipo
 * @returns {string}
 */
export function tituloCierre(tipo) {
  let numero = 2;
  for (let i = 0; i < SECCIONES.length; i += 1) {
    if (seccionCabe(SECCIONES[i], tipo)) numero += 1;
  }
  return `${numero}. ${MSG.seccionCierre}`;
}

/**
 * @param {object} seccion
 * @param {string} tipo
 * @returns {boolean}
 */
function seccionCabe(seccion, tipo) {
  return seccion.items.some((item) => itemCabe(item, seccion, tipo));
}

/**
 * @param {object} item
 * @param {object} seccion
 * @param {string} tipo
 * @returns {boolean}
 */
function itemCabe(item, seccion, tipo) {
  const solo = item.solo || seccion.solo || [];
  if (solo.length && !solo.includes(tipo)) return false;
  const salvo = item.salvo || seccion.salvo || [];
  return !(tipo && salvo.includes(tipo));
}

/**
 * @param {string} id
 * @returns {object|null}
 */
export function seccionDeItem(id) {
  for (let i = 0; i < SECCIONES.length; i += 1) {
    const seccion = SECCIONES[i];
    for (let j = 0; j < seccion.items.length; j += 1) {
      if (seccion.items[j].id === id) return seccion;
    }
  }
  return null;
}
