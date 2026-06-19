import React from 'react';

export function PhotographerCardSkeleton() {
  return (
    <div className="bg-[#FAFAF8] rounded-xl overflow-hidden shadow-sm border border-[#1A1A1A]/10 animate-fade-in">
      <div className="w-full h-56 bg-brand-charcoal/5 animate-skeleton"></div>
      <div className="p-5 space-y-3.5">
        <div className="flex justify-between items-start">
          <div className="w-1/2 h-5 bg-brand-charcoal/5 rounded animate-skeleton"></div>
          <div className="w-12 h-5 bg-brand-charcoal/5 rounded animate-skeleton"></div>
        </div>
        <div className="w-3/4 h-4 bg-brand-charcoal/5 rounded animate-skeleton"></div>
        <div className="w-full h-8 bg-brand-charcoal/5 rounded animate-skeleton"></div>
        <div className="flex justify-between items-center pt-2 border-t border-[#1A1A1A]/5">
          <div className="w-20 h-4 bg-brand-charcoal/5 rounded animate-skeleton"></div>
          <div className="w-16 h-4 bg-brand-charcoal/5 rounded animate-skeleton"></div>
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-10 bg-brand-charcoal/5 rounded w-1/4"></div>
      <div className="h-4 bg-brand-charcoal/5 rounded w-1/2"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-64 bg-brand-charcoal/5 rounded col-span-2"></div>
        <div className="h-64 bg-brand-charcoal/5 rounded col-span-1"></div>
      </div>
    </div>
  );
}
