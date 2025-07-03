# 🚀 SIS-FP-Project: Sistema de Gestión Portuaria y Seguridad

¡Bienvenido al repositorio de SIS-FP-Project! Este sistema integral está diseñado para optimizar la gestión y el control de diversas operaciones en un entorno portuario, enfocándose en la seguridad y el registro eficiente de datos.

---

## ✨ Características Principales

* **Gestión de Empresas:** Registro y control de empresas que operan en el puerto.
* **Control Vehicular:** Monitoreo de entradas y salidas de vehículos.
* **Registro de Embarcaciones:** Seguimiento de embarcaciones que ingresan y zarpan.
* **Eventos de Protestas:** Documentación detallada de protestas y bloqueos.
* **Apoyo de Fuerza Pública:** Registro de la presencia y acciones de las fuerzas de seguridad.
* **Gestión de Antecedentes:** Verificación y registro de antecedentes de personal.
* **Dashboard Interactivo:** Reportes y visualizaciones de datos en tiempo real.
* **Exportación a Excel:** Funcionalidad para exportar registros a hojas de cálculo.
* **Autenticación Segura:** Acceso protegido mediante tokens JWT.
* **Interfaz Responsiva:** Adaptable a diferentes tamaños de pantalla (escritorio, tablet, móvil).

---

## 🏗️ Arquitectura y Funcionamiento

El proyecto SIS-FP sigue una arquitectura **MERN Stack**, lo que significa que utiliza **M**ongoDB, **E**xpress.js, **R**eact (aunque el frontend es HTML/JS puro, sigue la filosofía de componentes y API REST), y **N**ode.js.

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
    * `dashboard.html` (o `reporte_general.html`): Visualización de reportes y estadísticas.
* **Funcionamiento:**
    * Cada sección del frontend interactúa con el backend a través de **peticiones HTTP (GET, POST, PUT, DELETE)** a las API RESTful.
    * Utiliza JavaScript para manejar la lógica de la interfaz de usuario, la validación de formularios, la paginación de tablas, la búsqueda y la exportación de datos.
    * El diseño responsivo se logra mediante **Tailwind CSS** y **media queries** personalizadas.

### ⚙️ Backend

El backend está construido con **Node.js y el framework Express.js**, proporcionando una API RESTful para la gestión de datos.

* **Estructura:**
    * `models/`: Define los esquemas de datos con Mongoose para MongoDB (ej., `User`, `Empresa`, `Vehiculo`, `Embarcacion`, `Protesta`, `FuerzaPublica`, `Antecedente`).
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

## 📋 Requerimientos del Sistema

Para ejecutar este proyecto localmente, necesitarás:

* **Node.js:** Versión 14 o superior.
* **npm:** Gestor de paquetes de Node.js (viene con Node.js).
* **MongoDB:** Una instancia de MongoDB (local o en la nube, ej. MongoDB Atlas).
* **Variables de Entorno:** Configurar un archivo `.env` con las variables necesarias (ej., `MONGO_URI`, `JWT_SECRET`).

---

## 🧪 Pruebas con Insomnia / Postman

Las APIs del backend fueron probadas exhaustivamente utilizando herramientas como **Insomnia** o **Postman**. Se verificaron las operaciones CRUD (GET, POST, PUT, DELETE) para cada recurso (Empresas, Vehículos, Embarcaciones, Protestas, Fuerza Pública, Antecedentes), así como los flujos de autenticación (registro de usuario, inicio de sesión).

---

## 📊 Diagramas Conceptuales

### 🏛️ Diagrama de Clases (Conceptual)

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

### ↔️ Diagrama de Entidad-Relación (Conceptual)

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

---

## 🗺️ Mapa de Navegación

El sistema está diseñado para una navegación clara y estructurada:

1.  **Página de Login (`login.html`)** 🔑
    * Punto de entrada al sistema.
    * Permite a los usuarios autenticarse.
    * Redirige al `menu.html` tras un inicio de sesión exitoso.

2.  **Menú Principal (`menu.html`)** 🏠
    * Actúa como el dashboard central y punto de partida para todas las operaciones.
    * **Desplegables y Secciones:**
        * **Gestión de Entradas y Salidas** 🚪
            * **Empresas:** Acceso a la gestión de registros de entrada y salida de personal de empresas.
            * **Vehículos:** Acceso a la gestión de registros de entrada y salida de vehículos.
            * **Embarcaciones:** Acceso a la gestión de registros de entrada y zarpe de embarcaciones.
        * **Incidentes y Apoyos** 🚨
            * **Protestas:** Acceso al registro y seguimiento de eventos de protestas y bloqueos.
            * **Fuerza Pública:** Acceso al registro de apoyos y acciones de las fuerzas de seguridad.
        * **Seguridad y Verificación** ✅
            * **Antecedentes:** Acceso a la verificación y registro de antecedentes de personal.
        * **Reportes y Estadísticas** 📈
            * **Dashboard / Reporte General:** Acceso al panel de control con visualizaciones y filtros de datos consolidados.

3.  **Páginas de Gestión (Ej. `empresas.html`, `vehiculos.html`, etc.)** 📝
    * Cada sección (Empresas, Vehículos, Embarcaciones, Protestas, Fuerza Pública, Antecedentes) tiene su propia página dedicada.
    * Contiene tablas para visualizar los registros.
    * Botones para "Nuevo Registro", "Editar", "Eliminar" y "Exportar a Excel".
    * Formularios para la creación y edición de registros.
    * Funcionalidades específicas (ej. "Registrar Salida" para vehículos/embarcaciones, "Finalizar Protesta").

4.  **Dashboard / Reporte General (`dashboard.html` o `reporte_general.html`)** 📊
    * Presenta un resumen visual de los datos del sistema.
    * **KPIs:** Muestra contadores clave (ej. Total de Protestas, Vehículos Registrados).
    * **Filtros de Datos:** Permite filtrar la información por rango de fechas y tipos específicos.
    * **Gráficos:** Visualizaciones de datos (ej. Ingreso de Personal por Hora, Control Vehicular por Tipo, Protestas por Motivo).

---

## 🛠️ Instalación y Ejecución Local

Para poner en marcha el proyecto en tu máquina local:

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/JJMEJIAAVILA/SIS-FP-Project.git](https://github.com/JJMEJIAAVILA/SIS-FP-Project.git)
    cd SIS-FP-Project
    ```
2.  **Configura el Backend:**
    * Navega a la carpeta `backend`: `cd backend`
    * Instala las dependencias: `npm install`
    * Crea un archivo `.env` en la carpeta `backend` con tus variables de entorno. Ejemplo:
        ```
        MONGO_URI=mongodb://localhost:27017/sis_fp_db
        JWT_SECRET=tu_secreto_jwt_muy_seguro
        PORT=3000
        ```
    * Inicia el servidor backend: `npm start` (o `node server.js` si tu script de inicio es `server.js`)
3.  **Configura el Frontend:**
    * El frontend es estático (HTML, CSS, JS). Simplemente abre los archivos HTML en tu navegador.
    * Asegúrate de que las rutas a los archivos CSS y JS en tu HTML sean correctas (ej. `assets/css/global.css`).
    * Verifica que la URL de la API en los archivos JavaScript del frontend (`apiBaseUrl`) apunte a tu servidor backend (ej. `http://localhost:3000/api/empresas`).


---

¡Gracias por explorar SIS-FP-Project! Si tienes alguna pregunta, no dudes en contactarme.