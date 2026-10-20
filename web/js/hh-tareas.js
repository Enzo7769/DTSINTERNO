/**
 * Propósito: Tareas de mano de obra de la hoja HH de
 *   «The Real Costo Operacional 2025 ACONCAGUA».
 *   Horas y valor UF son los de la planilla. El costo de la
 *   tarea es horas × valor UF × 1,2 (+20 %).
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-06
 * Dependencias: ninguna
 */

/** Recargo de la planilla: columna «Valor HH (UF) +20 %». */
export const RECARGO_HH = 1.2;

/**
 * @type {{id: string, tipo: string, componente: string,
 *   descripcion: string, horas: number, valorUf: number}[]}
 */
export const TAREAS_HH = [
  {
    id: "plan-pre",
    tipo: "Planificación",
    componente: "Jefatura",
    descripcion: "Planificación pre producción",
    horas: 0.25,
    valorUf: 0.25
  },
  {
    id: "ruteo",
    tipo: "Producción",
    componente: "Integración",
    descripcion: "Integración y ruteo",
    horas: 1,
    valorUf: 0.2
  },
  {
    id: "insp-ruteo",
    tipo: "Producción",
    componente: "GyC",
    descripcion: "Inspección del ruteo y armado",
    horas: 0.04,
    valorUf: 0.1
  },
  {
    id: "bios",
    tipo: "Producción",
    componente: "Integración",
    descripcion: "Encendido y configuración de BIOS",
    horas: 0.04,
    valorUf: 0.1
  },
  {
    id: "clonacion",
    tipo: "Producción",
    componente: "Integración",
    descripcion: "Clonación",
    horas: 0.5,
    valorUf: 0.1
  },
  {
    id: "perifericos",
    tipo: "Producción",
    componente: "Integración",
    descripcion: "Prueba funcional de periféricos",
    horas: 0.08,
    valorUf: 0.1
  },
  {
    id: "pruebas",
    tipo: "Producción",
    componente: "Integración",
    descripcion: "Configuraciones de pruebas",
    horas: 0.04,
    valorUf: 0.1
  },
  {
    id: "aplicativo",
    tipo: "Producción",
    componente: "Integración",
    descripcion: "Prueba funcional con aplicativo y de uso continuo",
    horas: 0.08,
    valorUf: 0.1
  },
  {
    id: "anidesk",
    tipo: "Producción",
    componente: "Integración",
    descripcion: "Registro y Anidesk",
    horas: 0.25,
    valorUf: 0.1
  },
  {
    id: "insp-funcional",
    tipo: "Producción",
    componente: "GyC",
    descripcion: "Inspección funcional",
    horas: 0.08,
    valorUf: 0.1
  },
  {
    id: "config-cliente",
    tipo: "Producción",
    componente: "Integración",
    descripcion: "Configuraciones del cliente",
    horas: 0.25,
    valorUf: 0.1
  },
  {
    id: "limpieza-int",
    tipo: "Producción",
    componente: "Integración",
    descripcion: "Limpieza interna",
    horas: 0.08,
    valorUf: 0.1
  },
  {
    id: "cuadratura",
    tipo: "Producción",
    componente: "Mecánica",
    descripcion: "Cerrar y cuadraturas",
    horas: 0.5,
    valorUf: 0.1
  },
  {
    id: "limpieza-ext",
    tipo: "Producción",
    componente: "Integración",
    descripcion: "Limpieza externa",
    horas: 0.08,
    valorUf: 0.1
  },
  {
    id: "insp-final",
    tipo: "Producción",
    componente: "GyC",
    descripcion: "Inspección final y sellos",
    horas: 0.25,
    valorUf: 0.1
  }
];

/**
 * @param {{componente: string, descripcion: string}} tarea
 * @returns {string}
 */
export function conceptoHh(tarea) {
  return `${tarea.componente}: ${tarea.descripcion}`.slice(0, 160);
}

/**
 * UF de una tarea ya con el recargo del 20 %.
 * @param {number} horas
 * @param {number} valorUf
 * @param {boolean} activa
 * @returns {number}
 */
export function montoTareaUf(horas, valorUf, activa) {
  if (!activa || !(horas > 0) || !(valorUf > 0)) return 0;
  return horas * valorUf * RECARGO_HH;
}
