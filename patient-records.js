document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const patientId = document.body.getAttribute('data-patient-id');
    
    // Load medical records
    loadMedicalRecords();
    
    // Handle search
    document.getElementById('search-btn').addEventListener('click', function() {
        const searchTerm = document.getElementById('search-records').value.trim();
        loadMedicalRecords(searchTerm);
    });
    
    // Handle Enter key in search
    document.getElementById('search-records').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.trim();
            loadMedicalRecords(searchTerm);
        }
    });
    
    function loadMedicalRecords(searchTerm = '') {
        let url = `/api/patients/${patientId}/records`;
        if (searchTerm) {
            url += `?search=${encodeURIComponent(searchTerm)}`;
        }
        
        fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(records => {
            const container = document.getElementById('medical-records');
            const loading = document.getElementById('loading-records');
            
            if (records.length === 0) {
                container.innerHTML = '<p class="text-muted">No medical records found.</p>';
                return;
            }
            
            let html = '<div class="list-group">';
            
            records.forEach(record => {
                const recordDate = new Date(record.recordDate);
                const formattedDate = recordDate.toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                });
                
                html += `
                <div class="list-group-item list-group-item-action" data-record-id="${record.id}">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${record.specialistName} (${record.specialization})</h6>
                        <small>${formattedDate}</small>
                    </div>
                    <p class="mb-1">${record.diagnosis || 'No diagnosis recorded'}</p>
                    <small class="text-muted">${record.prescription || 'No prescription'}</small>
                </div>
                `;
            });
            
            html += '</div>';
            loading.style.display = 'none';
            container.innerHTML = html;
            
            // Add click handlers to record items
            document.querySelectorAll('#medical-records .list-group-item').forEach(item => {
                item.addEventListener('click', function() {
                    const recordId = this.getAttribute('data-record-id');
                    showRecordDetails(recordId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading medical records:', error);
            document.getElementById('medical-records').innerHTML = 
                '<p class="text-danger">Error loading medical records. Please try again.</p>';
        });
    }
    
    function showRecordDetails(recordId) {
        fetch(`/api/patients/records/${recordId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(record => {
            const recordDate = new Date(record.recordDate);
            const formattedDate = recordDate.toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });
            
            let html = `
                <h6>${record.specialistName}</h6>
                <p>${record.specialization}</p>
                
                <table class="table table-borderless">
                    <tr>
                        <th>Date:</th>
                        <td>${formattedDate}</td>
                    </tr>
                    <tr>
                        <th>Diagnosis:</th>
                        <td>${record.diagnosis || 'Not specified'}</td>
                    </tr>
                    <tr>
                        <th>Prescription:</th>
                        <td>${record.prescription || 'Not specified'}</td>
                    </tr>
            `;
            
            if (record.notes) {
                html += `
                    <tr>
                        <th>Notes:</th>
                        <td>${record.notes}</td>
                    </tr>
                `;
            }
            
            html += '</table>';
            
            // Create modal if it doesn't exist
            if (!document.getElementById('recordDetailsModal')) {
                const modalHTML = `
                <div class="modal fade" id="recordDetailsModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Medical Record Details</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body" id="recordDetailsContent">
                                ${html}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            } else {
                document.getElementById('recordDetailsContent').innerHTML = html;
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('recordDetailsModal'));
            modal.show();
        })
        .catch(error => {
            console.error('Error loading medical record details:', error);
            alert('Failed to load medical record details');
        });
    }
});