import React from 'react';

export const WeatherSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Hero Skeleton */}
      <div className="w-full rounded-3xl bg-slate-900/40 border border-white/10 p-8">
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-white/10 rounded-lg" />
            <div className="h-4 w-32 bg-white/5 rounded-md" />
          </div>
          <div className="h-9 w-28 bg-white/10 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 items-center">
          <div className="lg:col-span-5 flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white/10" />
            <div className="space-y-2">
              <div className="h-14 w-28 bg-white/10 rounded-xl" />
              <div className="h-5 w-24 bg-white/5 rounded-md" />
            </div>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 border border-white/5 p-4 space-y-2">
                <div className="h-3 w-14 bg-white/10 rounded" />
                <div className="h-6 w-16 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Summary Skeleton */}
      <div className="w-full rounded-3xl bg-slate-900/40 border border-white/10 p-6 space-y-4">
        <div className="h-6 w-44 bg-white/10 rounded-md" />
        <div className="h-4 w-5/6 bg-white/5 rounded-md" />
        <div className="h-4 w-3/4 bg-white/5 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
        </div>
      </div>

      {/* Hourly Strip Skeleton */}
      <div className="w-full rounded-3xl bg-slate-900/40 border border-white/10 p-6 space-y-4">
        <div className="h-6 w-36 bg-white/10 rounded-md" />
        <div className="h-32 bg-white/5 rounded-2xl" />
      </div>

      {/* 7-Day Skeleton */}
      <div className="w-full rounded-3xl bg-slate-900/40 border border-white/10 p-6 space-y-3">
        <div className="h-6 w-32 bg-white/10 rounded-md" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-white/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
};
