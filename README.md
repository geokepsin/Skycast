# SkyCast — Live Weather Intelligence & AI Outlook

SkyCast is a production-grade weather report web application built with React, TypeScript, Tailwind CSS, Express, Open-Meteo, and Google Gemini AI (`gemini-3.8-flash`).

## Features

1. **City Search & Autocomplete**: Debounced search powered by Open-Meteo Geocoding with keyboard navigation and coordinate matching.
2. **GPS Geolocation**: "Use my location" button utilizing the browser Geolocation API with graceful permission error fallbacks.
3. **Current Conditions Hero**:
   - Prominent temperature, apparent "feels-like" temperature, and high/low values.
   - Animated SVG condition icons responding to day/night and WMO codes.
   - Comprehensive atmospheric metrics grid: Humidity (with gauge bar), Wind speed/direction with compass needle, Surface Pressure, UV Index with danger scale, Visibility, and Sunrise/Sunset times.
4. **AI Weather Summary & Daily Tips**:
   - Powered by Gemini 3.8 Flash via a secure server proxy (`POST /api/summary`).
   - 2–3 sentence natural language outlook.
   - 3 actionable tips: What to wear (clothing & fabrics), Umbrella requirement, and Best outdoor window.
   - Resilient heuristic fallback if the Gemini API key is missing or experiencing transient issues.
5. **Interactive Hourly Strip (24h)**:
   - Horizontally scrollable 24-hour forecast strip with left/right scroll controls.
   - Interactive SVG temperature curve using cubic Bézier interpolation and gradient fill.
   - Hover highlights and peak/trough indicators.
6. **7-Day Outlook**:
   - High and low temperatures with relative color spectrum bars showing where each day falls relative to the week's global temperature range.
   - Rain probability and peak UV index indicators.
7. **Units Toggle & Favorites**:
   - Seamless switching between Metric (°C, km/h, mm) and Imperial (°F, mph, in).
   - Saved favorite cities list with quick-switch chips and local storage persistence.
8. **Dynamic Atmospheric Theming**:
   - Real-time gradient backgrounds adapt to current conditions (Clear day, Clear night, Rain, Thunderstorm, Snow, Fog, Overcast).

---

## Backend API Specification

The Express backend serves both as the API proxy and the production server:

- `GET /api/geocode?q=<city>`: Searches cities and returns coordinates, country, and admin subdivisions.
- `GET /api/weather?lat=<lat>&lon=<lon>&units=[metric|imperial]`: Returns normalized current, hourly (24h), and daily (7d) weather data.
- `POST /api/summary`: Accepts weather data payload and calls the Gemini API (`gemini-3.8-flash`) to generate structured advice.
- **In-Memory Cache**: 10-minute TTL cache across geocoding and weather queries to minimize redundant upstream requests.
- **Rate Limiting**: Built-in IP rate limiter (60+ req/min) to prevent abuse.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- NPM

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```bash
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=3000
   ```

3. Start development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. Build for production:
   ```bash
   npm run build
   npm run start
   ```
