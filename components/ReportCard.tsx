import React from 'react';
import type { DailyReport, ProjectReview } from '../types.ts';

interface ReportCardProps {
  report: DailyReport;
  onViewDetails: () => void;
  review?: ProjectReview;
  reviewerName?: string;
}

const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onViewDetails,
  review,
  reviewerName,
}) => {
  const hasImages = report.images.length > 0;
  const firstImage = hasImages ? report.images[0] : null;
  const additionalImagesCount = report.images.length - 1;

  return (
    <div 
      className="bg-base-100 rounded-lg shadow-lg border border-gray-200 flex flex-col overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:ring-2 hover:ring-secondary cursor-pointer"
      onClick={onViewDetails}
    >
      {/* Image Section */}
      <div 
        className="relative aspect-video bg-gray-100 flex items-center justify-center overflow-hidden"
      >
        {firstImage ? (
          <>
            <img
              src={firstImage}
              alt={`Báo cáo ngày ${report.date}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {additionalImagesCount > 0 && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs font-bold px-2 py-1 rounded-md">
                +{additionalImagesCount} ảnh
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 italic">Không có hình ảnh</p>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
            <h4 className="text-md font-bold text-primary">{report.date}</h4>
            <span className="text-xs text-gray-500">Bởi: {report.submittedBy}</span>
        </div>
        
        <div className="flex-grow mt-1">
          <p className="text-sm text-gray-800 line-clamp-2" title={report.tasks}>
            {report.tasks}
          </p>
        </div>
      </div>

      {/* Review Section (kept for quick info) */}
      <div className="px-4 pb-4 mt-auto">
        {review && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-3 rounded-r-lg">
                <p className="font-bold text-sm">✔️ {reviewerName}:</p>
                <p className="text-sm italic truncate">"{review.comment}"</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ReportCard;