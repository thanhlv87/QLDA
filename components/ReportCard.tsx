import React from 'react';
import type { DailyReport, ProjectReview } from '../types';

interface ReportCardProps {
  report: DailyReport;
  onEdit: (report: DailyReport) => void;
  onDelete: (reportId: string, reportDate: string) => void;
  onReview: (report: DailyReport) => void;
  canEdit: boolean;
  canDelete: boolean;
  canReview: boolean;
  review?: ProjectReview;
  reviewerName?: string;
}

const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onEdit,
  onDelete,
  onReview,
  canEdit,
  canDelete,
  canReview,
  review,
  reviewerName,
}) => {
  const hasImages = report.images.length > 0;
  const firstImage = hasImages ? report.images[0] : null;
  const additionalImagesCount = report.images.length - 1;

  return (
    <div 
      className="bg-base-100 rounded-lg shadow-md border border-gray-200 flex flex-col overflow-hidden group transition-shadow hover:shadow-xl"
    >
      {/* Image Section */}
      <div 
        className="relative aspect-video bg-gray-100 flex items-center justify-center cursor-pointer"
        onClick={() => firstImage && window.open(firstImage, '_blank')}
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
            <h4 className="text-md font-semibold text-primary">{report.date}</h4>
            <span className="text-xs text-gray-500">Bởi: {report.submittedBy}</span>
        </div>
        
        <div className="flex-grow mt-1">
          <p className="text-sm text-gray-700 line-clamp-2" title={report.tasks}>
            {report.tasks}
          </p>
        </div>
      </div>

      {/* Review & Actions Section */}
      <div className="px-4 pb-4 mt-2">
        {review ? (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-3 rounded-r-lg">
                <p className="font-bold text-sm">✔️ {reviewerName}:</p>
                <p className="text-sm italic">"{review.comment}"</p>
            </div>
        ) : (
            canReview && (
                <button 
                    onClick={() => onReview(report)}
                    className="w-full text-center bg-blue-100 text-blue-700 font-semibold py-2 px-3 rounded-md hover:bg-blue-200 transition-colors text-sm"
                >
                    Xác nhận & Nhận xét
                </button>
            )
        )}
      </div>

      {(canEdit || canDelete) && (
        <div className="bg-gray-50 px-4 py-2 border-t flex justify-end space-x-4">
            {canEdit && (
                <button onClick={() => onEdit(report)} className="text-xs font-medium text-secondary hover:text-accent">CHỈNH SỬA</button>
            )}
            {canDelete && (
                <button onClick={() => onDelete(report.id, report.date)} className="text-xs font-medium text-error hover:text-red-700">XÓA</button>
            )}
        </div>
      )}
    </div>
  );
};

export default ReportCard;