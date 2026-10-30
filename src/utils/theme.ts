/**
 * Dynamic theming and atmospheric styling based on weather conditions and time of day.
 */

export interface WeatherTheme {
  background: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  mutedText: string;
  accent: string;
  chartColor: string;
  chartGradientFrom: string;
  chartGradientTo: string;
  isDarkCondition: boolean;
}

export function getWeatherTheme(weatherCode: number, isDay: boolean): WeatherTheme {
  // Night theme for any condition if not daylight
  if (!isDay) {
    if (weatherCode >= 95) {
      // Night Thunderstorm
      return {
        background: 'from-slate-950 via-indigo-950 to-purple-950',
        cardBg: 'bg-slate-900/50 backdrop-blur-xl',
        cardBorder: 'border-purple-500/20',
        textColor: 'text-slate-100',
        mutedText: 'text-purple-200/70',
        accent: 'text-amber-400',
        chartColor: '#c084fc',
        chartGradientFrom: 'rgba(192, 132, 252, 0.4)',
        chartGradientTo: 'rgba(192, 132, 252, 0.0)',
        isDarkCondition: true,
      };
    }
    // General Clear / Partly Cloudy Night
    return {
      background: 'from-slate-950 via-slate-900 to-indigo-950',
      cardBg: 'bg-slate-900/60 backdrop-blur-xl',
      cardBorder: 'border-slate-800/80',
      textColor: 'text-slate-100',
      mutedText: 'text-slate-400',
      accent: 'text-sky-400',
      chartColor: '#38bdf8',
      chartGradientFrom: 'rgba(56, 189, 248, 0.4)',
      chartGradientTo: 'rgba(56, 189, 248, 0.0)',
      isDarkCondition: true,
    };
  }

  // Daytime conditions:
  // Thunderstorm (95, 96, 99)
  if (weatherCode >= 95) {
    return {
      background: 'from-slate-900 via-indigo-950 to-slate-800',
      cardBg: 'bg-slate-900/60 backdrop-blur-xl',
      cardBorder: 'border-slate-700/60',
      textColor: 'text-slate-100',
      mutedText: 'text-slate-300',
      accent: 'text-amber-400',
      chartColor: '#fbbf24',
      chartGradientFrom: 'rgba(251, 191, 36, 0.4)',
      chartGradientTo: 'rgba(251, 191, 36, 0.0)',
      isDarkCondition: true,
    };
  }

  // Rain / Drizzle (51 - 67, 80 - 82)
  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
    return {
      background: 'from-slate-800 via-sky-950 to-slate-900',
      cardBg: 'bg-slate-900/60 backdrop-blur-xl',
      cardBorder: 'border-sky-800/40',
      textColor: 'text-slate-100',
      mutedText: 'text-sky-200/70',
      accent: 'text-sky-400',
      chartColor: '#38bdf8',
      chartGradientFrom: 'rgba(56, 189, 248, 0.4)',
      chartGradientTo: 'rgba(56, 189, 248, 0.0)',
      isDarkCondition: true,
    };
  }

  // Snow (71 - 77, 85, 86)
  if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) {
    return {
      background: 'from-slate-700 via-cyan-900 to-slate-800',
      cardBg: 'bg-slate-900/50 backdrop-blur-xl',
      cardBorder: 'border-cyan-500/20',
      textColor: 'text-slate-100',
      mutedText: 'text-cyan-100/70',
      accent: 'text-cyan-300',
      chartColor: '#67e8f9',
      chartGradientFrom: 'rgba(103, 232, 249, 0.4)',
      chartGradientTo: 'rgba(103, 232, 249, 0.0)',
      isDarkCondition: true,
    };
  }

  // Fog (45, 48)
  if (weatherCode === 45 || weatherCode === 48) {
    return {
      background: 'from-slate-700 via-slate-800 to-stone-900',
      cardBg: 'bg-slate-900/50 backdrop-blur-xl',
      cardBorder: 'border-slate-700/50',
      textColor: 'text-slate-100',
      mutedText: 'text-slate-300',
      accent: 'text-slate-200',
      chartColor: '#cbd5e1',
      chartGradientFrom: 'rgba(203, 213, 225, 0.4)',
      chartGradientTo: 'rgba(203, 213, 225, 0.0)',
      isDarkCondition: true,
    };
  }

  // Overcast (3)
  if (weatherCode === 3) {
    return {
      background: 'from-slate-800 via-slate-700 to-blue-950',
      cardBg: 'bg-slate-900/50 backdrop-blur-xl',
      cardBorder: 'border-slate-700/60',
      textColor: 'text-slate-100',
      mutedText: 'text-slate-300',
      accent: 'text-sky-300',
      chartColor: '#7dd3fc',
      chartGradientFrom: 'rgba(125, 211, 252, 0.4)',
      chartGradientTo: 'rgba(125, 211, 252, 0.0)',
      isDarkCondition: true,
    };
  }

  // Partly Cloudy (1, 2)
  if (weatherCode === 1 || weatherCode === 2) {
    return {
      background: 'from-blue-700 via-sky-800 to-slate-900',
      cardBg: 'bg-slate-900/50 backdrop-blur-xl',
      cardBorder: 'border-sky-600/30',
      textColor: 'text-slate-100',
      mutedText: 'text-sky-200/80',
      accent: 'text-amber-300',
      chartColor: '#fcd34d',
      chartGradientFrom: 'rgba(252, 211, 77, 0.4)',
      chartGradientTo: 'rgba(252, 211, 77, 0.0)',
      isDarkCondition: true,
    };
  }

  // Clear Sky Day (0)
  return {
    background: 'from-sky-600 via-blue-700 to-indigo-900',
    cardBg: 'bg-slate-900/40 backdrop-blur-xl',
    cardBorder: 'border-sky-400/25',
    textColor: 'text-white',
    mutedText: 'text-sky-100/80',
    accent: 'text-amber-300',
    chartColor: '#fcd34d',
    chartGradientFrom: 'rgba(252, 211, 77, 0.4)',
    chartGradientTo: 'rgba(252, 211, 77, 0.0)',
    isDarkCondition: true,
  };
}
