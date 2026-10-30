import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Droplets, Wind } from 'lucide-react';
import { HourlyForecast } from '../types/weather';
import { WeatherIcon } from './WeatherIcons';

interface HourlyForecastStripProps {
  hourly: HourlyForecast[];
  tempUnit: string;
  windUnit: string;
}

export const HourlyForecastStrip: React.FC<HourlyForecastStripProps> = ({
  hourly,
  tempUnit,
  windUnit,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!hourly || hourly.length === 0) return null;

  // Calculate bounds for SVG Chart
  const temps = hourly.map((h) => h.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = Math.max(1, maxTemp - minTemp);

  // SVG Chart Geometry
  const chartHeight = 70;
  const pointWidth = 64; // width per hourly block
  const totalChartWidth = pointWidth * (hourly.length - 1);

  // Generate SVG path points
  const points = hourly.map((h, index) => {
    const x = index * pointWidth;
    // inverted y because SVG origin is top-left
    const y = chartHeight - ((h.temperature - minTemp) / tempRange) * (chartHeight - 20) - 10;
    return { x, y, temp: h.temperature, item: h, index };
  });

  // Construct smooth curve path with cubic Bézier interpolation
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  // Area path (closed at the bottom)
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight + 10} L ${points[0].x} ${chartHeight + 10} Z`;

  return (
    <section className="w-full rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/15 p-6 sm:p-7 shadow-xl relative overflow-hidden transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight">
            Hourly Forecast
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            24-hour continuous outlook & temperature trend
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 hover:text-white transition-colors"
            title="Scroll left"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 hover:text-white transition-colors"
            title="Scroll right"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontally scrollable container containing both SVG Chart and Cards */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto custom-scrollbar mt-4 pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        <div style={{ minWidth: `${totalChartWidth + 64}px` }} className="pt-2 px-4">
          {/* Temperature Trend SVG Chart */}
          <div className="relative mb-3 h-[80px]">
            <svg
              viewBox={`-20 0 ${totalChartWidth + 40} ${chartHeight + 15}`}
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="hourlyTempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area under curve */}
              <path d={areaD} fill="url(#hourlyTempGradient)" />

              {/* Curve Stroke */}
              <path
                d={pathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points & Labels */}
              {points.map((pt) => {
                const isHovered = hoveredIndex === pt.index;
                const isPeak = pt.temp === maxTemp;
                const isTrough = pt.temp === minTemp;

                return (
                  <g key={`point-${pt.index}`}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5.5 : isPeak || isTrough ? 4.5 : 3}
                      fill={isPeak ? '#f59e0b' : isTrough ? '#06b6d4' : '#38bdf8'}
                      stroke="#0f172a"
                      strokeWidth="2"
                      className="cursor-pointer transition-all"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 8}
                      textAnchor="middle"
                      className={`text-[11px] font-mono-numbers fill-white font-medium select-none pointer-events-none transition-opacity ${
                        isHovered || isPeak || isTrough || pt.index % 3 === 0
                          ? 'opacity-100'
                          : 'opacity-40 sm:opacity-80'
                      }`}
                    >
                      {pt.temp}°
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Hourly items strip */}
          <div className="grid" style={{ gridTemplateColumns: `repeat(${hourly.length}, ${pointWidth}px)` }}>
            {hourly.map((hour, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <div
                  key={hour.time}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`flex flex-col items-center p-2 rounded-2xl transition-all cursor-pointer select-none text-center ${
                    isHovered
                      ? 'bg-white/15 border border-sky-400/40 scale-105 shadow-lg'
                      : 'hover:bg-white/10'
                  }`}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <span className="text-xs font-semibold text-slate-200">
                    {hour.displayTime}
                  </span>

                  <div className="my-2">
                    <WeatherIcon
                      weatherCode={hour.weatherCode}
                      isDay={hour.isDay}
                      size="sm"
                      className="drop-shadow-sm"
                    />
                  </div>

                  <span className="text-sm font-bold text-white font-mono-numbers">
                    {hour.temperature}{tempUnit}
                  </span>

                  {/* Precipitation Probability */}
                  <div className="flex items-center gap-0.5 mt-1.5 text-[10px] text-sky-300 font-medium">
                    <Droplets className="w-2.5 h-2.5 shrink-0" />
                    <span>{hour.precipitationProbability}%</span>
                  </div>

                  {/* Wind speed */}
                  <div className="flex items-center gap-0.5 mt-0.5 text-[10px] text-slate-400">
                    <Wind className="w-2.5 h-2.5 shrink-0" />
                    <span className="font-mono-numbers">{Math.round(hour.windSpeed)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
