import { GoogleGenAI, Type } from '@google/genai';
import { generateHeuristicSummary } from '../src/utils/weatherData';

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

let quotaExhaustedUntil = 0;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed.' });
  }

  const { weather, locationName } = req.body || {};
  if (!weather || !weather.current) {
    return res.status(400).json({
      error: 'INVALID_PAYLOAD',
      message: 'Weather data with current conditions is required to generate AI insights.',
    });
  }

  if (!ai || Date.now() < quotaExhaustedUntil) {
    return res.status(200).json(generateHeuristicSummary(weather, locationName));
  }

  try {
    const { current, daily, units } = weather;
    const tempUnit = units?.temperature || '°C';
    const windUnit = units?.windSpeed || 'km/h';
    const todayDaily = daily?.[0] || {};
    const maxRainProb = todayDaily.precipitationProbabilityMax ?? current.precipitation ?? 0;

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
      return res.status(200).json(generateHeuristicSummary(weather, locationName));
    }

    const parsed = JSON.parse(jsonText);
    return res.status(200).json({
      summary: parsed.summary,
      tips: parsed.tips,
      source: 'gemini',
    });
  } catch (error: any) {
    const errorStr = (error?.message || '').toLowerCase();
    if (
      error?.status === 'RESOURCE_EXHAUSTED' ||
      errorStr.includes('429') ||
      errorStr.includes('quota') ||
      errorStr.includes('resource_exhausted')
    ) {
      quotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
    }
    return res.status(200).json(generateHeuristicSummary(weather, locationName));
  }
}
