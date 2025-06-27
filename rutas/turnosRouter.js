const express = require('express');
const turnosRouter = express.Router();
const mysql = require('mysql2');

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
turnosRouter.use(express.json());
turnosRouter.use(express.text());

// Modelo Turno (opcional)

class Turno {
    constructor(id, Fecha_Hora, Profesional_Asignado, Paciente_Asignado, Estado_De_Turno, Observaciones) {
        this.id = id;
        this.Fecha_Hora = Fecha_Hora;
        this.Profesional_Asignado = Profesional_Asignado;
        this.Paciente_Asignado = Paciente_Asignado;
        this.Estado_De_Turno = Estado_De_Turno;
        this.Observaciones = Observaciones;
    }
}


// ------------------- ENDPOINTS ESPECÍFICOS -------------------

// Buscar turnos por fecha, estado o profesional
turnosRouter.get('/buscar', (req, res) => {
    const { fecha, estado, profesional } = req.query;
    let sql = 'SELECT * FROM Turnos WHERE 1=1';
    const params = [];

    if (fecha) {
        sql += ' AND DATE(Fecha_Hora) = ?';
        params.push(fecha);
    }
    if (estado) {
        sql += ' AND Estado_De_Turno = ?';
        params.push(estado);
    }
    if (profesional) {
        sql += ' AND Profesional_Asignado = ?';
        params.push(profesional);
    }

    bd.query(sql, params, (err, rows) => {
        if (err) {
            console.error('Error al buscar turnos:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        res.json(rows);
    });
});



// Listar todos los turnos asignados a un profesional específico
// Este endpoint permite obtener todos los turnos asignados a un profesional específico
// Se espera que el parámetro de la ruta sea el DNI del profesional

turnosRouter.get('/profesional/:profesional', (req, res) => {
    const profesional = req.params.profesional;
    const sql = 'SELECT * FROM Turnos WHERE Profesional_Asignado = ?';
    bd.query(sql, [profesional], (err, rows) => {
        if (err) {
            console.error('Error al consultar turnos del profesional:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        res.json(rows);
    });
});

// Listar todos los turnos de un paciente (historial)
turnosRouter.get('/paciente/:paciente', (req, res) => {
    const paciente = req.params.paciente;
    const sql = `
        SELECT 
            t.id,
            DATE_FORMAT(t.Fecha_Hora, '%Y-%m-%d %H:%i') AS Fecha_Hora,
            t.Paciente_Asignado,
            t.Estado_De_Turno,
            t.Observaciones,
            p.Nombre_Completo AS Profesional_Nombre,
            p.Especializacion AS Especialidad
        FROM Turnos t
        JOIN Profesionales p ON t.Profesional_Asignado = p.DNI
        WHERE t.Paciente_Asignado = ?
    `;
    bd.query(sql, [paciente], (err, rows) => {
        if (err) {
            console.error('Error al consultar turnos del paciente:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        res.json(rows);
    });
});

// Consultar si un paciente tiene turnos pendientes
turnosRouter.get('/paciente/:paciente/pendientes', (req, res) => {
    const paciente = req.params.paciente;
    const sql = "SELECT * FROM Turnos WHERE Paciente_Asignado = ? AND Estado_De_Turno = 'pendiente'";
    bd.query(sql, [paciente], (err, rows) => {
        if (err) {
            console.error('Error al consultar turnos pendientes:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        res.json(rows);
    });
});

// Cancelar un turno, actualizando su estado
turnosRouter.put('/cancelar/:id', (req, res) => {
    const id = req.params.id;
    const sql = "UPDATE Turnos SET Estado_De_Turno = 'cancelado' WHERE id = ?";
    bd.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al cancelar el turno:', err);
            return res.status(500).json({ error: 'No se pudo cancelar el turno.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No existe el turno a cancelar' });
        }
        res.json({ mensaje: `El turno con id ${id} fue cancelado correctamente.` });
    });
});



// Obtener todos los turnos
turnosRouter.get('/', (req, res) => {
    const sql = `
        SELECT 
            t.id,
            DATE_FORMAT(t.Fecha_Hora, '%Y-%m-%d %H:%i') AS Fecha_Hora,
            t.Paciente_Asignado,
            t.Estado_De_Turno,
            t.Observaciones,
            p.Especializacion AS Especialidad
        FROM Turnos t
        JOIN Profesionales p ON t.Profesional_Asignado = p.DNI
    `;
    bd.query(sql, (err, rows) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        res.json(rows);
    });
});

// Obtener un turno por id
turnosRouter.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM Turnos WHERE id = ?';
    bd.query(sql, [id], (err, rows) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        if (arrayVacio(rows)) {
            return res.status(404).json({ mensaje: 'No existe el turno solicitado' });
        }
        res.json(rows[0]);
    });
});

// Función para saber si el array está vacío
const arrayVacio = (arr) => !Array.isArray(arr) || arr.length === 0;






// Crear un nuevo turno
// Este endpoint permite agregar un nuevo turno a la base de datos
// Se espera que el cuerpo de la solicitud contenga los datos del turno en formato JSON


turnosRouter.post('/nuevo', (req, res) => {
    console.log('Datos recibidos en /nuevo:', req.body);
    const { Fecha_Hora, Profesional_Asignado } = req.body;
    // Validar horario permitido
    const horaTurno = Fecha_Hora.split(' ')[1]?.slice(0, 5);
    const horariosValidos = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'];
    if (!horariosValidos.includes(horaTurno)) {
        return res.status(400).json({ error: 'Horario fuera del rango permitido (08:00 a 13:00)' });
    }
    // Verificamos si ya existe un turno en ese horario para el mismo profesional
    const sqlCheck = 'SELECT * FROM Turnos WHERE Fecha_Hora = ? AND Profesional_Asignado = ?';
    bd.query(sqlCheck, [Fecha_Hora, Profesional_Asignado], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al verificar disponibilidad' });
        if (rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe un turno agendado para este horario' });
        }
        // Si está disponible, insertar el turno
        const { Paciente_Asignado, Estado_De_Turno, Observaciones } = req.body;
        const sqlInsert = 'INSERT INTO Turnos (Fecha_Hora, Profesional_Asignado, Paciente_Asignado, Estado_De_Turno, Observaciones) VALUES (?, ?, ?, ?, ?)';
        const values = [Fecha_Hora, Profesional_Asignado, Paciente_Asignado, Estado_De_Turno, Observaciones || null];
        bd.query(sqlInsert, values, (err2, result) => {
            if (err2) {
                return res.status(500).json({ error: 'No se pudo agendar el turno, este paciente no se encuentra registrado' });
            }
            res.json({ mensaje: 'El turno se agregó correctamente' });
        });
    });
});



// Modificar un turno existente
// Este endpoint permite modificar un turno existente en la base de datos
// Se espera que el cuerpo de la solicitud contenga los datos del turno en formato JSON


turnosRouter.put('/modificar', (req, res) => {
    console.log('Datos recibidos en /modificar:', req.body);
    const { id, Fecha_Hora, Profesional_Asignado, Paciente_Asignado, Estado_De_Turno, Observaciones } = req.body;
    // Validar horario permitido
    const horaTurno = Fecha_Hora.split(' ')[1]?.slice(0, 5);
    const horariosValidos = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'];
    if (!horariosValidos.includes(horaTurno)) {
        return res.status(400).json({ error: 'Horario fuera del rango permitido (08:00 a 13:00)' });
    }

    // Verificamos que no exista otro turno con el mismo profesional y horario (excpeto el actual)
    const sqlCheck = 'SELECT * FROM Turnos WHERE Fecha_Hora = ? AND Profesional_Asignado = ? AND id <> ?';
    bd.query(sqlCheck, [Fecha_Hora, Profesional_Asignado, id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al verificar disponibilidad' });
        }
        if (rows.length > 0) {
            return res.status(400).json({ error: 'No hay turnos para este horario' });
        }

        // Si está disponible, actualizar el turno
        const sql = 'UPDATE Turnos SET Fecha_Hora=?, Profesional_Asignado=?, Paciente_Asignado=?, Estado_De_Turno=?, Observaciones=? WHERE id=?';
        const values = [Fecha_Hora, Profesional_Asignado, Paciente_Asignado, Estado_De_Turno, Observaciones || null, id];

        bd.query(sql, values, (err2, result) => {
            if (err2) {
                console.error('Error al modificar en la base de datos:', err2);
                return res.status(500).json({ error: 'Los datos no se pudieron modificar en la base de datos' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: 'No existe el turno a modificar' });
            }
            res.json({ mensaje: 'Se modificaron los datos del turno', turno: { id, Fecha_Hora, Profesional_Asignado, Paciente_Asignado, Estado_De_Turno, Observaciones } });
        });
    });
});

// Eliminar un turno por id
// Este endpoint permite eliminar un turno específico por su id
// Si el turno no existe, se devuelve un mensaje de error 404

turnosRouter.delete('/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM Turnos WHERE id = ?';
    bd.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar en la base de datos:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No existe el turno a eliminar' });
        }
        res.json({ mensaje: `Se eliminó el turno cuyo id es ${id}` });
    });
});

module.exports = turnosRouter;
