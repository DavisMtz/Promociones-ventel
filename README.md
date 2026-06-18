# Anuncios Liverpool — Constructor de mensajes para Google Chat

Aplicación web en **Google Apps Script (GAS)** para construir, previsualizar y
enviar mensajes de tarjeta (**cardsV2**) a Google Chat mediante un webhook,
sin escribir JSON a mano.

## ✨ Características

- **Editor visual** de tarjetas de Google Chat (estructura `cardsV2`).
- **Encabezado** con título, subtítulo, imagen (círculo o cuadrado) y texto alternativo.
- **Secciones colapsables** y **reordenamiento** (▲ ▼) de secciones y elementos.
- **Widgets** que se agregan/quitan dinámicamente:
  - 📝 **Texto** (admite HTML: `<b>`, `<i>`, `<a href="">`)
  - 🖼️ **Imagen** (con enlace al hacer clic)
  - 🔘 **Botones** con estilo (relleno / contorno / tonal / sin borde), color e icono
  - 🏷️ **Texto decorado** (icono, etiqueta superior/inferior, texto y botón lateral)
  - 🔖 **Chips** (con icono y enlace)
  - 🔲 **Cuadrícula** (grid de 1–3 columnas con imagen, título y subtítulo)
  - ➖ **Separador**
- **Iconos integrados** de Google Chat (knownIcon) para botones, chips y texto decorado.
- **Imágenes por enlace o por subida**: las imágenes subidas se guardan en
  la carpeta de Drive **«Mensajes ventel»** (se crea automáticamente si no
  existe) y se hacen públicas para que Chat pueda mostrarlas. Los enlaces de
  Drive pegados se convierten automáticamente al formato que Chat sí renderiza.
- **Webhook editable** y recordado entre sesiones (`PropertiesService`).
- **Previsualización** en vivo con apariencia de tarjeta de Google Chat.
- **JSON generado** visible y copiable, construido y validado correctamente.
- **Doble confirmación** antes de enviar (modal con el destino + confirmación final).

> ℹ️ **Sobre las imágenes:** Google Chat pide las imágenes de forma **anónima**
> desde sus servidores, así que la URL debe servir el PNG/JPG sin sesión
> iniciada. Los enlaces `uc?export=view` (obsoleto) y `lh3.googleusercontent.com/d/`
> (requiere sesión) **no funcionan** dentro del mensaje. La app usa el endpoint
> `https://drive.google.com/thumbnail?id={ID}&sz=w1600`, que sí responde a
> peticiones anónimas, y convierte automáticamente cualquier enlace de Drive
> que pegues a ese formato. La imagen debe ser pública (la subida lo hace
> automáticamente con «cualquiera con el enlace»).

> ⚠️ **Widgets interactivos:** campos de texto, listas desplegables, selectores
> de fecha e interruptores **no** funcionan por webhook entrante porque
> requieren una app de Chat que procese las interacciones. Por eso el
> constructor incluye solo elementos que sí se muestran al enviar por webhook.

## 📁 Archivos

| Archivo | Descripción |
|---|---|
| `Code.gs` | Lógica del servidor: servir HTML, subir imágenes a Drive, enviar al webhook, guardar el webhook. |
| `Index.html` | Estructura de la interfaz. |
| `Stylesheet.html` | Estilos (incluido en `Index.html`). |
| `JavaScript.html` | Lógica del cliente: estado, formulario dinámico, preview, JSON y envío. |
| `appsscript.json` | Manifiesto (scopes y configuración de la Web App). |

## 🚀 Despliegue

### Opción A — Editor de Apps Script (manual)

1. Entra a <https://script.google.com> y crea un **proyecto nuevo**.
2. Crea los archivos con estos nombres exactos y pega el contenido:
   - `Code.gs`
   - `Index.html`, `Stylesheet.html`, `JavaScript.html` (Archivo → Nuevo → HTML)
3. En **Configuración del proyecto** activa *«Mostrar el archivo de manifiesto
   `appsscript.json`»* y pega el contenido del manifiesto.
4. **Implementar → Nueva implementación → Aplicación web**.
   - *Ejecutar como:* **Yo**
   - *Quién tiene acceso:* **Solo yo** (o según necesites)
5. Autoriza los permisos solicitados (Drive y solicitudes externas).
6. Abre la URL de la Web App.

### Opción B — clasp (línea de comandos)

```bash
npm install -g @google/clasp
clasp login
clasp create --type webapp --title "Promociones Ventel"
clasp push
clasp deploy
```

## 🔑 Cómo obtener el webhook de Google Chat

1. En el espacio de Google Chat: **menú del espacio → Apps e integraciones →
   Webhooks → Agregar webhook**.
2. Copia la URL (empieza con `https://chat.googleapis.com/...`).
3. Pégala en el campo **Webhook de destino** de la app y pulsa **Guardar**.

## 🔒 Permisos (scopes)

- `script.external_request` — enviar el mensaje al webhook.
- `drive` — crear la carpeta «Mensajes ventel» y guardar imágenes.
- `userinfo.email` — identificar al usuario para recordar su webhook.

## 📝 Notas

- El payload solo incluye `cardsV2` cuando la tarjeta tiene contenido; el
  texto simple es opcional e independiente.
- Las imágenes subidas se comparten como *«cualquiera con el enlace»* para que
  Google Chat pueda renderizarlas. Si tu organización restringe el uso
  compartido público, usa la opción de pegar una URL ya pública.
