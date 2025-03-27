document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const patientId = document.getElementById('patient-id').value;
    
    // Handle profile form submission
    document.getElementById('profile-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const profileData = {
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            dateOfBirth: document.getElementById('dob').value,
            gender: document.getElementById('gender').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            bloodType: document.getElementById('blood-type').value
        };
        
        updatePatientProfile(patientId, profileData);
    });
    
    // Handle password form submission
    document.getElementById('password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        
        changePassword(currentPassword, newPassword);
    });
    
    function updatePatientProfile(patientId, profileData) {
        fetch(`/api/patients/${patientId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        })
        .then(response => {
            if (response.ok) {
                alert('Profile updated successfully');
                return response.json();
            }
            throw new Error('Failed to update profile');
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        });
    }
    
    function changePassword(currentPassword, newPassword) {
        fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        })
        .then(response => {
            if (response.ok) {
                alert('Password changed successfully');
                document.getElementById('password-form').reset();
                return;
            }
            throw new Error('Failed to change password');
        })
        .catch(error => {
            console.error('Error changing password:', error);
            alert('Failed to change password. Please check your current password and try again.');
        });
    }
});