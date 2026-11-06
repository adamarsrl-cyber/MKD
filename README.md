# Portal de Estudios Bíblicos RVR1960

Sitio web estático (HTML/CSS/JS puro, sin servidor propio) para leer en línea los
estudios bíblicos RVR1960 escritos en **Markdown (.md)**. El portal lee los archivos
.md directamente, los convierte a una página limpia y ofrece índice de contenido,
tamaño de letra ajustable, impresión, descarga y navegación entre estudios.

## 1. Puesta en marcha en tu computadora (Windows)

1. Copia dentro de la carpeta `md/` el **contenido** de tu carpeta `MKD`, de modo que
   existan `md/libro-completo/`, `md/por-capitulo/`, `md/tematicos/`, `md/parabolas/`,
   `md/bienaventuranzas/`, `md/ayudas-especiales/` y `md/ayudas-espirituales/`.
   No cambies nombres de carpetas ni de archivos.
2. Ejecuta **`actualizar_catalogo.bat`** una vez. Lee los .md y toma el título real de
   cada estudio (el primer `# Título` o el campo `title:`), de modo que las listas y el
   buscador muestren, por ejemplo, el nombre de cada parábola en lugar de
   "parábola 3". También avisa si falta algún archivo.
3. Ejecuta **`inicio.bat`**. Abre el portal en `http://localhost:8000`.

> Importante: el portal **no se puede abrir con doble clic en `index.html`** para leer
> los estudios, porque el navegador bloquea que una página local lea otros archivos.
> Usa `inicio.bat` (necesita Python instalado) o, desde una terminal en esta carpeta,
> `python -m http.server 8000`. Una vez publicado en internet (sección 2) no hace falta
> nada de esto.

## 2. Cómo publicarlo gratis en internet

Cualquiera de estas tres opciones aloja sitios estáticos **sin costo**:

### Opción A — Cloudflare Pages (recomendada, muy rápida en Bolivia/Latam)
1. Crea una cuenta gratuita en https://pages.cloudflare.com
2. Sube esta carpeta completa (arrastrando los archivos) o conéctala a un
   repositorio de GitHub.
3. Cloudflare te da una dirección como `tu-sitio.pages.dev` de inmediato.
4. Opcional: puedes conectar un dominio propio (`.org`, `.com`) más adelante,
   también gratis si usas el dominio gratuito que da Cloudflare.

### Opción B — GitHub Pages
1. Crea una cuenta gratuita en https://github.com
2. Crea un repositorio nuevo (por ejemplo `estudios-biblicos`).
3. Sube todos los archivos de esta carpeta al repositorio.
4. Ve a **Settings → Pages**, elige la rama `main` y la carpeta raíz.
5. En un par de minutos el sitio queda publicado en
   `https://tu-usuario.github.io/estudios-biblicos/`.

### Opción C — Netlify
1. Crea una cuenta gratuita en https://netlify.com
2. Arrastra esta carpeta directamente a la web de Netlify ("Deploy manually").
3. Netlify publica el sitio al instante con una dirección gratuita.

En cualquiera de las tres, cada vez que agregues o cambies estudios solo tienes que
volver a subir la carpeta (o hacer `git push` si usas GitHub).

Sube también la carpeta `md/` con los estudios (unos 46 MB en total, muy por debajo de los
límites gratuitos de Cloudflare Pages, GitHub Pages y Netlify). En hosting con
distinción de mayúsculas/minúsculas (GitHub Pages, Cloudflare) los nombres de archivo
deben coincidir exactamente, por ejemplo `Zacarias-10-vf.md` con Z mayúscula.

## 3. Cómo se leen los archivos .md

`js/catalogo.js` enlaza cada uno de los 1427 estudios con su archivo .md (campo `md`).
Ese catálogo se genera con `gen_catalogo.py` a partir de la carpeta `md/` (o, si
está vacía, del listado `indexmd.txt`). Al tocar un estudio, `visor.html?id=...`:

- descarga el .md desde la carpeta `md/` (acepta UTF-8 y, como respaldo, Windows-1252);
- ignora el bloque inicial `--- ... ---` (front matter) si existe;
- lo convierte a HTML con **marked** y lo limpia con **DOMPurify** (se bloquean
  scripts y enlaces peligrosos aunque estén escritos dentro del .md);
- arma el índice de contenido con los encabezados `##` y `###`;
- convierte los enlaces relativos a otros .md en enlaces al lector, y resuelve las
  imágenes relativas a la carpeta del archivo.

Los estudios con mayúsculas o nombres irregulares (`Zacarias-NN`, `2_timoteo-NN`,
`06-jouse-ec`, carpeta `03-Levitio`, etc.) se vinculan por el número de libro y de
capítulo, no por el nombre exacto de la carpeta, así que funcionan tal como están.

### Cómo agregar o cambiar un estudio

1. Coloca el .md en la carpeta que corresponde dentro de `md/`, con el mismo patrón
   de nombre que los demás (por ejemplo `por-capitulo/NT/04-San-Juan/san-juan-03-vf.md`).
2. Ejecuta `actualizar_catalogo.bat` para que el catálogo lo reconozca y lea su título.
3. Vuelve a subir los archivos al hosting.

Si solo corriges el texto de un .md que ya existe, basta con reemplazar el archivo:
el lector siempre pide la versión más reciente.

### Correspondencia de carpetas con el catálogo

| Carpeta en `md/` | Catálogo | Archivos |
|---|---|---|
| `libro-completo` | Libros completos (por número de libro 01–66) | 66 |
| `por-capitulo/AT`, `por-capitulo/NT` | Estudios por capítulo | 1189 |
| `tematicos/AT`, `tematicos/NT` | Estudios temáticos (01–05 en cada testamento) | 10 |
| `parabolas` | Parábolas | 52 |
| `bienaventuranzas` | Bienaventuranzas | 9 |
| `ayudas-especiales` | Ayudas Bíblicas (`encontrarayudabiblico-NN`) | 68 |
| `ayudas-espirituales` | Ayudas Bíblicas Solicitadas (`ayuda-especial-NN`) | 33 |

Si alguna vez se mezclan los nombres de las dos carpetas de ayudas, se corrige
en `gen_catalogo.py` (constantes y llamadas a `simple(...)`).

## 5. Formularios que necesitan un servicio externo gratuito

Este sitio es 100% estático (no tiene servidor propio), así que tres
funciones necesitan conectarse a un servicio externo **gratuito** para
funcionar de verdad con todos los visitantes:

| Función | Archivo | Servicio gratuito sugerido |
|---|---|---|
| Formulario de contacto | `contacto.html` | [Formspree](https://formspree.io) (plan gratuito, 50 mensajes/mes) — reemplazar `TU_ID_DE_FORMSPREE` en el `action` del formulario |
| Boletín por correo | `comunidad.html` | [Buttondown](https://buttondown.email) o Mailchimp (planes gratuitos) |
| Muro de oración compartido entre visitantes | `comunidad.html` | Hoy guarda las peticiones solo en el navegador de cada visitante (`localStorage`), como demostración. Para que todos vean las mismas peticiones hace falta una base de datos simple gratuita, por ejemplo Google Sheets + Formspree, o Firebase (plan gratuito) |
| Comentarios en cada estudio (`visor.html`) | — | [Giscus](https://giscus.app) (gratuito, usa GitHub Discussions) es la opción más simple para un sitio ya alojado en GitHub Pages |

Ninguno de estos es obligatorio para publicar el sitio: sin conectarlos,
el catálogo de estudios, el buscador y la lectura de los estudios funcionan
igual. Son mejoras para cuando haya tiempo de configurarlas.

## 6. Estructura del proyecto

```
index.html                Inicio (héroe, declaración de fe, buscador, redes)
estudios.html             Catálogo por libro/capítulo/tema/ayudas
visor.html                Lector de estudios en Markdown
multimedia.html           Audio, video, infografías (espacios reservados)
comunidad.html            Devocional, muro de oración, boletín, ofrendas
contacto.html             Formulario de contacto y redes sociales
css/estilos.css           Estilos de todo el sitio (incluye el lector e impresión)
js/config.js              RUTA_BASE_MD (carpeta de los .md) y utilidades
js/catalogo.js            Datos de los 1427 estudios (generado por gen_catalogo.py)
js/visor.js               Lector: carga, convierte y muestra el .md
js/componentes.js         Cabecera y pie de página compartidos
js/buscador.js            Buscador interno (títulos, libros y capítulos)
js/estudios.js            Lógica de la página de estudios
js/main.js                Utilidades varias
js/vendor/                marked y DOMPurify (copias locales, con sus licencias)
md/                       Aquí van los archivos .md (contenido de MKD)
indexmd.txt               Listado de archivos .md usado como respaldo por el generador
gen_catalogo.py           Genera js/catalogo.js (desde md/ o desde indexmd.txt)
inicio.bat                Abre el portal en http://localhost:8000
actualizar_catalogo.bat   Ejecuta gen_catalogo.py
```
