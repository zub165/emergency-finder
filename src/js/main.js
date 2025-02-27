import '../css/styles.css';

class EmergencyRoomSystem {
    constructor() {
        this.dbName = 'ERSystemDB';
        this.dbVersion = 1;
        this.db = null;
        this.patients = [];
        this.waitTimeDisplay = document.getElementById('waitTimeDisplay');
        this.severityLevel = document.getElementById('severityLevel');
        this.registrationForm = document.getElementById('registrationForm');
        this.map = null;
        this.markers = [];
        this.currentPatients = [];
        this.lastBackupDate = localStorage.getItem('lastBackupDate');
        this.backupReminderDays = 7; // Remind every 7 days
        
        this.initializeSystem();
    }

    async initializeSystem() {
        await this.initializeDatabase();
        this.patients = await this.loadPatients();
        this.setupEventListeners();
        this.initializeMap();
        this.setupAPIConfigs();
        this.displayPatients();
        this.createStorageStatus();
        this.setupDataControls();
        this.checkBackupReminder();
        this.showPersistenceWarning();
    }

    async initializeDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                this.showStorageStatus('Falling back to localStorage');
                resolve(false);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.showStorageStatus('Connected to IndexedDB');
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('patients')) {
                    db.createObjectStore('patients', { keyPath: 'id' });
                }
            };
        });
    }

    setupDataControls() {
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'position-fixed top-0 end-0 p-3 d-flex gap-2';
        controlsContainer.style.zIndex = '1000';

        // Export button
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-secondary';
        exportBtn.innerHTML = '<i class="fas fa-download"></i> Export Data';
        exportBtn.onclick = () => this.exportData();

        // Import button
        const importBtn = document.createElement('button');
        importBtn.className = 'btn btn-primary';
        importBtn.innerHTML = '<i class="fas fa-upload"></i> Import Data';
        importBtn.onclick = () => this.importData();

        // Hidden file input for import
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        fileInput.onchange = (e) => this.handleFileImport(e);
        
        controlsContainer.appendChild(importBtn);
        controlsContainer.appendChild(exportBtn);
        controlsContainer.appendChild(fileInput);
        document.body.appendChild(controlsContainer);
    }

    async handleFileImport(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validate imported data
                    if (!Array.isArray(importedData.patients)) {
                        throw new Error('Invalid data format');
                    }

                    // Confirm import
                    if (confirm(`Import ${importedData.patients.length} patient records? This will replace existing data.`)) {
                        this.patients = importedData.patients;
                        await this.savePatients();
                        this.displayPatients();
                        this.showStorageStatus('Data imported successfully');
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    this.showStorageStatus('Error importing data: Invalid format');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('Import error:', error);
            this.showStorageStatus('Error importing data');
        }
    }

    importData() {
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.click();
    }

    showPersistenceWarning() {
        const warning = document.createElement('div');
        warning.className = 'alert alert-warning alert-dismissible fade show';
        warning.style.position = 'fixed';
        warning.style.bottom = '60px';
        warning.style.left = '50%';
        warning.style.transform = 'translateX(-50%)';
        warning.style.zIndex = '1000';
        warning.style.maxWidth = '90%';
        warning.style.width = '600px';

        warning.innerHTML = `
            <strong>⚠️ Data Storage Notice:</strong>
            <ul class="mb-0">
                <li>Data is stored locally in your browser</li>
                <li>Clearing browser data will erase all patient records</li>
                <li>Regular backups are recommended</li>
            </ul>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(warning);
        
        // Hide warning after 10 seconds
        setTimeout(() => {
            warning.classList.remove('show');
            setTimeout(() => warning.remove(), 150);
        }, 10000);
    }

    checkBackupReminder() {
        if (!this.lastBackupDate) {
            this.showBackupReminder();
            return;
        }

        const lastBackup = new Date(this.lastBackupDate);
        const daysSinceBackup = Math.floor((new Date() - lastBackup) / (1000 * 60 * 60 * 24));

        if (daysSinceBackup >= this.backupReminderDays) {
            this.showBackupReminder();
        }
    }

    showBackupReminder() {
        const reminder = document.createElement('div');
        reminder.className = 'alert alert-info alert-dismissible fade show';
        reminder.style.position = 'fixed';
        reminder.style.top = '60px';
        reminder.style.left = '50%';
        reminder.style.transform = 'translateX(-50%)';
        reminder.style.zIndex = '1000';
        reminder.style.maxWidth = '90%';
        reminder.style.width = '400px';

        reminder.innerHTML = `
            <strong>📦 Backup Reminder:</strong>
            <p class="mb-2">It's been a while since your last backup. Would you like to export your data now?</p>
            <button class="btn btn-sm btn-primary me-2" onclick="window.erSystem.exportData()">Export Now</button>
            <button class="btn btn-sm btn-secondary" onclick="window.erSystem.dismissBackupReminder()">Remind Me Later</button>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(reminder);
    }

    dismissBackupReminder() {
        // Update last backup date to silence reminder for another week
        const reminderAlert = document.querySelector('.alert-info');
        if (reminderAlert) {
            reminderAlert.classList.remove('show');
            setTimeout(() => reminderAlert.remove(), 150);
        }
        this.updateLastBackupDate();
    }

    updateLastBackupDate() {
        const now = new Date().toISOString();
        this.lastBackupDate = now;
        localStorage.setItem('lastBackupDate', now);
    }

    async exportData() {
        try {
            const data = {
                patients: this.patients,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `er-system-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.updateLastBackupDate();
            this.showStorageStatus('Data exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            this.showStorageStatus('Error exporting data');
        }
    }

    async loadPatients() {
        try {
            this.showStorageStatus('Loading patient data...', true);
            
            // Try IndexedDB first
            if (this.db) {
                const patients = await this.loadFromIndexedDB();
                this.showStorageStatus(`Loaded ${patients.length} records from IndexedDB`);
                return patients;
            }
            
            // Fallback to localStorage
            const savedPatients = localStorage.getItem('erPatients');
            const patients = savedPatients ? JSON.parse(savedPatients) : [];
            this.showStorageStatus(`Loaded ${patients.length} records from localStorage`);
            return patients;
        } catch (error) {
            console.error('Error loading patients:', error);
            this.showStorageStatus('Error loading data');
            return [];
        }
    }

    async loadFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['patients'], 'readonly');
            const store = transaction.objectStore('patients');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async savePatients() {
        try {
            this.showStorageStatus('Saving...', true);
            
            // Try IndexedDB first
            if (this.db) {
                await this.saveToIndexedDB();
                this.showStorageStatus('Saved to IndexedDB');
                return;
            }
            
            // Fallback to localStorage
            localStorage.setItem('erPatients', JSON.stringify(this.patients));
            this.showStorageStatus('Saved to localStorage');
        } catch (error) {
            console.error('Error saving patients:', error);
            this.showStorageStatus('Error saving data');
        }
    }

    async saveToIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['patients'], 'readwrite');
            const store = transaction.objectStore('patients');
            
            // Clear existing records
            store.clear();
            
            // Add all patients
            this.patients.forEach(patient => {
                store.add(patient);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async setupAPIConfigs() {
        try {
            await this.validateAPIKeys();
            await this.setupRateLimiting();
            console.log('API configuration successful');
        } catch (error) {
            console.error('API configuration failed:', error);
        }
    }

    async validateAPIKeys() {
        const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY;
        const weatherKey = process.env.WEATHER_API_KEY;

        if (!googleMapsKey || !weatherKey) {
            throw new Error('Missing API keys');
        }

        try {
            await this.testGoogleMapsAPI(googleMapsKey);
            await this.testWeatherAPI(weatherKey);
        } catch (error) {
            throw new Error(`API validation failed: ${error.message}`);
        }
    }

    setupEventListeners() {
        this.registrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });
    }

    async handleRegistration() {
        const name = document.getElementById('name').value;
        const symptoms = document.getElementById('symptoms').value;
        const severity = parseInt(document.getElementById('severity').value);

        const patient = {
            id: Date.now(),
            name,
            symptoms,
            severity,
            registrationTime: new Date().toISOString(),
            estimatedWaitTime: this.calculateWaitTime(severity),
            lastUpdated: new Date().toISOString()
        };

        this.patients.push(patient);
        await this.savePatients();
        this.displayPatients();
        this.updateWaitTimeDisplay(patient);
        
        // Reset form
        document.getElementById('registrationForm').reset();
    }

    calculateWaitTime(severity) {
        // Base wait times in minutes
        const baseWaitTimes = {
            high: 15,    // 1-3 severity
            medium: 30,  // 4-7 severity
            low: 60      // 8-10 severity
        };

        if (severity <= 3) return baseWaitTimes.high;
        if (severity <= 7) return baseWaitTimes.medium;
        return baseWaitTimes.low;
    }

    updateWaitTimeDisplay(patient) {
        if (this.waitTimeDisplay && this.severityLevel) {
            this.waitTimeDisplay.textContent = `${patient.estimatedWaitTime} mins`;
            
            let severityText = '';
            let severityClass = '';
            
            if (patient.severity <= 3) {
                severityText = 'High';
                severityClass = 'severity-high';
            } else if (patient.severity <= 7) {
                severityText = 'Medium';
                severityClass = 'severity-medium';
            } else {
                severityText = 'Low';
                severityClass = 'severity-low';
            }
            
            this.severityLevel.textContent = `Severity Level: ${severityText}`;
            this.severityLevel.className = severityClass;
        }
    }

    displayPatients() {
        const container = document.querySelector('.container');
        if (!container) return;

        // Check if records section exists, if not create it
        let recordsSection = document.getElementById('patientRecords');
        if (!recordsSection) {
            recordsSection = document.createElement('div');
            recordsSection.id = 'patientRecords';
            recordsSection.className = 'row mt-4';
            container.appendChild(recordsSection);
        }

        // Sort patients by severity (highest priority first)
        const sortedPatients = [...this.patients].sort((a, b) => a.severity - b.severity);

        recordsSection.innerHTML = `
            <div class="col-12">
                <div class="card shadow-sm">
                    <div class="card-header bg-light">
                        <h5 class="card-title mb-0">Patient Records</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Symptoms</th>
                                        <th>Severity</th>
                                        <th>Registration Time</th>
                                        <th>Estimated Wait</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sortedPatients.map(patient => `
                                        <tr class="severity-${patient.severity <= 3 ? 'high' : patient.severity <= 7 ? 'medium' : 'low'}">
                                            <td>${patient.name}</td>
                                            <td>${patient.symptoms}</td>
                                            <td>${patient.severity}</td>
                                            <td>${new Date(patient.registrationTime).toLocaleString()}</td>
                                            <td>${patient.estimatedWaitTime} mins</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initializeMap() {
        // Implement Google Maps initialization here
        console.log('Map initialization will be implemented when API key is available');
    }

    async testGoogleMapsAPI(apiKey) {
        // Implement API test
        return true;
    }

    async testWeatherAPI(apiKey) {
        // Implement API test
        return true;
    }

    setupRateLimiting() {
        // Implement rate limiting
        return Promise.resolve();
    }

    createStorageStatus() {
        const status = document.createElement('div');
        status.className = 'storage-status';
        status.id = 'storageStatus';
        status.textContent = 'Data stored locally';
        document.body.appendChild(status);
    }

    showStorageStatus(message, isSaving = false) {
        const status = document.getElementById('storageStatus');
        if (status) {
            status.textContent = message;
            status.className = `storage-status${isSaving ? ' saving' : ''}`;
            if (!isSaving) {
                setTimeout(() => {
                    status.textContent = 'Data stored locally';
                    status.className = 'storage-status';
                }, 2000);
            }
        }
    }

    async removePatient(patientId) {
        this.patients = this.patients.filter(p => p.id !== patientId);
        await this.savePatients();
        this.displayPatients();
        this.showStorageStatus('Patient removed');
    }
}

// Initialize the system when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.erSystem = new EmergencyRoomSystem();
}); 