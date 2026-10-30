import React from 'react';
import { AlertTriangle, RefreshCw, MapPin } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
  onSelectDefaultCity?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  onRetry,
  onSelectDefaultCity,
}) => {
  return (
    <div className="w-full rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-rose-500/30 p-8 sm:p-12 text-center shadow-2xl space-y-6 max-w-2xl mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-display font-bold text-white">
          Weather Data Unavailable
        </h2>
        <p className="text-sm text-slate-300 max-w-md mx-auto">
          {message || 'We were unable to load the weather report. Please check your connection and try again.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs tracking-wide transition-all shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>

        {onSelectDefaultCity && (
          <button
            onClick={onSelectDefaultCity}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/15 font-semibold text-xs transition-all"
          >
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>Load New York</span>
          </button>
        )}
      </div>
    </div>
  );
};
