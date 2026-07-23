/**
 * @file Deployment.gs
 * @description Script para automatizar la actualización masiva de hojas de clientes.
 * Vincula programáticamente cada hoja de cliente a la biblioteca compartida centralizada.
 * Versión optimizada con escáner inteligente de pestañas tolerante a espacios ocultos,
 * menú de ejecución rápida integrado y estándares de ES6 (const/let).
 */

// ID de prueba de la biblioteca maestra de la plantilla original
const MASTER_LIBRARY_ID = "1KeQgiXH8pWkKLoAvfNvVFsUwhP8QFcidSZt-kNlQWhn9h-lCTJsntd-l";

// Código autogenerado (stub) que se inyectará en cada cliente
const CLIENT_STUB_CODE = `
// Código autogenerado para enlazar con la Biblioteca Maestra
function onOpen() {
  MasterLibrary.onOpen();
}
function runMonthlyComparativeReport() {
  MasterLibrary.runMonthlyComparativeReport();
}
function showAdminPrompt() {
  MasterLibrary.showAdminPrompt();
}
function resetAdminMenu() {
  MasterLibrary.resetAdminMenu();
}
function setNewAdminCode() {
  MasterLibrary.setNewAdminCode();
}
`;

/**
 * Se ejecuta automáticamente al abrir la hoja de administración.
 * Crea un menú personalizado en la barra superior para lanzar el despliegue con un clic.
 */
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('Despliegue 🛠️')
      .addItem('🚀 Ejecutar Despliegue Masivo', 'deployToAllClients')
      .addToUi();
  } catch (e) {
    Logger.log("Aviso: No se pudo crear el menú en este contexto.");
  }
}

/**
 * Recorre la pestaña de Clientes, busca las URLs de la columna A e inyecta la solución.
 */
function deployToAllClients() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // BÚSQUEDA DINÁMICA INTELIGENTE:
  // Recorre todas las pestañas, limpia espacios ocultos y busca "clientes" sin importar mayúsculas
  let sheet = null;
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const cleanedName = sheets[i].getName().trim().toLowerCase();
    if (cleanedName === "clientes") {
      sheet = sheets[i];
      break;
    }
  }
  
  if (!sheet) {
    safeAlert("Error: Asegúrese de tener una pestaña llamada 'Clientes' con las URLs en la columna A.");
    return;
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    safeAlert("No se encontraron URLs en la columna A de la pestaña 'Clientes'.");
    return;
  }
  
  const urls = sheet.getRange("A2:A" + lastRow).getValues().flat();
  
  let successCount = 0;
  let errorCount = 0;
  
  urls.forEach((url, index) => {
    if (!url || !url.includes("/d/")) return;
    
    try {
      const spreadsheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)[1];
      const scriptId = getOrCreateBoundScript(spreadsheetId);
      
      if (scriptId) {
        updateScriptContent(scriptId);
        successCount++;
        sheet.getRange(index + 2, 2).setValue(`✅ Éxito: ${new Date().toLocaleString()}`);
      } else {
        errorCount++;
        sheet.getRange(index + 2, 2).setValue("❌ Error: No se pudo crear el proyecto.");
      }
    } catch (e) {
      errorCount++;
      sheet.getRange(index + 2, 2).setValue(`❌ Error: ${e.message}`);
    }
  });
  
  safeAlert(`Despliegue finalizado.\nResultados:\n- Éxitos: ${successCount}\n- Errores: ${errorCount}`);
}

/**
 * Función auxiliar para evitar caídas de script si se ejecuta fuera del entorno UI.
 */
function safeAlert(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (e) {
    Logger.log(`AVISO: ${message}`);
  }
}

/**
 * Crea o recupera un proyecto de Apps Script vinculado a la hoja del cliente.
 */
function getOrCreateBoundScript(spreadsheetId) {
  const token = ScriptApp.getOAuthToken();
  const url = "https://script.googleapis.com/v1/projects";
  
  const payload = {
    title: "Script de Planificación Financiera - Cliente",
    parentId: spreadsheetId
  };
  
  const options = {
    method: "POST",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${token}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  if (response.getResponseCode() === 200) {
    return data.scriptId;
  } else {
    Logger.log(`Aviso en documento ${spreadsheetId}: ${response.getContentText()}`);
    return null;
  }
}

/**
 * Sobrescribe el contenido de la hoja de cálculo del cliente con la biblioteca y el stub.
 */
function updateScriptContent(scriptId) {
  const token = ScriptApp.getOAuthToken();
  const url = `https://script.googleapis.com/v1/projects/${scriptId}/content`;
  
  const manifest = {
    timeZone: Session.getScriptTimeZone(),
    dependencies: {
      libraries: [
        {
          userSymbol: "MasterLibrary",
          libraryId: MASTER_LIBRARY_ID,
          version: "39",
          developmentMode: true
        }
      ]
    },
    exceptionLogging: "STACKDRIVER",
    runtimeVersion: "V8"
  };
  
  const payload = {
    files: [
      {
        name: "appsscript",
        type: "JSON",
        source: JSON.stringify(manifest)
      },
      {
        name: "Code",
        type: "SERVER_JS",
        source: CLIENT_STUB_CODE
      }
    ]
  };
  
  const options = {
    method: "PUT",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${token}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    throw new Error(`Error inyectando el código: ${response.getContentText()}`);
  }
}
