import { LocationInfo, WeatherData, UnitSystem, AiSummaryResponse } from '../types/weather';

export async function searchLocations(query: string, signal?: AbortSignal): Promise<LocationInfo[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, { signal });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Geocoding request failed (${res.status})`);
  }

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

  const res = await fetch(`/api/weather?${params.toString()}`, { signal });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Weather data request failed (${res.status})`);
  }

  return res.json();
}

export async function fetchAiSummary(
  weather: WeatherData,
  locationName: string,
  signal?: AbortSignal
): Promise<AiSummaryResponse> {
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

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `AI summary request failed (${res.status})`);
  }

  return res.json();
}
