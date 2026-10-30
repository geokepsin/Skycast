/**
 * Weather & Geocoding Types for SkyCast
 */

export type UnitSystem = 'metric' | 'imperial';

export interface LocationInfo {
  id?: number | string;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  countryCode?: string;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  surfacePressure: number;
  windSpeed: number;
  windDirection: number;
  windDirectionCardinal: string;
  uvIndex: number;
  uvDescription: string;
  visibilityKm: number;
  visibilityMiles: number;
  isDay: boolean;
  precipitation: number;
  weatherCode: number;
  condition: string;
  time: string;
  sunrise: string;
  sunset: string;
}

export interface HourlyForecast {
  time: string; // ISO string
  displayTime: string; // e.g. "2 PM", "Now"
  temperature: number;
  precipitationProbability: number;
  weatherCode: number;
  condition: string;
  windSpeed: number;
  uvIndex: number;
  visibility: number;
  isDay: boolean;
}

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // e.g. "Mon", "Today"
  formattedDate: string; // e.g. "Oct 30"
  weatherCode: number;
  condition: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbabilityMax: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
}

export interface WeatherData {
  location: LocationInfo;
  current: CurrentWeather;
  hourly: HourlyForecast[]; // Next 24-36 hours
  daily: DailyForecast[]; // 7 days
  units: {
    temperature: '°C' | '°F';
    windSpeed: 'km/h' | 'mph';
    pressure: 'hPa' | 'inHg';
    precipitation: 'mm' | 'in';
    visibility: 'km' | 'mi';
  };
  fetchedAt: string;
}

export interface AiSummaryResponse {
  summary: string;
  tips: {
    clothing: string;
    umbrella: string;
    outdoor: string;
  };
  source: 'gemini' | 'rules';
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}
