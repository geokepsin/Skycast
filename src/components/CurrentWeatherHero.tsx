import React from 'react';
import {
  Droplets,
  Wind,
  Compass,
  Sun,
  Sunset,
  Eye,
  Gauge,
  Star,
  MapPin,
  Calendar,
} from 'lucide-react';
import { WeatherData } from '../types/weather';
import { WeatherIcon } from './WeatherIcons';

interface CurrentWeatherHeroProps {
  weather: WeatherData;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const CurrentWeatherHero: React.FC<CurrentWeatherHeroProps> = ({
  weather,
  isFavorite,
  onToggleFavorite,
}) => {
  const { location, current, daily, units } = weather;
  const todayForecast = daily[0] || { temperatureMax: current.temperature, temperatureMin: current.temperature };

  // Format local date and time
  const now = new Date();
  const formattedDateTime = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Format sunrise / sunset times
  const formatSunTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return timeStr.slice(11, 16);
    }
  };

  // UV index color helper
  const getUvBadgeColor = (uv: number) => {
    if (uv < 3) return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
    if (uv < 6) return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
    if (uv < 8) return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
    if (uv < 11) return 'bg-rose-500/20 text-rose-300 border-rose-400/30';
    return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
  };

  return (
    <section className="w-full rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/15 p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all">
      {/* Decorative subtle ambient backdrop glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header row: Location info & Bookmark */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-400 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
              {location.name}
              {location.admin1 && (
                <span className="text-lg sm:text-xl font-normal text-slate-300 ml-2">
                  {location.admin1}
                </span>
              )}
            </h1>
            {location.country && (
              <span className="text-xs uppercase tracking-wider font-semibold text-sky-300 px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/30">
                {location.country}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formattedDateTime}
            </span>
            <span aria-hidden="true">·</span>
            <span>Local Timezone: {location.timezone || 'Local'}</span>
          </div>
        </div>

        <button
          onClick={onToggleFavorite}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
            isFavorite
              ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 hover:bg-amber-400/30'
              : 'bg-white/10 border-white/15 text-slate-200 hover:bg-white/20 hover:text-white'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>{isFavorite ? 'Saved Location' : 'Save Location'}</span>
        </button>
      </div>

      {/* Main Temperature & Visuals Split */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 items-center">
        {/* Left: Huge Temperature + Condition */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="flex items-center gap-6">
            <WeatherIcon
              weatherCode={current.weatherCode}
              isDay={current.isDay}
              size="xl"
              className="drop-shadow-lg"
            />
            <div>
              <div className="flex items-baseline">
                <span className="text-6xl sm:text-7xl font-display font-extrabold tracking-tighter text-white font-mono-numbers">
                  {current.temperature}
                </span>
                <span className="text-3xl sm:text-4xl font-light text-sky-300 ml-1">
                  {units.temperature}
                </span>
              </div>
              <p className="text-lg font-medium text-slate-200 mt-0.5">
                {current.condition}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-300 mt-4">
            <p>
              Feels like <span className="font-semibold text-white font-mono-numbers">{current.apparentTemperature}{units.temperature}</span>
            </p>
            <span aria-hidden="true" className="text-slate-500">|</span>
            <p className="flex items-center gap-2">
              <span>H: <strong className="text-white font-mono-numbers">{todayForecast.temperatureMax}{units.temperature}</strong></span>
              <span>L: <strong className="text-white font-mono-numbers">{todayForecast.temperatureMin}{units.temperature}</strong></span>
            </p>
          </div>
        </div>

        {/* Right: Atmospheric Conditions Grid (6 Cards) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {/* 1. Humidity */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Humidity</span>
              <Droplets className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono-numbers text-white">
                {current.relativeHumidity}%
              </span>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, current.relativeHumidity))}%` }}
                />
              </div>
            </div>
          </div>

          {/* 2. Wind */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Wind</span>
              <Wind className="w-4 h-4 text-teal-400" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono-numbers text-white">
                  {current.windSpeed}
                </span>
                <span className="text-xs text-slate-300">{units.windSpeed}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
                <Compass
                  className="w-3.5 h-3.5 text-teal-300 transition-transform duration-700"
                  style={{ transform: `rotate(${current.windDirection}deg)` }}
                />
                <span>{current.windDirectionCardinal} ({current.windDirection}°)</span>
              </div>
            </div>
          </div>

          {/* 3. UV Index */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>UV Index</span>
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono-numbers text-white">
                  {current.uvIndex}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getUvBadgeColor(current.uvIndex)}`}>
                  {current.uvDescription}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (current.uvIndex / 11) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4. Pressure */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Pressure</span>
              <Gauge className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono-numbers text-white">
                  {current.surfacePressure}
                </span>
                <span className="text-xs text-slate-300">{units.pressure}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Standard Atmospheric</p>
            </div>
          </div>

          {/* 5. Visibility */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Visibility</span>
              <Eye className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono-numbers text-white">
                  {units.visibility === 'mi' ? current.visibilityMiles : current.visibilityKm}
                </span>
                <span className="text-xs text-slate-300">{units.visibility}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Clear Horizon</p>
            </div>
          </div>

          {/* 6. Sunrise / Sunset */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Sun Cycle</span>
              <Sunset className="w-4 h-4 text-orange-400" />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Rise:</span>
                <span className="font-semibold text-white font-mono-numbers">
                  {formatSunTime(current.sunrise)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Set:</span>
                <span className="font-semibold text-white font-mono-numbers">
                  {formatSunTime(current.sunset)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
