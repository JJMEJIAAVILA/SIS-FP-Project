# Documento Técnico del Sistema SIS-FP

**Autor:** JHON JAIRO MEJIA AVILA
**Fecha:** 08 de Julio de 2025
**Versión:** 1.0

---

## 1. Introducción

Este documento técnico describe la arquitectura, los componentes y las funcionalidades clave del Sistema Integral de Seguridad Física Portuaria (SIS-FP). El objetivo principal de SIS-FP es proporcionar una solución robusta para la gestión y el control de la seguridad en entornos portuarios, abarcando desde el registro de accesos hasta la verificación de antecedentes y el monitoreo de infraestructura.

---

## 2. Arquitectura del Sistema

SIS-FP se ha desarrollado siguiendo una arquitectura cliente-servidor (frontend y backend), con una base de datos NoSQL para el almacenamiento de datos.

### 2.1. Frontend (Cliente)

La interfaz de usuario del sistema (frontend) es una aplicación web que se ejecuta en el navegador del cliente.

* **Tecnologías:**
    * **HTML5:** Estructura de las páginas web.
    * **CSS3:** Estilos y diseño visual de la aplicación.
    * **Tailwind CSS:** Framework CSS utility-first para un desarrollo rápido y responsivo.
    * **JavaScript (Vanilla JS):** Lógica interactiva del lado del cliente, manejo de eventos, y comunicación con el backend.
    * **XLSX (SheetJS):** Librería JavaScript para la exportación de datos de tablas a archivos Excel (.xlsx).

* **Responsividad:** El diseño del frontend es completamente responsivo, adaptándose a diferentes tamaños de pantalla (escritorio, tabletas, móviles) mediante el uso de media queries y clases responsivas de Tailwind CSS.

### 2.2. Backend (Servidor)

El servidor (backend) es el corazón de la lógica de negocio, gestiona las solicitudes del frontend, interactúa con la base de datos y aplica las reglas de negocio.

* **Tecnologías:**
    * **Node.js:** Entorno de ejecución de JavaScript del lado del servidor.
    * **Express.js:** Framework web para Node.js que facilita la creación de APIs RESTful.
    * **Mongoose:** Librería de modelado de objetos (ODM) para MongoDB, que proporciona una forma sencilla de interactuar con la base de datos.
    * **JSON Web Tokens (JWT):** Utilizado para la autenticación y autorización de usuarios, asegurando que solo los usuarios autenticados puedan acceder a ciertas rutas de la API.

### 2.3. Base de Datos

El sistema utiliza una base de datos NoSQL para almacenar la información de manera flexible y escalable.

* **Tecnología:** **MongoDB**
* **Colecciones Principales:**
    * `users`: Almacena la información de los usuarios del sistema (credenciales, roles).
    * `antecedentes`: Contiene los registros de verificación de antecedentes de personas.
    * `registros_acceso`: Almacena los eventos de entrada y salida de personas, vehículos y embarcaciones.
    * `vehiculos`: Catálogo maestro de vehículos.
    * `embarcaciones`: Catálogo maestro de embarcaciones.
    * `empresas`: Catálogo maestro de empresas.
    * `protestas`: Registros de eventos de protestas.
    * `fuerza_publica`: Registros de solicitudes de apoyo de fuerza pública.
    * `luces`: Gestión del sistema de luces.
    * `registro_camaras`: Gestión del registro de cámaras.

---

## 3. Módulos y Funcionalidades Clave

SIS-FP se organiza en módulos que cubren diferentes aspectos de la seguridad portuaria.

### 3.1. Módulo de Autenticación (Login)

* **Propósito:** Controlar el acceso al sistema.
* **Funcionalidades:** Inicio de sesión de usuarios, validación de credenciales, generación y manejo de JWT.

### 3.2. Módulo de Menú Principal

* **Propósito:** Proporcionar una navegación centralizada a todos los módulos del sistema.
* **Funcionalidades:** Presenta tarjetas interactivas que redirigen a las diferentes secciones.

### 3.3. Módulo de Administración de Usuarios (`admin_users.html`)

* **Propósito:** Gestión de las cuentas de usuario del sistema.
* **Funcionalidades:** Creación, lectura, actualización y eliminación (CRUD) de usuarios. Asignación de roles.

### 3.4. Módulo de Verificación de Antecedentes (`antecedentes.html`)

* **Propósito:** Registrar y gestionar el historial de verificación de antecedentes de personas.
* **Funcionalidades:**
    * CRUD de registros de antecedentes.
    * Búsqueda y paginación de antecedentes.
    * Exportación de datos a Excel.
    * **Validación de Renovación (Regla de Negocio):** Una verificación de antecedentes no puede ser renovada antes de 6 meses desde su última `fecha_verificacion`. El sistema valida esta regla al intentar actualizar un registro existente.

### 3.5. Módulo de Registro de Accesos (`registro_acceso.html`)

* **Propósito:** Registrar y controlar las entradas y salidas de personas, vehículos y embarcaciones en el puerto.
* **Funcionalidades:**
    * Registro de accesos con fecha y hora automáticas (no editables).
    * Registro de datos de persona (N.I., nombre, empresa) directamente en el formulario.
    * Selección del tipo de ingreso (Terrestre o Marítimo) con campos condicionales.
    * **Creación Implícita de Activos (Revertido):** *Nota: Esta funcionalidad fue explorada pero revertida. El sistema ahora espera que los vehículos y embarcaciones existan en sus catálogos maestros si se usan en un registro de acceso.*
    * Registro de hora y fecha de salida para los accesos.
    * Edición y eliminación de registros de acceso.
    * Búsqueda y paginación de registros.
    * Exportación de datos a Excel.

### 3.6. Otros Módulos (Reporte de Empresas, Vehículos, Embarcaciones, Luces, Cámaras, Protestas, Fuerza Pública, Reporte General)

* **Propósito:** Proporcionar interfaces para la gestión y visualización de datos específicos de cada área.
* **Funcionalidades:** CRUD básico, búsqueda, paginación y exportación a Excel para cada entidad.

---

## 4. Seguridad

El sistema implementa medidas de seguridad para proteger la información y el acceso no autorizado:

* **Autenticación Basada en JWT:** Los usuarios deben iniciar sesión para obtener un token JWT, que se utiliza para autenticar todas las solicitudes subsecuentes al backend.
* **Protección de Rutas:** Las rutas de la API en el backend están protegidas, requiriendo un token JWT válido para acceder a ellas.
* **Contraseñas Hasheadas:** Las contraseñas de los usuarios se almacenan de forma segura utilizando hashing (ej. bcrypt) en la base de datos.

---

## 5. Conclusión

SIS-FP es una solución integral que centraliza la gestión de seguridad portuaria a través de una interfaz de usuario intuitiva y un backend robusto. La implementación de la validación de reglas de negocio específicas (como la renovación de antecedentes) mejora la eficiencia operativa y la integridad de los datos.

---