document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    let currentAppointmentId = null;
    
    // Load specialist name
    fetch('/api/specialists/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(specialist => {
        document.getElementById('specialistName').textContent = specialist.lastName;
    })
    .catch(error => {
        console.error('Error loading specialist profile:', error);
    });
    
    // Load patients for dropdown
    fetch('/api/patients', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(patients => {
        const select = document.getElementById('patientSelect');
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = `${patient.firstName} ${patient.lastName}`;
            select.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error loading patients:', error);
    });
    
    // Load appointments
    loadAppointments('SCHEDULED', 'upcomingAppointments');
    loadAppointments('COMPLETED', 'completedAppointments');
    loadAppointments('CANCELLED', 'cancelledAppointments');
    
    // Handle new appointment form submission
    document.getElementById('newAppointmentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const patientId = document.getElementById('patientSelect').value;
        const date = document.getElementById('appointmentDate').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const notes = document.getElementById('appointmentNotes').value;
        
        const appointmentData = {
            patientId: patientId,
            appointmentDate: date,
            startTime: startTime,
            endTime: endTime,
            notes: notes
        };
        
        fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(appointmentData)
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to create appointment');
        })
        .then(appointment => {
            alert('Appointment created successfully');
            document.getElementById('newAppointmentForm').reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('newAppointmentModal'));
            modal.hide();
            
            // Refresh appointments list
            loadAppointments('SCHEDULED', 'upcomingAppointments');
        })
        .catch(error => {
            alert(error.message || 'Failed to create appointment');
            console.error('Error creating appointment:', error);
        });
    });
    
    // Handle appointment actions
    document.getElementById('completeAppointmentBtn').addEventListener('click', function() {
        if (currentAppointmentId) {
            updateAppointmentStatus(currentAppointmentId, 'COMPLETED');
        }
    });
    
    document.getElementById('cancelAppointmentBtn').addEventListener('click', function() {
        if (currentAppointmentId && confirm('Are you sure you want to cancel this appointment?')) {
            updateAppointmentStatus(currentAppointmentId, 'CANCELLED');
        }
    });
    
    function loadAppointments(status, containerId) {
        fetch(`/api/appointments?specialist=me&status=${status}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(appointments => {
            const container = document.getElementById(containerId);
            
            if (appointments.length === 0) {
                container.innerHTML = '<p class="text-muted">No appointments found</p>';
                return;
            }
            
            let html = '<div class="list-group">';
            
            appointments.forEach(appt => {
                const time = `${appt.startTime} - ${appt.endTime}`;
                const date = new Date(appt.appointmentDate).toLocaleDateString();
                
                html += `
                <div class="list-group-item list-group-item-action" data-appointment-id="${appt.id}">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${appt.patientName}</h6>
                        <small>${date}</small>
                    </div>
                    <p class="mb-1">${time}</p>
                    ${appt.notes ? `<small class="text-muted">${appt.notes}</small>` : ''}
                </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
            
            // Add click handlers to appointment items
            document.querySelectorAll(`#${containerId} .list-group-item`).forEach(item => {
                item.addEventListener('click', function() {
                    const appointmentId = this.getAttribute('data-appointment-id');
                    showAppointmentDetails(appointmentId);
                });
            });
        })
        .catch(error => {
            console.error(`Error loading ${status} appointments:`, error);
            document.getElementById(containerId).innerHTML = 
                '<p class="text-danger">Error loading appointments. Please try again.</p>';
        });
    }
    
    function showAppointmentDetails(appointmentId) {
        currentAppointmentId = appointmentId;
        
        fetch(`/api/appointments/${appointmentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(appointment => {
            const date = new Date(appointment.appointmentDate).toLocaleDateString();
            const time = `${appointment.startTime} - ${appointment.endTime}`;
            
            let html = `
                <h6>${appointment.patientName}</h6>
                <p>${date} at ${time}</p>
                <p>Status: <span class="badge bg-${getStatusBadgeColor(appointment.status)}">
                    ${appointment.status}
                </span></p>
            `;
            
            if (appointment.notes) {
                html += `
                    <div class="card mt-3">
                        <div class="card-header">Notes</div>
                        <div class="card-body">
                            <p>${appointment.notes}</p>
                        </div>
                    </div>
                `;
            }
            
            document.getElementById('appointmentDetailsContent').innerHTML = html;
            
            // Show/hide buttons based on status
            const completeBtn = document.getElementById('completeAppointmentBtn');
            const cancelBtn = document.getElementById('cancelAppointmentBtn');
            
            completeBtn.style.display = appointment.status === 'SCHEDULED' ? 'inline-block' : 'none';
            cancelBtn.style.display = appointment.status === 'SCHEDULED' ? 'inline-block' : 'none';
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('appointmentDetailsModal'));
            modal.show();
        })
        .catch(error => {
            console.error('Error loading appointment details:', error);
            alert('Failed to load appointment details');
        });
    }
    
    function updateAppointmentStatus(appointmentId, status) {
        fetch(`/api/appointments/${appointmentId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: status })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to update appointment status');
        })
        .then(updatedAppointment => {
            alert(`Appointment marked as ${status.toLowerCase()}`);
            const modal = bootstrap.Modal.getInstance(document.getElementById('appointmentDetailsModal'));
            modal.hide();
            
            // Refresh all appointment lists
            loadAppointments('SCHEDULED', 'upcomingAppointments');
            loadAppointments('COMPLETED', 'completedAppointments');
            loadAppointments('CANCELLED', 'cancelledAppointments');
        })
        .catch(error => {
            alert(error.message || 'Failed to update appointment status');
            console.error('Error updating appointment status:', error);
        });
    }
    
    function getStatusBadgeColor(status) {
        switch (status) {
            case 'SCHEDULED': return 'primary';
            case 'COMPLETED': return 'success';
            case 'CANCELLED': return 'danger';
            default: return 'secondary';
        }
    }
});