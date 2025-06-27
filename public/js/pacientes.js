// Función para formatear fecha a dd/mm/yyyy
function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

// Función para cargar todos los pacientes

// La función fetch se usa para hacer solicitudes HTTP
function cargarPacientes() {
    fetch('/api/1.0/pacientes')
        .then(res => res.json())
        .then(pacientes => {
            const tbody = document.querySelector('#tablaPacientes tbody');
            tbody.innerHTML = '';
            // Al cargar pacientes
            pacientes.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.DNI}</td>
                    <td>${p.Nombre_Completo}</td>
                    <td>${formatearFecha(p.Fecha_Nacimiento)}</td>
                    <td>${p.Email}</td>
                    <td>${p.Historial_Basico || ''}</td>
                    <td>
                        <button class="btn-editar" data-dni="${p.DNI}">Editar</button>
                        <button class="btn-eliminar" data-dni="${p.DNI}">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);  // El método appendChild agrega el elemento tr al tbody
            });

            // Evento eliminar paciente
            // Seleccionamos todos los botones de eliminar y les agregamos un evento click
            document.querySelectorAll('.btn-eliminar').forEach(btn => {
                btn.addEventListener('click', function() {
                    if (confirm('¿Seguro que deseas eliminar este paciente?')) {
                        fetch(`/api/1.0/pacientes/${this.dataset.dni}`, { method: 'DELETE' })
                            .then(res => res.json())
                            .then(() => cargarPacientes());
                    }
                });
            });

            // Evento editar (similar al de profesionales) 
            // Seleccionamos todos los botones de editar y les agregamos un evento click
            // Al hacer click en el botón editar, se carga la información del paciente en el formulario
            // para que el usuario pueda modificarla
            // y luego se envía una solicitud PUT para actualizar los datos del paciente
            document.querySelectorAll('.btn-editar').forEach(btn => {
                btn.addEventListener('click', function() {
                    const dni = this.dataset.dni;
                    fetch(`/api/1.0/pacientes/${dni}`)
                        .then(res => res.json())
                        .then(paciente => {
                            const form = document.getElementById('formPaciente');
                            form.DNI.value = paciente.DNI;
                            form.Nombre_Completo.value = paciente.Nombre_Completo;
                            form.Fecha_Nacimiento.value = paciente.Fecha_Nacimiento.slice(0,10); // formato yyyy-mm-dd
                            form.Email.value = paciente.Email;
                            form.Historial_Basico.value = paciente.Historial_Basico || '';
                            form.dataset.editando = dni;
                            form.querySelector('button[type="submit"]').textContent = 'Guardar Cambios';
                        });
                });
            });
        });
}

// Buscar turnos de un paciente por DNI
// Al enviar el formulario de búsqueda, se captura el evento submit
// Se previene el comportamiento por defecto del formulario para evitar recargar la página 
// Se obtiene el valor del campo DNI y se verifica que no esté vacío
// Luego se hace una solicitud GET a la API para buscar el paciente por su DNI 

document.getElementById('formBuscarPaciente').addEventListener('submit', function(e) {
    e.preventDefault();
    const dni = document.getElementById('dniBuscar').value.trim();
    if (!dni) return;

    // Buscar datos del paciente
    fetch(`/api/1.0/pacientes/${dni}`)
        .then(res => res.json())
        .then(paciente => {

            // Ahora buscar turnos
            fetch(`/api/3.0/turnos/paciente/${dni}`)
                .then(res => res.json())
                .then(resp => {
                    const turnos = Array.isArray(resp) ? resp : resp.turnos;
                    const div = document.getElementById('turnosPaciente');
                    if (!Array.isArray(turnos) || turnos.length === 0) {
                        div.innerHTML = '<p>No se encontraron turnos para este paciente.</p>';
                        return;
                    }
                    let html = '<h3>Turnos del paciente</h3><ul>';
                    turnos.forEach(t => {
                        html += `<li>${t.Fecha_Hora.replace('T', ' ').slice(0, 16)} - Estado: ${t.Estado_De_Turno} - Especialidad: ${t.Especialidad}</li>`;
                    });
                    html += '</ul>';
                    div.innerHTML = html;
                });
        });
});

// Evento para registrar o modificar un paciente
// Al enviar el formulario de paciente, se captura el evento submit
// Se obtiene el formulario y se crea un objeto con los datos del paciente
// Si el formulario tiene el atributo data-editando, se envía una solicitud PUT para modificar el paciente
// Si no, se envía una solicitud POST para registrar un nuevo paciente

document.getElementById('formPaciente').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        DNI: form.DNI.value,
        Nombre_Completo: form.Nombre_Completo.value,
        Fecha_Nacimiento: form.Fecha_Nacimiento.value,
        Email: form.Email.value,
        Historial_Basico: form.Historial_Basico.value
    };

    if (form.dataset.editando) {
        // Modo edición
        fetch('/api/1.0/pacientes/modificar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(resp => {
            alert(resp.mensaje || 'Paciente modificado');
            form.reset();
            delete form.dataset.editando;
            form.querySelector('button[type="submit"]').textContent = 'Registrar';
            cargarPacientes();
        });
    } else {
        // Modo alta
        fetch('/api/1.0/pacientes/nuevo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(resp => {
            alert(resp.mensaje || 'Paciente registrado');
            form.reset();
            cargarPacientes();
        });
    }
});


// Cargar pacientes al iniciar la página
document.addEventListener('DOMContentLoaded', cargarPacientes);