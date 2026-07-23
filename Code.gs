/**
 * @file Code.gs
 * @description Lógica del menú de seguridad, generador de reportes y borradores de correo.
 * Escrito usando estándares modernos de JavaScript ES6 (const y let) y tolerante a fallas de contexto.
 */

/**
 * Se ejecuta automáticamente al abrir el archivo.
 * Inicializa la clave por defecto en el primer login y crea el menú de forma segura.
 */
function onOpen() {
  try {
    addAdminMenuWithAccessControl();
  } catch (e) {
    Logger.log("Aviso: onOpen se ejecutó fuera de la interfaz.");
  }

  const userProperties = PropertiesService.getUserProperties();
  if (!userProperties.getProperty('ADMIN_CODE')) {
    userProperties.setProperty('ADMIN_CODE', 'PROSPR2025');
  }
}

/**
 * Agrega el menú personalizado 'Admin' a la interfaz de usuario de forma segura.
 */
function addAdminMenuWithAccessControl() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('Admin')
      .addItem('Unlock Admin Menu', 'showAdminPrompt')
      .addToUi();
  } catch (e) {
    Logger.log("Aviso: getUi() no está disponible en este contexto.");
  }
}

/**
 * Muestra el cuadro de diálogo para ingresar la clave de administrador.
 */
function showAdminPrompt() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.prompt('Admin Access', 'Please enter the admin code to unlock admin options:', ui.ButtonSet.OK_CANCEL);
    if (response.getSelectedButton() === ui.Button.OK) {
      const code = response.getResponseText();
      if (verifyAdminCode(code)) {
        addUnlockedAdminMenu();
        ui.alert('Admin options unlocked!');
      } else {
        ui.alert('Incorrect code. Access denied.');
      }
    }
  } catch (e) {
    Logger.log("Error en prompt de administrador: " + e.message);
  }
}

/**
 * Verifica la clave ingresada contra la propiedad de usuario almacenada.
 */
function verifyAdminCode(code) {
  const userProperties = PropertiesService.getUserProperties();
  let storedCode = userProperties.getProperty('ADMIN_CODE');

  if (!storedCode) {
    storedCode = 'PROSPR2025';
    userProperties.setProperty('ADMIN_CODE', storedCode);
  }

  return code === storedCode;
}

/**
 * Muestra el menú de administración completo con todas las opciones disponibles para el cliente.
 */
function addUnlockedAdminMenu() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('Admin')
      .addItem('Monthly Comparative Report', 'runMonthlyComparativeReport')
      .addItem('Set Admin Code', 'setNewAdminCode')
      .addItem('Lock Admin Menu', 'resetAdminMenu')
      .addToUi();
  } catch (e) {
    Logger.log("Aviso: No se pudo desbloquear el menú en este contexto.");
  }
}

/**
 * Bloquea de nuevo el menú administrativo.
 */
function resetAdminMenu() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('Admin')
      .addItem('Unlock Admin Menu', 'showAdminPrompt')
      .addToUi();
    ui.alert('Admin menu locked again.');
  } catch (e) {
    Logger.log("Aviso: No se pudo bloquear el menú en este contexto.");
  }
}

/**
 * Permite al administrador cambiar su clave de acceso.
 */
function setNewAdminCode() {
  try {
    const ui = SpreadsheetApp.getUi();
    const userProperties = PropertiesService.getUserProperties();

    const currentCodeResponse = ui.prompt('Verify Current Admin Code', 'Please enter your current admin code to change it:', ui.ButtonSet.OK_CANCEL);
    if (currentCodeResponse.getSelectedButton() === ui.Button.OK) {
      const currentCode = currentCodeResponse.getResponseText();
      if (verifyAdminCode(currentCode)) {
        const newCodeResponse = ui.prompt('Set New Admin Code', 'Enter the new admin code:', ui.ButtonSet.OK_CANCEL);
        if (newCodeResponse.getSelectedButton() === ui.Button.OK) {
          const newCode = newCodeResponse.getResponseText();
          if (newCode) {
            userProperties.setProperty('ADMIN_CODE', newCode);
            ui.alert('Admin code successfully updated!');
          } else {
            ui.alert('New admin code cannot be empty.');
          }
        }
      } else {
        ui.alert('Incorrect current admin code. Cannot change.');
      }
    }
  } catch (e) {
    Logger.log("Error al cambiar contraseña: " + e.message);
  }
}

/**
 * Genera el Reporte Comparativo Mensual basado en la pestaña 'Monthly Budget'.
 */
function runMonthlyComparativeReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const budgetSheetName = 'Monthly Budget';
  const sheet = ss.getSheetByName(budgetSheetName);
    
  if (!sheet) {
    try {
      SpreadsheetApp.getUi().alert(`Error: Sheet "${budgetSheetName}" not found! Please ensure the "Monthly Budget" tab exists.`);
    } catch (e) {
      Logger.log(`Error: Sheet "${budgetSheetName}" not found!`);
    }
    return;
  }

  // Recupera detalles del período desde las celdas designadas.
  const year = sheet.getRange('F2').getValue();
  const month = sheet.getRange('F3').getValue();
  const bom = sheet.getRange('H2').getValue(); 
  const eom = sheet.getRange('H3').getValue(); 

  // Configuración de columnas (indexadas en 0)
  const CATEGORY_COL = 1;    // Columna B para categorías
  const ITEM_DESC_COL = 2;   // Columna C para descripción de items
  const BUDGET_COL = 3;      // Columna D para montos planificados
  const ACTUAL_COL = 5;      // Columna F para montos reales

  const DEVIATION_THRESHOLD = 0.20; 
  const START_ROW = 5;             

  const data = sheet.getDataRange().getValues(); 

  const allCategoriesData = {};
  let currentCategoryName = null;
  let currentCategoryItems = [];
  let currentCategoryTotalBudget = 0;
  let currentCategoryTotalActual = 0;

  for (let i = START_ROW - 1; i < data.length; i++) {
    const row = data[i];
    const categoryHeader = (row[CATEGORY_COL] !== null && row[CATEGORY_COL] !== undefined) ? String(row[CATEGORY_COL]).trim() : "";
    const itemDescription = (row[ITEM_DESC_COL] !== null && row[ITEM_DESC_COL] !== undefined) ? String(row[ITEM_DESC_COL]).trim() : "";
    
    const budgetValue = parseFloat(row[BUDGET_COL]) || 0;
    const actualValue = parseFloat(row[ACTUAL_COL]) || 0;

    if (categoryHeader && categoryHeader.indexOf('Total') === -1) {
      if (currentCategoryName) {
        allCategoriesData[currentCategoryName] = {
          items: currentCategoryItems,
          totalBudget: currentCategoryTotalBudget,
          totalActual: currentCategoryTotalActual
        };
      }
      currentCategoryName = categoryHeader;
      currentCategoryItems = [];
      currentCategoryTotalBudget = 0;
      currentCategoryTotalActual = 0;
    }

    if (currentCategoryName && (itemDescription || budgetValue !== 0 || actualValue !== 0) && categoryHeader.indexOf('Total') === -1) {
        currentCategoryItems.push({
          description: itemDescription,
          budget: budgetValue,
          actual: actualValue
        });
    }

    if (categoryHeader.indexOf('Total') === 0 && currentCategoryName) {
      currentCategoryTotalBudget = budgetValue;
      currentCategoryTotalActual = actualValue;

      allCategoriesData[currentCategoryName] = {
        items: currentCategoryItems,
        totalBudget: currentCategoryTotalBudget,
        totalActual: currentCategoryTotalActual
      };

      currentCategoryName = null;
      currentCategoryItems = [];
      currentCategoryTotalBudget = 0;
      currentCategoryTotalActual = 0;
    }
  }

  if (currentCategoryName) {
    allCategoriesData[currentCategoryName] = {
      items: currentCategoryItems,
      totalBudget: currentCategoryTotalBudget,
      totalActual: currentCategoryTotalActual
    };
  }

  const reportRowsForSheet = [
    [
      "Category",         
      "Item Description", 
      "Actual",           
      "Planned",          
      "Deviation ($)",    
      "Deviation (%)",    
      "Status"            
    ]
  ];
  const reportLinesForEmail = []; 

  for (const catName in allCategoriesData) {
    const d = allCategoriesData[catName];
    const actual = d.totalActual || 0;
    const budget = d.totalBudget || 0;
    
    const deviation = actual - budget; 
    
    let deviationPct = 0;
    if (budget === 0) {
      deviationPct = (actual === 0) ? 0 : (actual > 0 ? 1 : -1);
    } else {
      deviationPct = deviation / budget;
    }

    const deviationPctStr = (deviationPct * 100).toFixed(1) + "%";
    const status = Math.abs(deviationPct) > DEVIATION_THRESHOLD ? (deviationPct > 0 ? "Over" : "Under") : "OK";
    const deviationSign = deviation > 0 ? "+" : ""; 
    const deviationStr = deviationSign + deviation.toFixed(2);

    if (status !== "OK" || (budget === 0 && actual !== 0) || (budget !== 0 && actual === 0)) {
      reportRowsForSheet.push([
        catName, 
        "",      
        "$" + actual.toFixed(2), 
        "$" + budget.toFixed(2), 
        deviationStr,
        deviationPctStr,
        status
      ]);

      reportLinesForEmail.push(
        `${catName}: ${status} budget by ${deviationPctStr} ($${actual.toFixed(2)} vs. $${budget.toFixed(2)})`
      );

      const significantItems = [];
      for (let j = 0; j < d.items.length; j++) {
        const item = d.items[j];
        const itemDeviation = item.actual - item.budget;
        let itemDeviationPct = 0;

        if (item.budget === 0) {
          itemDeviationPct = (item.actual === 0) ? 0 : (item.actual > 0 ? 1 : -1);
        } else {
          itemDeviationPct = itemDeviation / item.budget;
        }

        if (Math.abs(itemDeviationPct) > DEVIATION_THRESHOLD || (item.budget === 0 && item.actual !== 0) || (item.budget !== 0 && item.actual === 0)) {
          const itemDiffSign = itemDeviation > 0 ? "+" : "";
          significantItems.push({
            description: item.description,
            actual: item.actual,
            budget: item.budget,
            diff: itemDiffSign + itemDeviation.toFixed(2),
            diffPct: (itemDeviationPct * 100).toFixed(1) + "%"
          });

          reportRowsForSheet.push([
            "", 
            item.description, 
            "$" + item.actual.toFixed(2),
            "$" + item.budget.toFixed(2),
            itemDiffSign + itemDeviation.toFixed(2),
            (itemDeviationPct * 100).toFixed(1) + "%", 
            ""  
          ]);
        }
      }

      if (significantItems.length > 0) {
        reportLinesForEmail.push("   Key Items:");
        significantItems.forEach(function(item) {
          reportLinesForEmail.push(
            `     ${item.description}: $${item.actual.toFixed(2)} (Actual) vs $${item.budget.toFixed(2)} (Planned) (Diff: ${item.diff}, ${item.diffPct})`
          );
        });
      }
      reportLinesForEmail.push(""); 
      reportRowsForSheet.push(["", "", "", "", "", "", ""]);  
    }
  }

  // Genera el reporte visual en la hoja
  generateTabularReportSheet(reportRowsForSheet, month, year, bom, eom);

  // Prepara los strings de fecha
  const bomStr = prettyDate(bom);
  const eomStr = prettyDate(eom);
  
  const finalReportText =
    `Monthly Budget Deviation Report\n` +
    `Period: ${month} ${year} (${bomStr} - ${eomStr})\n` +
    `Generated on: ${new Date().toLocaleDateString()}\n\n` +
    reportLinesForEmail.join("\n");
  
  const emailSubject = `${month} ${year} Budget Comparison`;

  // LLAMADAS DE ENVÍO DE BORRADORES
  // 1. Borrador en texto plano original
  generateReportAsEmailDraft(finalReportText, emailSubject);

  // 2. Borrador en HTML Premium corporativo de Grupo LyN
  generateBrandedHtmlEmailDraft(allCategoriesData, month, year, bomStr, eomStr, DEVIATION_THRESHOLD);
}

/**
 * BONUS ADICIONAL: Genera un segundo borrador de correo en formato HTML premium con 
 * la identidad visual de Grupo LyN usando Template Literals (V8).
 */
function generateBrandedHtmlEmailDraft(categories, month, year, bomStr, eomStr, threshold) {
  const emailSubject = `[Diseño Premium] ${month} ${year} - Reporte de Desviación`;
  
  const categoriesHtml = Object.keys(categories).map(catName => {
    const d = categories[catName];
    const actual = d.totalActual || 0;
    const budget = d.totalBudget || 0;
    const deviation = actual - budget;
    const deviationPct = budget === 0 ? (actual === 0 ? 0 : 1) : deviation / budget;
    const status = Math.abs(deviationPct) > threshold ? (deviationPct > 0 ? "Over" : "Under") : "OK";
    
    if (status === "OK" && budget !== 0 && actual !== 0) return '';
    if (budget === 0 && actual === 0) return ''; 
    
    const badgeColor = status === "Over" ? "#FFD6D6" : "#D6FFD6";
    const badgeTextColor = status === "Over" ? "#D9534F" : "#3C763D";
    const borderAccentColor = status === "Over" ? "#D9534F" : "#5CB85C";
    
    const significantItems = d.items.filter(item => {
      const itemDev = item.actual - item.budget;
      const itemDevPct = item.budget === 0 ? (item.actual === 0 ? 0 : 1) : itemDev / item.budget;
      return Math.abs(itemDevPct) > threshold || (item.budget === 0 && item.actual !== 0) || (item.budget !== 0 && item.actual === 0);
    });
    
    const itemsTableHtml = significantItems.length > 0 ? `
      <table width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size: 11px; background-color: #FAFAFA; border: 1px solid #EEEEEE; border-radius: 4px; font-family: Arial, sans-serif;">
        <tr style="background-color: #F0F0F0; color: #666666; font-weight: bold;">
          <td style="border-bottom: 1px solid #E0E0E0;">Concepto Responsable</td>
          <td align="right" style="border-bottom: 1px solid #E0E0E0;">Real</td>
          <td align="right" style="border-bottom: 1px solid #E0E0E0;">Planificado</td>
          <td align="right" style="border-bottom: 1px solid #E0E0E0;">Variación</td>
        </tr>
        ${significantItems.map(item => {
          const itemDiff = item.actual - item.budget;
          const itemDiffSign = itemDiff > 0 ? "+" : "";
          const itemDiffColor = itemDiff > 0 ? "#D9534F" : "#3C763D";
          return `
            <tr>
              <td style="border-bottom: 1px solid #EEEEEE; color: #333333;">${item.description}</td>
              <td align="right" style="border-bottom: 1px solid #EEEEEE;">$${item.actual.toFixed(2)}</td>
              <td align="right" style="border-bottom: 1px solid #EEEEEE;">$${item.budget.toFixed(2)}</td>
              <td align="right" style="border-bottom: 1px solid #EEEEEE; color: ${itemDiffColor}; font-weight: bold;">${itemDiffSign}$${itemDiff.toFixed(2)}</td>
            </tr>
          `;
        }).join('')}
      </table>
    ` : '';

    return `
      <div style="border: 1px solid #E0E0E0; border-left: 4px solid ${borderAccentColor}; border-radius: 4px; padding: 18px; margin-bottom: 20px; background-color: #FFFFFF;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
          <tr>
            <td style="font-size: 15px; font-weight: bold; color: #111111; font-family: Arial, sans-serif;">${catName}</td>
            <td align="right">
              <span style="background-color: ${badgeColor}; color: ${badgeTextColor}; padding: 3px 8px; border-radius: 3px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">${status} BUDGET</span>
            </td>
          </tr>
        </table>
        
        <p style="margin: 0 0 15px 0; font-size: 13px; color: #555555;">
          Total Real: <strong>$${actual.toFixed(2)}</strong> vs Planificado: <strong>$${budget.toFixed(2)}</strong> 
          (Desviación del <strong style="color: ${borderAccentColor};">${(deviationPct * 100).toFixed(1)}%</strong>)
        </p>
        
        ${itemsTableHtml}
      </div>
    `;
  }).join('');

  const htmlBody = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; background-color: #FFFFFF; border: 1px solid #EAEAEA; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      
      <!-- Cabecera Corporativa de Grupo LyN -->
      <div style="background-color: #111111; padding: 20px 25px; color: #FFFFFF;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size: 20px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; font-family: Arial, sans-serif;">
              <span style="border: 2px solid #FFFFFF; padding: 2px 8px; margin-right: 5px;">1</span> GRUPO LYN
            </td>
            <td align="right" style="font-size: 10px; font-weight: 300; letter-spacing: 1px; color: #CCCCCC; text-transform: uppercase;">
              REFORMAS • INTERIORISMO
            </td>
          </tr>
        </table>
      </div>
      
      <!-- Cuerpo del mensaje -->
      <div style="padding: 25px 30px;">
        <h1 style="font-size: 22px; font-weight: bold; margin-top: 0; margin-bottom: 5px; color: #111111;">Reporte Comparativo Mensual</h1>
        <p style="font-size: 14px; font-style: italic; color: #777777; margin-top: 0; margin-bottom: 20px;">de Planificación Financiera</p>
        
        <!-- Bloque de metadatos del período -->
        <div style="background-color: #F9F9F9; border: 1px solid #EEEEEE; border-radius: 4px; padding: 12px 15px; margin-bottom: 20px; font-size: 13px; color: #555555;">
          <strong>Período:</strong> ${month} ${year} (${bomStr} - ${eomStr})<br>
          <strong>Fecha de Generación:</strong> ${new Date().toLocaleDateString()}
        </div>
        
        <!-- Cuadro de Alerta / Resumen -->
        <div style="border-left: 4px solid #111111; background-color: #FAFAFA; padding: 12px 15px; margin-bottom: 25px; border-radius: 0 4px 4px 0;">
          <strong style="color: #111111; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Aviso de Control Financiero:</strong>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #666666; line-height: 1.5;">
            Se detallan las categorías del presupuesto con desviaciones superiores al ${threshold * 100}%.
          </p>
        </div>
        
        <!-- Inyección de tarjetas de categorías dinámicas -->
        ${categoriesHtml || `
          <div style="text-align: center; padding: 20px; color: #5CB85C; font-weight: bold; background-color: #F0F9F0; border: 1px solid #D6EFD6; border-radius: 4px;">
            ✓ No se han identificado desviaciones que superen el umbral establecido.
          </div>
        `}
        
      </div>
      
      <!-- Footer -->
      <div style="background-color: #F9F9F9; padding: 20px 30px; border-top: 1px solid #EAEAEA; text-align: center; font-size: 11px; color: #888888; font-family: Arial, sans-serif; line-height: 1.4;">
        Este es un reporte financiero premium automatizado para clientes de <strong>Grupo LyN</strong>.<br>
        Contacto: <a href="mailto:info@grupolyn.com" style="color: #111111; text-decoration: underline; font-weight: bold;">info@grupolyn.com</a>.
      </div>
    </div>
  `;

  try {
    GmailApp.createDraft('', emailSubject, '', { htmlBody: htmlBody });
  } catch (e) {
    Logger.log("No se pudo crear el borrador HTML: " + e.message);
  }
}

/**
 * Formatea un objeto Date a un formato de texto "MM/dd/yyyy".
 */
function prettyDate(date) {
  if (!(date instanceof Date)) return date;
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "MM/dd/yyyy");
}

/**
 * Genera el reporte tabular en la pestaña correspondiente.
 */
function generateTabularReportSheet(tableData, month, year, bom, eom) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportSheetName = `${month} Budget Comparison`; 
  let reportSheet = ss.getSheetByName(reportSheetName);
  
  if (reportSheet) {
    reportSheet.clear(); 
  } else {
    reportSheet = ss.insertSheet(reportSheetName); 
  }

  reportSheet.getRange('C2').setValue("Year");
  reportSheet.getRange('D2').setValue(year);
  reportSheet.getRange('E2').setValue("BOM");
  reportSheet.getRange('F2').setValue(Utilities.formatDate(bom, Session.getScriptTimeZone(), "M/d/yyyy"));

  reportSheet.getRange('C3').setValue("Month");
  reportSheet.getRange('D3').setValue(month);
  reportSheet.getRange('E3').setValue("EOM");
  reportSheet.getRange('F3').setValue(Utilities.formatDate(eom, Session.getScriptTimeZone(), "M/d/yyyy"));

  const nRows = tableData.length;
  const nCols = 7; 
  const dataStartRow = 5; 
  reportSheet.getRange(dataStartRow, 1, nRows, nCols).setValues(tableData);

  const headerRange = reportSheet.getRange(dataStartRow, 1, 1, nCols);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#e3e3e3'); 
  headerRange.setFontFamily('Arial, Helvetica, sans-serif');

  if (nRows > 1) { 
    reportSheet.getRange(dataStartRow + 1, 1, nRows - 1, nCols).setFontFamily('Arial, Helvetica, sans-serif');
  }

  for (let i = 0; i < nRows - 1; i++) { 
    const currentRowIndex = dataStartRow + 1 + i; 
    const rowData = tableData[i + 1]; 

    const categoryCellContent = String(rowData[0]); 

    if (categoryCellContent === "") {
        reportSheet.getRange(currentRowIndex, 1, 1, nCols).setBackground('#ffffff'); 
        continue; 
    }

    if (rowData[0] === "" && rowData[1] !== "") { 
      reportSheet.getRange(currentRowIndex, 1, 1, nCols).setBackground('#f7f7f7'); 
      reportSheet.getRange(currentRowIndex, 2).setFontSize(9); 
      reportSheet.getRange(currentRowIndex, 2).setHorizontalAlignment('left'); 
    } else {
      const status = rowData[6]; 
      const statusCell = reportSheet.getRange(currentRowIndex, 7); 
      
      if (status === "Over") {
        statusCell.setBackground('#ffd6d6'); 
      } else if (status === "Under") {
        statusCell.setBackground('#d6ffd6'); 
      }
      reportSheet.getRange(currentRowIndex, 1).setFontWeight('bold'); 
      reportSheet.getRange(currentRowIndex, 1).setFontLine('underline'); 
      reportSheet.getRange(currentRowIndex, 1, 1, nCols).setBackground('#f0f8ff'); 
    }
  }

  for (let c = 1; c <= nCols; c++) {
    reportSheet.autoResizeColumn(c);
  }

  reportSheet.getRange(dataStartRow, 3, nRows, 1).setHorizontalAlignment('right'); 
  reportSheet.getRange(dataStartRow, 4, nRows, 1).setHorizontalAlignment('right'); 
  reportSheet.getRange(dataStartRow, 5, nRows, 1).setHorizontalAlignment('right'); 
  reportSheet.getRange(dataStartRow, 6, nRows, 1).setHorizontalAlignment('right'); 

  ss.setActiveSheet(reportSheet);
  SpreadsheetApp.getUi().alert(`Report generated successfully in the "${reportSheetName}" sheet.`);
}

/**
 * Crea un borrador en Gmail con el formato de texto plano original.
 */
function generateReportAsEmailDraft(content, subject) {
  try {
    GmailApp.createDraft('', subject, '', { htmlBody: `<pre>${content}</pre>` });
    SpreadsheetApp.getUi().alert('Report has been saved as a draft in your Gmail.');
  } catch (e) {
    SpreadsheetApp.getUi().alert(`Could not create Gmail draft. Please ensure you have granted script permissions for Gmail. Error: ${e.message}`);
  }
}
