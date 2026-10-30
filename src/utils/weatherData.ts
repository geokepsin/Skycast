import { WeatherData, CurrentWeather, HourlyForecast, DailyForecast, AiSummaryResponse } from '../types/weather';

export function getWeatherCondition(code: number): string {
  switch (code) {
    case 0: return 'Clear sky';
    case 1: return 'Mainly clear';
    case 2: return 'Partly cloudy';
    case 3: return 'Overcast';
    case 45: return 'Fog';
    case 48: return 'Freezing fog';
    case 51: return 'Light drizzle';
    case 53: return 'Moderate drizzle';
    case 55: return 'Dense drizzle';
    case 56: return 'Light freezing drizzle';
    case 57: return 'Dense freezing drizzle';
    case 61: return 'Slight rain';
    case 63: return 'Moderate rain';
    case 65: return 'Heavy rain';
    case 66: return 'Light freezing rain';
    case 67: return 'Heavy freezing rain';
    case 71: return 'Slight snow fall';
    case 73: return 'Moderate snow fall';
    case 75: return 'Heavy snow fall';
    case 77: return 'Snow grains';
    case 80: return 'Slight rain showers';
    case 81: return 'Moderate rain showers';
    case 82: return 'Violent rain showers';
    case 85: return 'Slight snow showers';
    case 86: return 'Heavy snow showers';
    case 95: return 'Thunderstorm';
    case 96: return 'Thunderstorm with slight hail';
    case 99: return 'Thunderstorm with heavy hail';
    default: return 'Fair';
  }
}

export function getWindCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
  return directions[index];
}

export function getUvDescription(uv: number): string {
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very High';
  return 'Extreme';
}

export function normalizeWeatherData(
  data: any,
  lat: number,
  lon: number,
  units: 'metric' | 'imperial',
  locationName: string = 'Current Location',
  country: string = '',
  admin1: string = ''
): WeatherData {
  const currentData = data.current || {};
  const hourlyData = data.hourly || {};
  const dailyData = data.daily || {};

  const sunriseList: string[] = dailyData.sunrise || [];
  const sunsetList: string[] = dailyData.sunset || [];

  const current: CurrentWeather = {
    temperature: Math.round(currentData.temperature_2m ?? 0),
    apparentTemperature: Math.round(currentData.apparent_temperature ?? currentData.temperature_2m ?? 0),
    relativeHumidity: Math.round(currentData.relative_humidity_2m ?? 0),
    surfacePressure: Math.round(currentData.surface_pressure ?? 1013),
    windSpeed: Math.round((currentData.wind_speed_10m ?? 0) * 10) / 10,
    windDirection: Math.round(currentData.wind_direction_10m ?? 0),
    windDirectionCardinal: getWindCardinal(currentData.wind_direction_10m ?? 0),
    uvIndex: Math.round((currentData.uv_index ?? 0) * 10) / 10,
    uvDescription: getUvDescription(currentData.uv_index ?? 0),
    visibilityKm: 10,
    visibilityMiles: 6.2,
    isDay: Boolean(currentData.is_day ?? 1),
    precipitation: currentData.precipitation ?? 0,
    weatherCode: currentData.weather_code ?? 0,
    condition: getWeatherCondition(currentData.weather_code ?? 0),
    time: currentData.time || new Date().toISOString(),
    sunrise: sunriseList[0] || '',
    sunset: sunsetList[0] || '',
  };

  const hourlyTimes: string[] = hourlyData.time || [];
  const hourlyTemps: number[] = hourlyData.temperature_2m || [];
  const hourlyPrecipProb: number[] = hourlyData.precipitation_probability || [];
  const hourlyWeatherCode: number[] = hourlyData.weather_code || [];
  const hourlyWindSpeed: number[] = hourlyData.wind_speed_10m || [];
  const hourlyUv: number[] = hourlyData.uv_index || [];
  const hourlyVis: number[] = hourlyData.visibility || [];

  const currentTimeStr = currentData.time || new Date().toISOString();
  let startIndex = hourlyTimes.findIndex((t) => t >= currentTimeStr.slice(0, 13));
  if (startIndex === -1) startIndex = 0;

  const hourly: HourlyForecast[] = [];
  const hoursToFetch = 24;
  for (let i = startIndex; i < Math.min(startIndex + hoursToFetch, hourlyTimes.length); i++) {
    const timeStr = hourlyTimes[i];
    const hourDate = new Date(timeStr);
    let displayTime = 'Now';
    if (i > startIndex) {
      displayTime = hourDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true,
      });
    }

    const hourIso = timeStr.slice(11, 16);
    const isDayHour = hourIso >= '06:00' && hourIso <= '20:00';

    hourly.push({
      time: timeStr,
      displayTime,
      temperature: Math.round(hourlyTemps[i] ?? 0),
      precipitationProbability: Math.round(hourlyPrecipProb[i] ?? 0),
      weatherCode: hourlyWeatherCode[i] ?? 0,
      condition: getWeatherCondition(hourlyWeatherCode[i] ?? 0),
      windSpeed: Math.round((hourlyWindSpeed[i] ?? 0) * 10) / 10,
      uvIndex: Math.round((hourlyUv[i] ?? 0) * 10) / 10,
      visibility: Math.round((hourlyVis[i] ?? 10000) / 1000),
      isDay: isDayHour,
    });
  }

  const dailyDates: string[] = dailyData.time || [];
  const dailyMaxTemps: number[] = dailyData.temperature_2m_max || [];
  const dailyMinTemps: number[] = dailyData.temperature_2m_min || [];
  const dailyPrecipProb: number[] = dailyData.precipitation_probability_max || [];
  const dailyWeatherCode: number[] = dailyData.weather_code || [];
  const dailyUvMax: number[] = dailyData.uv_index_max || [];

  const daily: DailyForecast[] = [];
  const daysCount = Math.min(7, dailyDates.length);
  for (let i = 0; i < daysCount; i++) {
    const dDate = new Date(dailyDates[i] + 'T00:00:00');
    let dayOfWeek = dDate.toLocaleDateString('en-US', { weekday: 'short' });
    if (i === 0) dayOfWeek = 'Today';
    else if (i === 1) dayOfWeek = 'Tomorrow';

    const formattedDate = dDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    daily.push({
      date: dailyDates[i],
      dayOfWeek,
      formattedDate,
      weatherCode: dailyWeatherCode[i] ?? 0,
      condition: getWeatherCondition(dailyWeatherCode[i] ?? 0),
      temperatureMax: Math.round(dailyMaxTemps[i] ?? 0),
      temperatureMin: Math.round(dailyMinTemps[i] ?? 0),
      precipitationProbabilityMax: Math.round(dailyPrecipProb[i] ?? 0),
      sunrise: sunriseList[i] || '',
      sunset: sunsetList[i] || '',
      uvIndexMax: Math.round((dailyUvMax[i] ?? 0) * 10) / 10,
    });
  }

  return {
    location: {
      name: locationName,
      country,
      admin1,
      latitude: lat,
      longitude: lon,
      timezone: data.timezone || 'UTC',
    },
    current,
    hourly,
    daily,
    units: {
      temperature: units === 'imperial' ? '°F' : '°C',
      windSpeed: units === 'imperial' ? 'mph' : 'km/h',
      pressure: units === 'imperial' ? 'inHg' : 'hPa',
      precipitation: units === 'imperial' ? 'in' : 'mm',
      visibility: units === 'imperial' ? 'mi' : 'km',
    },
    fetchedAt: new Date().toISOString(),
  };
}

export function generateHeuristicSummary(
  weather: WeatherData,
  locationName: string
): AiSummaryResponse {
  const { current, daily, units } = weather;
  const tempUnit = units?.temperature || '°C';
  const todayDaily = daily?.[0] || {};
  const maxRainProb = todayDaily.precipitationProbabilityMax ?? current.precipitation ?? 0;

  const isCold = tempUnit === '°C' ? current.temperature < 10 : current.temperature < 50;
  const isWarm = tempUnit === '°C' ? current.temperature > 24 : current.temperature > 75;
  const isRainy = maxRainProb >= 40 || current.weatherCode >= 51;

  let summaryText = `Expect ${current.condition.toLowerCase()} skies in ${locationName || 'your area'} today with a high of ${todayDaily.temperatureMax ?? current.temperature}${tempUnit} and a low of ${todayDaily.temperatureMin ?? current.temperature}${tempUnit}. `;
  if (isRainy) {
    summaryText += `Precipitation chance peaks around ${maxRainProb}%, so keep rain protection close at hand.`;
  } else if (isWarm) {
    summaryText += `Pleasantly warm conditions will dominate most of the daylight hours with light breezes.`;
  } else if (isCold) {
    summaryText += `Chilly temperatures will persist throughout the day, especially during early morning and late evening.`;
  } else {
    summaryText += `Overall mild and stable conditions make for a comfortable day ahead.`;
  }

  let clothingTip = '';
  if (isCold) {
    clothingTip = `Layer up with a warm insulated jacket, scarf, and thermal underlayer to guard against ${current.temperature}${tempUnit} air.`;
  } else if (isWarm) {
    clothingTip = `Breathable cotton or linen fabrics, sunglasses, and light shorts or t-shirt will keep you comfortable.`;
  } else {
    clothingTip = `A light sweater or medium windbreaker over a comfortable t-shirt is ideal for shifting temperatures.`;
  }

  let umbrellaTip = '';
  if (maxRainProb >= 50 || current.precipitation > 0) {
    umbrellaTip = `Yes, carry a compact umbrella. ${maxRainProb}% chance of rain showers expected today.`;
  } else if (maxRainProb >= 20) {
    umbrellaTip = `Optional pocket umbrella. Slight ${maxRainProb}% chance of isolated sprinkles.`;
  } else {
    umbrellaTip = `No umbrella needed today. Clear skies and minimal precipitation expected.`;
  }

  let outdoorTip = '';
  if (isRainy) {
    outdoorTip = `Aim for early morning or dry breaks between showers for errands and outdoor walks.`;
  } else if (current.uvIndex >= 6) {
    outdoorTip = `Best outdoor window is before 11:00 AM or after 4:00 PM when peak UV intensity (${current.uvIndex}) softens.`;
  } else {
    outdoorTip = `Ideal for afternoon walks or outdoor exercise between 1:00 PM and 5:00 PM with pleasant ${current.temperature}${tempUnit} temperatures.`;
  }

  return {
    summary: summaryText,
    tips: {
      clothing: clothingTip,
      umbrella: umbrellaTip,
      outdoor: outdoorTip,
    },
    source: 'rules',
  };
}
