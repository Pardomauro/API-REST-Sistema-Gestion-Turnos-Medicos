

const express = require('express');
const profesionalesRouter=express.Router();
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer');

// Configuración de Multer
// Este middleware se utiliza para manejar la subida de archivos en las solicitudes HTTP
// En este caso, se configura para almacenar las fotos de perfil de los profesionales en una carpeta
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/fotos_profesionales'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Ruta para subir foto de perfil y crear profesional
// Esta ruta maneja la creación de un nuevo profesional en la base de datos
// Recibe los datos del profesional y la foto de perfil, y los almacena en la base de datos
// La foto de perfil se guarda en una carpeta específica y se almacena su nombre en la base de datos
// La ruta es accesible mediante una solicitud POST a '/nuevo' 
// y utiliza el middleware 'upload.single' para manejar la subida de un solo archivo
// El archivo debe llamarse 'Foto_De_Perfil' y se espera que sea una imagen

profesionalesRouter.post('/nuevo', upload.single('Foto_De_Perfil'), (req, res) => {
    const { DNI, Nombre_Completo, Especializacion, Matricula, Horarios_Disponibles } = req.body;
    const fotoPerfil = req.file ? req.file.filename : null;

    const sql = 'INSERT INTO Profesionales (DNI, Nombre_Completo, Especializacion, Matricula, Horarios_Disponibles, Foto_De_Perfil) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [DNI, Nombre_Completo, Especializacion, Matricula, Horarios_Disponibles, fotoPerfil];

    bd.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error al agregar en la base de datos:', err);
            return res.status(500).json({ error: 'No se pudo agregar el profesional.' });
        }
        res.json({ mensaje: 'Profesional agregado correctamente', foto: fotoPerfil });
    });
});


// Creamos la conexión a la base de datos MySQL
const bd = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'pardomauro2',
    database: 'sgtm', 
    connectTimeout: 60000,
});

// Conectamos a la base de datos
bd.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
    } else {
        console.log('Conexión exitosa a la base de datos MySQL');
    }
});

// Antes de realizar la API, procesamos el middleware para recibir datos en formato JSON / texto
profesionalesRouter.use(express.json());
profesionalesRouter.use(express.text());

// Modelo Profesional

class Profesional {
    constructor(DNI, Nombre_Completo, Especializacion, Matricula, Horarios_Disponibles, Foto_De_Perfil) {
        this.DNI = DNI;
        this.Nombre_Completo = Nombre_Completo;
        this.Especializacion = Especializacion;
        this.Matricula = Matricula;
        this.Horarios_Disponibles = Horarios_Disponibles;
        this.Foto_De_Perfil = Foto_De_Perfil;
    }
}

// Obtener profesionales por especialidad
// Esta ruta permite obtener una lista de profesionales filtrados por especialidad
// Si se proporciona un parámetro de consulta 'especialidad', se filtran los profesionales por esa especialidad
// Si no se proporciona, se devuelven todos los profesionales

profesionalesRouter.get('/', (req, res) => {
    const especialidad = req.query.especialidad;
    let sql = 'SELECT * FROM Profesionales';
    let params = [];
    if (especialidad) {
        sql += ' WHERE Especializacion = ?';
        params.push(especialidad);
    }
    bd.query(sql, params, (err, rows) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        res.json(rows);
    });
});

// Obtener un profesional por DNI
// Esta ruta permite obtener un profesional específico por su DNI


profesionalesRouter.get('/:dni', (req, res) => {
    const dni = req.params.dni;
    const sql = 'SELECT * FROM Profesionales WHERE DNI = ?';
    bd.query(sql, [dni], (err, rows) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        if (arrayVacio(rows)) {
            return res.status(404).json({ mensaje: 'No existe el profesional solicitado' });
        }
        res.json(rows[0]);
    });
});

// funcion para saber si el array está vacío
const arrayVacio = (arr) => !Array.isArray(arr) || arr.length === 0;




// Modificar un profesional existente
profesionalesRouter.put('/modificar', (req, res) => {
    const { DNI, Nombre_Completo, Especializacion, Matricula, Horarios_Disponibles, Foto_De_Perfil } = req.body;
    const sql = 'UPDATE Profesionales SET Nombre_Completo=?, Especializacion=?, Matricula=?, Horarios_Disponibles=?, Foto_De_Perfil=? WHERE DNI=?';
    const values = [Nombre_Completo, Especializacion, Matricula, Horarios_Disponibles, Foto_De_Perfil || null, DNI];
    const profesionalActualizado = new Profesional(DNI, Nombre_Completo, Especializacion, Matricula, Horarios_Disponibles, Foto_De_Perfil);

    bd.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error al modificar en la base de datos:', err);
            return res.status(500).json({ error: 'Los datos no se pudieron modificar en la base de datos' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No existe el profesional a modificar' });
        }
        res.json({ mensaje: 'Se modificaron los datos del profesional', profesional: profesionalActualizado });
    });
});

// Eliminar un profesional por DNI
profesionalesRouter.delete('/:dni', (req, res) => {
    const dni = req.params.dni;
    const sql = 'DELETE FROM Profesionales WHERE DNI = ?';
    bd.query(sql, [dni], (err, result) => {
        if (err) {
            console.error('Error al eliminar en la base de datos:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No existe el profesional a eliminar' });
        }
        res.json({ mensaje: `Se eliminó el profesional cuyo DNI es ${dni}` });
    });
});

module.exports = profesionalesRouter;