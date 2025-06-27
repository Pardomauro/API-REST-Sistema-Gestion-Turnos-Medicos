# SGTM - Sistema de Gestión de Turnos Médicos

## Descripción
Aplicación web para la gestión de turnos médicos, pacientes y profesionales.

## Instalación

1. Clonar el repositorio o copiar los archivos.
2. Instalar dependencias:
   ```
   npm install
   ```
3. Configurar la base de datos MySQL (ver archivo `bd.js` para los datos de conexión).
4. Crear las tablas ejecutando los scripts SQL provistos.

## Uso

1. Iniciar el servidor:
   ```
   node app.js
   ```
   o
   ```
   npx nodemon app.js
   ```
2. Acceder desde el navegador a:
   ```
   http://localhost:3020/
   ```

## Endpoints principales

- `/api/3.0/turnos` - Listar turnos
- `/api/3.0/turnos/nuevo` - Crear turno (POST)
- `/api/3.0/turnos/modificar` - Modificar turno (PUT)
- `/api/3.0/turnos/:id` - Obtener turno por ID (GET)
- `/api/3.0/turnos/buscar` - Buscar turnos por filtros (GET)
- `/api/3.0/turnos/paciente/:paciente` - Turnos de un paciente (GET)
- `/api/2.0/profesionales/nuevo` - Crear profesional con foto (POST)

## Subida de archivos

- Para subir la foto de perfil de un profesional, el formulario debe tener `enctype="multipart/form-data"` y un campo `Foto_De_Perfil`.

## Autor

- Mauro Pardo
