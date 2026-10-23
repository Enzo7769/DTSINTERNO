/**
 * Propósito: Correo diario con los retiros de equipos atrasados, de
 *   hoy y de los próximos días, leídos de Firestore (colección
 *   recepcionLocales). Corre gratis en Google Apps Script con la
 *   cuenta de Google que lo instala.
 * Autor: DTS Autoservicio SpA
 * Fecha: 2026-10-23
 * Dependencias: Google Apps Script (UrlFetchApp, MailApp, ScriptApp,
 *   Session, Utilities)
 *
 * Instalación paso a paso: ver LEEME.md en esta carpeta.
 * La lógica de fechas es la misma de retirosPorFecha en
 * web/js/recepcion-datos.js: si cambia una, cambiar la otra.
 */

/** Ajustes. Lo único que normalmente se toca. */
const CONFIG = {
  /** Proyecto de Firebase (web/js/config.js → projectId). */
  proyecto: "controldtshardware",
  coleccion: "recepcionLocales",
  /** Correos que reciben el aviso; vacío = la cuenta que lo instala. */
  destinatarios: [],
  /** Días de anticipación de «Próximos». */
  diasAviso: 3,
  /** Hora aproximada del envío diario (0 a 23, hora de Chile). */
  hora: 8,
  zona: "America/Santiago",
  /** Si es false, los días sin nada pendiente no llega correo. */
  enviarSinNovedades: false,
  /** Dirección de la página, para abrir cada local desde el correo. */
  enlace: "https://controldtshardware.web.app"
};

/* ===================== Lo que se ejecuta ===================== */

/**
 * Revisa los retiros y manda el correo. Es la función que corre
 * cada día; también se puede ejecutar a mano para probar.
 * @returns {void}
 */
function enviarRecordatorio() {
  const hoy = Utilities.formatDate(new Date(), CONFIG.zona, "yyyy-MM-dd");
  const r = retirosPorFecha(leerLocales(), hoy, CONFIG.diasAviso);
  const total = r.atrasados.length + r.hoy.length + r.proximos.length;
  if (!total && !CONFIG.enviarSinNovedades) {
    console.log(`${hoy}: sin retiros que avisar; no se envía correo.`);
    return;
  }
  const correo = armarCorreo(r, hoy, CONFIG);
  const para = CONFIG.destinatarios.length
    ? CONFIG.destinatarios.join(",")
    : Session.getEffectiveUser().getEmail();
  MailApp.sendEmail({
    to: para,
    subject: correo.asunto,
    body: correo.texto,
    htmlBody: correo.html,
    name: "DTS · Recepción de equipos"
  });
  console.log(`Correo enviado a ${para}: ${correo.asunto}`);
}

/**
 * Programa el envío diario. Se ejecuta UNA vez; si se vuelve a
 * ejecutar, reemplaza la programación anterior (no la duplica).
 * @returns {void}
 */
function instalarRecordatorioDiario() {
  quitarRecordatorioDiario();
  ScriptApp.newTrigger("enviarRecordatorio")
    .timeBased()
    .everyDays(1)
    .atHour(CONFIG.hora)
    .inTimezone(CONFIG.zona)
    .create();
  console.log(`Listo: el correo saldrá cada día cerca de las `
    + `${CONFIG.hora}:00 (hora de Chile).`);
}

/**
 * Detiene el envío diario.
 * @returns {void}
 */
function quitarRecordatorioDiario() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === "enviarRecordatorio")
    .forEach((t) => ScriptApp.deleteTrigger(t));
}

/**
 * Muestra en el registro lo que diría el correo de hoy, sin enviarlo.
 * @returns {void}
 */
function vistaPrevia() {
  const hoy = Utilities.formatDate(new Date(), CONFIG.zona, "yyyy-MM-dd");
  const r = retirosPorFecha(leerLocales(), hoy, CONFIG.diasAviso);
  const correo = armarCorreo(r, hoy, CONFIG);
  console.log(`${correo.asunto}\n\n${correo.texto}`);
}

/* ===================== Leer Firestore ===================== */

/**
 * Todos los locales de la colección, ya convertidos a objetos.
 * Usa el permiso de la cuenta que instala el script (debe tener
 * acceso al proyecto de Firebase).
 * @returns {object[]}
 */
function leerLocales() {
  const base = "https://firestore.googleapis.com/v1/projects/"
    + `${CONFIG.proyecto}/databases/(default)/documents/`
    + `${CONFIG.coleccion}?pageSize=300`;
  const locales = [];
  let pagina = "";
  do {
    const url = pagina
      ? `${base}&pageToken=${encodeURIComponent(pagina)}`
      : base;
    const resp = UrlFetchApp.fetch(url, {
      headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
      muteHttpExceptions: true
    });
    const codigo = resp.getResponseCode();
    if (codigo !== 200) {
      const ayuda = codigo === 403
        ? `La cuenta ${Session.getEffectiveUser().getEmail()} no tiene `
          + `permiso para leer Firestore en «${CONFIG.proyecto}». Dale el `
          + "rol «Visualizador de Cloud Datastore» en Google Cloud → IAM "
          + "(ver LEEME.md)."
        : "Revisa CONFIG.proyecto y que Firestore exista.";
      throw new Error(`Firestore respondió ${codigo}. ${ayuda} Detalle: `
        + resp.getContentText().slice(0, 300));
    }
    const datos = JSON.parse(resp.getContentText());
    (datos.documents || []).forEach((doc) => {
      const local = desdeFirestore({ mapValue: { fields: doc.fields } });
      local.id = doc.name.split("/").pop();
      locales.push(local);
    });
    pagina = datos.nextPageToken || "";
  } while (pagina);
  return locales;
}

/**
 * Convierte un valor del formato REST de Firestore a JavaScript.
 * @param {object} valor
 * @returns {unknown}
 */
function desdeFirestore(valor) {
  if (!valor) return null;
  if ("stringValue" in valor) return valor.stringValue;
  if ("integerValue" in valor) return Number(valor.integerValue);
  if ("doubleValue" in valor) return Number(valor.doubleValue);
  if ("booleanValue" in valor) return valor.booleanValue;
  if ("timestampValue" in valor) return valor.timestampValue;
  if ("arrayValue" in valor) {
    return (valor.arrayValue.values || []).map(desdeFirestore);
  }
  if ("mapValue" in valor) {
    const salida = {};
    Object.entries(valor.mapValue.fields || {}).forEach(([k, v]) => {
      salida[k] = desdeFirestore(v);
    });
    return salida;
  }
  return null;
}

/* ===================== Fechas (igual que la página) ============ */

/**
 * Días entre dos fechas AAAA-MM-DD (positivo si «hasta» es después).
 * @param {string} desde
 * @param {string} hasta
 * @returns {number}
 */
function diasEntre(desde, hasta) {
  const ms = Date.parse(`${hasta}T00:00:00Z`)
    - Date.parse(`${desde}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

/**
 * Locales con equipos aún pendientes de retiro, por fecha de retiro
 * programado: atrasados, hoy y próximos.
 * @param {object[]} locales
 * @param {string} hoy AAAA-MM-DD
 * @param {number} dias anticipación de «próximos»
 * @returns {{atrasados: object[], hoy: object[], proximos: object[]}}
 */
function retirosPorFecha(locales, hoy, dias) {
  const salida = { atrasados: [], hoy: [], proximos: [] };
  (locales || []).forEach((local) => {
    if (!local.retiroProgramado) return;
    const pendientes = (local.equipos || [])
      .filter((equipo) => equipo.etapa === "pendiente").length;
    if (!pendientes) return;
    const faltan = diasEntre(hoy, local.retiroProgramado);
    const fila = { local, dias: Math.abs(faltan), pendientes };
    if (faltan < 0) salida.atrasados.push(fila);
    else if (faltan === 0) salida.hoy.push(fila);
    else if (faltan <= dias) salida.proximos.push(fila);
  });
  const porCodigo = (a, b) => String(a.local.codigo)
    .localeCompare(String(b.local.codigo), "es", { numeric: true });
  salida.atrasados.sort((a, b) => b.dias - a.dias || porCodigo(a, b));
  salida.hoy.sort(porCodigo);
  salida.proximos.sort((a, b) => a.dias - b.dias || porCodigo(a, b));
  return salida;
}

/* ===================== El correo ===================== */

/**
 * @param {number} n
 * @param {string} uno
 * @param {string} varios
 * @returns {string} «1 día», «3 días»
 */
function conteo(n, uno, varios) {
  return `${n} ${n === 1 ? uno : varios}`;
}

/**
 * @param {string} iso AAAA-MM-DD
 * @returns {string} DD/MM/AAAA
 */
function fechaChilena(iso) {
  const [a, m, d] = String(iso).split("-");
  return d ? `${d}/${m}/${a}` : String(iso);
}

/**
 * @param {unknown} texto
 * @returns {string}
 */
function escapar(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Asunto, texto plano y HTML del aviso.
 * @param {{atrasados: object[], hoy: object[], proximos: object[]}} r
 * @param {string} hoy
 * @param {{diasAviso: number, enlace: string}} cfg
 * @returns {{asunto: string, texto: string, html: string}}
 */
function armarCorreo(r, hoy, cfg) {
  const grupos = [
    { filas: r.atrasados, titulo: "Atrasados", color: "#b42318",
      cuando: (f) => `Atrasado ${conteo(f.dias, "día", "días")}` },
    { filas: r.hoy, titulo: "Retiro hoy", color: "#b26b00",
      cuando: () => "Retiro hoy" },
    { filas: r.proximos,
      titulo: `Próximos ${cfg.diasAviso} días`, color: "#2a78d6",
      cuando: (f) => `En ${conteo(f.dias, "día", "días")}` }
  ];
  const partes = [];
  if (r.atrasados.length) {
    partes.push(conteo(r.atrasados.length, "atrasado", "atrasados"));
  }
  if (r.hoy.length) partes.push(`${r.hoy.length} hoy`);
  if (r.proximos.length) {
    partes.push(conteo(r.proximos.length, "próximo", "próximos"));
  }
  const asunto = partes.length
    ? `Retiros de equipos: ${partes.join(", ")}`
    : "Retiros de equipos: sin pendientes";
  const nombreDe = (l) => `${l.codigo}${l.nombre ? ` · ${l.nombre}` : ""}`;
  const detalle = (f) => [
    `${conteo(f.pendientes, "equipo", "equipos")} por retirar`,
    f.local.comuna,
    f.local.contrato,
    f.local.transportista ? `transporte: ${f.local.transportista}` : ""
  ].filter(Boolean).join(" · ");
  const linea = (f, g) => [nombreDe(f.local), g.cuando(f),
    `retiro ${fechaChilena(f.local.retiroProgramado)}`, detalle(f)]
    .join(" · ");
  const texto = [`Retiros de equipos al ${fechaChilena(hoy)}`, ""]
    .concat(...grupos.filter((g) => g.filas.length).map((g) => [
      `${g.titulo.toUpperCase()} (${g.filas.length})`,
      ...g.filas.map((f) => `- ${linea(f, g)}`),
      ""
    ]))
    .concat(partes.length ? [] : ["No hay retiros pendientes."])
    .join("\n");
  const enlaceLocal = (l) => (cfg.enlace
    ? `${cfg.enlace}/#/recepcion-local?id=${encodeURIComponent(l.id)}`
    : "");
  const bloque = (g) => {
    if (!g.filas.length) return "";
    const items = g.filas.map((f) => {
      const url = enlaceLocal(f.local);
      const nombre = escapar(nombreDe(f.local));
      const titulo = url
        ? `<a href="${escapar(url)}" style="color:#08344c">${nombre}</a>`
        : nombre;
      const resto = escapar(detalle(f));
      return `<li style="margin:0 0 8px"><strong>${titulo}</strong>`
        + `<br><span style="color:${g.color};font-weight:700">`
        + `${escapar(g.cuando(f))}</span> · retiro `
        + `${fechaChilena(f.local.retiroProgramado)}<br>`
        + `<span style="color:#4d6472">${resto}</span></li>`;
    }).join("");
    return `<h3 style="color:${g.color};margin:18px 0 8px">`
      + `${escapar(g.titulo)} (${g.filas.length})</h3>`
      + `<ul style="padding-left:18px;margin:0">${items}</ul>`;
  };
  const html = '<div style="font-family:Arial,sans-serif;color:#08344c">'
    + `<h2 style="margin:0 0 4px">Retiros de equipos</h2>`
    + `<p style="margin:0;color:#4d6472">Al ${fechaChilena(hoy)}. `
    + "Locales con equipos aún sin retirar.</p>"
    + grupos.map(bloque).join("")
    + (partes.length ? "" : "<p>No hay retiros pendientes.</p>")
    + (cfg.enlace
      ? `<p style="margin-top:18px"><a href="${escapar(cfg.enlace)}`
        + '/#/recepcion">Abrir recepción de equipos</a></p>'
      : "")
    + "</div>";
  return { asunto, texto, html };
}
