# TÓPICO SMART QR

**Presentación pública (abre desde cualquier dispositivo):** https://karenminayasiguenas.github.io/topico-smart-qr/

![Panel principal de TÓPICO SMART QR](docs/dashboard.png)

Sistema web completo para la gestión del inventario de medicamentos de un tópico institucional.
Implementado con **Node.js + Express + PostgreSQL**, interfaz en español con Bootstrap 5, Chart.js,
SweetAlert2, QR reales por lote y escaneo con cámara.

## Inicio rápido

```powershell
# Desde la carpeta del proyecto
npm install
npm start
```

Abrir en el navegador: **http://127.0.0.1:3100**

> Alternativa: ejecutar `scripts\iniciar.cmd` con doble clic.

### Credenciales iniciales

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin123!` | Administrador (acceso total) |
| `personal` | `Personal123!` | Personal del tópico |

Cámbielas después del primer ingreso desde **Mi cuenta → Cambiar contraseña**, o edite
`SEED_ADMIN_PASSWORD` / `SEED_STAFF_PASSWORD` en `.env` antes de la primera ejecución.

## Base de datos

El proyecto detectó PostgreSQL 15 instalado y creó su **propio clúster persistente** en
`data\pgdata` (no modifica el clúster del sistema).

- Motor: PostgreSQL 15
- Host/puerto: `127.0.0.1:55432`
- Base de datos: `topico_smart_qr`
- Usuario: `topico` (trust local)

Si el clúster no está activo (por ejemplo, tras reiniciar la computadora), `npm start` lo inicia
automáticamente con `pg_ctl.exe`. La ruta se configura en `.env` (`PG_BIN`, `PG_DATA`).
Para reinicializar el esquema y los datos base: `npm run db:init`.

## Módulos

- **Panel principal:** estadísticas calculadas desde la base de datos, gráficas de movimientos
  y categorías, últimos movimientos y alertas recientes.
- **Medicamentos:** alta, edición, consulta, desactivación y búsqueda/filtros.
- **Lotes:** varios por medicamento, vencimiento, stock mínimo, ubicación y QR único por lote.
- **Códigos QR:** generación real (paquete `qrcode`), descarga PNG, impresión, lectura por cámara
  (`html5-qrcode`) y consulta manual por token. Al abrir un QR desde el celular se muestra una ficha pública.
- **Inventario:** entradas, salidas FEFO (primero vence el lote que sale), ajustes, bloqueo de lotes
  vencidos y prevención de cantidades negativas. Todas las operaciones usan transacciones.
- **Alertas inteligentes:** stock mínimo/agotado y vencimientos a 90, 30 y 7 días; se recalculan
  automáticamente tras cada movimiento y cada 10 minutos, conservando el historial (nunca se borran).
- **Movimientos:** historial con usuario, lote, motivo, fecha y existencias antes/después.
- **Reportes:** inventario general, stock bajo, vencimientos y entradas/salidas; exportación PDF y Excel.
- **Usuarios:** administrador y personal, permisos por rol, contraseñas cifradas con bcrypt y JWT.

## Despliegue en Render (recomendado si Netlify no está disponible)

El repo incluye `render.yaml` (Blueprint). Crea una cuenta en https://render.com → **New + → Blueprint** →
conecta GitHub → selecciona `KarenMinayaSiguenas/topico-smart-qr` → **Apply**. Render crea automáticamente el
servicio Node y la base PostgreSQL, y configura `DATABASE_URL` y `JWT_SECRET`.
La URL pública será `https://topico-smart-qr.onrender.com`.

> El plan gratuito apaga el servicio tras ~15 min de inactividad; la primera visita puede tardar
> unos segundos en despertar. Para una demo continua usa el plan Starter.

## Despliegue en Netlify (con PostgreSQL en la nube)

El repositorio ya incluye `netlify.toml` y `netlify/functions/api.js`, que envuelven la API Express
como función serverless. Netlify sirve `public/` como sitio estático y redirige `/api/*` a la función.

**Paso 1 — Base de datos:** crea un proyecto PostgreSQL gratuito en https://neon.tech (o Supabase)
y copia la cadena de conexión, por ejemplo:
`postgresql://usuario:contraseña@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

**Paso 2 — Desde tu repositorio de GitHub:**
1. Entra a https://app.netlify.com → **Add new site** → **Import an existing project**.
2. Elige **Deploy with GitHub** y autoriza Netlify; selecciona `KarenMinayaSiguenas/topico-smart-qr`.
3. En *Build settings* déjalo así:
   - Base directory: *(vacío)*
   - Build command: *(vacío)*
   - Publish directory: `public`
   - Functions directory: `netlify/functions` (ya viene en `netlify.toml`)
4. Antes de publicar, entra en **Site configuration → Environment variables** y agrega:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | La cadena de conexión de Neon/Supabase |
   | `JWT_SECRET` | Una frase larga y aleatoria (ej. `cambia-esto-por-una-clave-muy-segura-2026`) |

5. Presiona **Deploy site**. La URL pública queda en el panel de Netlify.

**Usuarios iniciales** se crean automáticamente la primera vez: `admin / Admin123!` y
`personal / Personal123!`. Cámbialas después de ingresar.

> Nota: la API usa `DATABASE_URL` con SSL cuando la variable existe; si no existe, usa el clúster
> PostgreSQL local. Las alertas se evalúan en el arranque de la función y tras cada movimiento.
> En Netlify el plan gratuito tiene límites de invocaciones; suficiente para una demostración.

## Pruebas automatizadas ejecutadas

```powershell
npm test                 # 31 verificaciones de API, base de datos, QR, FEFO, alertas y reportes
node tests/browser.test.js  # 23 verificaciones en Chrome headless (páginas, botones y formularios)
npm run test:netlify        # 4 verificaciones de la Netlify Function con BD local
```

Los datos creados por las pruebas se eliminan automáticamente al finalizar.

## Notas

- La cámara para escanear QR requiere acceder desde `127.0.0.1` o HTTPS (política del navegador).
- Las librerías de frontend están incluidas en `public\vendor`, por lo que no se depende de CDNs.
- Los archivos originales del proyecto (`index.html`, `js/`, `css/styles.css`, `server.mjs`) se
  conservaron. La aplicación nueva se sirve desde `public/` con Express.
- En producción cambie `JWT_SECRET` en `.env` por una clave larga y aleatoria.
