// Creamos un middleware para manejar errores en la aplicación Express
// Este middleware captura errores y envía una respuesta JSON con el mensaje de error

function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Error interno del servidor'
        }
    });
}

module.exports = errorHandler;