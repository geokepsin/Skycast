import React from 'react';
import { Star, MapPin, X } from 'lucide-react';
import { LocationInfo } from '../types/weather';

interface FavoritesBarProps {
  favorites: LocationInfo[];
  currentLocation: LocationInfo;
  onSelectFavorite: (location: LocationInfo) => void;
  onRemoveFavorite: (location: LocationInfo) => void;
  onToggleCurrentFavorite: () => void;
  isCurrentFavorite: boolean;
}

export const FavoritesBar: React.FC<FavoritesBarProps> = ({
  favorites,
  currentLocation,
  onSelectFavorite,
  onRemoveFavorite,
  onToggleCurrentFavorite,
  isCurrentFavorite,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-2 px-1 text-xs">
      <div className="flex items-center gap-1.5 text-slate-300 shrink-0 font-medium mr-1">
        <button
          type="button"
          onClick={onToggleCurrentFavorite}
          className="p-1 rounded-md hover:bg-white/10 transition-colors"
          title={isCurrentFavorite ? 'Remove current city from favorites' : 'Add current city to favorites'}
          aria-label={isCurrentFavorite ? 'Remove current city from favorites' : 'Add current city to favorites'}
        >
          <Star
            className={`w-4 h-4 transition-colors ${
              isCurrentFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400 hover:text-amber-300'
            }`}
          />
        </button>
        <span className="hidden sm:inline">Favorites:</span>
      </div>

      <div className="flex items-center gap-2">
        {favorites.map((fav) => {
          const isSelected =
            fav.name.toLowerCase() === currentLocation.name.toLowerCase() &&
            fav.country === currentLocation.country;

          return (
            <div
              key={`${fav.name}-${fav.latitude}-${fav.longitude}`}
              className={`group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-sky-500/25 border-sky-400/50 text-white shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 border-white/10 text-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectFavorite(fav)}
                className="flex items-center gap-1 text-left"
              >
                <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="font-medium whitespace-nowrap">{fav.name}</span>
                {fav.countryCode && (
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {fav.countryCode}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFavorite(fav);
                }}
                className="p-0.5 rounded text-slate-400 hover:text-rose-300 hover:bg-white/10 transition-colors"
                title={`Remove ${fav.name} from favorites`}
                aria-label={`Remove ${fav.name} from favorites`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
