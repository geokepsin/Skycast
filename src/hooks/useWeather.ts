import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationInfo, WeatherData, UnitSystem, AiSummaryResponse } from '../types/weather';
import { fetchWeather, fetchAiSummary } from '../services/weatherApi';

const LAST_LOCATION_KEY = 'skycast_last_location';
const UNITS_KEY = 'skycast_unit_system';

const DEFAULT_LOCATION: LocationInfo = {
  name: 'New York',
  country: 'United States',
  admin1: 'New York',
  latitude: 40.7128,
  longitude: -74.006,
};

export function useWeather() {
  const [units, setUnits] = useState<UnitSystem>(() => {
    try {
      const saved = localStorage.getItem(UNITS_KEY);
      if (saved === 'metric' || saved === 'imperial') return saved;
    } catch (e) {
      console.warn('Error reading unit system from localStorage:', e);
    }
    return 'metric';
  });

  const [location, setLocation] = useState<LocationInfo>(() => {
    try {
      const saved = localStorage.getItem(LAST_LOCATION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name && typeof parsed.latitude === 'number') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading last location from localStorage:', e);
    }
    return DEFAULT_LOCATION;
  });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [aiSummary, setAiSummary] = useState<AiSummaryResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const aiAbortControllerRef = useRef<AbortController | null>(null);

  // Save units
  useEffect(() => {
    try {
      localStorage.setItem(UNITS_KEY, units);
    } catch (e) {
      console.warn('Error saving units to localStorage:', e);
    }
  }, [units]);

  // Save last selected location
  useEffect(() => {
    try {
      localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location));
    } catch (e) {
      console.warn('Error saving location to localStorage:', e);
    }
  }, [location]);

  // Fetch AI summary for a given weather payload
  const loadAiSummary = useCallback(async (weatherData: WeatherData, locName: string) => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
    }
    aiAbortControllerRef.current = new AbortController();

    setAiLoading(true);
    setAiError(null);

    try {
      const result = await fetchAiSummary(
        weatherData,
        locName,
        aiAbortControllerRef.current.signal
      );
      setAiSummary(result);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to load AI summary:', err);
        setAiError(err.message || 'Unable to generate AI weather summary.');
      }
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Fetch weather data for the current location & units
  const loadWeather = useCallback(
    async (locToFetch: LocationInfo, unitsToFetch: UnitSystem) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const data = await fetchWeather(
          locToFetch.latitude,
          locToFetch.longitude,
          unitsToFetch,
          locToFetch.name,
          locToFetch.country,
          locToFetch.admin1,
          abortControllerRef.current.signal
        );

        setWeather(data);
        // Automatically fetch AI summary when fresh weather data arrives
        loadAiSummary(data, locToFetch.name);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch weather:', err);
          setError(err.message || 'Failed to fetch weather data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    },
    [loadAiSummary]
  );

  // Initial load or when location or units change
  useEffect(() => {
    loadWeather(location, units);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort();
      }
    };
  }, [location, units, loadWeather]);

  const selectLocation = useCallback((newLoc: LocationInfo) => {
    setLocation(newLoc);
  }, []);

  const toggleUnits = useCallback(() => {
    setUnits((prev) => (prev === 'metric' ? 'imperial' : 'metric'));
  }, []);

  const refreshWeather = useCallback(() => {
    loadWeather(location, units);
  }, [loadWeather, location, units]);

  const refreshAiSummary = useCallback(() => {
    if (weather) {
      loadAiSummary(weather, location.name);
    }
  }, [weather, location.name, loadAiSummary]);

  return {
    location,
    weather,
    loading,
    error,
    units,
    selectLocation,
    toggleUnits,
    refreshWeather,
    aiSummary,
    aiLoading,
    aiError,
    refreshAiSummary,
  };
}
