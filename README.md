# 📊 Automatización Financiera para Grupo LyN

Este proyecto contiene la solución de automatización y control financiero desarrollada para **Grupo LyN — Reformas e Interiorismo** utilizando **Google Sheets** y **Google Apps Script (Motor V8)**.

---

## 🛠️ Funcionalidades Principales

### 1. Control de Acceso y Menú "Admin" Seguro
*   **Seguridad por Contraseña:** Inicializa dinámicamente un menú `Admin` bloqueado en la hoja de cálculo.
*   **Desbloqueo Dinámico:** Solicita la contraseña unificada (`PROSPR2025`) mediante un aviso emergente. Al validar la clave, redibuja el menú en caliente para revelar las opciones de administración avanzadas.
*   **Almacenamiento Local Encriptado:** Guarda las claves en las propiedades locales del usuario (`PropertiesService.getUserProperties()`), permitiendo un control de acceso personalizado para múltiples asesores y clientes sin exponer datos en el documento global.

### 2. Generador del Reporte Comparativo Mensual (Doble Salida)
*   **Procesamiento Dinámico (Cero Hardcoding):** El analizador de datos no depende de rangos de celdas fijos. Escanea la hoja dinámicamente detectando las categorías por su formato de texto y los cierres de bloque de presupuesto mediante la palabra "Total".
*   **Pestaña Tabular Visual:** Crea de forma automática una nueva pestaña de comparación de presupuesto (`[Month] Budget Comparison`) aplicando un formato de semáforo con colores suaves (rojo claro para desviaciones negativas o excesos, verde claro para ahorros significativos).
*   **Borrador de Gmail HTML Premium:** Diseña y guarda automáticamente en Gmail un borrador en formato HTML que utiliza **comillas invertidas (Template Literals)** y estilos en línea (*inline CSS*). El correo incluye el branding corporativo minimalista negro de Grupo LyN y se adapta correctamente a cualquier cliente de correo móvil u ordenador.

### 3. Script de Despliegue Masivo y Escalabilidad (Bonus)
*   **Arquitectura de Biblioteca Maestra:** Separa el código pesado de los archivos individuales de los clientes. El administrador centraliza la lógica en una biblioteca compartida central, inyectando únicamente "stubs" ligeros de código en cada cliente.
*   **Automatización por API REST:** El archivo `Deployment.gs` utiliza la API interna de Google Apps Script para leer un listado de URLs de clientes desde la pestaña `Clientes`, crear sus proyectos en la nube de forma programática y conectarlos a la biblioteca maestra en segundos.

---

## 📂 Estructura del Repositorio

```directory
grupolyn-budget-automation/
├── Code.gs             # Lógica del menú de seguridad y reportes mensuales
├── Deployment.gs       # Script maestro de actualización masiva (API REST)
├── appsscript.json     # Archivo de manifiesto unificado con OAuth Scopes
└── README.md           # Documentación y portada del proyecto

⚙️ Requisitos de Configuración e Instalación
Para que el script de despliegue masivo (Deployment.gs) pueda realizar llamadas a la API de Google de forma programática, se requiere realizar los siguientes ajustes en la cuenta del Administrador:
Habilitar la API de Apps Script: Ingrese a script.google.com/home/settings y active el interruptor global API de Google Apps Script a la posición Habilitado (On).
Configurar los OAuth Scopes: Asegúrese de tener el archivo de manifiesto appsscript.json configurado en su proyecto con los siguientes ámbitos de seguridad mínimos autorizados:
code
JSON
"oauthScopes": [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/script.projects",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/script.external_request"
]
