# Acta de Aplicación de Pruebas y Aceptación del Sistema SIS-FP

**Fecha de Aplicación:** 08 de Julio de 2025
**Versión del Sistema Probado:** 1.0
**Probador(es):** JHON JAIRO MEJIA AVILA 
**Revisor(es) / Aceptación:** JULIAN ANDRES LOAIZA LOPEZ

---

## 1. Introducción

Este documento resume los resultados de las pruebas funcionales realizadas al Sistema Integral de Seguridad Física Portuaria (SIS-FP) con el fin de verificar su correcto funcionamiento y aceptación de las funcionalidades implementadas.

---

## 2. Módulos Probados

Se realizaron pruebas exhaustivas en los siguientes módulos principales del sistema:

* Módulo de Autenticación (Login)
* Módulo de Menú Principal
* Módulo de Administración de Usuarios
* Módulo de Verificación de Antecedentes
* Módulo de Registro de Accesos
* Módulo de Reporte de Empresas
* Módulo de Reporte de Vehículos
* Módulo de Reporte de Embarcaciones
* Módulo de Sistema de Luces
* Módulo de Registro de Cámaras
* Módulo de Reporte de Protestas
* Módulo de Apoyo de la Fuerza Pública
* Módulo de Reporte General de Seguridad

---

## 3. Casos de Prueba y Resultados

A continuación, se detallan algunos de los casos de prueba clave ejecutados y sus resultados:

### 3.1. Módulo de Autenticación (Login)

| ID Caso | Descripción del Caso de Prueba | Pasos de Prueba | Resultado Esperado | Resultado Obtenido | Estado |
| :------ | :----------------------------- | :-------------- | :----------------- | :----------------- | :----- |
| L-001   | Inicio de sesión exitoso       | 1. Ingresar credenciales válidas. 2. Clic en "Iniciar Sesión". | Redirección al menú principal. | OK | Aceptado |
| L-002   | Inicio de sesión fallido       | 1. Ingresar credenciales inválidas. 2. Clic en "Iniciar Sesión". | Mensaje de error de credenciales. | OK | Aceptado |

### 3.2. Módulo de Verificación de Antecedentes

| ID Caso | Descripción del Caso de Prueba | Pasos de Prueba | Resultado Esperado | Resultado Obtenido | Estado |
| :------ | :----------------------------- | :-------------- | :----------------- | :----------------- | :----- |
| A-001   | Creación de nuevo antecedente  | 1. Clic en "Nuevo Registro". 2. Llenar todos los campos obligatorios. 3. Clic en "Guardar Registro". | El antecedente se guarda y aparece en la tabla. | OK | Aceptado |
| A-002   | Edición de antecedente existente | 1. Clic en "Editar" en un registro. 2. Modificar un campo (ej. Observaciones). 3. Clic en "Actualizar Registro". | El antecedente se actualiza en la tabla. | OK | Aceptado |
| A-003   | Eliminación de antecedente     | 1. Clic en "Eliminar" en un registro. 2. Confirmar eliminación. | El antecedente es eliminado de la tabla. | OK | Aceptado |
| A-004   | **Renovación antes de 6 meses** | 1. Editar un antecedente. 2. Cambiar `Fecha de Verificación` a una fecha **anterior a 6 meses** de la última. 3. Clic en "Actualizar Registro". | Mensaje de error: "La verificación de antecedentes no puede ser renovada antes de 6 meses..." | OK | Aceptado |
| A-005   | **Renovación después de 6 meses** | 1. Editar un antecedente. 2. Cambiar `Fecha de Verificación` a una fecha **posterior a 6 meses** de la última. 3. Clic en "Actualizar Registro". | El antecedente se actualiza exitosamente. | OK | Aceptado |
| A-006   | Búsqueda de antecedentes       | 1. Ingresar término de búsqueda en el campo "BUSCAR". | La tabla filtra los resultados según el término. | OK | Aceptado |
| A-007   | Exportación a Excel            | 1. Clic en "EXPORTAR EXCEL". | Se descarga un archivo .xlsx con los datos de la tabla. | OK | Aceptado |

### 3.3. Módulo de Registro de Accesos

| ID Caso | Descripción del Caso de Prueba | Pasos de Prueba | Resultado Esperado | Resultado Obtenido | Estado |
| :------ | :----------------------------- | :-------------- | :----------------- | :----------------- | :----- |
| RA-001  | Registro de acceso Terrestre   | 1. Clic en "Nuevo Registro de Acceso". 2. Llenar campos de persona, seleccionar "TERRESTRE", llenar campos de vehículo. 3. Clic en "Guardar Registro". | El registro de acceso se guarda y aparece en la tabla. | OK | Aceptado |
| RA-002  | Registro de acceso Marítimo    | 1. Clic en "Nuevo Registro de Acceso". 2. Llenar campos de persona, seleccionar "MARITIMO", llenar campos de embarcación. 3. Clic en "Guardar Registro". | El registro de acceso se guarda y aparece en la tabla. | OK | Aceptado |
| RA-003  | Registro de Salida             | 1. En un registro sin hora de salida, clic en "Registrar Salida". 2. Llenar fecha y hora de salida. 3. Clic en "Guardar Salida". | La hora y fecha de salida se actualizan en el registro. | OK | Aceptado |
| RA-004  | Edición de registro de acceso  | 1. Clic en "Editar" en un registro. 2. Modificar campos (ej. Observaciones). 3. Clic en "Actualizar Registro". | El registro de acceso se actualiza en la tabla. | OK | Aceptado |
| RA-005  | Eliminación de registro de acceso | 1. Clic en "Eliminar" en un registro. 2. Confirmar eliminación. | El registro de acceso es eliminado de la tabla. | OK | Aceptado |
| RA-006  | Búsqueda de registros de acceso | 1. Ingresar término de búsqueda en el campo "BUSCAR". | La tabla filtra los resultados según el término. | OK | Aceptado |
| RA-007  | Exportación a Excel            | 1. Clic en "EXPORTAR EXCEL". | Se descarga un archivo .xlsx con los datos de la tabla. | OK | Aceptado |

### 3.4. Otros Módulos (Empresas, Vehículos, Embarcaciones, Admin. Usuarios, etc.)

Se verificó el correcto funcionamiento de las operaciones CRUD (Crear, Leer, Actualizar, Eliminar), búsqueda, paginación y exportación a Excel en cada uno de los módulos restantes, confirmando que cumplen con su propósito individual.

---

## 4. Observaciones y Conclusión

Las pruebas realizadas confirman que el Sistema Integral de Seguridad Física Portuaria (SIS-FP) opera de acuerdo con los requisitos funcionales definidos. Todas las funcionalidades principales, incluyendo la validación específica de 6 meses para la renovación de antecedentes, han sido verificadas con éxito.

El sistema está listo para su aceptación y posible despliegue.

---

## 5. Firmas de Aceptación

**Probador(es):**

JHON JAIRO MEJIA AVILA
[Firma]
[Fecha]

[Nombre del Probador 2 (si aplica)]
[Firma]
[Fecha]

**Revisor(es) / Cliente:**

JUALIAN ANDRES LOAIZA LOPEZ
[Firma]
[Fecha]