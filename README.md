# 🚢 SIS-FP: Solución Integral de Seguridad Física Portuaria

---

## 🌟 Descripción del Proyecto

Bienvenido a **SIS-FP**, tu aliado estratégico para la **gestión integral de la seguridad física en entornos portuarios**. 🌊 Este sistema te permite registrar y monitorear de cerca todas las actividades y elementos críticos, ofreciéndote una visión consolidada para tomar decisiones rápidas y efectivas en materia de seguridad. ¡Mantén tu puerto seguro y eficiente! ⚓

---

## ✨ Características Destacadas

Hemos desarrollado las siguientes funcionalidades clave para optimizar tus operaciones:

* **🔐 Autenticación Robusta:**
    * Registro de nuevos usuarios en pocos pasos.
    * Inicio de sesión seguro con **JWT** para proteger tus datos.
    * Gestión sencilla de perfiles de usuario.
* **👥 Gestión de Usuarios (Solo Admins):**
    * Control total: Lista, crea, edita y elimina usuarios.
    * Asignación de roles flexibles (`admin`, `operator`, `viewer`) para un control preciso de accesos.
    * Rutas y funciones protegidas por **RBAC (Role-Based Access Control)**.
* **📊 Módulos de Reporte y Gestión Específicos:**
    * **🏢 Empresas:** Administra el personal y sus entradas/salidas.
    * **🚗 Vehículos:** Monitorea el tráfico vehicular en el puerto.
    * **🛥️ Embarcaciones:** Controla el movimiento marítimo.
    * **🕵️‍♂️ Antecedentes:** Registra y consulta historiales de personal.
    * **💡 Luces:** Supervisa el sistema de iluminación.
    * **📸 Cámaras:** Configura y vigila tus sistemas de video.
    * **📢 Protestas:** Registra y gestiona eventos de alteración del orden.
    * **🛡️ Fuerza Pública:** Coordina y registra solicitudes de apoyo.
* **📈 Dashboard Interactivo y Potente:**
    * **KPIs en tiempo real:** Visualiza métricas clave de un vistazo.
    * **Gráficos dinámicos:** Barras, pastel, y donas para análisis visual de datos.
    * **Filtros avanzados:** Segmenta tus datos por rangos de fechas (día, mes, año, personalizado) y por tipo (vehículos, embarcaciones).
* **📱 Diseño Moderno y Adaptable:**
    * Interfaz **"Glassmorphism"** con un tema oscuro elegante.
    * **Responsivo:** Se adapta perfectamente a cualquier pantalla, desde móviles hasta grandes monitores, gracias a **Tailwind CSS**.

---

## 🛠️ Tecnologías Utilizadas

Este proyecto está construido con herramientas robustas y modernas:

### Backend

* **Node.js**: Entorno de ejecución JavaScript.
* **Express.js**: Framework web para construir APIs RESTful.
* **MongoDB**: Base de datos NoSQL flexible y escalable.
* **Mongoose**: Modelado de objetos para MongoDB.
* **JWT (JSON Web Tokens)**: Seguridad y autenticación sin estado.
* **Bcrypt.js**: Para un almacenamiento seguro de contraseñas.
* **CORS**: Manejo de políticas de origen cruzado.
* **Dotenv**: Gestión de variables de entorno seguras.

### Frontend

* **HTML5**: Estructura semántica de las páginas web.
* **CSS3**: Estilos modernos y diseño responsive con efecto "glassmorphism".
* **JavaScript**: Lógica interactiva del lado del cliente.
* **Tailwind CSS**: Un framework CSS de primera clase para un desarrollo rápido y flexible.
* **Chart.js**: Librería para crear gráficos impresionantes y personalizables.
* **Font Awesome**: Iconos vectoriales escalables.

---

## 🚀 Estructura del Proyecto

SIS-FP/
├── assets/
│   ├── css/
│   │   ├── admin_users.css
│   │   ├── global.css
│   │   ├── menu.css
│   │   └── reporte_general.css
│   ├── img/
│   │   └── (Imágenes de fondo y otras)
│   └── js/
│       ├── admin_users.js
│       ├── login.js
│       ├── menu.js
│       └── reporte_general.js
├── backend/
│   ├── controllers/
│   │   ├── adminUserController.js
│   │   ├── authController.js (si existe)
│   │   └── dashboardController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Antecedente.js
│   │   ├── Camara.js
│   │   ├── Embarcacion.js
│   │   ├── Empresa.js
│   │   ├── FuerzaPublica.js
│   │   ├── Luz.js
│   │   ├── Protesta.js
│   │   ├── User.js
│   │   └── Vehiculo.js
│   ├── routes/
│   │   ├── adminUserRoutes.js
│   │   ├── antecedentesRoutes.js
│   │   ├── camarasRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── embarcacionesRoutes.js
│   │   ├── empresas.js
│   │   ├── fuerzaPublicaRoutes.js
│   │   ├── lucesRoutes.js
│   │   ├── protestasRoutes.js
│   │   └── vehiculos.js
│   └── server.js
├── admin_users.html
├── antecedentes.html
├── camaras.html
├── dashboard.html (o reporte_general.html)
├── embarcaciones.html
├── empresas.html
├── fuerza_publica.html
├── index.html (página de bienvenida/landing)
├── login.html
├── luces.html
├── menu.html
├── protestas.html
├── registro_camaras.html
├── vehiculos.html
└── .env.example (archivo de ejemplo para variables de entorno)


---

## 🚀 Configuración y Ejecución

¡Poner en marcha SIS-FP es muy fácil! Sigue estos pasos:

### ⚙️ Prerrequisitos

Asegúrate de tener instalados estos esenciales:

* **Node.js y npm**: Descárgalos desde [nodejs.org](https://nodejs.org/).
* **MongoDB**: Instala MongoDB Community Server desde [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community). ¡Recuerda que el servicio de MongoDB debe estar activo (generalmente en `mongodb://localhost:27017`)! 🗄️ Puedes usar MongoDB Compass para una gestión visual.

### 📦 Instalación del Backend

1.  **Dirígete a la carpeta `backend`**:
    ```bash
    cd SIS-FP/backend
    ```
2.  **Instala todas las dependencias de Node.js**:
    ```bash
    npm install
    ```
3.  **Crea tu archivo `.env`**:
    En la carpeta `backend`, crea un archivo llamado `.env`. Este archivo contendrá tus variables de entorno sensibles. ¡Puedes copiar el contenido de `.env.example` y personalizarlo!

    ```env
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/sis_fp_db
    JWT_SECRET=tu_clave_secreta_muy_larga_y_segura!
    ```
    * `PORT`: El puerto donde tu servidor backend estará escuchando.
    * `MONGO_URI`: La cadena de conexión a tu base de datos MongoDB.
    * `JWT_SECRET`: Una clave secreta **MUY SEGURA** para firmar los tokens JWT. ¡**Cámbiala por una cadena aleatoria y compleja** antes de ir a producción! 🔒

### 🗄️ Configuración de la Base de Datos

Asegúrate de que tu base de datos `sis_fp_db` esté accesible y funcionando.

**Para el Acceso de Administrador:**
Para usar la interfaz de gestión de usuarios, necesitas que al menos una cuenta en tu base de datos tenga el rol de `admin`. Si no tienes una, puedes modificar un usuario existente o crear uno nuevo usando MongoDB Compass:

1.  Abre MongoDB Compass y conéctate a `mongodb://localhost:27017`.
2.  Selecciona tu base de datos `sis_fp_db`.
3.  Ve a la colección `users`.
4.  Encuentra el documento del usuario al que quieres darle acceso de administrador (o crea uno nuevo).
5.  Haz clic en el icono de edición (el lápiz ✏️) y asegúrate de que el campo `role` esté configurado como `"admin"`:
    ```json
    {
      // ... otros campos
      "username": "superadmin",
      "email": "admin@example.com",
      "password": "hashed_password",
      "role": "admin", // ✨ ¡Este es el campo clave!
      // ... otros campos
    }
    ```
6.  ¡Guarda los cambios y listo!

### ▶️ Ejecución del Backend

1.  Desde la carpeta `backend`, inicia tu servidor con un simple comando:
    ```bash
    node server.js
    ```
    Si todo va bien, verás un mensaje confirmando que tu servidor Express está escuchando en el puerto 3000 y que MongoDB se ha conectado correctamente. 🎉

### 🌐 Ejecución del Frontend

El frontend de SIS-FP funciona con archivos estáticos, ¡así que es muy fácil de lanzar!

1.  Abre tu navegador web favorito (Chrome, Firefox, Edge, Safari).
2.  Navega directamente a la página de inicio de sesión de tu aplicación. Si tu backend está en `localhost:3000` y tus archivos frontend están en la raíz de `SIS-FP`, la URL más común sería:
    ```
    http://localhost:3000/login.html
    ```
    Si usas una extensión como Live Server en VS Code, simplemente abre `login.html` con ella, y el frontend se conectará automáticamente a tu backend en `localhost:3000`.

---

## 👩‍💻 Uso de la Aplicación

1.  **Iniciar Sesión:**
    * Usa las credenciales de un usuario registrado. Si tienes un usuario con `role: "admin"`, ¡podrás explorar todas las funcionalidades!
2.  **Navegación Intuitiva:**
    * Desde el menú principal, accede fácilmente a todos los módulos de reporte y gestión.
    * El **Dashboard** te espera con análisis de datos en tiempo real y filtros personalizables.
3.  **Gestión de Usuarios (¡Solo Admins!):**
    * Haz clic en la tarjeta "Admin. Usuarios" en el menú principal.
    * Desde ahí, tendrás el poder de gestionar todas las cuentas del sistema.

---

## 💡 Próximas Mejoras y Consideraciones

* **Dashboard al 💯:** Continuar afinando los contadores y gráficos para que siempre muestren datos precisos.
* **PWA - Acceso Directo:** Implementar la funcionalidad completa de PWA (`manifest.json` y Service Worker) para una experiencia de instalación en el escritorio/móvil con un icono personalizado. 📱
* **Manejo de Errores Amigable:** Mejorar los mensajes de error en el frontend para una experiencia de usuario más fluida.
* **Optimización del Rendimiento:** Considerar la adición de índices en la base de datos para consultas más rápidas en colecciones grandes.
* **Seguridad Avanzada:** Para entornos de producción, ¡siempre es buena idea implementar HTTPS y validaciones de entrada más rigurosas!

---

¡Esperamos que disfrutes desarrollando y utilizando **SIS-FP**! 🎉

Si tienes alguna pregunta, sugerencia o necesitas ayuda, ¡no dudes en comunicarte!