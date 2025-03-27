document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('specialistLoginForm');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                role: 'SPECIALIST'
            })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Login failed');
        })
        .then(data => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/specialist/dashboard';
        })
        .catch(error => {
            alert('Invalid username or password');
            console.error('Login error:', error);
        });
    });
});