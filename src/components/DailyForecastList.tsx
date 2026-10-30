import React from 'react';
import { Droplets, Sun, Calendar } from 'lucide-react';
import { DailyForecast } from '../types/weather';
import { WeatherIcon } from './WeatherIcons';

interface DailyForecastListProps {
  daily: DailyForecast[];
  tempUnit: string;
}

export const DailyForecastList: React.FC<DailyForecastListProps> = ({
  daily,
  tempUnit,
}) => {
  if (!daily || daily.length === 0) return null;

  // Determine global min and max temperatures across the 7-day period for the range bar
  const allMins = daily.map((d) => d.temperatureMin);
  const allMaxs = daily.map((d) => d.temperatureMax);
  const globalMin = Math.min(...allMins);
  const globalMax = Math.max(...allMaxs);
  const globalSpan = Math.max(1, globalMax - globalMin);

  return (
    <section className="w-full rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/15 p-6 sm:p-7 shadow-xl transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-400" />
          <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight">
            7-Day Outlook
          </h2>
        </div>
        <span className="text-xs text-slate-300 font-medium">
          Extended Forecast
        </span>
      </div>

      {/* Days list */}
      <div className="divide-y divide-white/5 mt-2">
        {daily.map((day) => {
          // Calculate offset and width for the temperature bar
          const leftPercent = ((day.temperatureMin - globalMin) / globalSpan) * 100;
          const widthPercent = ((day.temperatureMax - day.temperatureMin) / globalSpan) * 100;

          return (
            <div
              key={day.date}
              className="py-3.5 px-2 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition-colors"
            >
              {/* Day Name & Date */}
              <div className="w-full sm:w-36 flex items-center justify-between sm:justify-start gap-3">
                <span className="text-sm font-semibold text-white">
                  {day.dayOfWeek}
                </span>
                <span className="text-xs text-slate-400">
                  {day.formattedDate}
                </span>
              </div>

              {/* Weather Icon & Condition */}
              <div className="flex items-center gap-3 sm:w-48">
                <WeatherIcon
                  weatherCode={day.weatherCode}
                  isDay={true}
                  size="sm"
                  className="shrink-0"
                />
                <span className="text-xs sm:text-sm text-slate-200 truncate">
                  {day.condition}
                </span>
              </div>

              {/* Rain Probability & UV */}
              <div className="flex items-center gap-4 sm:w-32">
                <div className="flex items-center gap-1 text-xs text-sky-300">
                  <Droplets className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-mono-numbers">{day.precipitationProbabilityMax}%</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-300">
                  <Sun className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-mono-numbers">UV {Math.round(day.uvIndexMax)}</span>
                </div>
              </div>

              {/* Temperature Range Bar */}
              <div className="flex items-center gap-3 w-full sm:w-60">
                <span className="text-xs font-medium text-slate-300 w-8 text-right font-mono-numbers">
                  {day.temperatureMin}°
                </span>

                {/* Relative visual bar */}
                <div className="relative flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-amber-300 to-rose-400 shadow-sm"
                    style={{
                      left: `${Math.max(0, leftPercent)}%`,
                      width: `${Math.max(10, widthPercent)}%`,
                    }}
                  />
                </div>

                <span className="text-xs font-bold text-white w-8 font-mono-numbers">
                  {day.temperatureMax}°
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
