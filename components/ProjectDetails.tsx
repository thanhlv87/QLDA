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

// Modal for Project Manager to add a review
const ReviewReportModal: React.FC<{
    report: DailyReport;
    currentUser: User;
    onClose: () => void;
    onAddReview: (projectId: string, reportId: string, comment: string, userId: string) => Promise<void>;
}> = ({ report, currentUser, onClose, onAddReview }) => {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setIsSubmitting(true);
        await onAddReview(report.projectId, report.id, comment, currentUser.id);
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
                    <footer className="p-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
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

const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode }> = ({ label, value }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-sm">
    <dt className="font-medium text-gray-500">{label}</dt>
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

const ContactCard: React.FC<{ title: string; details: { label: string; value: string }[] }> = ({ title, details }) => (
    <div className="p-4 bg-gray-50 rounded-md border h-full">
        <h5 className="font-semibold text-gray-800 mb-3 text-base">{title}</h5>
        <div className="space-y-2">
            {details.map(item => <DetailItem key={item.label} label={item.label} value={item.value} />)}
        </div>
    </div>
);


interface ProjectDetailsProps {
    project: Project;
    reports: (DailyReport & { managerReview?: ProjectReview })[]; // Reports with review attached
    currentUser: User | null;
    users: User[];
    onBack: () => void;
    onAddReport: (reportData: Omit<DailyReport, 'id'>) => Promise<void>;
    onUpdateProject: (projectData: Project) => Promise<void>;
    onDeleteProject: (projectId: string, projectName: string) => void;
    onUpdateReport: (reportData: DailyReport) => Promise<void>;
    onDeleteReport: (reportId: string, projectId: string) => Promise<void>;
    onAddReportReview: (projectId: string, reportId: string, comment: string, userId: string) => Promise<void>;
}

type DetailsView = 'details' | 'editProject' | 'addReport' | 'editReport';
type ActiveTab = 'reports' | 'info';

const ProjectDetails: React.FC<ProjectDetailsProps> = ({
    project,
    reports,
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
    const [activeTab, setActiveTab] = useState<ActiveTab>('reports');
    const [selectedReportToEdit, setSelectedReportToEdit] = useState<DailyReport | null>(null);
    const [reportToDelete, setReportToDelete] = useState<{ id: string; date: string } | null>(null);
    const [reportToReview, setReportToReview] = useState<DailyReport | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [aiSummary, setAiSummary] = useState<string>('');
    
    useEffect(() => {
        setAiSummary('');
        setActiveTab('reports');
    }, [project.id]);

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        setAiSummary('');
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
        setSelectedReportToEdit(report);
        setView('editReport');
    };
    
    const handleDeleteReportConfirm = (reportId: string, reportDate: string) => {
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
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'N/A';
    const canAddReport = useMemo(() => permissions.canAddReport(currentUser, project), [currentUser, project]);
    const canEditProject = useMemo(() => permissions.canEditProject(currentUser, project), [currentUser, project]);
    const canReviewReports = useMemo(() => permissions.canReviewReport(currentUser, project), [currentUser, project]);

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

    const renderProjectInfo = () => (
         <div className="bg-base-100 rounded-lg shadow-md p-6 border border-gray-200 animate-fade-in">
            {currentUser?.role === Role.Admin && (
                <DetailSection title="Nhân sự Phụ trách (Phân quyền)">
                    <DetailItem label="Cán bộ Quản lý" value={projectManagers} />
                    <DetailItem label="Giám sát trưởng" value={leadSupervisors} />
                </DetailSection>
            )}

             <DetailSection title="Mốc thời gian">
                <DetailItem label="Ngày triển khai thi công" value={project.constructionStartDate} />
                <DetailItem label="Ngày nghiệm thu theo kế hoạch" value={project.plannedAcceptanceDate} />
            </DetailSection>

            <DetailSection title="Thông tin Phê duyệt">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                    <ApprovalCard title="Kế hoạch vốn" approval={project.capitalPlanApproval} />
                    <ApprovalCard title="Phương án kỹ thuật" approval={project.technicalPlanApproval} />
                    <ApprovalCard title="Dự toán" approval={project.budgetApproval} />
                </div>
            </DetailSection>
            
            <DetailSection title="Thông tin các Đơn vị & Cán bộ">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    <ContactCard title="Cán bộ Quản lý Dự án" details={[
                        { label: 'Tên phòng', value: project.projectManagementUnit?.departmentName || '' },
                        { label: 'Tên Cán bộ', value: project.projectManagementUnit?.personnelName || '' },
                        { label: 'SĐT', value: project.projectManagementUnit?.phone || '' },
                    ]} />
                    <ContactCard title="Giám sát A (QLVH)" details={[
                        { label: 'Tên XNDV', value: project.supervisorA?.enterpriseName || '' },
                        { label: 'Tên Cán bộ', value: project.supervisorA?.personnelName || '' },
                        { label: 'SĐT', value: project.supervisorA?.phone || '' },
                    ]} />
                     <ContactCard title="Đơn vị Thiết kế" details={[
                        { label: 'Tên công ty', value: project.designUnit.companyName },
                        { label: 'Chủ nhiệm đề án', value: project.designUnit.personnelName },
                        { label: 'SĐT', value: project.designUnit.phone },
                    ]} />
                    <ContactCard title="Đơn vị Thi công" details={[
                        { label: 'Tên công ty', value: project.constructionUnit.companyName },
                        { label: 'Chỉ huy trưởng', value: project.constructionUnit.personnelName },
                        { label: 'SĐT', value: project.constructionUnit.phone },
                    ]} />
                    <ContactCard title="Đơn vị Giám sát" details={[
                        { label: 'Tên công ty', value: project.supervisionUnit.companyName },
                        { label: 'Giám sát trưởng', value: project.supervisionUnit.personnelName },
                        { label: 'SĐT', value: project.supervisionUnit.phone },
                    ]} />
                </div>
            </DetailSection>
        </div>
    );

    const renderReports = () => (
         <div className="animate-fade-in space-y-8">
            <div className="bg-base-100 rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-primary">Tóm tắt tiến độ (AI)</h3>
                    <button 
                        onClick={handleGenerateSummary} 
                        disabled={isGeneratingSummary}
                        className="bg-primary text-white font-semibold py-2 px-4 rounded-md hover:opacity-90 disabled:bg-gray-400 disabled:cursor-wait transition-colors"
                    >
                        {isGeneratingSummary ? 'Đang tạo...' : 'Tạo tóm tắt'}
                    </button>
                </div>
                {isGeneratingSummary && <p className="text-gray-600">AI đang phân tích báo cáo, vui lòng chờ...</p>}
                {aiSummary && (
                    <div className="prose max-w-none text-gray-700 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br />') }}></div>
                )}
            </div>
            
            <div className="bg-base-100 rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-primary">Báo cáo hàng ngày</h3>
                    {canAddReport && (
                        <button onClick={() => setView('addReport')} className="bg-success text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 transition-colors">
                            + Gửi báo cáo mới
                        </button>
                    )}
                </div>

                {reports.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {reports.map(report => (
                            <ReportCard
                                key={report.id}
                                report={report}
                                onEdit={() => handleEditReport(report)}
                                onDelete={() => handleDeleteReportConfirm(report.id, report.date)}
                                onReview={() => setReportToReview(report)}
                                canEdit={permissions.canEditReport(currentUser, project)}
                                canDelete={permissions.canDeleteReport(currentUser, project)}
                                canReview={canReviewReports}
                                review={report.managerReview}
                                reviewerName={report.managerReview ? getUserName(report.managerReview.reviewedById) : ''}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Chưa có báo cáo nào cho dự án này.</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <button onClick={onBack} className="text-secondary hover:text-accent font-semibold flex items-center mb-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Trở về Dashboard
                    </button>
                    <h2 className="text-3xl font-bold text-gray-800">{project.name}</h2>
                </div>
                {canEditProject && (
                    <button onClick={() => setView('editProject')} className="bg-secondary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity">
                        Chỉnh sửa Dự án
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'reports'
                            ? 'border-secondary text-secondary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        aria-current={activeTab === 'reports' ? 'page' : undefined}
                    >
                        Báo cáo & Tiến độ
                    </button>
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'info'
                            ? 'border-secondary text-secondary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        aria-current={activeTab === 'info' ? 'page' : undefined}
                    >
                        Thông tin Dự án
                    </button>
                </nav>
            </div>
            
            {/* Tab Content */}
            <div>
                {activeTab === 'reports' && renderReports()}
                {activeTab === 'info' && renderProjectInfo()}
            </div>
            
            {/* Modals */}
             {reportToReview && currentUser && (
                <ReviewReportModal
                    report={reportToReview}
                    currentUser={currentUser}
                    onClose={() => setReportToReview(null)}
                    onAddReview={onAddReportReview}
                />
            )}
            {reportToDelete && (
                <ConfirmationModal
                    message={`Bạn có chắc chắn muốn xóa báo cáo ngày "${reportToDelete.date}"?`}
                    onConfirm={executeDeleteReport}
                    onCancel={() => setReportToDelete(null)}
                />
            )}
        </div>
    );
};

export default ProjectDetails;