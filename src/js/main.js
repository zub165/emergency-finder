import { Loader } from '@googlemaps/js-api-loader';
import axios from 'axios';
import '../css/styles.css';

// Initialize Google Maps
const loader = new Loader({
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
    version: "weekly"
});

// Initialize map
let map;
loader.load().then(() => {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8,
    });
});

// Get weather data
async function getWeather(lat, lon) {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`);
        return response.data;
    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                // Center map on user's location
                map.setCenter({ lat: latitude, lng: longitude });
                
                // Get and display weather
                const weather = await getWeather(latitude, longitude);
                if (weather) {
                    document.getElementById('weather').textContent = 
                        `Current weather: ${weather.main.temp}°C, ${weather.weather[0].description}`;
                }
            },
            (error) => {
                console.error('Error getting location:', error);
            }
        );
    }
    
    // Initialize form handlers
    const form = document.getElementById('registration-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Handle form submission
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            console.log('Form submitted:', data);
            // TODO: Send data to backend
        });
    }
});
