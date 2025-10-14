import React, { useState, useMemo, useEffect } from 'react';
import type { Project, DailyReport, User, ProjectReview } from '../types';
import { Role } from '../types';
import { permissions } from '../services/permissions';
import { generateProjectSummary } from '../services/geminiService';
import AddReportForm from './AddReportForm';
import EditReportForm from './EditReportForm';
import EditProjectForm from './EditProjectForm';
import ReportCard from './ReportCard';
import ConfirmationModal from './ConfirmationModal';
import ImageLightbox from './ImageLightbox'; // New component for image gallery
import ReportCardSkeleton from './ReportCardSkeleton'; // New component for loading state
import ReportDetailsModal from './ReportDetailsModal'; // New component for report details
// FIX: Removed CheckCircleIcon and ClockIcon as they are not used and were causing import errors.
import { ArrowLeftIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, CompanyIcon, ExternalLinkIcon, PhoneIcon, UserCircleIcon, UserGroupIcon, XIcon } from './Icons';


// Modal for Project Manager to add a review
const ReviewReportModal: React.FC<{
    report: DailyReport;
    currentUser: User;
    onClose: () => void;
    onAddReview: (projectId: string, reportId: string, comment: string, user: User) => Promise<void>;
}> = ({ report, currentUser, onClose, onAddReview }) => {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setIsSubmitting(true);
        await onAddReview(report.projectId, report.id, comment, currentUser);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b">
                    <h3 className="text-xl font-bold text-primary">Xác nhận & Nhận xét Báo cáo</h3>
                    <p className="text-sm text-gray-500">Ngày {report.date}</p>
                </header>
                <form onSubmit={handleSubmit}>
                    <main className="p-6">
                        <label htmlFor="reviewComment" className="block text-sm font-medium text-gray-700 mb-2">
                            Nội dung nhận xét
                        </label>
                        <textarea
                            id="reviewComment"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={4}
                            placeholder="Nhập nhận xét hoặc chỉ đạo của bạn..."
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                            required
                        />
                    </main>
                    <footer className="p-4 border-t flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting} className="bg-success text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

// Helper components for displaying project info
const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h4 className="text-lg font-semibold text-primary border-b-2 border-primary/20 pb-2 mb-4">{title}</h4>
    <div className="space-y-3">{children}</div>
  </div>
);

const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-sm items-start">
    <dt className="font-medium text-gray-500 flex items-center">
        {icon && <span className="mr-2 text-gray-400">{icon}</span>}
        {label}
    </dt>
    <dd className="text-gray-900 md:col-span-2">{value || <span className="italic text-gray-400">Chưa có thông tin</span>}</dd>
  </div>
);

const ApprovalCard: React.FC<{ title: string; approval: Project['capitalPlanApproval'] }> = ({ title, approval }) => (
     <div className="space-y-2 p-4 bg-gray-50 rounded-md border">
        <h5 className="font-semibold text-gray-800 text-base">{title}</h5>
        <DetailItem label="Số Quyết định" value={approval.decisionNumber} />
        <DetailItem label="Ngày" value={approval.date} />
    </div>
);

const ContactCard: React.FC<{ title: string; details: { label: string; value: string; icon?: React.ReactNode }[] }> = ({ title, details }) => (
    <div className="p-4 bg-gray-50 rounded-md border h-full">
        <h5 className="font-semibold text-gray-800 mb-3 text-base">{title}</h5>
        <div className="space-y-2">
            {details.map(item => <DetailItem key={item.label} label={item.label} value={item.value} icon={item.icon} />)}
        </div>
    </div>
);


interface ProjectDetailsProps {
    project: Project;
    reports: (DailyReport & { managerReview?: ProjectReview })[];
    isReportsLoading: boolean;
    currentUser: User | null;
    users: User[];
    onBack: () => void;
    onAddReport: (reportData: Omit<DailyReport, 'id'>) => Promise<void>;
    onUpdateProject: (projectData: Project) => Promise<void>;
    onDeleteProject: (projectId: string, projectName: string) => void;
    onUpdateReport: (reportData: DailyReport) => Promise<void>;
    onDeleteReport: (reportId: string, projectId: string) => Promise<void>;
    onAddReportReview: (projectId: string, reportId: string, comment: string, user: User) => Promise<void>;
}

type DetailsView = 'details' | 'editProject' | 'addReport' | 'editReport';
type ActiveTab = 'reports' | 'approvals' | 'workItems' | 'info';

const getDefaultTabForRole = (role: Role | null): ActiveTab => {
    switch (role) {
        case Role.ProjectManager:
        case Role.DepartmentHead:
            return 'reports';
        case Role.LeadSupervisor:
        default:
            return 'reports';
    }
};

const ProjectDetails: React.FC<ProjectDetailsProps> = ({
    project,
    reports,
    isReportsLoading,
    currentUser,
    users,
    onBack,
    onAddReport,
    onUpdateProject,
    onDeleteProject,
    onUpdateReport,
    onDeleteReport,
    onAddReportReview,
}) => {
    const [view, setView] = useState<DetailsView>('details');
    const [activeTab, setActiveTab] = useState<ActiveTab>(() => getDefaultTabForRole(currentUser?.role || null));
    const [selectedReportToEdit, setSelectedReportToEdit] = useState<DailyReport | null>(null);
    const [reportToDelete, setReportToDelete] = useState<{ id: string; date: string } | null>(null);
    const [reportToReview, setReportToReview] = useState<DailyReport | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [aiSummary, setAiSummary] = useState<string>('');
    const [displayedAiSummary, setDisplayedAiSummary] = useState<string>('');
    const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [viewingReport, setViewingReport] = useState<(DailyReport & { managerReview?: ProjectReview }) | null>(null);


    // AI typing effect
    useEffect(() => {
        if (aiSummary) {
            setDisplayedAiSummary('');
            let i = 0;
            const interval = setInterval(() => {
                setDisplayedAiSummary(prev => prev + aiSummary.charAt(i));
                i++;
                if (i > aiSummary.length) {
                    clearInterval(interval);
                }
            }, 10); // Adjust typing speed here
            return () => clearInterval(interval);
        }
    }, [aiSummary]);
    
    useEffect(() => {
        setAiSummary('');
        setDisplayedAiSummary('');
        setActiveTab(getDefaultTabForRole(currentUser?.role || null));
    }, [project.id, currentUser?.role]);

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        setAiSummary('');
        setDisplayedAiSummary('');
        try {
            const summary = await generateProjectSummary(project, reports);
            setAiSummary(summary);
        } catch (error) {
            console.error("Failed to generate summary:", error);
            setAiSummary("Đã xảy ra lỗi khi tạo tóm tắt. Vui lòng thử lại.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };
    
    const handleEditReport = (report: DailyReport) => {
        setViewingReport(null); // Close details modal first
        setSelectedReportToEdit(report);
        setView('editReport');
    };
    
    const handleDeleteReportConfirm = (reportId: string, reportDate: string) => {
        setViewingReport(null);
        setReportToDelete({ id: reportId, date: reportDate });
    };

    const executeDeleteReport = async () => {
        if (reportToDelete) {
            await onDeleteReport(reportToDelete.id, project.id);
            setReportToDelete(null);
        }
    };

    const handleUpdateReport = async (reportData: DailyReport) => {
        await onUpdateReport(reportData);
        setView('details');
        setSelectedReportToEdit(null);
    };

    const handleUpdateProject = async (projectData: Project) => {
        await onUpdateProject(projectData);
        setView('details');
    };

    const handleImageClick = (images: string[], startIndex: number) => {
        setLightboxImages(images);
        setLightboxIndex(startIndex);
    };

    const handleStartReview = (report: DailyReport) => {
      setViewingReport(null);
      setReportToReview(report);
    };
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'N/A';
    const canAddReport = useMemo(() => permissions.canAddReport(currentUser, project), [currentUser, project]);
    const canEditProject = useMemo(() => permissions.canEditProject(currentUser, project), [currentUser, project]);
// FIX: Corrected call to a non-existent permission function.
    const canViewApprovals = useMemo(() => permissions.canViewApprovalsTab(currentUser), [currentUser]);
    const canUseAi = useMemo(() => permissions.canUseAiSummary(currentUser), [currentUser]);

    const projectManagers = useMemo(() => 
        users.filter(u => project.projectManagerIds.includes(u.id)).map(u => u.name).join(', ') || <span className="italic text-gray-400">Chưa gán</span>,
    [users, project.projectManagerIds]);

    const leadSupervisors = useMemo(() => 
        users.filter(u => project.leadSupervisorIds.includes(u.id)).map(u => u.name).join(', ') || <span className="italic text-gray-400">Chưa gán</span>,
    [users, project.leadSupervisorIds]);


    if (view === 'editProject') {
        return (
            <EditProjectForm
                project={project}
                users={users}
                currentUser={currentUser}
                onUpdateProject={handleUpdateProject}
                onCancel={() => setView('details')}
            />
        );
    }

    if (view === 'addReport') {
        if (!currentUser) return null;
        return (
            <AddReportForm
                projectId={project.id}
                currentUser={currentUser}
                onAddReport={async (data) => {
                    await onAddReport(data);
                    setView('details');
                }}
                onCancel={() => setView('details')}
            />
        );
    }
    
    if (view === 'editReport' && selectedReportToEdit) {
        return (
            <EditReportForm
                report={selectedReportToEdit}
                onUpdateReport={handleUpdateReport}
                onCancel={() => {
                    setView('details');
                    setSelectedReportToEdit(null);
                }}
            />
        );
    }
    
    const TabButton: React.FC<{ tabName: ActiveTab; label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tabName
                    ? 'border-b-2 border-secondary text-secondary'
                    : 'text-gray-500 hover:text-gray-800'
            }`}
        >
            {label}
        </button>
    );

    return (
      <div className="animate-fade-in">
        <header className="mb-6">
            <button onClick={onBack} className="text-secondary hover:text-accent font-semibold flex items-center mb-4">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Trở về Dashboard
            </button>
            <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{project.name}</h2>
                </div>
                <div className="flex gap-2 sm:gap-4">
                    {canEditProject && (
                        <button onClick={() => setView('editProject')} className="bg-neutral text-primary font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
                            Chỉnh sửa Dự án
                        </button>
                    )}
                    {canAddReport && (
                        <button onClick={() => setView('addReport')} className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity">
                            Thêm Báo cáo +
                        </button>
                    )}
                </div>
            </div>
        </header>

        <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-2 sm:space-x-6" aria-label="Tabs">
                <TabButton tabName="reports" label="Báo cáo" />
                {canViewApprovals && <TabButton tabName="approvals" label="Phê duyệt" />}
                <TabButton tabName="workItems" label="Bảng tiến độ thi công" />
                <TabButton tabName="info" label="Thông tin" />
            </nav>
        </div>

        <div>
            {activeTab === 'reports' && (
                <div className="space-y-6">
                    {canUseAi && (
                        <div className="bg-base-100 p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-xl font-bold text-primary mb-4">Tóm tắt tiến độ bằng AI</h3>
                            <div className="prose prose-sm max-w-none text-gray-800 mb-4 whitespace-pre-wrap">{displayedAiSummary || (isGeneratingSummary ? 'AI đang phân tích...' : 'Bấm nút để tạo tóm tắt.')}</div>
                            <button onClick={handleGenerateSummary} disabled={isGeneratingSummary || reports.length === 0} className="bg-secondary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 disabled:bg-gray-400">
                                {isGeneratingSummary ? 'Đang tạo...' : 'Tạo tóm tắt'}
                            </button>
                            {reports.length === 0 && <p className="text-xs text-gray-500 mt-2 italic">Cần có ít nhất một báo cáo để tạo tóm tắt.</p>}
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {isReportsLoading ? (
                            [...Array(8)].map((_, i) => <ReportCardSkeleton key={i} />)
                        ) : reports.length > 0 ? (
                            reports.map(report => (
                                <ReportCard 
                                    key={report.id} 
                                    report={report}
                                    onViewDetails={() => setViewingReport(report)}
                                    review={report.managerReview}
                                    reviewerName={report.managerReview?.reviewedByName}
                                />
                            ))
                        ) : (
                            <p className="col-span-full text-center text-gray-500 py-8">Chưa có báo cáo nào cho dự án này.</p>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'approvals' && canViewApprovals && (
                <div className="bg-base-100 rounded-lg shadow-md p-6 border border-gray-200 animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ApprovalCard title="Kế hoạch vốn" approval={project.capitalPlanApproval} />
                    <ApprovalCard title="Phương án kỹ thuật" approval={project.technicalPlanApproval} />
                    <ApprovalCard title="Dự toán" approval={project.budgetApproval} />
                </div>
            )}

            {activeTab === 'workItems' && (
                 <div className="bg-base-100 rounded-lg shadow-md border border-gray-200 animate-fade-in overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-white">
                        <h3 className="text-xl font-bold text-primary">Bảng tiến độ thi công</h3>
                        {project.scheduleSheetEditUrl && (
                            <a 
                                href={project.scheduleSheetEditUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-secondary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
                            >
                                <ExternalLinkIcon className="h-5 w-5" />
                                Mở để Chỉnh sửa
                            </a>
                        )}
                    </div>
                    <div>
                        {project.scheduleSheetUrl ? (
                             <iframe src={project.scheduleSheetUrl} className="w-full h-[70vh] border-none" title="Bảng tiến độ thi công"></iframe>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <p>Chưa có kế hoạch tiến độ nào được thêm vào.</p>
                                {canEditProject && <p className="mt-2 text-sm">Vui lòng vào mục "Chỉnh sửa dự án" để thêm link nhúng từ Google Sheet.</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'info' && (
                <div className="bg-base-100 rounded-lg shadow-md p-6 border border-gray-200 animate-fade-in">
                    {currentUser?.role === Role.Admin && (
                        <DetailSection title="Nhân sự Phụ trách (Phân quyền)">
                            <DetailItem label="Cán bộ Quản lý" value={projectManagers} icon={<UserGroupIcon />} />
                            <DetailItem label="Giám sát trưởng" value={leadSupervisors} icon={<UserGroupIcon />} />
                        </DetailSection>
                    )}

                    <DetailSection title="Mốc thời gian">
{/* FIX: Corrected a syntax error where a component tag was incomplete. */}
                        <DetailItem label="Ngày triển khai thi công" value={project.constructionStartDate} icon={<CalendarIcon />} />
                        <DetailItem label="Ngày nghiệm thu theo kế hoạch" value={project.plannedAcceptanceDate} icon={<CalendarIcon />} />
                    </DetailSection>

                     <DetailSection title="Thông tin các Đơn vị & Cán bộ">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <ContactCard title="Đơn vị Thiết kế" details={[
                                { label: "Công ty", value: project.designUnit?.companyName, icon: <CompanyIcon /> },
                                { label: "Chủ nhiệm", value: project.designUnit?.personnelName, icon: <UserCircleIcon /> },
                                { label: "SĐT", value: project.designUnit?.phone, icon: <PhoneIcon /> },
                            ]} />
                             <ContactCard title="Đơn vị Thi công" details={[
                                { label: "Công ty", value: project.constructionUnit?.companyName, icon: <CompanyIcon /> },
                                { label: "Chỉ huy trưởng", value: project.constructionUnit?.personnelName, icon: <UserCircleIcon /> },
                                { label: "SĐT", value: project.constructionUnit?.phone, icon: <PhoneIcon /> },
                            ]} />
                             <ContactCard title="Đơn vị Giám sát" details={[
                                { label: "Công ty", value: project.supervisionUnit?.companyName, icon: <CompanyIcon /> },
                                { label: "Giám sát trưởng", value: project.supervisionUnit?.personnelName, icon: <UserCircleIcon /> },
                                { label: "SĐT", value: project.supervisionUnit?.phone, icon: <PhoneIcon /> },
                            ]} />
                             <ContactCard title="Cán bộ QLDA" details={[
                                { label: "Phòng", value: project.projectManagementUnit?.departmentName, icon: <CompanyIcon /> },
                                { label: "Cán bộ", value: project.projectManagementUnit?.personnelName, icon: <UserCircleIcon /> },
                                { label: "SĐT", value: project.projectManagementUnit?.phone, icon: <PhoneIcon /> },
                            ]} />
                             <ContactCard title="Giám sát A (QLVH)" details={[
                                { label: "XNDV", value: project.supervisorA?.enterpriseName, icon: <CompanyIcon /> },
                                { label: "Cán bộ", value: project.supervisorA?.personnelName, icon: <UserCircleIcon /> },
                                { label: "SĐT", value: project.supervisorA?.phone, icon: <PhoneIcon /> },
                            ]} />
                        </div>
                    </DetailSection>
                </div>
            )}
        </div>

        {reportToDelete && (
            <ConfirmationModal 
                message={`Bạn có chắc chắn muốn xóa báo cáo ngày ${reportToDelete.date}?`}
                onConfirm={executeDeleteReport}
                onCancel={() => setReportToDelete(null)}
            />
        )}
        {reportToReview && currentUser && (
            <ReviewReportModal 
                report={reportToReview}
                currentUser={currentUser}
                onClose={() => setReportToReview(null)}
                onAddReview={onAddReportReview}
            />
        )}
        {lightboxImages && (
            <ImageLightbox 
                images={lightboxImages}
                startIndex={lightboxIndex}
                onClose={() => setLightboxImages(null)}
            />
        )}
        {viewingReport && (
            <ReportDetailsModal 
                report={viewingReport}
                project={project}
                currentUser={currentUser}
                review={viewingReport.managerReview}
                reviewerName={viewingReport.managerReview?.reviewedByName}
                onClose={() => setViewingReport(null)}
                onEdit={handleEditReport}
                onDelete={handleDeleteReportConfirm}
                onReview={handleStartReview}
                onImageClick={handleImageClick}
            />
        )}
      </div>
    );
};

export default ProjectDetails;