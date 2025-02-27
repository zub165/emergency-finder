# Emergency Room Wait Time System

A real-time emergency room wait time estimation and registration system that uses traffic and weather data to provide accurate wait time predictions.

## Features

- Real-time wait time estimation using multiple factors:
  - Current patient load
  - Traffic conditions (via Google Maps API)
  - Weather conditions (via OpenWeatherMap API)
  - Historical patterns
- Patient registration system
- Resource optimization
- Severity scale assessment
- Interactive map integration

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Google Maps API key
- OpenWeatherMap API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/zub165/emergency-finder.git
cd emergency-finder
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your API keys:
```env
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
WEATHER_API_KEY=your_openweathermap_key_here
```

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Run tests:
```bash
npm test
```

## API Integration

This project uses two external APIs:
- Google Maps API for traffic data
- OpenWeatherMap API for weather conditions

For detailed API setup instructions, see [API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)

## Testing

The project includes comprehensive test suites for:
- Registration functionality
- Wait time calculations
- Severity scale assessment
- Map integration
- Resource optimization

Run tests using:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Contact

Your Name - [@zub165](https://github.com/zub165)

Project Link: [https://github.com/zub165/emergency-finder](https://github.com/zub165/emergency-finder)