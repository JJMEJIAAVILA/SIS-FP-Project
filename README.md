Markdown

# 🚀 SIS-FP-Project: Sistema de Gestión Portuaria y Seguridad

¡Bienvenido al repositorio de SIS-FP-Project! Este sistema integral está diseñado para optimizar la gestión y el control de diversas operaciones en un entorno portuario, enfocándose en la seguridad y el registro eficiente de datos.

---

## ✨ Características Principales

* **Gestión de Empresas:** Registro y control de empresas que operan en el puerto.
* **Control Vehicular:** Monitoreo de entradas y salidas de vehículos.
* **Registro de Embarcaciones:** Seguimiento de embarcaciones que ingresan y zarpan.
* **Eventos de Protestas:** Documentación detallada de protestas y bloqueos.
* **Apoyo de Fuerza Pública:** Registro de la presencia y acciones de las fuerzas de seguridad.
* **Gestión de Antecedentes:** Verificación y registro de antecedentes de personal, incluyendo validación de renovación.
* **Registro de Accesos Centralizado:** Interfaz unificada para registrar entradas y salidas de personas, vehículos y embarcaciones.
* **Dashboard Interactivo:** Reportes y visualizaciones de datos en tiempo real.
* **Exportación a Excel:** Funcionalidad para exportar registros a hojas de cálculo.
* **Autenticación Segura:** Acceso protegido mediante tokens JWT.
* **Interfaz Responsiva:** Adaptable a diferentes tamaños de pantalla (escritorio, tablet, móvil).

---

## 🏗️ Arquitectura y Funcionamiento

El proyecto SIS-FP sigue una arquitectura **cliente-servidor (Frontend y Backend)**, con una base de datos NoSQL para el almacenamiento de datos.

### 🌐 Frontend

El frontend es una aplicación web construida con **HTML, CSS (Tailwind CSS y estilos personalizados) y JavaScript puro**. Se enfoca en una interfaz de usuario intuitiva y responsiva.

* **Páginas Principales:**
    * `login.html`: Interfaz de autenticación de usuarios.
    * `menu.html`: Dashboard principal con enlaces a las diferentes secciones.
    * `empresas.html`: Gestión de registros de empresas.
    * `vehiculos.html`: Gestión de registros de vehículos.
    * `embarcaciones.html`: Gestión de registros de embarcaciones.
    * `protestas.html`: Gestión de registros de protestas.
    * `fuerza_publica.html`: Gestión de registros de apoyo de la fuerza pública.
    * `antecedentes.html`: Gestión de registros de antecedentes.
    * `registro_acceso.html`: Registro y control de accesos.
    * `reporte_general.html`: Visualización de reportes y estadísticas.
* **Funcionamiento:**
    * Cada sección del frontend interactúa con el backend a través de **peticiones HTTP (GET, POST, PUT, DELETE)** a las API RESTful.
    * Utiliza JavaScript para manejar la lógica de la interfaz de usuario, la validación de formularios, la paginación de tablas, la búsqueda y la exportación de datos.
    * El diseño responsivo se logra mediante **Tailwind CSS** y **media queries** personalizadas.

### ⚙️ Backend

El backend está construido con **Node.js y el framework Express.js**, proporcionando una API RESTful para la gestión de datos.

* **Estructura:**
    * `models/`: Define los esquemas de datos con Mongoose para MongoDB (ej., `User`, `Empresa`, `Vehiculo`, `Embarcacion`, `Protesta`, `FuerzaPublica`, `Antecedente`, `RegistroAcceso`).
    * `controllers/`: Contiene la lógica de negocio para cada ruta, interactuando con los modelos y manejando las peticiones y respuestas HTTP.
    * `routes/`: Define las rutas de la API y las asocia con las funciones de los controladores.
    * `middleware/`: Incluye el middleware de autenticación (`authMiddleware.js`) para proteger las rutas.
    * `config/db.js`: Archivo de configuración para la conexión a la base de datos MongoDB.
* **Funcionamiento:**
    * Recibe peticiones del frontend, procesa los datos, interactúa con la base de datos MongoDB y envía respuestas JSON.
    * Implementa operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para cada entidad.
    * Manejo de errores centralizado para una mejor robustez.

---

## 🛠️ Tecnologías y Herramientas

* **Lenguajes:** JavaScript (Frontend y Backend), HTML, CSS.
* **Frameworks:**
    * **Node.js:** Entorno de ejecución de JavaScript en el servidor.
    * **Express.js:** Framework web para Node.js (Backend).
    * **Tailwind CSS:** Framework CSS de utilidad para el diseño responsivo (Frontend).
* **Librerías/Módulos:**
    * **Mongoose:** ODM (Object Data Modeling) para MongoDB y Node.js.
    * **jsonwebtoken (JWT):** Para la autenticación basada en tokens.
    * **bcryptjs:** Para el hash seguro de contraseñas.
    * **Chart.js:** Para la creación de gráficos interactivos en el dashboard.
    * **xlsx:** Para la exportación de datos a archivos Excel.
    * **Font Awesome:** Biblioteca de iconos escalables.
    * **express-async-handler:** Middleware para manejar errores en rutas asíncronas de Express.
* **Base de Datos:**
    * **MongoDB:** Base de datos NoSQL.
    * **MongoDB Compass:** Herramienta GUI para interactuar con MongoDB.
* **IDE de Desarrollo:**
    * **IntelliJ IDEA:** Entorno de desarrollo integrado.
* **Metodología de Software:**
    * **Metodología Ágil (Scrum/Kanban):** El desarrollo se ha llevado a cabo de manera iterativa y incremental, adaptándose a los requisitos y priorizando la funcionalidad.

---

## 🔒 Mecanismos de Seguridad

* **Autenticación JWT:** Los usuarios deben iniciar sesión para obtener un token web JSON (JWT) que se utiliza para autenticar todas las solicitudes posteriores al backend.
* **Hash de Contraseñas:** Las contraseñas se almacenan con hash utilizando `bcryptjs` para protegerlas incluso si la base de datos es comprometida.
* **Rutas Protegidas:** Todas las rutas sensibles del backend están protegidas por middleware de autenticación, asegurando que solo los usuarios autorizados puedan acceder a ellas.
* **Validación de Entradas:** Se realiza validación de datos tanto en el frontend como en el backend para prevenir inyecciones y datos maliciosos.
* **HTTPS (Recomendado):** Aunque no se implementó directamente en el código de desarrollo, para un entorno de producción, se recomienda encarecidamente el uso de HTTPS para cifrar la comunicación entre el cliente y el servidor.

---

## 🚀 Instalación y Ejecución Local (Guía de Inicio Rápido)

Para poner en marcha el proyecto en tu máquina local, sigue estos pasos:

### 1. Requisitos Previos

Asegúrate de tener instalados los siguientes componentes en tu sistema:

* **Node.js:** Versión 14.x o superior. Puedes descargarlo desde [nodejs.org](https://nodejs.org/).
* **npm (Node Package Manager):** Se instala automáticamente con Node.js.
* **MongoDB:** Una instancia de MongoDB debe estar corriendo localmente o ser accesible desde tu máquina. Puedes descargar MongoDB Community Server desde [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community).
    * **Opcional:** MongoDB Compass (herramienta gráfica para gestionar MongoDB) es útil para visualizar la base de datos.

### 2. Configuración del Proyecto

#### 2.1. Clonar el Repositorio

Abre tu terminal (Git Bash, CMD, PowerShell) y clona el repositorio del proyecto:

```bash
git clone [https://github.com/JJMEJIAAVILA/SIS-FP-Project.git](https://github.com/JJMEJIAAVILA/SIS-FP-Project.git)
Navega a la carpeta raíz del proyecto:

Bash

cd SIS-FP-Project
2.2. Instalación de Dependencias del Backend
El backend se encuentra en la subcarpeta backend. Navega a ella e instala las dependencias:

Bash

cd backend
npm install
2.3. Configuración de Variables de Entorno del Backend
El backend requiere un archivo .env para almacenar variables de configuración sensibles (como la URI de la base de datos y la clave secreta de JWT).

Crea un archivo llamado .env en la carpeta backend.

Copia y pega el siguiente contenido en el archivo .env, reemplazando los valores entre corchetes [] con tus propios datos:

MONGO_URI=[Tu_URI_de_MongoDB_local_o_remota]
# Ejemplo para MongoDB local: MONGO_URI=mongodb://localhost:27017/sis_fp_db
# Asegúrate de que 'sis_fp_db' sea el nombre de tu base de datos.

JWT_SECRET=[Una_cadena_secreta_larga_y_aleatoria]
# Ejemplo: JWT_SECRET=supersecretkeyparajwt
# ¡Usa una cadena más segura en producción!

PORT=3000
Nota sobre MONGO_URI: Si tu MongoDB está corriendo localmente en el puerto por defecto, mongodb://localhost:27017/sis_fp_db es una URI común. El nombre de la base de datos (sis_fp_db) se creará automáticamente si no existe al primer uso.

3. Ejecución de la Aplicación
3.1. Iniciar el Backend
Desde la carpeta backend, ejecuta el siguiente comando para iniciar el servidor:

Bash

npm start
Verás mensajes en la consola indicando que el servidor se ha conectado a la base de datos y está escuchando en el puerto 3000.

3.2. Acceder al Frontend
El frontend es una aplicación web estática. No necesita un servidor Node.js separado para ejecutarse (aparte del backend API).

Abre tu navegador web (Chrome, Firefox, Edge, etc.).

Navega directamente al archivo login.html dentro de la carpeta SIS-FP de tu proyecto. La ruta en tu navegador se verá algo así:
file:///C:/Users/TuUsuario/Documentos/SIS-FP-Project/SIS-FP/login.html
(Ajusta la ruta según la ubicación de tu proyecto).

3.3. Credenciales de Prueba
Para iniciar sesión y probar el sistema, puedes usar las siguientes credenciales (si no las has modificado en tu base de datos):

Usuario: admin

Contraseña: password

📊 Diagramas Conceptuales
🏛️ Diagrama de Clases (Conceptual)
Representa las entidades principales del sistema y sus atributos clave.

+----------------+       +-----------------+       +-----------------+
|      User      |       |     Empresa     |       |     Vehiculo    |
+----------------+       +-----------------+       +-----------------+
| - username: String     | - fechaRegistro: Date   | - fechaRegistro: Date   |
| - email: String        | - nombre: String        | - conductor: String     |
| - password: String     | - nit: String           | - empresa: String       |
| - role: String         | - hora_entrada: String  | - placa: String         |
| - createdAt: Date      | - hora_salida: String   | - tipo_vehiculo: String |
| - updatedAt: Date      | - fecha_salida: Date    | - hora_entrada: String  |
|                        | - observaciones: String | - parqueadero_interno: Boolean |
+----------------+       +-----------------+       | - parqueadero_visitantes: Boolean |
|                                         | - hora_salida: String   |
|                                         | - fecha_salida: Date    |
|                                         | - observaciones: String |
|                                         +-----------------+
|
| (Autentica)
V
+---------------------+       +-------------------+       +--------------------+
|     Embarcacion     |       |   FuerzaPublica   |       |     Antecedente    |
+---------------------+       +-------------------+       +--------------------+
| - fechaRegistro: Date       | - fecha: Date             | - fechaRegistro: Date      |
| - piloto: String            | - fuerza_publica: String  | - tipo_documento: String   |
| - nombre_embarcacion: String| - unidades: String        | - numero_documento: String |
| - tipo_embarcacion: String  | - hora_llegada: String    | - nombre_completo: String  |
| - hora_entrada: String      | - hora_salida: String     | - resultado_verificacion: String |
| - hora_salida: String       | - fecha_salida: Date      | - observaciones: String    |
| - fecha_salida: Date        | - accion_realizada: String| - verificado_por: String   |
| - observaciones: String     | - observaciones: String   +--------------------+
+---------------------+       +-------------------+
^
| (Registra)
|
+---------------------+
|      Protesta       |
+---------------------+
| - fecha: Date               |
| - tipo_protesta: String     |
| - vias: String              |
| - sector_bloqueo: String    |
| - motivo_protesta: String   |
| - generador_protesta: String|
| - hora_inicio: String       |
| - hora_finalizacion: String |
| - fecha_finalizacion: Date  |
| - tiempo_total_bloqueo: String |
| - geoposicion: String       |
| - observaciones: String     |
+---------------------+
↔️ Diagrama de Entidad-Relación (Conceptual)
Muestra las relaciones entre las colecciones de la base de datos.

+-----------+       +-----------+       +-----------+
|   USERS   |-------|  EMPRESAS |-------|  VEHICULOS|
+-----------+       +-----------+       +-----------+
| _id       |<--1:N--| _id       |<--1:N--| _id       |
| username  |       | fechaReg. |       | fechaReg. |
| email     |       | nombre    |       | conductor |
| password  |       | nit       |       | empresa   |
| role      |       | ...       |       | placa     |
+-----------+       +-----------+       | ...       |
+-----------+

+-----------------+       +-------------------+       +------------------+
|  EMBARCACIONES  |-------|  FUERZAPUBLICAS   |-------|  ANTECEDENTES    |
+-----------------+       +-------------------+       +------------------+
| _id             |<--1:N--| _id               |<--1:N--| _id              |
| fechaRegistro   |       | fecha             |       | fechaRegistro    |
| piloto          |       | fuerza_publica    |       | tipo_documento   |
| nombre_embarcacion|     | unidades          |       | numero_documento |
| ...             |       | ...               |       | ...              |
+-----------------+       +-------------------+       +------------------+

+-----------+
|  PROTESTAS|
+-----------+
| _id       |
| fecha     |
| tipo_prot.|
| vias      |
| ...       |
+-----------+
🗺️ Mapa de Navegación
El sistema está diseñado para una navegación clara y estructurada:

Página de Login (login.html) 🔑

Punto de entrada al sistema.

Permite a los usuarios autenticarse.

Redirige al menu.html tras un inicio de sesión exitoso.

Menú Principal (menu.html) 🏠

Actúa como el dashboard central y punto de partida para todas las operaciones.

Desplegables y Secciones:

Gestión de Entradas y Salidas 🚪

Registro de Accesos: Acceso al control unificado de entradas y salidas de personas, vehículos y embarcaciones.

Empresas: Acceso a la gestión de registros de empresas.

Vehículos: Acceso a la gestión de registros de vehículos.

Embarcaciones: Acceso a la gestión de registros de embarcaciones.

Incidentes y Apoyos 🚨

Protestas: Acceso al registro y seguimiento de eventos de protestas y bloqueos.

Fuerza Pública: Acceso al registro de apoyos y acciones de las fuerzas de seguridad.

Seguridad y Verificación ✅

Antecedentes: Acceso a la verificación y registro de antecedentes de personal.

Reportes y Estadísticas 📈

Reporte General: Acceso al panel de control con visualizaciones y filtros de datos consolidados.

Páginas de Gestión (Ej. empresas.html, vehiculos.html, etc.) 📝

Cada sección (Empresas, Vehículos, Embarcaciones, Protestas, Fuerza Pública, Antecedentes, Registro de Accesos) tiene su propia página dedicada.

Contiene tablas para visualizar los registros.

Botones para "Nuevo Registro", "Editar", "Eliminar" y "Exportar a Excel".

Formularios para la creación y edición de registros.

Funcionalidades específicas (ej. "Registrar Salida" para accesos, "Finalizar Protesta", validación de 6 meses en Antecedentes).

Reporte General (reporte_general.html) 📊

Presenta un resumen visual de los datos del sistema.

KPIs: Muestra contadores clave (ej. Total de Protestas, Vehículos Registrados).

Filtros de Datos: Permite filtrar la información por rango de fechas y tipos específicos.

Gráficos: Visualizaciones de datos (ej. Ingreso de Personal por Hora, Control Vehicular por Tipo, Protestas por Motivo).

🧪 Pruebas con Insomnia / Postman
Las APIs del backend fueron probadas exhaustivamente utilizando herramientas como Insomnia o Postman. Se verificaron las operaciones CRUD (GET, POST, PUT, DELETE) para cada recurso (Usuarios, Empresas, Vehículos, Embarcaciones, Protestas, Fuerza Pública, Antecedentes, Registros de Acceso), así como los flujos de autenticación (registro de usuario, inicio de sesión).

¡Gracias por explorar SIS-FP-Project!