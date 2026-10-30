import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { FavoritesBar } from './components/FavoritesBar';
import { CurrentWeatherHero } from './components/CurrentWeatherHero';
import { AiSummaryCard } from './components/AiSummaryCard';
import { HourlyForecastStrip } from './components/HourlyForecastStrip';
import { DailyForecastList } from './components/DailyForecastList';
import { WeatherSkeleton } from './components/WeatherSkeleton';
import { ErrorDisplay } from './components/ErrorDisplay';
import { useWeather } from './hooks/useWeather';
import { useFavorites, DEFAULT_FAVORITES } from './hooks/useFavorites';
import { useGeolocation } from './hooks/useGeolocation';
import { getWeatherTheme } from './utils/theme';
import { AlertCircle, X, ExternalLink } from 'lucide-react';

export default function App() {
  const {
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
  } = useWeather();

  const {
    favorites,
    isFavorite,
    removeFavorite,
    toggleFavorite,
  } = useFavorites();

  const {
    getCurrentLocation,
    isLocating,
    geoError,
    clearGeoError,
  } = useGeolocation();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Handle browser geolocation request
  const handleUseMyLocation = async () => {
    try {
      clearGeoError();
      const coords = await getCurrentLocation();
      selectLocation({
        name: 'My Location',
        country: '',
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setToastMessage('GPS Location detected successfully');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      console.warn('Geolocation failed:', err.message);
    }
  };

  // Determine current atmospheric theme based on current condition and isDay
  const weatherCode = weather?.current?.weatherCode ?? 0;
  const isDay = weather?.current?.isDay ?? true;
  const theme = getWeatherTheme(weatherCode, isDay);

  const isCurrentFav = isFavorite(location);

  return (
    <div
      className={`min-h-screen bg-gradient-to-b ${theme.background} text-white font-sans transition-colors duration-1000 flex flex-col`}
    >
      {/* Top Navigation */}
      <Navbar
        currentLocation={location}
        units={units}
        onSelectLocation={selectLocation}
        onToggleUnits={toggleUnits}
        onRefresh={refreshWeather}
        onUseMyLocation={handleUseMyLocation}
        isLocating={isLocating}
        isLoadingWeather={loading}
      />

      {/* Geolocation or Notification Toast */}
      {(geoError || toastMessage) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs sm:text-sm shadow-lg ${
              geoError
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{geoError || toastMessage}</span>
            </div>
            <button
              onClick={() => {
                if (geoError) clearGeoError();
                if (toastMessage) setToastMessage(null);
              }}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Favorites Quick-Switch Bar */}
        <FavoritesBar
          favorites={favorites}
          currentLocation={location}
          onSelectFavorite={selectLocation}
          onRemoveFavorite={removeFavorite}
          onToggleCurrentFavorite={() => toggleFavorite(location)}
          isCurrentFavorite={isCurrentFav}
        />

        {/* Loading / Error / Data View */}
        {loading && !weather ? (
          <WeatherSkeleton />
        ) : error && !weather ? (
          <ErrorDisplay
            message={error}
            onRetry={refreshWeather}
            onSelectDefaultCity={() => selectLocation(DEFAULT_FAVORITES[2])}
          />
        ) : weather ? (
          <div className="space-y-6">
            {/* 1. Hero: Current Conditions & Atmospheric Grid */}
            <CurrentWeatherHero
              weather={weather}
              isFavorite={isCurrentFav}
              onToggleFavorite={() => toggleFavorite(location)}
            />

            {/* 2. AI Weather Summary & Personalized Practical Tips */}
            <AiSummaryCard
              summaryData={aiSummary}
              isLoading={aiLoading}
              error={aiError}
              onRefresh={refreshAiSummary}
              locationName={location.name}
            />

            {/* 3. Hourly Forecast (24h) with Temperature Curve */}
            <HourlyForecastStrip
              hourly={weather.hourly}
              tempUnit={weather.units.temperature}
              windUnit={weather.units.windSpeed}
            />

            {/* 4. 7-Day Extended Forecast with Temperature Range Bars */}
            <DailyForecastList
              daily={weather.daily}
              tempUnit={weather.units.temperature}
            />
          </div>
        ) : null}
      </main>

      {/* Clean Footer */}
      <footer className="w-full border-t border-white/10 bg-slate-950/60 backdrop-blur-md py-6 px-4 sm:px-6 lg:px-8 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-slate-200">SkyCast</span>
            <span>· Live Global Weather Intelligence</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Powered by Open-Meteo & Google Gemini</span>
            <span aria-hidden="true">·</span>
            <span>Refreshed 10-min cache</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
