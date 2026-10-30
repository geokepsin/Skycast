import { useState, useEffect, useCallback } from 'react';
import { LocationInfo } from '../types/weather';

const STORAGE_KEY = 'skycast_favorite_locations';

export const DEFAULT_FAVORITES: LocationInfo[] = [
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    latitude: 35.6762,
    longitude: 139.6503,
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    latitude: 51.5074,
    longitude: -0.1278,
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'United States',
    admin1: 'New York',
    countryCode: 'US',
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    countryCode: 'FR',
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    countryCode: 'AU',
    latitude: -33.8688,
    longitude: 151.2093,
  },
];

export function useFavorites() {
  const [favorites, setFavorites] = useState<LocationInfo[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading favorites from localStorage:', e);
    }
    return DEFAULT_FAVORITES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Error saving favorites to localStorage:', e);
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (loc?: LocationInfo | null): boolean => {
      if (!loc) return false;
      return favorites.some(
        (f) =>
          (f.name.toLowerCase() === loc.name.toLowerCase() && f.country === loc.country) ||
          (Math.abs(f.latitude - loc.latitude) < 0.05 && Math.abs(f.longitude - loc.longitude) < 0.05)
      );
    },
    [favorites]
  );

  const addFavorite = useCallback((loc: LocationInfo) => {
    setFavorites((prev) => {
      const exists = prev.some(
        (f) =>
          (f.name.toLowerCase() === loc.name.toLowerCase() && f.country === loc.country) ||
          (Math.abs(f.latitude - loc.latitude) < 0.05 && Math.abs(f.longitude - loc.longitude) < 0.05)
      );
      if (exists) return prev;
      return [
        {
          ...loc,
          id: loc.id || `${loc.name}-${loc.latitude.toFixed(2)}-${loc.longitude.toFixed(2)}`,
        },
        ...prev,
      ];
    });
  }, []);

  const removeFavorite = useCallback((loc: LocationInfo) => {
    setFavorites((prev) =>
      prev.filter(
        (f) =>
          !(
            (f.name.toLowerCase() === loc.name.toLowerCase() && f.country === loc.country) ||
            (Math.abs(f.latitude - loc.latitude) < 0.05 && Math.abs(f.longitude - loc.longitude) < 0.05)
          )
      )
    );
  }, []);

  const toggleFavorite = useCallback(
    (loc: LocationInfo) => {
      if (isFavorite(loc)) {
        removeFavorite(loc);
      } else {
        addFavorite(loc);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };
}
