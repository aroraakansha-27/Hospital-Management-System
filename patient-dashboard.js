document.addEventListener('DOMContentLoaded', function() {
    const patientId = document.body.getAttribute('data-patient-id');
    const token = localStorage.getItem('token');
    
    // Load upcoming appointments
    loadUpcomingAppointments();
    
    // Load recent medical records
    loadRecentMedicalRecords();
    
    // Toggle quick appointment form
    document.getElementById('book-appointment-btn').addEventListener('click', function() {
        const form = document.getElementById('quick-appointment-form');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });
    
    // Handle appointment date change
    document.getElementById('appointment-date').addEventListener('change', function() {
        const specialistId = document.getElementById('specialist-type').value;
        const date = this.value;
        
        if (specialistId && date) {
            loadAvailableTimeSlots(specialistId, date);
        }
    });
    
    // Handle specialist type change
    document.getElementById('specialist-type').addEventListener('change', function() {
        const date = document.getElementById('appointment-date').value;
        const specialistId = this.value;
        
        if (specialistId && date) {
            loadAvailableTimeSlots(specialistId, date);
        }
    });
    
    // Handle form submission
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
    
    function loadUpcomingAppointments() {
        fetch(`/api/appointments?patientId=${patientId}&status=SCHEDULED`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(appointments => {
            const container = document.getElementById('upcoming-appointments');
            const loading = document.getElementById('loading-appointments');
            
            if (appointments.length === 0) {
                container.innerHTML = '<p>No upcoming appointments found.</p>';
                return;
            }
            
            let html = '<div class="list-group">';
            
            appointments.forEach(appt => {
                html += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${appt.specialistName} (${appt.specialization})</h6>
                        <small>${appt.status}</small>
                    </div>
                    <p class="mb-1">${appt.appointmentDate} at ${appt.startTime} - ${appt.endTime}</p>
                    ${appt.notes ? `<small>Notes: ${appt.notes}</small>` : ''}
                </div>
                `;
            });
            
            html += '</div>';
            loading.style.display = 'none';
            container.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading appointments:', error);
            document.getElementById('upcoming-appointments').innerHTML = 
                '<p class="text-danger">Error loading appointments. Please try again.</p>';
        });
    }
    
    function loadRecentMedicalRecords() {
        fetch(`/api/patients/${patientId}/records?limit=3`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(records => {
            const container = document.getElementById('recent-records');
            const loading = document.getElementById('loading-records');
            
            if (records.length === 0) {
                container.innerHTML = '<p>No medical records found.</p>';
                return;
            }
            
            let html = '<div class="list-group">';
            
            records.forEach(record => {
                html += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${record.specialistName}</h6>
                        <small>${new Date(record.recordDate).toLocaleDateString()}</small>
                    </div>
                    <p class="mb-1">${record.diagnosis || 'No diagnosis recorded'}</p>
                    <small class="text-muted">${record.prescription || 'No prescription'}</small>
                </div>
                `;
            });
            
            html += '</div>';
            loading.style.display = 'none';
            container.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading medical records:', error);
            document.getElementById('recent-records').innerHTML = 
                '<p class="text-danger">Error loading medical records. Please try again.</p>';
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
            document.getElementById('appointment-form').reset();
            document.getElementById('quick-appointment-form').style.display = 'none';
            loadUpcomingAppointments();
        })
        .catch(error => {
            console.error('Error booking appointment:', error);
            alert('Failed to book appointment. Please try again.');
        });
    }
});