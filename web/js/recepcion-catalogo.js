/**
 * Propósito: Catálogos de la recepción de equipos devueltos: regiones
 *   de Chile, etapas, componentes que se revisan y sus estados.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-23
 * Dependencias: ninguna
 */

/** Regiones de Chile de norte a sur (id corto, nombre, número). */
export const REGIONES = [
  { id: "AP", etiqueta: "Arica y Parinacota", numero: "XV" },
  { id: "TA", etiqueta: "Tarapacá", numero: "I" },
  { id: "AN", etiqueta: "Antofagasta", numero: "II" },
  { id: "AT", etiqueta: "Atacama", numero: "III" },
  { id: "CO", etiqueta: "Coquimbo", numero: "IV" },
  { id: "VA", etiqueta: "Valparaíso", numero: "V" },
  { id: "RM", etiqueta: "Metropolitana de Santiago", numero: "RM" },
  { id: "LI", etiqueta: "O'Higgins", numero: "VI" },
  { id: "ML", etiqueta: "Maule", numero: "VII" },
  { id: "NB", etiqueta: "Ñuble", numero: "XVI" },
  { id: "BI", etiqueta: "Biobío", numero: "VIII" },
  { id: "AR", etiqueta: "La Araucanía", numero: "IX" },
  { id: "LR", etiqueta: "Los Ríos", numero: "XIV" },
  { id: "LL", etiqueta: "Los Lagos", numero: "X" },
  { id: "AI", etiqueta: "Aysén", numero: "XI" },
  { id: "MA", etiqueta: "Magallanes", numero: "XII" }
];

/** Etapas de un equipo, en orden. */
export const ETAPAS = [
  { id: "pendiente", etiqueta: "Pendiente de retiro", corto: "Pendiente" },
  { id: "transito", etiqueta: "En tránsito", corto: "En tránsito" },
  { id: "recibido", etiqueta: "Recibido en bodega", corto: "Recibido" },
  { id: "revisado", etiqueta: "Revisado", corto: "Revisado" }
];

/** Tipos de equipo que se reciben. */
export const TIPOS_RECEPCION = [
  { id: "totem", etiqueta: "Tótem" },
  { id: "visor", etiqueta: "Visor" },
  { id: "locker", etiqueta: "Locker" },
  { id: "otro", etiqueta: "Otro" }
];

/** Cómo viene cada componente. */
export const ESTADOS_COMPONENTE = [
  { id: "ok", etiqueta: "OK" },
  { id: "danado", etiqueta: "Dañado" },
  { id: "falta", etiqueta: "Falta" },
  { id: "na", etiqueta: "No aplica" }
];

/** Resultado de la revisión de un equipo. */
export const RESULTADOS = [
  { id: "ok", etiqueta: "Completo y OK" },
  { id: "danado", etiqueta: "Con daños" },
  { id: "incompleto", etiqueta: "Incompleto" }
];

/**
 * Lo que se revisa al recibir un equipo, por grupo. «ayuda» dice qué
 * mirar; «solo» limita el ítem a ciertos tipos de equipo.
 */
export const CHECKLIST_RECEPCION = [
  {
    titulo: "Estructura",
    items: [
      { id: "gabinete", nombre: "Gabinete y estructura",
        ayuda: "Golpes, abolladuras, rayas, pintura y óxido." },
      { id: "cerradura", nombre: "Cerradura y llaves",
        ayuda: "Llaves presentes y la puerta abre y cierra." },
      { id: "base", nombre: "Base y anclajes",
        ayuda: "Base completa; pernos y placas de anclaje." }
    ]
  },
  {
    titulo: "Pantalla",
    items: [
      { id: "pantalla", nombre: "Pantalla",
        ayuda: "Sin quiebres, manchas ni píxeles muertos." },
      { id: "touch", nombre: "Touch",
        ayuda: "Responde en todo el panel.",
        solo: ["totem", "locker"] }
    ]
  },
  {
    titulo: "Computador",
    items: [
      { id: "cpu", nombre: "Placa madre / Mini PC",
        ayuda: "Enciende y llega al sistema operativo." },
      { id: "disco", nombre: "Disco",
        ayuda: "Presente y detectado." },
      { id: "ram", nombre: "Memoria RAM",
        ayuda: "Presente y con la capacidad esperada." },
      { id: "fuente", nombre: "Fuente de poder",
        ayuda: "Entrega energía sin ruidos ni olor a quemado." }
    ]
  },
  {
    titulo: "Periféricos",
    items: [
      { id: "impresora", nombre: "Impresora térmica",
        ayuda: "Imprime y corta el papel.",
        solo: ["totem"] },
      { id: "lector", nombre: "Lector QR / código de barras",
        ayuda: "Lee un código de prueba." },
      { id: "parlantes", nombre: "Parlantes",
        ayuda: "Se escucha el audio." }
    ]
  },
  {
    titulo: "Conexiones y energía",
    items: [
      { id: "cables", nombre: "Cables de poder y red",
        ayuda: "Cable de poder, red, USB y video." },
      { id: "router", nombre: "Router / BAM",
        ayuda: "Equipo de red y su chip, si tenía." },
      { id: "ups", nombre: "UPS",
        ayuda: "Si el equipo tenía UPS, que esté y funcione." }
    ]
  }
];

export const ITEMS_RECEPCION = CHECKLIST_RECEPCION
  .flatMap((grupo) => grupo.items);

/**
 * @param {{id: string, etiqueta: string}[]} lista
 * @param {string} id
 * @returns {string}
 */
export function etiquetaDeLista(lista, id) {
  const hallado = lista.find((item) => item.id === id);
  return hallado ? hallado.etiqueta : "";
}

/**
 * Ítems que aplican a un tipo de equipo.
 * @param {string} tipo
 * @returns {object[]}
 */
export function itemsDeTipo(tipo) {
  return ITEMS_RECEPCION
    .filter((item) => !item.solo || item.solo.includes(tipo));
}
