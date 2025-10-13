import React, { useState, useEffect } from 'react';
import type { Project, DailyReport, User } from '../types';
import ReportCard from './ReportCard';
import EditProjectForm from './EditProjectForm';
import { generateProjectSummary } from '../services/geminiService';
import { permissions } from '../services/permissions';

interface ImageLightboxProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-50 transition-colors"
        aria-label="Close image viewer"
      >
        &times;
      </button>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt="Full size view"
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};


interface ProjectDetailsProps {
  project: Project;
  reports: DailyReport[];
  currentUser: User | null;
  users: User[];
  onBack: () => void;
  onAddReport: (report: Omit<DailyReport, 'id'>) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string, projectName: string) => void;
}

const InfoField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="mb-2">
        <span className="font-semibold text-gray-600">{label}:</span>
        <span className="ml-2 text-gray-800">{value}</span>
    </div>
);

const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  reports,
  currentUser,
  users,
  onBack,
  onAddReport,
  onUpdateProject,
  onDeleteProject
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newReportTasks, setNewReportTasks] = useState('');
  const [newReportImages, setNewReportImages] = useState<string[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'reports'>('info');

  const handleGenerateSummary = () => {
    if (reports.length > 0) {
      setIsGeneratingSummary(true);
      generateProjectSummary(project, reports)
        .then(setSummary)
        .catch(err => {
          console.error(err);
          setSummary('Could not generate summary.');
        })
        .finally(() => {
          setIsGeneratingSummary(false);
        });
    }
  };

  const handleAddReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportTasks.trim() || !currentUser) {
      alert('Please fill in the tasks for the report.');
      return;
    }

    const today = new Date();
    const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    onAddReport({
      projectId: project.id,
      date: formattedDate,
      tasks: newReportTasks,
      images: newReportImages,
      submittedBy: currentUser.name,
    });
    setNewReportTasks('');
    setNewReportImages([]);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    onUpdateProject(updatedProject);
    setIsEditing(false);
  }

  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      setIsProcessingImages(true);
      const files = Array.from(e.target.files);
      // FIX: Explicitly type `file` as `File` to resolve TS error where it was inferred as `unknown`.
      const optimizedImagePromises = files.map((file: File) => optimizeImage(file));

      try {
          const optimizedImages = await Promise.all(optimizedImagePromises);
          setNewReportImages(prev => [...prev, ...optimizedImages]);
      } catch (error) {
          console.error("Error optimizing images:", error);
          alert("An error occurred while processing the images. Please try again.");
      } finally {
          setIsProcessingImages(false);
          e.target.value = '';
      }
  };

  const handleRemoveImage = (indexToRemove: number) => {
      setNewReportImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  if (isEditing) {
    return <EditProjectForm project={project} onUpdateProject={handleUpdateProject} onCancel={() => setIsEditing(false)} users={users} currentUser={currentUser} />;
  }

  const TabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    count?: number;
  }> = ({ label, isActive, onClick, count }) => (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      className={`px-4 py-3 text-sm sm:text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent rounded-t-md ${
        isActive
          ? 'border-b-2 border-secondary text-secondary'
          : 'border-b-2 border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {label}
      {typeof count !== 'undefined' && (
         <span className={`ml-2 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${isActive ? 'bg-secondary text-white' : 'bg-gray-200 text-gray-700'}`}>
            {count}
         </span>
      )}
    </button>
  );


  return (
    <div className="animate-fade-in">
       {viewingImage && <ImageLightbox imageUrl={viewingImage} onClose={() => setViewingImage(null)} />}
      <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
        <div>
            <button onClick={onBack} className="text-secondary hover:text-accent font-semibold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Trở về Danh sách
            </button>
            <h2 className="text-3xl font-bold text-gray-800">{project.name}</h2>
        </div>
        <div className="flex gap-2">
            {permissions.canEditProject(currentUser, project) && (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-accent text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
                >
                    Chỉnh sửa Dự án
                </button>
            )}
             {permissions.canDeleteProject(currentUser) && (
                <button 
                    onClick={() => onDeleteProject(project.id, project.name)}
                    className="bg-error text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
                >
                    Xóa Dự án
                </button>
            )}
        </div>
      </div>

       {/* AI Summary Section - Redesigned for a more compact look */}
      <div className="bg-base-100 p-4 rounded-lg shadow-md border border-gray-200 mb-8">
          <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.6-2.6L11.25 18l1.938-.648a3.375 3.375 0 002.6-2.6l.648-1.938 1.938.648a3.375 3.375 0 002.6 2.6l.648 1.938-.648-1.938a3.375 3.375 0 00-2.6 2.6z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-800">Tóm tắt tiến độ AI</h3>
              </div>
              {isGeneratingSummary ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <svg className="animate-spin h-4 w-4 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Đang tạo...</span>
                  </div>
              ) : summary ? (
                  <button
                      onClick={handleGenerateSummary}
                      disabled={reports.length === 0}
                      className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-secondary transition-colors"
                      title="Tạo lại tóm tắt"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                  </button>
              ) : (
                   <button
                      onClick={handleGenerateSummary}
                      disabled={reports.length === 0 || isGeneratingSummary}
                      className="bg-secondary text-white font-bold text-sm py-2 px-4 rounded-md hover:bg-primary transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                      Tạo Tóm tắt
                  </button>
              )}
          </div>
          {summary && !isGeneratingSummary && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{summary}</p>
              </div>
          )}
          {!summary && !isGeneratingSummary && (
              <p className="text-sm text-gray-500 mt-2">
                  {reports.length > 0 ? 'Nhấn nút để phân tích các báo cáo và tạo tóm tắt.' : 'Chưa có báo cáo nào để tạo tóm tắt.'}
              </p>
          )}
      </div>


       {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 sm:space-x-4" aria-label="Tabs">
          <TabButton
            label="Thông tin Dự án"
            isActive={activeTab === 'info'}
            onClick={() => setActiveTab('info')}
          />
          <TabButton
            label="Báo cáo Hàng ngày"
            isActive={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
            count={reports.length}
          />
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'info' && (
           <div role="tabpanel" className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-base-100 p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-primary mb-4 border-b pb-2">Thông tin Chung</h3>
                <InfoField label="Ngày bắt đầu" value={project.constructionStartDate} />
                <InfoField label="Ngày nghiệm thu dự kiến" value={project.plannedAcceptanceDate} />
                <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-gray-600 mb-2">Phê duyệt Kế hoạch vốn</h4>
                    <InfoField label="Số QĐ" value={project.capitalPlanApproval.decisionNumber} />
                    <InfoField label="Ngày" value={project.capitalPlanApproval.date} />
                </div>
                 <div className="mt-2 pt-2 border-t">
                    <h4 className="font-semibold text-gray-600 mb-2">Phê duyệt Phương án kỹ thuật</h4>
                    <InfoField label="Số QĐ" value={project.technicalPlanApproval.decisionNumber} />
                    <InfoField label="Ngày" value={project.technicalPlanApproval.date} />
                </div>
                 <div className="mt-2 pt-2 border-t">
                    <h4 className="font-semibold text-gray-600 mb-2">Phê duyệt Dự toán</h4>
                    <InfoField label="Số QĐ" value={project.budgetApproval.decisionNumber} />
                    <InfoField label="Ngày" value={project.budgetApproval.date} />
                </div>
              </div>
              <div className="bg-base-100 p-6 rounded-lg shadow-md border border-gray-200">
                 <h3 className="text-xl font-bold text-primary mb-4 border-b pb-2">Các đơn vị & Cán bộ liên quan</h3>
                 <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                        <h4 className="font-semibold text-primary mb-2">Cán bộ Quản lý Dự án</h4>
                        <p className="text-sm text-gray-700"><span className="font-medium">Phòng:</span> {project.projectManagementUnit?.departmentName || 'N/A'}</p>
                        <p className="text-sm text-gray-700"><span className="font-medium">Tên:</span> {project.projectManagementUnit?.personnelName || 'N/A'}</p>
                        <p className="text-sm text-gray-500"><span className="font-medium">SĐT:</span> {project.projectManagementUnit?.phone || 'N/A'}</p>
                    </div>
                     <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                        <h4 className="font-semibold text-primary mb-2">Giám sát A của đơn vị QLVH</h4>
                        <p className="text-sm text-gray-700"><span className="font-medium">XNDV:</span> {project.supervisorA?.enterpriseName || 'N/A'}</p>
                        <p className="text-sm text-gray-700"><span className="font-medium">Tên:</span> {project.supervisorA?.personnelName || 'N/A'}</p>
                        <p className="text-sm text-gray-500"><span className="font-medium">SĐT:</span> {project.supervisorA?.phone || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md border">
                        <h4 className="font-semibold text-primary mb-2">Đơn vị Thiết kế</h4>
                        <p className="text-sm text-gray-700"><span className="font-medium">Công ty:</span> {project.designUnit.companyName || 'N/A'}</p>
                        <p className="text-sm text-gray-700"><span className="font-medium">Chủ nhiệm đề án:</span> {project.designUnit.personnelName || 'N/A'}</p>
                        <p className="text-sm text-gray-500"><span className="font-medium">SĐT:</span> {project.designUnit.phone || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md border">
                        <h4 className="font-semibold text-primary mb-2">Đơn vị Thi công</h4>
                        <p className="text-sm text-gray-700"><span className="font-medium">Công ty:</span> {project.constructionUnit.companyName || 'N/A'}</p>
                        <p className="text-sm text-gray-700"><span className="font-medium">Chỉ huy trưởng:</span> {project.constructionUnit.personnelName || 'N/A'}</p>
                        <p className="text-sm text-gray-500"><span className="font-medium">SĐT:</span> {project.constructionUnit.phone || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md border">
                      <h4 className="font-semibold text-primary mb-2">Đơn vị Giám sát</h4>
                       <p className="text-sm text-gray-700"><span className="font-medium">Công ty:</span> {project.supervisionUnit.companyName || 'N/A'}</p>
                       <p className="text-sm text-gray-700"><span className="font-medium">Giám sát trưởng (đơn vị):</span> {project.supervisionUnit.personnelName || 'N/A'}</p>
                       <p className="text-sm text-gray-500"><span className="font-medium">SĐT:</span> {project.supervisionUnit.phone || 'N/A'}</p>
                    </div>
                 </div>
              </div>
            </div>
        )}
        {activeTab === 'reports' && (
            <div role="tabpanel" className="animate-fade-in">
              {permissions.canAddReport(currentUser, project) && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-8">
                  <h4 className="text-lg font-bold text-primary mb-4">Gửi báo cáo mới</h4>
                  <form onSubmit={handleAddReportSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="reportTasks" className="block text-sm font-medium text-gray-700 mb-1">
                        Nội dung công việc đã thực hiện
                      </label>
                      <textarea
                        id="reportTasks"
                        rows={4}
                        value={newReportTasks}
                        onChange={(e) => setNewReportTasks(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
                        placeholder="Mô tả chi tiết các công việc đã làm trong ngày..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hình ảnh công việc
                      </label>
                      
                      {newReportImages.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4 p-4 border rounded-md bg-gray-50">
                              {newReportImages.map((image, index) => (
                                  <div key={index} className="relative group">
                                      <img src={image} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-md shadow-sm" />
                                      <button
                                          type="button"
                                          onClick={() => handleRemoveImage(index)}
                                          className="absolute top-0 right-0 -mt-2 -mr-2 bg-error text-white rounded-full p-0 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                          aria-label="Remove image"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                      
                      <div className="flex items-center space-x-4">
                          <label htmlFor="imageUpload" className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                              <span>Chọn ảnh...</span>
                              <input id="imageUpload" name="imageUpload" type="file" className="sr-only" multiple accept="image/*" onChange={handleImageChange} />
                          </label>
                           {isProcessingImages && <div className="text-sm text-gray-500">Đang xử lý...</div>}
                      </div>
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={isProcessingImages}
                        className="bg-success text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Gửi Báo cáo
                      </button>
                    </div>
                  </form>
                </div>
              )}
              <div className="space-y-6">
                {reports.length > 0 ? (
                  reports.map(report => (
                    <ReportCard key={report.id} report={report} onViewImage={(img) => setViewingImage(img)} />
                  ))
                ) : (
                  <div className="text-center py-10 bg-base-100 rounded-lg shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có báo cáo nào</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {permissions.canAddReport(currentUser, project) ? 'Hãy gửi báo cáo đầu tiên cho dự án này.' : 'Khi có báo cáo mới, chúng sẽ xuất hiện ở đây.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default ProjectDetails;