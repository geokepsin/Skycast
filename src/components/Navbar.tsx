import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, RefreshCw, X } from 'lucide-react';
import { LocationInfo, UnitSystem } from '../types/weather';
import { searchLocations } from '../services/weatherApi';

interface NavbarProps {
  currentLocation: LocationInfo;
  units: UnitSystem;
  onSelectLocation: (location: LocationInfo) => void;
  onToggleUnits: () => void;
  onRefresh: () => void;
  onUseMyLocation: () => void;
  isLocating: boolean;
  isLoadingWeather: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLocation,
  units,
  onSelectLocation,
  onToggleUnits,
  onRefresh,
  onUseMyLocation,
  isLocating,
  isLoadingWeather,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(trimmed);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        console.error('Search autocomplete error:', err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (loc: LocationInfo) => {
      onSelectLocation(loc);
      setQuery('');
      setIsOpen(false);
      setSuggestions([]);
      setActiveIndex(-1);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    },
    [onSelectLocation]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/40 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center justify-between w-full md:w-auto shrink-0 gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-amber-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <span className="font-display font-bold text-lg text-white">S</span>
              </div>
            </div>
            <div>
              <span className="text-xl font-display font-bold tracking-tight text-white whitespace-nowrap">
                SkyCast
              </span>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onToggleUnits}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-colors"
              title="Toggle Units"
              aria-label="Toggle Temperature Units"
            >
              {units === 'metric' ? '°C' : '°F'}
            </button>
            <button
              onClick={onRefresh}
              disabled={isLoadingWeather}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-colors disabled:opacity-50"
              title="Refresh Forecast"
              aria-label="Refresh Forecast"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingWeather ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search & Location Zone */}
        <div ref={wrapperRef} className="relative w-full max-w-xl">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-300 pointer-events-none">
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              ) : (
                <Search className="w-4 h-4 text-slate-300" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search city (e.g. San Francisco, Tokyo, London)..."
              className="w-full pl-10 pr-24 py-2 text-sm text-white placeholder-slate-400 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 focus:border-sky-400 rounded-xl outline-none transition-all shadow-inner"
              aria-label="Search city name"
              aria-autocomplete="list"
            />

            {/* Quick Actions inside Search Bar */}
            <div className="absolute right-2 flex items-center gap-1">
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setSuggestions([]);
                    setIsOpen(false);
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                  aria-label="Clear search input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onUseMyLocation}
                disabled={isLocating}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-sky-300 hover:text-white bg-sky-500/20 hover:bg-sky-500/30 rounded-lg transition-colors border border-sky-400/30 disabled:opacity-50 whitespace-nowrap"
                title="Detect and use current GPS location"
                aria-label="Use my location"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MapPin className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">My Location</span>
              </button>
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <ul
              className="absolute left-0 right-0 mt-2 py-1.5 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5"
              role="listbox"
            >
              {suggestions.map((item, idx) => {
                const isSelected = idx === activeIndex;
                const region = [item.admin1, item.country].filter(Boolean).join(', ');
                return (
                  <li
                    key={`${item.latitude}-${item.longitude}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-sky-500/20 text-white' : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                      <div>
                        <span className="text-sm font-semibold text-white">{item.name}</span>
                        {region && <span className="text-xs text-slate-400 ml-2">{region}</span>}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono-numbers text-slate-400 shrink-0">
                      {item.latitude.toFixed(1)}°, {item.longitude.toFixed(1)}°
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Desktop Controls (Units & Refresh) */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {/* Segmented Unit Switcher */}
          <div className="flex items-center p-1 bg-white/10 rounded-xl border border-white/15">
            <button
              onClick={() => {
                if (units !== 'metric') onToggleUnits();
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                units === 'metric'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              °C, km/h
            </button>
            <button
              onClick={() => {
                if (units !== 'imperial') onToggleUnits();
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                units === 'imperial'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              °F, mph
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoadingWeather}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh weather data"
            aria-label="Refresh weather data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWeather ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};
