// En este archivo definimos las rutas para la API de la base de datos MySQL

const mysql = require('mysql2');

// Creamos la conexión a la base de datos MySQL

const bd = mysql.createConnection(

    {
        host: 'localhost',
        user: 'root',
        password: 'pardomauro2',
        database: 'sgtm',
        connectTimeout: 60000, 

    }

);

// Conectamos a la base de datos

bd.connect((error) => {
    if (error) {
        console.error('Error al conectar a la base de datos:', error);
    } else {
        console.log('Conexión exitosa a la base de datos MySQL');
    }
});

// Exportamos la conexión para que pueda ser utilizada en otros archivos

module.exports = bd;