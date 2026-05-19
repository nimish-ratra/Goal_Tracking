import React from 'react';

export const SkeletonLoader = () => (
  <div className="animate-pulse space-y-4 w-full">
    <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-neutral-200 rounded"></div>
      <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
    </div>
  </div>
);

export const EmptyState = ({ title, message, icon: Icon, action }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-neutral-200 rounded-xl shadow-sm">
    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-200 mb-4">
      {Icon ? <Icon className="w-8 h-8" /> : (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
    </div>
    <h3 className="text-[18px] font-semibold text-neutral-800 mb-1">{title}</h3>
    <p className="text-sm text-neutral-500 max-w-sm mb-6">{message}</p>
    {action}
  </div>
);
