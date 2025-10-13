import React from 'react';

const ReportCardSkeleton: React.FC = () => {
  return (
    <div className="bg-base-100 rounded-lg shadow-md border border-gray-200 flex flex-col overflow-hidden animate-pulse">
      {/* Image Section */}
      <div className="aspect-video bg-gray-300"></div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          <div className="h-5 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
        
        <div className="flex-grow mt-2 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
};

export default ReportCardSkeleton;