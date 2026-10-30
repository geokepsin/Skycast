import { normalizeWeatherData } from '../src/utils/weatherData';

export default async function handler(req: any, res: any) {
  try {
    const lat = parseFloat(req.query?.lat as string);
    const lon = parseFloat(req.query?.lon as string);
    const units = (req.query?.units as string) === 'imperial' ? 'imperial' : 'metric';
    const locationName = (req.query?.name as string) || 'Current Location';
    const country = (req.query?.country as string) || '';
    const admin1 = (req.query?.admin1 as string) || '';

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: 'INVALID_COORDINATES',
        message: 'Valid latitude (-90 to 90) and longitude (-180 to 180) are required.',
      });
    }

    const tempUnitParam = units === 'imperial' ? 'fahrenheit' : 'celsius';
    const windUnitParam = units === 'imperial' ? 'mph' : 'kmh';
    const precipUnitParam = units === 'imperial' ? 'inch' : 'mm';

    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,uv_index,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&timezone=auto&temperature_unit=${tempUnitParam}&wind_speed_unit=${windUnitParam}&precipitation_unit=${precipUnitParam}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Open-Meteo Forecast responded with status ${response.status}`);
    }

    const data = await response.json();
    const result = normalizeWeatherData(data, lat, lon, units, locationName, country, admin1);

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Weather forecast error:', err);
    return res.status(500).json({
      error: 'WEATHER_FETCH_FAILED',
      message: err.message || 'Unable to retrieve current weather data.',
    });
  }
}
