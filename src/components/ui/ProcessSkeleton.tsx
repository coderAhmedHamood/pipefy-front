import React from 'react';

interface ProcessSkeletonProps {
  count?: number;
}

export const ProcessSkeleton: React.FC<ProcessSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center space-x-3 space-x-reverse">
              {/* Process Icon */}
              <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
              
              <div className="flex-1 space-y-2">
                {/* Process Name */}
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                
                {/* Process Description */}
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                
                {/* Process Stats */}
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface ProcessDetailSkeletonProps {}

export const ProcessDetailSkeleton: React.FC<ProcessDetailSkeletonProps> = () => {
  return (
    <div className="p-6 animate-pulse">
      {/* Process Header Skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-300 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Stages Section Skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-300 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4 space-x-reverse p-3 border border-gray-200 rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-4"></div>
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fields Section Skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-300 rounded w-40"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-5 bg-gray-200 rounded w-12"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcessSkeleton;
