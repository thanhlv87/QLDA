import React from 'react';

const ProjectCardSkeleton: React.FC = () => {
  return (
    <div className="bg-base-100 rounded-lg shadow-lg overflow-hidden flex flex-col animate-pulse">
      <div className="p-6 flex-grow">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="h-5 w-5 mr-2 bg-gray-300 rounded-full"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
          <div className="flex items-center">
            <div className="h-5 w-5 mr-2 bg-gray-300 rounded-full"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between mb-2">
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-gray-300 h-2.5 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>
      </div>
      <div className="bg-gray-200 px-6 py-3">
        <div className="h-6 w-full bg-gray-300 rounded"></div>
      </div>
    </div>
  );
};

export default ProjectCardSkeleton;