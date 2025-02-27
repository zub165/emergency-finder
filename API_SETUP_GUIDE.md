# API Setup Guide for Emergency Room Wait Time System

## Overview
This system uses two external APIs:
1. Google Maps API for traffic data
2. OpenWeatherMap API for weather conditions

## Google Maps API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Distance Matrix API
   - Maps JavaScript API
   - Places API
4. Create credentials:
   - Go to "Credentials" in the left sidebar
   - Click "Create Credentials" → "API Key"
   - Copy the generated key
5. Set up restrictions (recommended):
   - IP address restrictions
   - HTTP referrer restrictions
   - API restrictions to only enabled APIs

Cost Information:
- Free tier: $200 monthly credit
- Distance Matrix API: $5 per 1000 requests
- Recommended: Set up billing alerts

## OpenWeatherMap API Setup
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Go to "API Keys" section
4. Copy your API key

Cost Information:
- Free tier: 60 calls/minute
- Pro options available for higher limits

## Environment Setup
1. Create a `.env` file in your project root:
```env
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
WEATHER_API_KEY=your_openweathermap_key_here
```

2. Add `.env` to your `.gitignore`:
```
.env
.env.local
.env.*.local
```

## API Usage Examples

### Google Maps Traffic Data
```javascript
const trafficData = await fetchGoogleTrafficData({
    lat: 40.7128,
    lng: -74.0060
});
// Returns: 'light', 'moderate', or 'heavy'
```

### Weather Data
```javascript
const weatherData = await fetchWeatherData({
    lat: 40.7128,
    lng: -74.0060
});
// Returns: 'clear', 'rain', 'snow', or 'storm'
```

## Rate Limiting
The system includes built-in rate limiting:
- Google Maps: 500 requests per minute
- Weather API: 60 requests per minute

## Error Handling
The system handles:
1. Invalid API keys
2. Expired keys
3. Rate limit exceeded
4. Network errors
5. API service outages

## Monitoring
Monitor your API usage:
1. Google Cloud Console Dashboard
2. OpenWeatherMap Dashboard
3. Built-in system logs

## Troubleshooting

### Common Issues:
1. "API key not valid":
   - Check if key is correctly copied
   - Verify key restrictions
   - Check billing status

2. "Rate limit exceeded":
   - Wait for rate limit reset
   - Consider upgrading plan
   - Check for code loops

3. "Network error":
   - Check internet connection
   - Verify API endpoint
   - Check firewall settings

### Debug Commands:
```bash
# Test Google Maps API
curl "https://maps.googleapis.com/maps/api/distancematrix/json?origins=40.7128,-74.0060&destinations=40.7128,-74.0060&key=YOUR_KEY"

# Test Weather API
curl "https://api.openweathermap.org/data/2.5/weather?lat=40.7128&lon=-74.0060&appid=YOUR_KEY"
```

## Best Practices
1. Never commit API keys to version control
2. Use environment variables
3. Implement rate limiting
4. Add error handling
5. Use fallback mechanisms
6. Monitor API usage
7. Keep keys restricted

## Support
- Google Maps API: [Support](https://developers.google.com/maps/support)
- OpenWeatherMap: [Support](https://openweathermap.org/api) 