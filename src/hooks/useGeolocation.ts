import { useState, useCallback } from 'react';

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

export function useGeolocation() {
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const getCurrentLocation = useCallback((): Promise<GeolocationCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser.';
        setGeoError(msg);
        reject(new Error(msg));
        return;
      }

      setIsLocating(true);
      setGeoError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          setIsLocating(false);
          let message = 'Unable to determine your current location.';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Location access was denied. Please enable location permissions or search for a city.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'Location information is currently unavailable.';
          } else if (error.code === error.TIMEOUT) {
            message = 'The request to obtain your location timed out.';
          }
          setGeoError(message);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, []);

  const clearGeoError = useCallback(() => {
    setGeoError(null);
  }, []);

  return {
    getCurrentLocation,
    isLocating,
    geoError,
    clearGeoError,
  };
}
