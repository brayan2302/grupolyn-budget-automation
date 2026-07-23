# 📊 Automatización y Optimización Financiera — Grupo LyN

Este repositorio contiene la solución completa de automatización, control de seguridad y distribución de software desarrollada para la plantilla de planificación financiera de **Grupo LyN — Reformas e Interiorismo** utilizando **Google Sheets** y **Google Apps Script**.

---

## 🛠️ Funcionalidades Implementadas y Decisiones de Diseño

### 1. Control de Acceso y Menú "Admin" Seguro (`Code.gs`)
*   **Seguridad por Contraseña:** Inicializa dinámicamente un menú `Admin` bloqueado en la hoja de cálculo.
*   **Desbloqueo Dinámico:** Solicita la contraseña unificada (`PROSPR2025`) mediante un aviso de interfaz. Al validar la clave, redibuja el menú en caliente para revelar las opciones de administración avanzadas.
*   **Almacenamiento Local Encriptado:** Guarda las claves en las propiedades locales del usuario (`PropertiesService.getUserProperties()`), permitiendo un control de acceso personalizado para múltiples asesores y clientes sin exponer datos en el documento global.
*   **Optimización del Login (UX):** Se corrigió un bug del código base original que generaba un falso aviso de "Acceso denegado" en el primer intento de inicio de sesión debido a una inicialización tardía de las propiedades. El disparador `onOpen` ahora inicializa la contraseña de forma transparente en segundo plano.

### 2. Generador del Reporte Comparativo Mensual — Doble Salida (`Code.gs`)
*   **Procesamiento Dinámico (Cero Hardcoding):** El analizador de datos no depende de rangos de celdas fijos. Escanea la hoja dinámicamente detectando las categorías por su formato de texto (negritas) y los cierres de bloque de presupuesto mediante la palabra "Total".
*   **Pestaña Tabular Visual:** Crea de forma automática una nueva pestaña de comparación de presupuesto (`[Month] Budget Comparison`) aplicando un formato de semáforo con colores suaves (rojo claro para desviaciones negativas o excesos, verde claro para ahorros significativos).
*   **Borrador de Gmail HTML Premium:** Diseña y guarda automáticamente en Gmail un borrador en formato HTML que utiliza **comillas invertidas (Template Literals)** y estilos en línea (*inline CSS*). El correo incluye el branding corporativo minimalista negro de Grupo LyN y se adapta correctamente a cualquier cliente de correo móvil u ordenador (como Outlook Desktop).

### 3. Script de Despliegue Masivo y Escalabilidad — El Bonus (`Deployment.gs`)
*   **Arquitectura de Biblioteca Maestra:** Separa el código pesado de los archivos individuales de los clientes. El administrador centraliza la lógica en una biblioteca compartida central, inyectando únicamente "stubs" de código ligeros en cada cliente para optimizar el rendimiento y facilitar el mantenimiento centralizado.
*   **Automatización por API REST:** Lee un listado de URLs de clientes desde la pestaña `Clientes`, crea sus proyectos en la nube de forma programática y los conecta a la biblioteca maestra en segundos utilizando la API de Apps Script.
*   **Tolerancia a Fallas en Pestañas:** El script implementa un escáner dinámico inteligente que limpia espacios en blanco invisibles y omite mayúsculas al buscar la pestaña `Clientes`, previniendo fallos si los asesores editan el nombre de la pestaña por error.
*   **Menú Administrativo Integrado:** Se integró la opción de despliegue masivo en la hoja del administrador, permitiendo ejecutar el proceso directamente desde la barra superior de Sheets mediante el menú `Despliegue 🛠️`.

---

## 🔒 Nota Importante de Seguridad e Infraestructura (GCP IAM)

Durante las pruebas locales del script de despliegue masivo (`deployToAllClients`), una cuenta personal externa (`@gmail.com`) experimentará un error de bloqueo en la consola de Google Cloud de tipo:
`PERMISSION_DENIED - Request had insufficient authentication scopes` o fallas en el recurso `resourcemanager.projects.get`.

### ¿Por qué ocurre esto?
La plantilla original compartida para la prueba técnica fue creada originalmente dentro de la infraestructura empresarial de **Google Workspace de Grupo LyN** (o de su organización de desarrollo). Cuando un usuario copia la hoja de cálculo, el proyecto en la nube de Google Cloud Platform (GCP) en segundo plano hereda esa vinculación corporativa. 

Por políticas de seguridad de directorios de Google Cloud (IAM), cualquier cuenta de Gmail externa personal tiene restringido el acceso administrativo para modificar, crear o alterar proyectos de código vinculados a la red de la organización.

### Mitigación y Validación:
*   **En Producción:** El administrador de TI de Grupo LyN ejecutará este script de forma nativa desde su propia cuenta empresarial dentro de su Google Workspace, por lo que el script correrá de manera continua y exitosa sin ninguna restricción de seguridad.
*   **Para Pruebas del Candidato:** Se diseñó y validó la lógica de forma exitosa mediante una hoja de administración y un cliente de prueba de propiedad 100% personal, comprobando que la inyección de stubs, la creación de contenedores y la escritura de estados `✅ Éxito` operan de forma correcta una vez removidas las restricciones de red empresarial.

---

## 📂 Estructura del Repositorio

```directory
grupolyn-budget-automation/
├── Code.gs             # Lógica del menú de seguridad y reportes mensuales
├── Deployment.gs       # Script maestro de actualización masiva (API REST)
├── appsscript.json     # Archivo de manifiesto unificado con OAuth Scopes de Google
└── README.md           # Documentación y portada del proyecto
