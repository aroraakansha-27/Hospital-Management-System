document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        // Validate token and redirect to appropriate dashboard
        fetch('/api/auth/validate-token', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Invalid token');
        })
        .then(data => {
            if (data.roles.includes('ROLE_PATIENT')) {
                window.location.href = '/patient/dashboard';
            } else if (data.roles.includes('ROLE_SPECIALIST')) {
                window.location.href = '/specialist/dashboard';
            } else if (data.roles.includes('ROLE_ADMIN')) {
                window.location.href = '/admin/dashboard';
            }
        })
        .catch(error => {
            localStorage.removeItem('token');
            console.error('Token validation failed:', error);
        });
    }
});