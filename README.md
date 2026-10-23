# Checklist de salida — DTS Autoservicio

Panel para registrar la salida de equipos de hardware, guardarlos
y descargar el PDF. El acceso es con correo y contraseña. Solo un
perfil administrador entra al listado.

Firebase es la base de este panel: Authentication, Firestore y
Hosting. Los filtros se aplican en el navegador sobre los últimos
500 registros, así no dependen de índices compuestos.

## Vista previa en este equipo

Sin configurar Firebase puedes recorrer el panel:

```text
cd web
python -m http.server 8080
```

Abre `http://127.0.0.1:8080/?demo=1#/listado`.

Esa vista solo funciona en localhost y no escribe en Firebase.

## Conectar Firebase

1. Crea un proyecto en la consola de Firebase.
2. Agrega una app web y copia el SDK en `web/js/config.js`.
3. En Authentication activa el proveedor Correo/contraseña.
4. Crea el usuario administrador.
5. Crea la base Firestore.
6. En Firestore crea la colección `usuarios`. El id del documento
   es el UID del usuario (Authentication > Users). Campos:
   - `rol`: `admin`
   - `nombre`: el nombre que se sugiere en el checklist
   - `email`: el correo del usuario
7. Publica las reglas: `firebase deploy --only firestore:rules`
8. Para publicar el panel: `firebase deploy --only hosting`

En producción el sitio debe servirse por HTTPS. Firebase Hosting
ya lo hace. Agrega el dominio en Authentication > Settings >
Authorized domains.

La contraseña del administrador no va en el código. La `apiKey`
web es pública; quien protege los datos son las reglas.

## Registro de errores

El navegador no puede escribir `error.log` en un servidor. Los
errores quedan en `localStorage`, clave `dts_error_log`, con
rotación bajo 1 MB. Si `produccion` es `true` en `web/js/config.js`,
no se imprimen en la consola.

## Cartilla de ruta

Rutas `#/cartillas` (listado) y `#/cartilla` (formulario). Se
guarda en la colección `cartillasRuta` y su correlativo vive en
`contadores/cartillasRuta`. El catálogo de secciones está en
`web/js/cartilla-catalogo.js`. Periféricos, testing y
configuraciones del cliente son listas: solo se guardan y se
imprimen los elementos marcados.

## Costos hardware

- **Costos hardware → Base de costos HW** (`#/costos`, `#/costo`):
  colección `baseCostosHw`. Cada costo tiene línea de producto
  (Autoservicio, CleverQ, Click&Collect o Mercadata), tipo de
  equipo, modelo, moneda (USD, CLP o UF), costo, fecha de
  actualización, documento de costeo y una hoja de costeo
  opcional. Exporta CSV y un resumen PDF.
- **Hoja de costeo** (reemplaza las pestañas y los ON/OFF de
  «The Real Costo Operacional»): parámetros (moneda del costo,
  cantidad de equipos, dólar y UF en CLP) y una pestaña por
  categoría (Dispositivos, Arneses, Metalmecánica, Logística,
  Ferretería, Insumos, SW, HH y Otros). Cada pestaña muestra de
  inmediato todos sus componentes; se marca «Incluir» y se completa
  cantidad por equipo (admite decimales), moneda, valor unitario,
  fabricante y link de cotización (solo `http://` o `https://`;
  «Abrir» lo abre en otra pestaña). Escribir un valor marca la
  fila sola. Máximo 200 componentes por costo. Cada fila se convierte a
  la moneda del costo; el costo por equipo es la suma y el lote
  es costo × cantidad. Muestra un resumen por categoría con su
  porcentaje. La guía de cada campo está en el mismo formulario
  («¿Cómo se usa esta hoja de costeo?», `AYUDA_COSTEO` en
  `web/js/costo-textos.js`). Los cálculos están en
  `web/js/costeo.js`. Al crear un costo, dólar y UF se proponen
  con la cotización del día (`web/js/tipo-cambio-dia.js`). Si esa
  consulta falla, se usan `tipoCambioUsd` y `valorUf` en
  `web/js/config.js`. En el listado, «Dólar del día» deja elegir
  la fecha: los equivalentes usan esa cotización (si el día no
  tuvo valor, el último hábil). En la hoja de costeo, ese día
  completa el dólar y la UF.
- **Historial de cotización**: cada costo guarda en `historial`
  (hasta 100 entradas) la fecha de guardado, el dólar y su día de
  cotización, la UF, el costo por equipo, el lote, la variación y
  quién lo registró. Se agrega una línea al crear y cada vez que
  cambia el costo, el dólar, la UF o la cantidad de equipos. Los
  costos anteriores muestran su cotización inicial. La lógica está
  en `web/js/costo-historial.js`. «Cliente / configuración» ya no
  se pide; los registros antiguos conservan el dato.
- **Modelo, costo y cliente**: el modelo es el equipo del catálogo
  (solo se crea en «Modelos»); guardar un costo no crea modelos.
  Cada costo es una cotización de un modelo. «Cliente de la
  cotización» es una receta de piezas: al elegirlo se marcan sus
  piezas y, si corresponde, las HH. Hay 42 clientes fijos de la
  planilla (`web/js/clientes-cotizacion.js`) y los creados con
  «Guardar piezas como cliente nuevo», que van a la colección
  `clientesCotizacion` (`APP.coleccionClientesCotizacion`).
  «Duplicar» (en la lista o en el costo abierto) abre un costo
  nuevo con los datos y piezas de otro, al dólar y UF del día y
  sin historial (`#/costo?copia=<id>`).
- **HH**: la pestaña de mano de obra usa la tabla de la hoja HH
  (`web/js/hh-tareas.js`): horas por equipo × valor UF × 1,2.
- **Lista de componentes**: cada pestaña tiene buscador, filtro
  «Solo seleccionados», subtotal y «Agregar componente manual»
  para lo que no está en la lista. La lista está en
  `web/js/catalogo-componentes.js` (`[tipo, componente,
  descripción]` por categoría) y se carga al abrir un costo. Los
  registros antiguos se recuperan: lo que coincide con la lista se
  marca en su fila; el resto aparece como manual en su pestaña.
  Lo agregado a mano va arriba de la lista y, al abrir un costo
  guardado, cada pestaña con piezas parte en «Solo seleccionados».
- **Día de la cotización**: campo propio junto al dólar y la UF.
  Bajo él se indica si los valores son de ese día, de referencia
  (no hubo cotización) o escritos a mano.
- **Modelos** (`#/modelos`, `#/modelo`): catálogo en `modelosHw`.
  Tipo, nombre, otro nombre, estado, clientes e imagen (JPEG bajo
  150 KB).
- **Especificaciones técnicas** (`#/especificaciones`,
  `#/especificacion`): la ficha técnica del mismo modelo
  (computador, pantalla, conectividad, energía). No se crea sola:
  primero existe el modelo. Cada tarjeta y la ficha abierta muestran
  cuántos de los 13 datos están completos (`avanceFicha` en
  `web/js/hw-catalogo.js`) y el listado filtra las fichas con datos
  pendientes. La ficha abierta enlaza a su modelo, lista los costos
  con el mismo nombre de modelo y ofrece «Nuevo costo de este
  modelo» (`#/costo?modelo=<id>`), que parte con el nombre y el tipo.
  El costo, a su vez, enlaza a la ficha técnica si el modelo está en
  el catálogo.
- **Cambios sin guardar**: checklist, cartilla, costo, modelo,
  ficha técnica, ficha de configuración y detalle del enlace avisan
  antes de salir con cambios pendientes, firmas incluidas
  (`web/js/cambios-pendientes.js`).

Costo y modelo se relacionan por el nombre del modelo, sin
distinguir mayúsculas, tildes ni espacios. Con la colección vacía
aparece «Importar planilla de referencia», que carga los datos de
`Resumen costos Hardware.xlsx` (`web/js/datos-planilla.js`).
Catálogos editables (líneas, monedas, campos de la ficha) en
`web/js/hw-catalogo.js`.

## Reglas y validaciones

- **Storage** está cerrado (`storage.rules`): la app no sube
  archivos; el PDF de la ficha de cliente se arma en el navegador.
- **Enlace del cliente** (`fichasCliente`): sin sesión solo se lee
  mientras el plazo está vigente (guarda claves). El cliente solo
  cambia sus respuestas, su nombre, el estado y agrega historial;
  no toca plazo, token, auditoría ni el PDF. El historial guarda
  las últimas 80 acciones.
- **Checklist**: la fecha de inspección no puede ser futura y la de
  salida no puede ser anterior a ella. Una MAC o IP mal escrita
  explica el formato. Un N° de serie repetido pide confirmar.
  «Marcar todo OK» no responde por el técnico las preguntas Sí/No
  (¿Tiene BAM?).
- **Cartilla**: DNS2 y Proxy son opcionales.
- **Costos**: la fecha de actualización no puede ser futura; un
  modelo fuera del catálogo pide confirmar. Al elegir un modelo del
  catálogo se marca su tipo.
- **Modelos**: al renombrar un modelo con costos, se ofrece cambiar
  el nombre también en esos costos (`web/js/modelo-costos.js`); al
  eliminarlo, se avisa cuántos costos lo usan.
- **Ficha de configuración**: «Nueva ficha» parte en blanco;
  «Ejemplo SURALIS» carga la ficha de referencia. Una ficha guardada
  se puede duplicar y eliminar. Abrir un enlace de cliente ya no
  reemplaza lo que se edita en «Editar ficha».
- **Enlaces de cliente**: piden un nombre con letras y un plazo
  futuro; un nombre repetido pide confirmar; ampliar el plazo admite
  de 1 a 90 días y avisa si reabre una ficha finalizada.

Pruebas: `node test/verificar.mjs`. Las reglas se prueban con el
emulador (requiere Java), en una carpeta con las herramientas:

```text
npm install firebase-tools @firebase/rules-unit-testing firebase
npx firebase emulators:exec --only firestore,storage \
  --project demo-dts "node test/reglas/reglas.test.mjs"
```

Después de cambiar reglas, publícalas:
`firebase deploy --only firestore:rules,storage`.

## Menú y diseño

El menú sigue el flujo de trabajo: Checklist de salida, Cartilla de
ruta, **Equipos y costos** (Modelos, Especificaciones técnicas,
Base de costos HW) y **Ficha de configuración** (Fichas guardadas,
Enlaces para clientes). Los listados comparten el mismo estilo:
filtros en un panel, tablas con encabezado fijo y acciones compactas
(«capa de orden visual» al final de `web/css/app.css`). En pantallas
angostas las tablas se desplazan dentro de su recuadro.

## Simulación del tótem (1.1 Config. menú)

La simulación muestra el mueble completo (cabezal, pantalla, ranura de
impresión y base) y recorre el flujo real: descanso, tipo de
atención, RUT, trámite y subtrámite. Al emitir el ticket se abre una
escena animada (`web/js/sim-ticket-cine.js`, solo CSS, sin archivos
de video): el tótem imprime, el papel sale por la ranura y la vista se
acerca hasta leer el ticket con su código (letra del trámite o «P»
si es preferente), trámite, RUT, tótem, fecha y personas en espera.
«Ver impresión» la repite. Respeta «reducir movimiento».

El video de descanso se busca en `web/assets/dtsdescanso.mp4`. Ese
archivo no está en el repositorio: mientras falte, se muestra una
pantalla de descanso animada con la marca. Para usar el video real,
cópialo en esa ruta.

## Recepción de equipos

Rutas `#/recepcion` (panel) y `#/recepcion-local?id=<id>` (local).
Sirve para recibir en bodega los equipos que vuelven al terminar un
contrato (por ejemplo, Walmart Líder, locales LID01, LID02…).

- **Colección** `recepcionLocales`: un documento por local con su
  contrato, código, nombre, región (las 16 de Chile), comuna,
  dirección, contacto, retiro programado, transportista, guía de
  despacho, notas y sus equipos (hasta 20). Reglas en
  `firestore.rules` (`localRecepcionValido`); el código no se repite
  dentro de un contrato.
- **Retiros programados:** el panel separa los locales con equipos
  aún pendientes de retiro en Atrasados (con los días de atraso), Hoy
  y Próximos 3 días (`DIAS_AVISO_RETIRO`), según su fecha de retiro
  programado. La tabla de locales también marca los atrasados.
- **Etapas por equipo:** Pendiente de retiro → En tránsito → Recibido
  en bodega → Revisado. Al pasar a Recibido se proponen la fecha de
  hoy y quien recibe. La etapa del local es la de su equipo más
  atrasado.
- **Revisión por componente** (`web/js/recepcion-catalogo.js`):
  estructura, pantalla y touch, computador (placa/mini PC, disco,
  RAM, fuente), periféricos (impresora, lector, parlantes) y
  conexiones (cables, router/BAM, UPS). Cada uno OK, Dañado, Falta o
  No aplica, con nota si hay problema; más «¿Enciende?». Resultado:
  Incompleto si falta algo, Con daños si algo está dañado o no
  enciende, si no Completo y OK. Para guardar un equipo como Revisado
  hay que evaluar todos sus componentes.
- **Panel:** recibidos y revisados, avance por región (norte a sur),
  novedades para reclamar (qué componente falta o vino dañado y en
  qué locales), filtros, CSV por equipo y «Recibir rápido» por N° de
  serie o código de local.
- **Importar desde Excel:** copiar las filas con encabezados (Código,
  Nombre, Región, Comuna, Dirección, Equipos, Modelo, Serie, Tipo) y
  pegarlas. La región se reconoce como «RM», «13», «Valparaíso»,
  «Región del Biobío», «VIII»… Se muestra un resumen antes de
  importar y se omiten los códigos que ya existen.
- Lógica pura y probada en `web/js/recepcion-datos.js`.

## Módulos siguientes

El menú ya reserva Usuarios. Ese acceso está desactivado hasta que
se construya.
