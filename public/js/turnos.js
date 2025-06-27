// Cargar todos los turnos
// y permitir editar o cancelar
// Al cargar la página, se llama a esta función para obtener todos los turnos
// y mostrarlos en la tabla
// También se asignan eventos a los botones de editar y cancelar 



function cargarTurnos() {
    fetch('/api/3.0/turnos')
        .then(res => res.json())
        .then(turnos => {
            const tbody = document.querySelector('#tablaTurnos tbody');
            tbody.innerHTML = '';
            turnos.forEach(t => {
                const tr = document.createElement('tr');
                const fechaHoraMostrar = t.Fecha_Hora.replace('T', ' ').slice(0, 16);
                tr.innerHTML = `
                    <td>${t.id}</td>
                    <td>${fechaHoraMostrar}</td>
                    <td>${t.Especialidad}</td>
                    <td>${t.Paciente_Asignado}</td>
                    <td>${t.Estado_De_Turno}</td>
                    <td>${t.Observaciones || ''}</td>
                    <td>
                        <button class="btn-editar" data-id="${t.id}">Editar</button>
                        <button class="btn-cancelar" data-id="${t.id}" ${t.Estado_De_Turno === 'cancelado' ? 'disabled' : ''}>Cancelar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Eventos para editar
            // Seleccionamos todos los botones de editar y les agregamos un evento click
            // Al hacer click en el botón editar, se carga la información del turno en el formulario
            document.querySelectorAll('.btn-editar').forEach(btn => {
                btn.addEventListener('click', function() {
                    editarTurno(this.dataset.id);
                });
            });

            // Eventos para cancelar
            document.querySelectorAll('.btn-cancelar').forEach(btn => {
                btn.addEventListener('click', function() {
                    if (confirm('¿Seguro que deseas cancelar este turno?')) {
                        cancelarTurno(this.dataset.id);
                    }
                });
            });
        });
}

// Cancelar turno
// Envía una solicitud PUT a la API para cancelar el turno
// y recarga la lista de turnos

function cancelarTurno(id) {
    fetch(`/api/3.0/turnos/cancelar/${id}`, {
        method: 'PUT'
    })
    .then(res => res.json())
    .then(data => {
        alert(data.mensaje || 'Turno cancelado');
        cargarTurnos();
    })
    .catch(() => alert('Error al cancelar turno'));
}

// Editar turno (carga los datos en el formulario para editar)
// Envía una solicitud GET a la API para obtener los datos del turno
// y los carga en el formulario de solicitud de turno
// Luego, al enviar el formulario, se envía una solicitud PUT para actualizar el turno

function editarTurno(id) {
    fetch(`/api/3.0/turnos/${id}`)
        .then(res => res.json())
        .then(turno => {
            const form = document.getElementById('formTurno');
            // Fecha y hora
            const [fecha, horaCompleta] = turno.Fecha_Hora.split(' ');
            form.Fecha_Hora.value = fecha;
            const hora = horaCompleta ? horaCompleta.slice(0,5) : '';
            // Cargar especialidad y profesional
            // Primero selecciona la especialidad del profesional
            fetch(`/api/2.0/profesionales/${turno.Profesional_Asignado}`)
                .then(res => res.json())
                .then(prof => {
                    form.especialidadSelect.value = prof.Especializacion;
                    // Cargar los profesionales de esa especialidad
                    fetch(`/api/2.0/profesionales?especialidad=${encodeURIComponent(prof.Especializacion)}`)
                        .then(res => res.json())
                        .then(profesionales => {
                            const profesionalSelect = form.profesionalSelect;
                            profesionalSelect.innerHTML = '<option value="">Seleccione profesional</option>';
                            profesionales.forEach(p => {
                                const option = document.createElement('option');
                                option.value = p.DNI;
                                option.textContent = `${p.Nombre_Completo} (Matrícula: ${p.Matricula})`;
                                profesionalSelect.appendChild(option);
                            });
                            profesionalSelect.value = turno.Profesional_Asignado;
                            // Cargar horario
                            const horarioSelect = form.horarioSelect;
                            horarioSelect.innerHTML = '<option value="">Seleccione horario</option>';
                            let horarioValido = false;
                            for (let h = 8; h < 14; h++) {
                                const horaStr = h.toString().padStart(2, '0') + ':00';
                                const option = document.createElement('option');
                                option.value = horaStr;
                                option.textContent = horaStr + ' hs';
                                if (horaStr === hora) horarioValido = true;
                                horarioSelect.appendChild(option);
                            }
                            // Si el horario no es válido, lo agregamos igual para que el usuario lo vea y lo pueda cambiar
                            if (!horarioValido && hora) {
                                const option = document.createElement('option');
                                option.value = hora;
                                option.textContent = hora + ' hs (fuera de rango)';
                                horarioSelect.appendChild(option);
                            }
                            horarioSelect.value = hora;
                        });
                });
                // Cargar los demás campos del turno
            form.Paciente_Asignado.value = turno.Paciente_Asignado;
            form.Estado_De_Turno.value = turno.Estado_De_Turno;
            form.Observaciones.value = turno.Observaciones || '';
            form.dataset.editando = id; // Guardamos el id que se está editando
            form.querySelector('button[type="submit"]').textContent = 'Guardar Cambios';
        });
}

// Modificar el submit del formulario para editar o crear
// Al enviar el formulario de solicitud de turno, se captura el evento submit
// Se previene el comportamiento por defecto del formulario para evitar recargar la página
// Se obtiene la fecha y hora del turno, el profesional asignado, el paciente asignado,
// el estado del turno y las observaciones
// Luego, se envía una solicitud POST para crear un nuevo turno o PUT para editar uno


document.getElementById('formTurno').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = e.target;
    const fecha = form.Fecha_Hora.value;
    const horario = form.Horario.value;
    const fechaHora = `${fecha} ${horario}:00`;

    const data = {
        id: form.dataset.editando,
        Fecha_Hora: fechaHora,
        Profesional_Asignado: form.Profesional_Asignado.value,
        Paciente_Asignado: form.Paciente_Asignado.value,
        Estado_De_Turno: form.Estado_De_Turno.value,
        Observaciones: form.Observaciones.value
    };

    // Agrega este log para ver qué se envía al backend
    console.log('Datos enviados al backend:', data);

    if (form.dataset.editando) {
        // Modo edición
        fetch('/api/3.0/turnos/modificar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json().then(json => ({ ok: res.ok, json })))
        .then(resp => {
            if (!resp.ok) {
                alert(resp.json.error || 'No hay turnos para este horario');
                return;
            }
            alert(resp.json.mensaje || 'Turno modificado');
            form.reset();
            delete form.dataset.editando;
            form.querySelector('button[type="submit"]').textContent = 'Solicitar Turno';
            cargarTurnos();
        });
    } else {
        // Modo alta
        fetch('/api/3.0/turnos/nuevo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json().then(json => ({ ok: res.ok, json })))
        .then(resp => {
            if (!resp.ok) {
                alert(resp.json.error || 'No hay turnos para este horario');
                return;
            }
            alert(resp.json.mensaje || 'Turno solicitado');
            form.reset();
            cargarTurnos();
        });
    }
});

// Buscar turnos por DNI de paciente
// Al enviar el formulario de búsqueda de turnos, se captura el evento submit
// Se previene el comportamiento por defecto del formulario para evitar recargar la página
// Se obtiene el DNI del paciente y se envía una solicitud GET a la API
// Si se encuentran turnos, se muestran en una lista; si no, se muestra un
// mensaje indicando que no se encontraron turnos
// Si hay un error al buscar, se muestra un mensaje de error

document.getElementById('formBuscarTurnos').addEventListener('submit', function(e) {
    e.preventDefault();
    const dni = document.getElementById('dniPacienteBuscar').value.trim();
    if (!dni) return;

    fetch(`/api/3.0/turnos/paciente/${dni}`)
        .then(res => res.json())
        .then(resp => {
            // Si el backend responde { turnos: [...] }
            const turnos = Array.isArray(resp) ? resp : resp.turnos;
            const div = document.getElementById('turnosPaciente');
            if (!Array.isArray(turnos) || turnos.length === 0) {
                div.innerHTML = '<p>No se encontraron turnos para este paciente.</p>';
                return;
            }
            let html = '<h3>Turnos del paciente</h3><ul>';
            turnos.forEach(t => {
                const fechaHoraMostrar = t.Fecha_Hora.replace('T', ' ').slice(0, 16);
                html += `<li>${fechaHoraMostrar} - Estado: ${t.Estado_De_Turno} - Especialidad: ${t.Especialidad}</li>`;
            });
            html += '</ul>';
            div.innerHTML = html;
        })
        .catch(() => {
            document.getElementById('turnosPaciente').innerHTML = '<p>Error al buscar turnos.</p>';
        });
});

// Mostrar los turnos del paciente en el HTML
function mostrarTurnosPaciente(turnos) {
    let html = '';
    turnos.forEach(t => {
        html += `<li>${t.Fecha_Hora.replace('T', ' ').slice(0, 16)} - Estado: ${t.Estado_De_Turno} - Especialidad: ${t.Especialidad}</li>`;
    });
    document.getElementById('turnosPaciente').innerHTML = html;
}

// Al cambiar especialidad, carga solo los profesionales de esa especialidad


document.getElementById('especialidadSelect').addEventListener('change', function() {
    const especialidad = this.value;
    const profesionalSelect = document.getElementById('profesionalSelect');
    profesionalSelect.innerHTML = '<option value="">Seleccione profesional</option>';
    document.getElementById('horarioSelect').innerHTML = '<option value="">Seleccione horario</option>';

    if (!especialidad) return;

    fetch(`/api/2.0/profesionales?especialidad=${encodeURIComponent(especialidad)}`)
        .then(res => res.json())
        .then(profesionales => {
            profesionales.forEach(p => {
                const option = document.createElement('option');
                option.value = p.DNI;
                option.textContent = `${p.Nombre_Completo} (Matrícula: ${p.Matricula})`;
                profesionalSelect.appendChild(option);
            });
        });
});

// Al seleccionar profesional, muestra los horarios disponibles (08:00 a 14:00)
document.getElementById('profesionalSelect').addEventListener('change', function() {
    const horarioSelect = document.getElementById('horarioSelect');
    horarioSelect.innerHTML = '<option value="">Seleccione horario</option>';
    // Todos los profesionales trabajan de 08:00 a 14:00 hs
    for (let h = 8; h < 14; h++) {
        const hora = h.toString().padStart(2, '0') + ':00';
        const option = document.createElement('option');
        option.value = hora;
        option.textContent = hora + ' hs';
        horarioSelect.appendChild(option);
    }
});

// Cargar turnos al iniciar la página
document.addEventListener('DOMContentLoaded', cargarTurnos);