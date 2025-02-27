import '../src/styles.css';

class EmergencyRoomSystem {
    constructor() {
        this.waitTimeDisplay = document.getElementById('waitTimeDisplay');
        this.severityLevel = document.getElementById('severityLevel');
        this.registrationForm = document.getElementById('registrationForm');
        this.map = null;
        this.markers = [];
        this.currentPatients = [];
        
        this.initializeSystem();
    }

    initializeSystem() {
        this.setupEventListeners();
        this.initializeMap();
        this.setupAPIConfigs();
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
            name,
            symptoms,
            severity,
            registrationTime: new Date(),
            estimatedWaitTime: await this.calculateWaitTime(severity)
        };

        this.currentPatients.push(patient);
        this.updateWaitTimeDisplay(patient.estimatedWaitTime);
        this.updateSeverityLevel(severity);
        this.registrationForm.reset();
    }

    async calculateWaitTime(severity) {
        try {
            const trafficData = await this.fetchGoogleTrafficData();
            const weatherData = await this.fetchWeatherData();
            const baseWaitTime = this.getBaseWaitTime(severity);
            
            return this.adjustWaitTime(baseWaitTime, trafficData, weatherData);
        } catch (error) {
            console.error('Error calculating wait time:', error);
            return this.getBaseWaitTime(severity);
        }
    }

    getBaseWaitTime(severity) {
        if (severity >= 8) return 10; // 10 minutes for severe cases
        if (severity >= 5) return 30; // 30 minutes for moderate cases
        return 60; // 60 minutes for mild cases
    }

    adjustWaitTime(baseTime, trafficData, weatherData) {
        let adjustedTime = baseTime;
        
        // Traffic adjustment
        if (trafficData.congestion === 'heavy') adjustedTime *= 1.3;
        else if (trafficData.congestion === 'moderate') adjustedTime *= 1.15;

        // Weather adjustment
        if (weatherData.severity === 'severe') adjustedTime *= 1.25;
        else if (weatherData.severity === 'moderate') adjustedTime *= 1.1;

        return Math.round(adjustedTime);
    }

    async fetchGoogleTrafficData() {
        // Implement actual Google Maps API call here
        return { congestion: 'moderate' };
    }

    async fetchWeatherData() {
        // Implement actual Weather API call here
        return { severity: 'moderate' };
    }

    updateWaitTimeDisplay(waitTime) {
        this.waitTimeDisplay.textContent = `${waitTime} min`;
    }

    updateSeverityLevel(severity) {
        const severityText = this.getSeverityText(severity);
        this.severityLevel.textContent = `Severity Level: ${severityText}`;
        this.updateSeverityColor(severity);
    }

    getSeverityText(severity) {
        if (severity >= 8) return 'High';
        if (severity >= 5) return 'Medium';
        return 'Low';
    }

    updateSeverityColor(severity) {
        this.severityLevel.classList.remove('severity-high', 'severity-medium', 'severity-low');
        if (severity >= 8) this.severityLevel.classList.add('severity-high');
        else if (severity >= 5) this.severityLevel.classList.add('severity-medium');
        else this.severityLevel.classList.add('severity-low');
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
}

// Initialize the system when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EmergencyRoomSystem();
}); 