export default async function handler(req: any, res: any) {
  try {
    const query = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'INVALID_QUERY',
        message: 'City search query must be at least 2 characters long.',
      });
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

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    return res.status(200).json({ results });
  } catch (err: any) {
    console.error('Geocoding error:', err);
    return res.status(500).json({
      error: 'GEOCODING_FAILED',
      message: err.message || 'Unable to retrieve location search results at this time.',
    });
  }
}
