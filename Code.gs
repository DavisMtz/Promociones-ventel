/**
 * Promociones Ventel - Constructor de mensajes de tarjeta para Google Chat
 * --------------------------------------------------------------------------
 * Web App en Google Apps Script que permite construir mensajes de tarjeta
 * (cardsV2) de Google Chat de forma visual, subir imagenes a Drive y enviarlos
 * a un webhook configurable.
 */

// Nombre de la carpeta de Drive donde se guardan las imagenes subidas.
var FOLDER_NAME = 'Mensajes ventel';

// Claves usadas en PropertiesService (por usuario) para recordar el webhook.
var PROP_WEBHOOK = 'VENTEL_WEBHOOK_URL';

/**
 * Punto de entrada de la Web App. Sirve la interfaz HTML.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Anuncios Liverpool - Constructor de mensajes')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Permite incluir archivos HTML parciales (CSS / JS) dentro de Index.html.
 * Uso en la plantilla: <?!= include('Stylesheet'); ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ===========================================================================
 *  WEBHOOK: guardar / leer
 * ======================================================================== */

/**
 * Devuelve el webhook guardado para este usuario (o cadena vacia).
 */
function getSavedWebhook() {
  try {
    var url = PropertiesService.getUserProperties().getProperty(PROP_WEBHOOK);
    return url || '';
  } catch (e) {
    return '';
  }
}

/**
 * Guarda el webhook para reutilizarlo en futuras sesiones.
 */
function saveWebhook(url) {
  PropertiesService.getUserProperties().setProperty(PROP_WEBHOOK, String(url || '').trim());
  return true;
}

/* ===========================================================================
 *  IMAGENES: subir a Drive
 * ======================================================================== */

/**
 * Obtiene (o crea si no existe) la carpeta "Mensajes ventel" en Drive.
 * @return {Folder}
 */
function getOrCreateFolder_() {
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(FOLDER_NAME);
}

/**
 * Guarda una imagen (enviada como Data URL base64) en la carpeta de Drive,
 * la hace publica para que Google Chat pueda mostrarla y devuelve la URL.
 *
 * @param {string} dataUrl  Cadena tipo "data:image/png;base64,...."
 * @param {string} fileName Nombre original del archivo.
 * @return {{url: string, id: string, name: string}}
 */
function uploadImage(dataUrl, fileName) {
  if (!dataUrl || dataUrl.indexOf('base64,') === -1) {
    throw new Error('No se recibio una imagen valida.');
  }

  // Separar el encabezado del Data URL para obtener mimeType y los datos.
  var matches = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!matches) {
    throw new Error('Formato de imagen no reconocido.');
  }
  var mimeType = matches[1];
  var base64 = matches[2];

  var bytes = Utilities.base64Decode(base64);
  var safeName = (fileName || 'imagen').replace(/[\\/:*?"<>|]/g, '_');
  var blob = Utilities.newBlob(bytes, mimeType, safeName);

  var folder = getOrCreateFolder_();
  var file = folder.createFile(blob);

  // Hacer la imagen visible para cualquiera con el enlace (necesario para Chat).
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    // En algunos dominios el sharing publico esta restringido; se continua igual.
  }

  var id = file.getId();
  return {
    id: id,
    name: file.getName(),
    // Endpoint "thumbnail" de Drive: sirve la imagen (PNG/JPG) con su
    // content-type a peticiones ANONIMAS, que es como Google Chat la pide.
    // (uc?export=view dejo de funcionar y lh3/d/ requiere sesion iniciada.)
    url: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1600'
  };
}

/* ===========================================================================
 *  ENVIO al webhook
 * ======================================================================== */

/**
 * Envia el payload (objeto JSON ya construido) al webhook de Google Chat.
 *
 * @param {string} webhookUrl  URL del webhook de Google Chat.
 * @param {Object} payload     Objeto del mensaje (text y/o cardsV2).
 * @return {{ok: boolean, code: number, body: string}}
 */
function sendToWebhook(webhookUrl, payload) {
  var url = String(webhookUrl || '').trim();
  if (!url) {
    throw new Error('Falta la URL del webhook.');
  }
  if (!/^https:\/\/chat\.googleapis\.com\//.test(url)) {
    throw new Error('La URL no parece un webhook de Google Chat (debe iniciar con https://chat.googleapis.com/).');
  }
  if (!payload || (typeof payload !== 'object')) {
    throw new Error('El contenido del mensaje no es valido.');
  }

  var options = {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error('Google Chat respondio con error ' + code + ': ' + body);
  }

  // Guardar el webhook usado para futuras sesiones.
  try { saveWebhook(url); } catch (e) {}

  return { ok: true, code: code, body: body };
}
