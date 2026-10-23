# Recordatorio diario de retiros por Gmail

Cada mañana revisa los locales de **Recepción de equipos** en Firebase y
manda un correo con:

- **Atrasados:** retiro programado ya pasado y equipos aún sin retirar,
  con los días de atraso.
- **Retiro hoy.**
- **Próximos 3 días.**

Cada local del correo enlaza a su ficha en la página. Si un día no hay
nada pendiente, no llega correo.

Es gratis: corre en Google Apps Script con tu cuenta de Google. No usa
servidores ni el plan de pago de Firebase.

## Antes de empezar

Usa la **misma cuenta de Google con la que entras a la consola de
Firebase** (dueña o editora del proyecto `controldtshardware`). El
script lee Firestore con el permiso de esa cuenta.

Hazlo en un computador; desde el celular el editor es incómodo.

## Instalación (una vez, unos 10 minutos)

1. Entra a <https://script.google.com> y toca **Nuevo proyecto**.
   Arriba a la izquierda cámbiale el nombre a
   `Recordatorio retiros DTS`.
2. Toca el engranaje **Configuración del proyecto** (menú izquierdo) y
   marca **Mostrar el archivo de manifiesto «appsscript.json» en el
   editor**.
3. Vuelve al **Editor** (icono `< >`):
   - Abre `Código.gs`, borra todo y pega el contenido de
     [`Codigo.gs`](Codigo.gs) de esta carpeta.
   - Abre `appsscript.json`, borra todo y pega el contenido de
     [`appsscript.json`](appsscript.json).
   - Guarda (icono de disquete o Ctrl+S).
4. Si quieres, ajusta el bloque `CONFIG` al inicio de `Código.gs`:
   - `destinatarios`: por ejemplo
     `["bodega@empresa.cl", "jefe@empresa.cl"]`. Vacío = te llega a ti.
   - `hora`: hora del envío (8 = 8:00 de la mañana).
   - `diasAviso`: días de anticipación de «Próximos» (3).
   - `enlace`: dirección donde está publicada la página.
5. **Prueba sin enviar:** arriba, en la lista de funciones, elige
   `vistaPrevia` y toca **Ejecutar**.
   - Google pedirá permisos. Toca **Revisar permisos**, elige tu
     cuenta. Si aparece «Google no verificó esta app», toca
     **Configuración avanzada** → **Ir a Recordatorio retiros DTS (no
     seguro)** → **Permitir**. Es tu propio script; ese aviso sale
     siempre con scripts personales.
   - Abajo, en el **Registro de ejecución**, verás el texto del correo.
6. **Prueba enviando:** elige `enviarRecordatorio` y toca **Ejecutar**.
   Te llega el correo si hay retiros atrasados, de hoy o próximos.
7. **Activa el envío diario:** elige `instalarRecordatorioDiario` y toca
   **Ejecutar**. Listo: desde mañana llega solo cada día.

## Para detenerlo o cambiarlo

- **Detener:** ejecuta `quitarRecordatorioDiario`.
- **Cambiar la hora:** cambia `hora` en `CONFIG`, guarda y vuelve a
  ejecutar `instalarRecordatorioDiario` (reemplaza la anterior, no la
  duplica).
- Las ejecuciones diarias se ven en el menú **Ejecuciones** (icono de
  lista). Si una falla, Google te avisa por correo.

## Si algo falla

- **«Firestore respondió 403»:** la cuenta no tiene acceso al proyecto
  de Firebase. Usa la cuenta dueña o pide que te agreguen en la consola
  de Firebase → Configuración del proyecto → Usuarios y permisos.
- **«Firestore respondió 404»:** revisa `proyecto` en `CONFIG`
  (`projectId` en `web/js/config.js`).
- **No llega nada:** si no hay retiros pendientes no se envía correo.
  Para probar, pon `enviarSinNovedades: true`, ejecuta
  `enviarRecordatorio` y después vuelve a dejarlo en `false`.

## Mantención

La regla de qué es «atrasado», «hoy» y «próximo» es la misma de la
página (`retirosPorFecha` en `web/js/recepcion-datos.js`). Una prueba en
`test/verificar.mjs` comprueba que ambas den lo mismo: si cambias una,
cambia la otra y vuelve a pegar `Codigo.gs` en Apps Script.
