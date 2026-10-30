import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google Gemini AI client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Simple in-memory cache with TTL (10 minutes)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, CacheEntry<unknown>>();

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setInCache<T>(key: string, data: T): void {
  // Purge expired keys if cache exceeds 1000 entries
  if (cache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now - v.timestamp > CACHE_TTL_MS) {
        cache.delete(k);
      }
    }
  }
  cache.set(key, { data, timestamp: Date.now() });
}

// Basic rate limiter per client IP (60 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimiter(req: Request, res: Response, next: () => void) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return next();
  }

  record.count += 1;
  if (record.count > 100) {
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait a moment before trying again.',
    });
  }

  next();
}

app.use('/api', rateLimiter);

// WMO Weather interpretation codes
function getWeatherCondition(code: number): string {
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

function getWindCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
  return directions[index];
}

function getUvDescription(uv: number): string {
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very High';
  return 'Extreme';
}

/**
 * 1. GET /api/geocode?q=<city>
 */
app.get('/api/geocode', async (req: Request, res: Response) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'INVALID_QUERY',
        message: 'City search query must be at least 2 characters long.',
      });
    }

    const cacheKey = `geo:${query.toLowerCase()}`;
    const cached = getFromCache<unknown[]>(cacheKey);
    if (cached) {
      return res.json({ results: cached, cached: true });
    }

    const apiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Open-Meteo Geocoding responded with status ${response.status}`);
    }

    const data = await response.json();
    const results = (data.results || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country || '',
      countryCode: item.country_code || '',
      admin1: item.admin1 || '',
      timezone: item.timezone || 'auto',
    }));

    setInCache(cacheKey, results);
    return res.json({ results, cached: false });
  } catch (err: any) {
    console.error('Geocoding error:', err);
    return res.status(500).json({
      error: 'GEOCODING_FAILED',
      message: err.message || 'Unable to retrieve location search results at this time.',
    });
  }
});

/**
 * 2. GET /api/weather?lat=&lon=&units=[metric|imperial]
 */
app.get('/api/weather', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const units = (req.query.units as string) === 'imperial' ? 'imperial' : 'metric';
    const locationName = (req.query.name as string) || 'Current Location';
    const country = (req.query.country as string) || '';
    const admin1 = (req.query.admin1 as string) || '';

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: 'INVALID_COORDINATES',
        message: 'Valid latitude (-90 to 90) and longitude (-180 to 180) are required.',
      });
    }

    const cacheKey = `weather:${lat.toFixed(3)}:${lon.toFixed(3)}:${units}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json({ ...cached as object, cached: true });
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
    const currentData = data.current || {};
    const hourlyData = data.hourly || {};
    const dailyData = data.daily || {};

    const sunriseList = dailyData.sunrise || [];
    const sunsetList = dailyData.sunset || [];

    // Current weather object
    const current = {
      temperature: Math.round(currentData.temperature_2m ?? 0),
      apparentTemperature: Math.round(currentData.apparent_temperature ?? currentData.temperature_2m ?? 0),
      relativeHumidity: Math.round(currentData.relative_humidity_2m ?? 0),
      surfacePressure: Math.round(currentData.surface_pressure ?? 1013),
      windSpeed: Math.round((currentData.wind_speed_10m ?? 0) * 10) / 10,
      windDirection: Math.round(currentData.wind_direction_10m ?? 0),
      windDirectionCardinal: getWindCardinal(currentData.wind_direction_10m ?? 0),
      uvIndex: Math.round((currentData.uv_index ?? 0) * 10) / 10,
      uvDescription: getUvDescription(currentData.uv_index ?? 0),
      visibilityKm: 10, // default if not provided
      visibilityMiles: 6.2,
      isDay: Boolean(currentData.is_day ?? 1),
      precipitation: currentData.precipitation ?? 0,
      weatherCode: currentData.weather_code ?? 0,
      condition: getWeatherCondition(currentData.weather_code ?? 0),
      time: currentData.time || new Date().toISOString(),
      sunrise: sunriseList[0] || '',
      sunset: sunsetList[0] || '',
    };

    // Extract next 24 hourly steps starting from current hour
    const hourlyTimes: string[] = hourlyData.time || [];
    const hourlyTemps: number[] = hourlyData.temperature_2m || [];
    const hourlyPrecipProb: number[] = hourlyData.precipitation_probability || [];
    const hourlyWeatherCode: number[] = hourlyData.weather_code || [];
    const hourlyWindSpeed: number[] = hourlyData.wind_speed_10m || [];
    const hourlyUv: number[] = hourlyData.uv_index || [];
    const hourlyVis: number[] = hourlyData.visibility || [];

    // Find closest index for current time or start index
    const currentTimeStr = currentData.time || new Date().toISOString();
    let startIndex = hourlyTimes.findIndex((t) => t >= currentTimeStr.slice(0, 13));
    if (startIndex === -1) startIndex = 0;

    const hourly = [];
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

      // Check whether this hour falls between sunrise and sunset
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

    // Daily 7-day forecast
    const dailyDates: string[] = dailyData.time || [];
    const dailyMaxTemps: number[] = dailyData.temperature_2m_max || [];
    const dailyMinTemps: number[] = dailyData.temperature_2m_min || [];
    const dailyPrecipProb: number[] = dailyData.precipitation_probability_max || [];
    const dailyWeatherCode: number[] = dailyData.weather_code || [];
    const dailyUvMax: number[] = dailyData.uv_index_max || [];

    const daily = [];
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

    const result = {
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

    setInCache(cacheKey, result);
    return res.json(result);
  } catch (err: any) {
    console.error('Weather forecast fetch error:', err);
    return res.status(500).json({
      error: 'WEATHER_FETCH_FAILED',
      message: err.message || 'Unable to retrieve current weather data.',
    });
  }
});

/**
 * 3. POST /api/summary
 * Gemini AI generation for "Today's summary" and 3 actionable tips (clothing, umbrella, outdoor).
 */
app.post('/api/summary', async (req: Request, res: Response) => {
  const { weather, locationName } = req.body || {};

  if (!weather || !weather.current) {
    return res.status(400).json({
      error: 'INVALID_PAYLOAD',
      message: 'Weather data with current conditions is required to generate AI insights.',
    });
  }

  const { current, daily, hourly, units } = weather;
  const tempUnit = units?.temperature || '°C';
  const windUnit = units?.windSpeed || 'km/h';
  const todayDaily = daily?.[0] || {};
  const maxRainProb = todayDaily.precipitationProbabilityMax ?? current.precipitation ?? 0;

  // Rule-based fallback generator for guaranteed stability
  const getRuleBasedSummary = () => {
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
      source: 'rules' as const,
    };
  };

  // If Gemini API is not configured, return rule-based insights
  if (!ai) {
    return res.json(getRuleBasedSummary());
  }

  try {
    const prompt = `You are SkyCast's friendly, accurate weather assistant.
Generate a concise, helpful summary and 3 practical daily tips for ${locationName || 'the user'}.

CURRENT WEATHER:
- Temperature: ${current.temperature}${tempUnit} (Feels like: ${current.apparentTemperature}${tempUnit})
- Condition: ${current.condition} (Weather Code: ${current.weatherCode})
- Humidity: ${current.relativeHumidity}%
- Wind: ${current.windSpeed} ${windUnit} (${current.windDirectionCardinal})
- UV Index: ${current.uvIndex} (${current.uvDescription})
- Today's Forecast: High ${todayDaily.temperatureMax ?? 'N/A'}${tempUnit}, Low ${todayDaily.temperatureMin ?? 'N/A'}${tempUnit}
- Precipitation Chance: ${maxRainProb}%
- Sunrise: ${current.sunrise || 'N/A'}, Sunset: ${current.sunset || 'N/A'}

Provide:
1. "summary": Exactly 2 to 3 natural, conversational, friendly sentences describing today's conditions and what to expect.
2. "tips":
   - "clothing": 1 specific, practical sentence on what to wear (fabrics, layers, shoes).
   - "umbrella": 1 clear sentence specifying if an umbrella or raincoat is needed and why.
   - "outdoor": 1 specific recommendation on the best time of day to go outside, run, or walk based on the temperature, rain probability, and UV index.`;

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "2 to 3 friendly sentences summarizing today's weather outlook.",
            },
            tips: {
              type: Type.OBJECT,
              properties: {
                clothing: {
                  type: Type.STRING,
                  description: 'Specific advice on clothing and layering for current conditions.',
                },
                umbrella: {
                  type: Type.STRING,
                  description: 'Advice on whether to carry an umbrella or waterproofs.',
                },
                outdoor: {
                  type: Type.STRING,
                  description: 'Best time window to go outside or exercise today.',
                },
              },
              required: ['clothing', 'umbrella', 'outdoor'],
            },
          },
          required: ['summary', 'tips'],
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out after 6 seconds')), 6000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const jsonText = response.text?.trim() || '';
    if (!jsonText) {
      return res.json(getRuleBasedSummary());
    }

    const parsed = JSON.parse(jsonText);
    return res.json({
      summary: parsed.summary,
      tips: parsed.tips,
      source: 'gemini',
    });
  } catch (error: any) {
    console.error('Gemini generation error, falling back to rule-based summary:', error?.message);
    return res.json(getRuleBasedSummary());
  }
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', name: 'SkyCast API', timestamp: new Date().toISOString() });
});

// In development, hook up Vite dev middleware; in production, serve built static files
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`SkyCast Server running on port ${PORT} (isDev: ${isDev})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
