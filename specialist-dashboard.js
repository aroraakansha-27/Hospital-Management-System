document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    // Load specialist profile
    fetch('/api/specialists/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(specialist => {
        document.getElementById('specialistName').textContent = specialist.lastName;
        document.getElementById('specialistFullName').textContent = `Dr. ${specialist.firstName} ${specialist.lastName}`;
        document.getElementById('specialistSpecialization').textContent = specialist.specialization;
    })
    .catch(error => {
        console.error('Error loading specialist profile:', error);
    });
    
    // Load today's appointments
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/appointments?specialist=me&date=${today}&status=SCHEDULED`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(appointments => {
        const container = document.getElementById('todaysAppointments');
        renderAppointments(appointments, container);
    })
    .catch(error => {
        console.error('Error loading today\'s appointments:', error);
    });
    
    // Load upcoming appointments
    fetch('/api/appointments?specialist=me&status=SCHEDULED&limit=5', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(appointments => {
        const container = document.getElementById('upcomingAppointments');
        renderAppointments(appointments, container);
    })
    .catch(error => {
        console.error('Error loading upcoming appointments:', error);
    });
    
    function renderAppointments(appointments, container) {
        if (appointments.length === 0) {
            container.innerHTML = '<p class="text-muted">No appointments found</p>';
            return;
        }
        
        let html = '<div class="list-group">';
        
        appointments.forEach(appt => {
            const time = `${appt.startTime} - ${appt.endTime}`;
            const date = new Date(appt.appointmentDate).toLocaleDateString();
            
            html += `
            <div class="list-group-item list-group-item-action">
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
    }
    
    // Logout functionality
    document.querySelector('[href="/logout"]').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    });
});