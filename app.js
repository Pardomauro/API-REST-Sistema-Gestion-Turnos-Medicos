const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const PORT = 3020;

// Middleware CORS
// Permite solicitudes desde otros dominios, útil para desarrollo y APIs
app.use(cors());


// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Redirigir la raíz al archivo gestionDeTurnos.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gestionDeTurnos.html'));
});

// Routers
const pacientesRouter = require('./rutas/pacientesRouter');
const profesionalesRouter = require('./rutas/profesionalesRouter');
const turnosRouter = require('./rutas/turnosRouter');

// Middleware para procesar datos en formato JSON
app.use(express.json());

// Middleware para procesar datos en formato JSON y texto
app.use('/api/1.0/pacientes', pacientesRouter);
app.use('/api/2.0/profesionales', profesionalesRouter);
app.use('/api/3.0/turnos', turnosRouter);

// Manejo de errores
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('Express está escuchando en el puerto: ' + PORT);
});