# Juancho Pérez ServiceDesk

Sistema web de órdenes de servicio técnico para taller de computadores: recepción de equipos, tablero de taller, consulta de estado para clientes, reportes en PDF y gestión de usuarios por rol.

**Created By: Juan C. Pérez**

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `servicedesk`), público.
2. Sube **el contenido** de esta carpeta a la raíz del repositorio (no la carpeta en sí). En la raíz deben quedar `index.html`, `404.html`, `.nojekyll`, `README.md` y la carpeta `assets/`.
   - Desde la web: *Add file → Upload files* y arrastra todo. El archivo `.nojekyll` está oculto en Windows/Mac: actívalo en "mostrar archivos ocultos" o créalo en GitHub con *Add file → Create new file* (nombre `.nojekyll`, vacío).
3. Ve a **Settings → Pages**. En *Build and deployment* elige **Deploy from a branch**, rama **main**, carpeta **/ (root)** y pulsa **Save**.
4. Espera 1–2 minutos. El sitio queda en `https://TU-USUARIO.github.io/servicedesk/`.

### Por qué esta versión no da problemas en GitHub

- El archivo principal se llama `index.html` y es un documento HTML completo.
- Todas las rutas son relativas (`assets/...`), así que funciona dentro de `usuario.github.io/repositorio/`.
- `.nojekyll` evita que GitHub procese los archivos con Jekyll.
- Las librerías de PDF (jsPDF) van incluidas en `assets/vendor/`; no depende de ningún CDN.
- No contiene llaves ni tokens reales (la conexión a Supabase es solo visual).

## Usuarios iniciales

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin` | `Admin2026` |
| Recepción | `recepcion` | `Recepcion2026` |
| Técnico | `tecnico` / `tecnico2` | `Tecnico2026` |
| Cliente | `cliente` | `Cliente2026` |

Entra como administrador y, en **Usuarios**, crea las cuentas reales, asigna roles, cambia las contraseñas iniciales o desactiva las que no uses. Las contraseñas se guardan cifradas (SHA-256), nunca en texto plano.

## Dónde se guardan los datos

GitHub Pages solo publica archivos estáticos (no tiene servidor ni base de datos). Por eso los usuarios, órdenes y reportes se guardan en el **almacenamiento del navegador** de cada computador:

- Los datos permanecen aunque cierres el navegador o apagues el equipo.
- Cada navegador/computador tiene su propia copia. Para pasar los datos a otro equipo usa **Usuarios → Respaldo de datos** (descargar y cargar `.json`).
- Cada orden, informe técnico y listado se respalda además en **PDF**.
- El inicio de sesión funciona en el navegador; sirve para separar roles, no como seguridad de servidor. Para varios equipos trabajando sobre los mismos datos en tiempo real, el siguiente paso sería conectar una base de datos real (por ejemplo Supabase).

## Estructura

```
index.html                 Página principal
404.html                   Redirige al inicio
.nojekyll                  Desactiva Jekyll en GitHub Pages
assets/css/styles.css      Estilos (colores del proyecto)
assets/js/app.js           Lógica de la aplicación
assets/img/logo.svg        Logo Juancho Pérez
assets/vendor/             jsPDF y jsPDF-AutoTable (generación de PDF)
```
