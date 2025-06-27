
const express = require('express');
const db = require('./bd'); 
const pacientesRouter = express.Router();

// Middleware para recibir datos en formato JSON / texto
pacientesRouter.use(express.json());
pacientesRouter.use(express.text());

// Modelo Paciente

class Paciente {
    constructor(DNI, Nombre_Completo, Fecha_Nacimiento, Email, Historial_Basico) {
        this.DNI = DNI;
        this.Nombre_Completo = Nombre_Completo;
        this.Fecha_Nacimiento = Fecha_Nacimiento;
        this.Email = Email;
        this.Historial_Basico = Historial_Basico;
    }
}

// Función para saber si el array está vacío
const arrayVacio = (arr) => !Array.isArray(arr) || arr.length === 0;

// Obtener todos los pacientes
pacientesRouter.get('/', (req, res) => {
    const sql = 'SELECT * FROM Pacientes';
    db.query(sql, (err, rows) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        res.json(rows);
    });
});

// Obtener un paciente por DNI
// Este endpoint permite obtener un paciente específico por su DNI
// Si el paciente no existe, se devuelve un mensaje de error 404
// Si ocurre un error al consultar la base de datos, se devuelve un mensaje de error

pacientesRouter.get('/:dni', (req, res) => {
    const dni = req.params.dni;
    const sql = 'SELECT * FROM Pacientes WHERE DNI = ?';
    db.query(sql, [dni], (err, rows) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        if (arrayVacio(rows)) {
            return res.status(404).json({ mensaje: 'No existe el paciente solicitado' });
        }
        res.json(rows[0]);
    });
});

// Crear un nuevo paciente
// Este endpoint permite agregar un nuevo paciente a la base de datos
// Se espera que el cuerpo de la solicitud contenga los datos del paciente en formato JSON
// Si los datos se agregan correctamente, se devuelve un mensaje de éxito junto con el paciente creado

pacientesRouter.post('/nuevo', (req, res) => {
    const { DNI, Nombre_Completo, Fecha_Nacimiento, Email, Historial_Basico } = req.body;
    const sql = 'INSERT INTO Pacientes (DNI, Nombre_Completo, Fecha_Nacimiento, Email, Historial_Basico) VALUES (?, ?, ?, ?, ?)';
    const values = [DNI, Nombre_Completo, Fecha_Nacimiento, Email, Historial_Basico || null];
    const nuevoPaciente = new Paciente(DNI, Nombre_Completo, Fecha_Nacimiento, Email, Historial_Basico);

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error al agregar en la base de datos:', err);
            return res.status(500).json({ error: 'Los datos no se pudieron agregar en la base de datos' });
        }
        res.json({ mensaje: 'El paciente se agregó correctamente', paciente: nuevoPaciente });
    });
});

// Modificar un paciente existente
// Este endpoint permite modificar los datos de un paciente existente
// Se espera que el cuerpo de la solicitud contenga los datos actualizados del paciente en formato JSON
// Si los datos se modifican correctamente, se devuelve un mensaje de éxito junto con el paciente actualizado

pacientesRouter.put('/modificar', (req, res) => {
    const { DNI, Nombre_Completo, Fecha_Nacimiento, Email, Historial_Basico } = req.body;
    const sql = 'UPDATE Pacientes SET Nombre_Completo=?, Fecha_Nacimiento=?, Email=?, Historial_Basico=? WHERE DNI=?';
    const values = [Nombre_Completo, Fecha_Nacimiento, Email, Historial_Basico || null, DNI];
    const pacienteActualizado = new Paciente(DNI, Nombre_Completo, Fecha_Nacimiento, Email, Historial_Basico);

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error al modificar en la base de datos:', err);
            return res.status(500).json({ error: 'Los datos no se pudieron modificar en la base de datos' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No existe el paciente a modificar' });
        }
        res.json({ mensaje: 'Se modificaron los datos del paciente', paciente: pacienteActualizado });
    });
});

// Eliminar un paciente por DNI
// Este endpoint permite eliminar un paciente de la base de datos por su DNI
// Si el paciente no existe, se devuelve un mensaje de error 404


pacientesRouter.delete('/:dni', (req, res) => {
    const dni = req.params.dni;
    const sql = 'DELETE FROM Pacientes WHERE DNI = ?';
    db.query(sql, [dni], (err, result) => {
        if (err) {
            console.error('Error al eliminar en la base de datos:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No existe el paciente a eliminar' });
        }
        res.json({ mensaje: `Se eliminó el paciente cuyo DNI es ${dni}` });
    });
});

// Obtener un paciente por DNI junto con sus turnos
// Este endpoint permite obtener un paciente específico por su DNI junto con sus turnos asignados

pacientesRouter.get('/:dni/con-turnos', (req, res) => {
    const dni = req.params.dni;
    const sqlPaciente = 'SELECT * FROM Pacientes WHERE DNI = ?';
    const sqlTurnos = 'SELECT * FROM Turnos WHERE Paciente_Asignado = ?';

    db.query(sqlPaciente, [dni], (err, rowsPaciente) => {
        if (err) return res.status(500).json({ error: 'Error interno del servidor.' });
        if (!rowsPaciente.length) return res.status(404).json({ mensaje: 'No existe el paciente solicitado' });

        db.query(sqlTurnos, [dni], (err2, rowsTurnos) => {
            if (err2) return res.status(500).json({ error: 'Error interno del servidor.' });
            res.json({
                paciente: rowsPaciente[0],
                turnos: rowsTurnos
            });
        });
    });
});

module.exports = pacientesRouter;