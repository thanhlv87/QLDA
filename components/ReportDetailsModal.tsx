import React from 'react';
import type { DailyReport, Project, ProjectReview, User } from '../types.ts';
import { permissions } from '../services/permissions.ts';
import { XIcon } from './Icons.tsx';

interface ReportDetailsModalProps {
  report: DailyReport;
  project: Project;
  currentUser: User | null;
  review?: ProjectReview;
  reviewerName?: string;
  onClose: () => void;
  onEdit: (report: DailyReport) => void;
  onDelete: (reportId: string, reportDate: string) => void;
  onReview: (report: DailyReport) => void;
  onImageClick: (images: string[], startIndex: number) => void;
}

const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  report,
  project,
  currentUser,
  review,
  reviewerName,
  onClose,
  onEdit,
  onDelete,
  onReview,
  onImageClick
}) => {
  const canEdit = permissions.canEditReport(currentUser, project);
  const canDelete = permissions.canDeleteReport(currentUser, project);
  const canReview = permissions.canReviewReport(currentUser, project);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-40 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-base-100 rounded-lg shadow-xl w-full max-w-3xl h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-lg z-10">
          <div>
            <h3 className="text-xl font-bold text-primary">Chi tiết Báo cáo</h3>
            <p className="text-sm text-gray-500">Ngày {report.date} - Bởi: {report.submittedBy}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100">
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-6 overflow-y-auto flex-grow space-y-6">
          <section>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Nội dung công việc</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{report.tasks}</p>
          </section>

          {report.images.length > 0 && (
            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Hình ảnh đính kèm</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {report.images.map((image, index) => (
                  <div key={index} className="relative group cursor-pointer" onClick={() => onImageClick(report.images, index)}>
                    <img
                      src={image}
                      alt={`Hình ảnh báo cáo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md shadow-sm transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
             <h4 className="text-lg font-semibold text-gray-800 mb-2">Xác nhận & Nhận xét</h4>
             {review ? (
                 <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-r-lg">
                    <p className="font-bold text-sm">✔️ {reviewerName}:</p>
                    <p className="text-sm italic mt-1 whitespace-pre-wrap">"{review.comment}"</p>
                </div>
             ) : (
                <p className="text-sm text-gray-500 italic">Chưa có nhận xét nào.</p>
             )}
          </section>
        </main>

        {(canEdit || canDelete || (canReview && !review)) && (
            <footer className="p-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg border-t sticky bottom-0">
              {canReview && !review && (
                 <button 
                    onClick={() => onReview(report)}
                    className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Xác nhận & Nhận xét
                </button>
              )}
              {canEdit && (
                <button onClick={() => onEdit(report)} className="bg-secondary text-white font-bold py-2 px-4 rounded-md hover:opacity-90">
                    Chỉnh sửa
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(report.id, report.date)} className="bg-error text-white font-bold py-2 px-4 rounded-md hover:opacity-90">
                    Xóa
                </button>
              )}
            </footer>
        )}
      </div>
    </div>
  );
};

export default ReportDetailsModal;