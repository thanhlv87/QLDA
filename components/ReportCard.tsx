import React from 'react';
import type { DailyReport } from '../types';

interface ReportCardProps {
  report: DailyReport;
  onViewImage: (imageUrl: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onViewImage }) => {
  return (
    <div className="bg-base-100 rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-primary">{report.date}</h4>
        <span className="text-sm text-gray-500">Báo cáo bởi: {report.submittedBy}</span>
      </div>
      <div className="mb-4">
        <p className="font-semibold text-gray-800 mb-2">Công việc trong ngày:</p>
        <p className="text-gray-600 whitespace-pre-wrap">{report.tasks}</p>
      </div>
      <div>
        <p className="font-semibold text-gray-800 mb-2">Hình ảnh:</p>
        {report.images.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {report.images.map((image, index) => (
              <button
                key={index}
                onClick={() => onViewImage(image)}
                className="aspect-square w-full block bg-gray-100 rounded-md overflow-hidden group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                aria-label={`View image ${index + 1}`}
              >
                <img
                  src={image}
                  alt={`Report thumbnail ${index + 1}`}
                  className="w-full h-full object-cover transition-transform transform group-hover:scale-110"
                />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">Không có hình ảnh nào được đính kèm.</p>
        )}
      </div>
    </div>
  );
};

export default ReportCard;