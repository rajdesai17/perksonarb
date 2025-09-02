'use client';

import { lazy, Suspense } from 'react';

// Lazy load components for better performance (map named exports to default)
const BuyCoffeeFormLazy = lazy(() =>
  import('./BuyCoffeeForm').then((m) => ({ default: m.BuyCoffeeForm }))
);
const CoffeeListLazy = lazy(() =>
  import('./CoffeeList').then((m) => ({ default: m.CoffeeList }))
);

// Loading fallback components
const FormLoadingFallback = () => (
  <div className="coffee-card max-w-md mx-auto">
    <div className="animate-pulse">
      <div className="text-center mb-6">
        <div className="h-8 bg-coffee-200 rounded w-48 mx-auto mb-2"></div>
        <div className="h-4 bg-coffee-150 rounded w-32 mx-auto"></div>
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-4 bg-coffee-200 rounded w-32"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-coffee-100 rounded-lg border-2 border-coffee-200"></div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-coffee-200 rounded w-24"></div>
          <div className="h-10 bg-coffee-100 rounded border border-coffee-200"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-coffee-200 rounded w-32"></div>
          <div className="h-24 bg-coffee-100 rounded border border-coffee-200"></div>
        </div>
        <div className="h-12 bg-coffee-300 rounded"></div>
      </div>
    </div>
  </div>
);

const ListLoadingFallback = () => (
  <div className="coffee-card">
    <div className="animate-pulse">
      <div className="text-center mb-6">
        <div className="h-8 bg-coffee-200 rounded w-48 mx-auto mb-2"></div>
        <div className="h-4 bg-coffee-150 rounded w-64 mx-auto"></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-coffee-50 rounded-lg p-4 border border-coffee-200">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-6 h-6 bg-coffee-200 rounded"></div>
                  <div className="h-4 bg-coffee-200 rounded w-24"></div>
                  <div className="h-3 bg-coffee-150 rounded w-12"></div>
                </div>
                <div className="h-3 bg-coffee-150 rounded w-32"></div>
              </div>
              <div className="text-right">
                <div className="h-5 bg-coffee-200 rounded w-20 mb-1"></div>
                <div className="h-3 bg-coffee-150 rounded w-16"></div>
              </div>
            </div>
            <div className="h-3 bg-coffee-150 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Wrapped components with Suspense
export const BuyCoffeeForm = () => (
  <Suspense fallback={<FormLoadingFallback />}>
    <BuyCoffeeFormLazy />
  </Suspense>
);

export const CoffeeList = () => (
  <Suspense fallback={<ListLoadingFallback />}>
    <CoffeeListLazy />
  </Suspense>
);