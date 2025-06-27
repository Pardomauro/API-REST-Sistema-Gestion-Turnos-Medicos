

// Función para cargar los profesionales desde la API
// mostrarlos en la tabla 
// asignar eventos a los botones de editar y eliminar
// y ver turnos

function cargarProfesionales() {
    fetch('/api/2.0/profesionales')
        .then(res => res.json())
        .then(profesionales => {
            const tbody = document.querySelector('#tablaProfesionales tbody');
            tbody.innerHTML = '';
            profesionales.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        ${p.Foto_De_Perfil ? `<img src="fotos_profesionales/${p.Foto_De_Perfil}" alt="Foto" width="60">` : ''}
                    </td>
                    <td>${p.Nombre_Completo}</td>
                    <td>${p.Especializacion}</td>
                    <td>${p.Matricula}</td>
                    <td>${p.Horarios_Disponibles}</td>
                    <td>
                        <button class="btn-editar" data-dni="${p.DNI}">Editar</button>
                        <button class="btn-eliminar" data-dni="${p.DNI}">Eliminar</button>
                        <button class="btn-turnos" data-dni="${p.DNI}">Ver Turnos</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Evento para eliminar profesional
            // Seleccionamos todos los botones de eliminar y les agregamos un evento click
            // Al hacer click en el botón eliminar, se muestra un mensaje de confirmación
            // y si el usuario confirma, se envía una solicitud DELETE a la API para eliminar 
            document.querySelectorAll('.btn-eliminar').forEach(btn => {
                btn.addEventListener('click', function() {
                    if (confirm('¿Seguro que deseas eliminar este profesional?')) {
                        eliminarProfesional(this.dataset.dni);
                    }
                });
            });

            // Evento para editar profesional
            // Seleccionamos todos los botones de editar y les agregamos un evento click
            // Al hacer click en el botón editar, se carga la información del profesional en el formulario   
            // para que el usuario pueda modificarla
            // y luego se envía una solicitud PUT para actualizar los datos del profesional 
            // y se cambia el texto del botón a "Guardar Cambios"

            document.querySelectorAll('.btn-editar').forEach(btn => {
                btn.addEventListener('click', function() {
                    const dni = this.dataset.dni;
                    fetch(`/api/2.0/profesionales/${dni}`)
                        .then(res => res.json())
                        .then(prof => {
                            const form = document.getElementById('formProfesional');
                            form.DNI.value = prof.DNI;
                            form.Nombre_Completo.value = prof.Nombre_Completo;
                            form.Especializacion.value = prof.Especializacion;
                            form.Matricula.value = prof.Matricula;
                            form.Horarios_Disponibles.value = prof.Horarios_Disponibles;
                            form.dataset.editando = dni;
                            form.querySelector('button[type="submit"]').textContent = 'Guardar Cambios';
                        });
                });
            });

            // Evento para ver turnos del profesional
            // Seleccionamos todos los botones de ver turnos y les agregamos un evento click
            // Al hacer click en el botón ver turnos, se envía una solicitud GET a la API para obtener los turnos del profesional
            // y se muestra en un div con id "turnosProfesional"
            // Si no hay turnos, se muestra un mensaje indicando que no se encontraron turnos 
            // para el profesional seleccionado


            document.querySelectorAll('.btn-turnos').forEach(btn => {
                btn.addEventListener('click', function() {
                    const dni = this.dataset.dni;
                    fetch(`/api/3.0/turnos/profesional/${dni}`)
                        .then(res => res.json())
                        .then(turnos => {
                            const div = document.getElementById('turnosProfesional');
                            if (!Array.isArray(turnos) || turnos.length === 0) {
                                div.innerHTML = '<p>No se encontraron turnos para este profesional.</p>';
                                return;
                            }
                            let html = `<h3>Turnos del profesional (DNI: ${dni})</h3><ul>`;
                            turnos.forEach(t => {
                                html += `<li>${t.Fecha_Hora.replace('T', ' ').slice(0, 16)} - Paciente: ${t.Paciente_Asignado} - Estado: ${t.Estado_De_Turno}</li>`;
                            });
                            html += '</ul>';
                            div.innerHTML = html;
                        });
                });
            });
        });
}

// Al enviar el formulario de agregar o editar profesional
// se captura el evento submit, se previene el comportamiento por defecto del formulario
// se crea un objeto FormData con los datos del formulario
// y se envía una solicitud POST a la API para agregar un nuevo profesional


document.getElementById('formProfesional').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    fetch('/api/2.0/profesionales/nuevo', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        alert(data.mensaje || 'Profesional agregado');
        form.reset();
        cargarProfesionales();
    })
    .catch(() => alert('Error al agregar profesional'));
});

function eliminarProfesional(dni) {
    fetch(`/api/2.0/profesionales/${dni}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
        alert(data.mensaje || 'Profesional eliminado');
        cargarProfesionales();
    })
    .catch(() => alert('Error al eliminar profesional'));
}

// Evento para registrar o modificar un profesional
// Al enviar el formulario de profesional, se captura el evento submit
// Se obtiene el formulario y se crea un objeto con los datos del profesional 
// Si el formulario tiene el atributo data-editando, se envía una solicitud PUT para modificar el profesional
// Si no, se envía una solicitud POST para registrar un nuevo profesional 


document.getElementById('formProfesional').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        DNI: form.DNI.value,
        Nombre_Completo: form.Nombre_Completo.value,
        Especializacion: form.Especializacion.value,
        Matricula: form.Matricula.value,
        Horarios_Disponibles: form.Horarios_Disponibles.value,
        // Si se usa una foto, se debe manejar la subida de archivos 
        
    };

    // Si el formulario tiene el atributo data-editando, se envía una solicitud PUT para modificar el profesional
    // Si no, se envía una solicitud POST para registrar un nuevo profesional
    // Aquí se asume que la foto se maneja por separado, ya que FormData
    // no se puede enviar directamente como JSON.

    if (form.dataset.editando) {
        fetch('/api/2.0/profesionales/modificar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(resp => {
            alert(resp.mensaje || 'Profesional modificado');
            form.reset();
            delete form.dataset.editando;
            form.querySelector('button[type="submit"]').textContent = 'Agregar';
            cargarProfesionales();
        });
    } else {
        // Modo alta
    }
});

// Cargar profesionales al iniciar la página
document.addEventListener('DOMContentLoaded', cargarProfesionales);