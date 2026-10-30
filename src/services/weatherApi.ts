import { LocationInfo, WeatherData, UnitSystem, AiSummaryResponse } from '../types/weather';
import { normalizeWeatherData, generateHeuristicSummary } from '../utils/weatherData';

export async function searchLocations(query: string, signal?: AbortSignal): Promise<LocationInfo[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, { signal });
    if (res.ok) {
      const data = await res.json();
      return (data.results || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        country: item.country || '',
        countryCode: item.countryCode || '',
        admin1: item.admin1 || '',
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone,
      }));
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    console.warn('Backend geocoding failed or returned non-200, trying direct Open-Meteo:', err);
  }

  // Graceful fallback for static deployments (e.g. Vercel static, Netlify)
  try {
    const directUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=8&language=en&format=json`;
    const res = await fetch(directUrl, { signal });
    if (!res.ok) {
      throw new Error(`Open-Meteo Geocoding failed (${res.status})`);
    }
    const data = await res.json();
    return (data.results || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      country: item.country || '',
      countryCode: item.country_code || '',
      admin1: item.admin1 || '',
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone,
    }));
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Unable to search locations right now. Please check your internet connection.');
  }
}

export async function fetchWeather(
  lat: number,
  lon: number,
  units: UnitSystem,
  name?: string,
  country?: string,
  admin1?: string,
  signal?: AbortSignal
): Promise<WeatherData> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    units,
    name: name || '',
    country: country || '',
    admin1: admin1 || '',
  });

  try {
    const res = await fetch(`/api/weather?${params.toString()}`, { signal });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    console.warn('Backend weather proxy unavailable, falling back to direct Open-Meteo API:', err);
  }

  // Graceful fallback to direct Open-Meteo API for serverless/static hosts (e.g. Vercel)
  try {
    const tempUnitParam = units === 'imperial' ? 'fahrenheit' : 'celsius';
    const windUnitParam = units === 'imperial' ? 'mph' : 'kmh';
    const precipUnitParam = units === 'imperial' ? 'inch' : 'mm';

    const directApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,uv_index,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&timezone=auto&temperature_unit=${tempUnitParam}&wind_speed_unit=${windUnitParam}&precipitation_unit=${precipUnitParam}`;

    const res = await fetch(directApiUrl, { signal });
    if (!res.ok) {
      throw new Error(`Open-Meteo Forecast request failed with status ${res.status}`);
    }

    const rawData = await res.json();
    return normalizeWeatherData(rawData, lat, lon, units, name || 'Current Location', country, admin1);
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    throw new Error(err.message || 'Unable to retrieve weather forecast at this time.');
  }
}

export async function fetchAiSummary(
  weather: WeatherData,
  locationName: string,
  signal?: AbortSignal
): Promise<AiSummaryResponse> {
  try {
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        weather,
        locationName,
      }),
      signal,
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    console.warn('AI summary API endpoint unavailable, generating heuristic summary:', err);
  }

  // Graceful heuristic fallback if backend API route is 404 on Vercel
  return generateHeuristicSummary(weather, locationName);
}
