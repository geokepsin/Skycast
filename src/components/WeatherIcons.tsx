import React from 'react';

interface WeatherIconProps {
  weatherCode: number;
  isDay?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  weatherCode,
  isDay = true,
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };
  const sizeClass = sizeMap[size];

  // Thunderstorm (95, 96, 99)
  if (weatherCode >= 95) {
    return (
      <svg
        className={`${sizeClass} ${className}`}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Thunderstorm"
      >
        <path
          className="animate-weather-float"
          d="M18 36a10 10 0 0 1 9-14 13 13 0 0 1 24 4 9 9 0 0 1-1 18H20a8 8 0 0 1-2-8Z"
          fill="#475569"
        />
        <path
          d="M32 36l-5 12h7l-3 12 11-16h-7l5-8h-8Z"
          fill="#FACC15"
          className="animate-weather-pulse"
        />
        <circle cx="20" cy="52" r="1.5" fill="#38BDF8" className="animate-rain-drip" />
        <circle cx="44" cy="54" r="1.5" fill="#38BDF8" className="animate-rain-drip" style={{ animationDelay: '0.4s' }} />
      </svg>
    );
  }

  // Snow (71-77, 85, 86)
  if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) {
    return (
      <svg
        className={`${sizeClass} ${className}`}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Snow"
      >
        <path
          className="animate-weather-float"
          d="M18 32a10 10 0 0 1 9-14 13 13 0 0 1 24 4 9 9 0 0 1-1 18H20a8 8 0 0 1-2-8Z"
          fill="#94A3B8"
        />
        {/* Snowflakes */}
        <g fill="#E0F2FE">
          <circle cx="22" cy="48" r="2" className="animate-weather-pulse" />
          <circle cx="32" cy="52" r="2.5" className="animate-weather-pulse" style={{ animationDelay: '0.3s' }} />
          <circle cx="42" cy="48" r="2" className="animate-weather-pulse" style={{ animationDelay: '0.6s' }} />
        </g>
      </svg>
    );
  }

  // Rain / Showers / Freezing Rain (51-67, 80-82)
  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
    return (
      <svg
        className={`${sizeClass} ${className}`}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Rain"
      >
        <path
          className="animate-weather-float"
          d="M18 30a10 10 0 0 1 9-14 13 13 0 0 1 24 4 9 9 0 0 1-1 18H20a8 8 0 0 1-2-8Z"
          fill="#64748B"
        />
        {/* Rain drops */}
        <g stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round">
          <line x1="22" y1="42" x2="19" y2="52" className="animate-rain-drip" />
          <line x1="32" y1="44" x2="29" y2="55" className="animate-rain-drip" style={{ animationDelay: '0.3s' }} />
          <line x1="42" y1="42" x2="39" y2="53" className="animate-rain-drip" style={{ animationDelay: '0.6s' }} />
        </g>
      </svg>
    );
  }

  // Fog / Mist (45, 48)
  if (weatherCode === 45 || weatherCode === 48) {
    return (
      <svg
        className={`${sizeClass} ${className}`}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Fog"
      >
        <g stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round">
          <line x1="16" y1="24" x2="48" y2="24" className="animate-weather-float" />
          <line x1="12" y1="32" x2="52" y2="32" className="animate-weather-float" style={{ animationDelay: '0.5s' }} />
          <line x1="18" y1="40" x2="46" y2="40" className="animate-weather-float" style={{ animationDelay: '1s' }} />
          <line x1="22" y1="48" x2="42" y2="48" className="animate-weather-float" style={{ animationDelay: '0.2s' }} />
        </g>
      </svg>
    );
  }

  // Overcast (3)
  if (weatherCode === 3) {
    return (
      <svg
        className={`${sizeClass} ${className}`}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Overcast"
      >
        {/* Back cloud */}
        <path
          d="M26 28a8 8 0 0 1 7-11 11 11 0 0 1 20 3 8 8 0 0 1-1 15h-24a7 7 0 0 1-2-7Z"
          fill="#475569"
          className="animate-weather-float"
          style={{ animationDelay: '1s' }}
        />
        {/* Front cloud */}
        <path
          d="M16 38a9 9 0 0 1 8-13 12 12 0 0 1 22 4 8 8 0 0 1-1 17H18a8 8 0 0 1-2-8Z"
          fill="#94A3B8"
          className="animate-weather-float"
        />
      </svg>
    );
  }

  // Partly Cloudy (1, 2)
  if (weatherCode === 1 || weatherCode === 2) {
    if (isDay) {
      return (
        <svg
          className={`${sizeClass} ${className}`}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Partly Cloudy"
        >
          {/* Sun */}
          <g className="animate-weather-spin" style={{ transformOrigin: '24px 24px' }}>
            <circle cx="24" cy="24" r="10" fill="#FBBF24" />
            <g stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round">
              <line x1="24" y1="8" x2="24" y2="11" />
              <line x1="24" y1="37" x2="24" y2="40" />
              <line x1="8" y1="24" x2="11" y2="24" />
              <line x1="37" y1="24" x2="40" y2="24" />
              <line x1="13" y1="13" x2="15" y2="15" />
              <line x1="33" y1="33" x2="35" y2="35" />
              <line x1="13" y1="35" x2="15" y2="33" />
              <line x1="33" y1="15" x2="35" y2="13" />
            </g>
          </g>
          {/* Cloud in front */}
          <path
            className="animate-weather-float"
            d="M20 42a9 9 0 0 1 8-13 12 12 0 0 1 22 4 8 8 0 0 1-1 17H22a8 8 0 0 1-2-8Z"
            fill="#CBD5E1"
          />
        </svg>
      );
    } else {
      // Partly Cloudy Night
      return (
        <svg
          className={`${sizeClass} ${className}`}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Partly Cloudy Night"
        >
          {/* Crescent Moon */}
          <path
            d="M32 14a12 12 0 1 0 14 16 14 14 0 0 1-14-16Z"
            fill="#FDE047"
            className="animate-weather-pulse"
          />
          {/* Cloud in front */}
          <path
            className="animate-weather-float"
            d="M18 42a9 9 0 0 1 8-13 12 12 0 0 1 22 4 8 8 0 0 1-1 17H20a8 8 0 0 1-2-8Z"
            fill="#64748B"
          />
        </svg>
      );
    }
  }

  // Clear Sky (0) - Night
  if (!isDay) {
    return (
      <svg
        className={`${sizeClass} ${className}`}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Clear Night"
      >
        <path
          d="M36 12a18 18 0 1 0 18 22 20 20 0 0 1-18-22Z"
          fill="#FDE047"
          className="animate-weather-pulse"
        />
        {/* Twinkling stars */}
        <polygon
          points="20,18 22,23 27,24 23,28 24,33 19,30 15,33 16,28 12,24 17,23"
          fill="#FFFFFF"
          className="animate-weather-pulse"
          style={{ transform: 'scale(0.5) translate(20px, 10px)', animationDelay: '0.4s' }}
        />
        <circle cx="48" cy="18" r="1.5" fill="#FFFFFF" className="animate-weather-pulse" style={{ animationDelay: '0.9s' }} />
        <circle cx="16" cy="46" r="1.5" fill="#FFFFFF" className="animate-weather-pulse" style={{ animationDelay: '0.2s' }} />
      </svg>
    );
  }

  // Clear Sky (0) - Day
  return (
    <svg
      className={`${sizeClass} ${className}`}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Clear Sky Day"
    >
      <circle cx="32" cy="32" r="14" fill="#FBBF24" className="animate-weather-pulse" />
      <g
        className="animate-weather-spin"
        style={{ transformOrigin: '32px 32px' }}
        stroke="#F59E0B"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <line x1="32" y1="8" x2="32" y2="13" />
        <line x1="32" y1="51" x2="32" y2="56" />
        <line x1="8" y1="32" x2="13" y2="32" />
        <line x1="51" y1="32" x2="56" y2="32" />
        <line x1="15" y1="15" x2="19" y2="19" />
        <line x1="45" y1="45" x2="49" y2="49" />
        <line x1="15" y1="49" x2="19" y2="45" />
        <line x1="45" y1="19" x2="49" y2="15" />
      </g>
    </svg>
  );
};
