document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const patientId = document.body.getAttribute('data-patient-id');
    let currentAppointmentId = null;
    
    // Load all appointment tabs
    loadAppointments('SCHEDULED', 'upcoming-appointments', 'loading-upcoming');
    loadAppointments('COMPLETED', 'past-appointments', 'loading-past');
    loadAppointments('CANCELLED', 'cancelled-appointments', 'loading-cancelled');
    
    // Load specialists for booking form
    loadSpecialists();
    
    // Handle date change in booking form
    document.getElementById('appointment-date').addEventListener('change', function() {
        const specialistId = document.getElementById('specialist-type').value;
        const date = this.value;
        
        if (specialistId && date) {
            loadAvailableTimeSlots(specialistId, date);
        }
    });
    
    // Handle specialist change in booking form
    document.getElementById('specialist-type').addEventListener('change', function() {
        const date = document.getElementById('appointment-date').value;
        const specialistId = this.value;
        
        if (specialistId && date) {
            loadAvailableTimeSlots(specialistId, date);
        }
    });
    
    // Handle booking form submission
    document.getElementById('appointment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const specialistId = document.getElementById('specialist-type').value;
        const date = document.getElementById('appointment-date').value;
        const timeSlot = document.getElementById('time-slot').value;
        const notes = document.getElementById('appointment-notes').value;
        
        if (!specialistId || !date || !timeSlot) {
            alert('Please fill all required fields');
            return;
        }
        
        const [startTime, endTime] = timeSlot.split('-');
        
        const appointmentData = {
            specialistId: parseInt(specialistId),
            appointmentDate: date,
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            notes: notes
        };
        
        bookAppointment(appointmentData);
    });
    
    // Handle cancel appointment button
    document.getElementById('cancel-appointment-btn').addEventListener('click', function() {
        if (currentAppointmentId) {
            if (confirm('Are you sure you want to cancel this appointment?')) {
                cancelAppointment(currentAppointmentId);
            }
        }
    });
    
    function loadAppointments(status, containerId, loadingId) {
        fetch(`/api/appointments?patientId=${patientId}&status=${status}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(appointments => {
            const container = document.getElementById(containerId);
            const loading = document.getElementById(loadingId);
            
            if (appointments.length === 0) {
                container.innerHTML = '<p class="text-muted">No appointments found.</p>';
                return;
            }
            
            let html = '<div class="list-group">';
            
            appointments.forEach(appt => {
                const apptDate = new Date(appt.appointmentDate);
                const formattedDate = apptDate.toLocaleDateString('en-US', { 
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
                });
                
                html += `
                <div class="list-group-item list-group-item-action" data-appointment-id="${appt.id}">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${appt.specialistName} (${appt.specialization})</h6>
                        <small class="text-${status === 'CANCELLED' ? 'danger' : 'success'}">${appt.status}</small>
                    </div>
                    <p class="mb-1">${formattedDate} at ${appt.startTime} - ${appt.endTime}</p>
                    ${appt.notes ? `<small class="text-muted">Notes: ${appt.notes}</small>` : ''}
                </div>
                `;
            });
            
            html += '</div>';
            loading.style.display = 'none';
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
    
    function loadSpecialists() {
        fetch('/api/specialists', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(specialists => {
            const select = document.getElementById('specialist-type');
            specialists.forEach(specialist => {
                const option = document.createElement('option');
                option.value = specialist.id;
                option.textContent = `${specialist.firstName} ${specialist.lastName} - ${specialist.specialization}`;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading specialists:', error);
        });
    }
    
    function loadAvailableTimeSlots(specialistId, date) {
        const timeSlotSelect = document.getElementById('time-slot');
        timeSlotSelect.disabled = true;
        timeSlotSelect.innerHTML = '<option value="">Loading available slots...</option>';
        
        fetch(`/api/appointments/available-slots?specialistId=${specialistId}&date=${date}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(slots => {
            timeSlotSelect.innerHTML = slots.length > 0 
                ? '<option value="">Select a time slot</option>'
                : '<option value="">No available slots</option>';
                
            slots.forEach(slot => {
                const option = document.createElement('option');
                option.value = `${slot.startTime} - ${slot.endTime}`;
                option.textContent = `${slot.startTime} - ${slot.endTime}`;
                timeSlotSelect.appendChild(option);
            });
            
            timeSlotSelect.disabled = false;
        })
        .catch(error => {
            console.error('Error loading time slots:', error);
            timeSlotSelect.innerHTML = '<option value="">Error loading slots</option>';
        });
    }
    
    function bookAppointment(appointmentData) {
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
            throw new Error('Failed to book appointment');
        })
        .then(appointment => {
            alert('Appointment booked successfully!');
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('bookAppointmentModal'));
            modal.hide();
            document.getElementById('appointment-form').reset();
            
            // Refresh appointments list
            loadAppointments('SCHEDULED', 'upcoming-appointments', 'loading-upcoming');
        })
        .catch(error => {
            console.error('Error booking appointment:', error);
            alert('Failed to book appointment. Please try again.');
        });
    }
    
    function showAppointmentDetails(appointmentId) {
        fetch(`/api/appointments/${appointmentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(appointment => {
            currentAppointmentId = appointment.id;
            
            const apptDate = new Date(appointment.appointmentDate);
            const formattedDate = apptDate.toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });
            
            let html = `
                <h6>${appointment.specialistName}</h6>
                <p>${appointment.specialization}</p>
                
                <table class="table table-borderless">
                    <tr>
                        <th>Date:</th>
                        <td>${formattedDate}</td>
                    </tr>
                    <tr>
                        <th>Time:</th>
                        <td>${appointment.startTime} - ${appointment.endTime}</td>
                    </tr>
                    <tr>
                        <th>Status:</th>
                        <td>${appointment.status}</td>
                    </tr>
            `;
            
            if (appointment.notes) {
                html += `
                    <tr>
                        <th>Notes:</th>
                        <td>${appointment.notes}</td>
                    </tr>
                `;
            }
            
            html += '</table>';
            
            document.getElementById('appointment-details-content').innerHTML = html;
            
            // Show/hide cancel button based on status
            const cancelBtn = document.getElementById('cancel-appointment-btn');
            cancelBtn.style.display = appointment.status === 'SCHEDULED' ? 'block' : 'none';
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('appointmentDetailsModal'));
            modal.show();
        })
        .catch(error => {
            console.error('Error loading appointment details:', error);
            alert('Failed to load appointment details. Please try again.');
        });
    }
    
    function cancelAppointment(appointmentId) {
        fetch(`/api/appointments/${appointmentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                alert('Appointment cancelled successfully');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('appointmentDetailsModal'));
                modal.hide();
                
                // Refresh appointments lists
                loadAppointments('SCHEDULED', 'upcoming-appointments', 'loading-upcoming');
                loadAppointments('CANCELLED', 'cancelled-appointments', 'loading-cancelled');
                return;
            }
            throw new Error('Failed to cancel appointment');
        })
        .catch(error => {
            console.error('Error cancelling appointment:', error);
            alert('Failed to cancel appointment. Please try again.');
        });
    }
});