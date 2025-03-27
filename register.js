document.addEventListener('DOMContentLoaded', function() {
    // Patient registration
    const patientForm = document.getElementById('patientRegisterForm');
    patientForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('patientFirstName').value;
        const lastName = document.getElementById('patientLastName').value;
        const email = document.getElementById('patientEmail').value;
        const username = document.getElementById('patientUsername').value;
        const password = document.getElementById('patientPassword').value;
        const confirmPassword = document.getElementById('patientConfirmPassword').value;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        const patientData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            username: username,
            password: password,
            role: 'PATIENT'
        };
        
        registerUser(patientData);
    });
    
    // Specialist registration
    const specialistForm = document.getElementById('specialistRegisterForm');
    specialistForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('specialistFirstName').value;
        const lastName = document.getElementById('specialistLastName').value;
        const email = document.getElementById('specialistEmail').value;
        const username = document.getElementById('specialistUsername').value;
        const specialization = document.getElementById('specialization').value;
        const password = document.getElementById('specialistPassword').value;
        const confirmPassword = document.getElementById('specialistConfirmPassword').value;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        const specialistData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            username: username,
            specialization: specialization,
            password: password,
            role: 'SPECIALIST'
        };
        
        registerUser(specialistData);
    });
    
    function registerUser(userData) {
        fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json().then(err => { throw err; });
        })
        .then(data => {
            alert('Registration successful! Please login.');
            window.location.href = '/login';
        })
        .catch(error => {
            alert(error.message || 'Registration failed');
            console.error('Registration error:', error);
        });
    }
});