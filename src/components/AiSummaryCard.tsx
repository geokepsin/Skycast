import React from 'react';
import { Sparkles, Shirt, Umbrella, Compass, RefreshCw, AlertCircle } from 'lucide-react';
import { AiSummaryResponse } from '../types/weather';

interface AiSummaryCardProps {
  summaryData: AiSummaryResponse | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  locationName: string;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({
  summaryData,
  isLoading,
  error,
  onRefresh,
  locationName,
}) => {
  return (
    <section className="w-full rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-sky-400/20 p-6 sm:p-7 shadow-xl relative overflow-hidden transition-all">
      {/* Ambient background highlight */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight">
              SkyCast AI Assistant
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Smart day planner for {locationName}</span>
              {summaryData?.source && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[11px] font-medium text-sky-300">
                    {summaryData.source === 'gemini' ? 'Gemini 3.8 Flash' : 'Smart Heuristics'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all disabled:opacity-50"
          title="Regenerate AI weather advice"
          aria-label="Regenerate AI weather advice"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
          <span className="hidden sm:inline">Regenerate</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="pt-5 relative z-10">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded-md w-11/12" />
            <div className="h-4 bg-white/10 rounded-md w-3/4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
              <div className="h-24 bg-white/5 rounded-2xl border border-white/5" />
              <div className="h-24 bg-white/5 rounded-2xl border border-white/5" />
              <div className="h-24 bg-white/5 rounded-2xl border border-white/5" />
            </div>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={onRefresh}
              className="underline hover:text-white ml-3 font-semibold"
            >
              Retry
            </button>
          </div>
        ) : summaryData ? (
          <div className="space-y-5">
            {/* 2-3 Sentences Summary */}
            <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-normal">
              {summaryData.summary}
            </p>

            {/* 3 Practical Tip Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Tip 1: Clothing */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-sky-400/30 transition-all flex flex-col justify-between">
                <div className="flex items-center gap-2 text-sky-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Shirt className="w-4 h-4" />
                  <span>What to Wear</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-snug">
                  {summaryData.tips.clothing}
                </p>
              </div>

              {/* Tip 2: Umbrella */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-sky-400/30 transition-all flex flex-col justify-between">
                <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Umbrella className="w-4 h-4" />
                  <span>Umbrella Need</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-snug">
                  {summaryData.tips.umbrella}
                </p>
              </div>

              {/* Tip 3: Outdoor Activity */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-sky-400/30 transition-all flex flex-col justify-between">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Compass className="w-4 h-4" />
                  <span>Best Time Outside</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-snug">
                  {summaryData.tips.outdoor}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};
