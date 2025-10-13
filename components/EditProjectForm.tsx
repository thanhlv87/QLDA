import React, { useState } from 'react';
import type { Project, User } from '../types';
import { Role } from '../types';
import { permissions } from '../services/permissions';

interface EditProjectFormProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
    onCancel: () => void;
    users: User[];
    currentUser: User | null;
}

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, type = 'text', ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            id={props.name}
            type={type}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
            style={type === 'date' ? { colorScheme: 'light' } : {}}
            {...props}
        />
    </div>
);


const EditProjectForm: React.FC<EditProjectFormProps> = ({ project, onUpdateProject, onCancel, users, currentUser }) => {
    const [formData, setFormData] = useState<Project>(project);

    // Helper to convert DD/MM/YYYY to YYYY-MM-DD for date input value
    const toYMD = (dmy: string): string => {
        if (!dmy || typeof dmy !== 'string') return '';
        const parts = dmy.split('/');
        if (parts.length !== 3) return '';
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };
    
    // Helper to convert YYYY-MM-DD from date input to DD/MM/YYYY for state
    const toDMY = (ymd: string): string => {
        if (!ymd || typeof ymd !== 'string') return '';
        const parts = ymd.split('-');
        if (parts.length !== 3) return '';
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'date' ? toDMY(value) : value;
        const keys = name.split('.');

        if (keys.length > 1) {
            setFormData(prev => ({
                ...prev,
                [keys[0]]: {
                    // @ts-ignore
                    ...prev[keys[0]],
                    [keys[1]]: finalValue
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: finalValue
            }));
        }
    };

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, options } = e.target;
        const value = Array.from(options)
            .filter((option: HTMLOptionElement) => option.selected)
            // FIX: Explicitly type `option` to resolve TS error where it was inferred as `unknown`.
            .map((option: HTMLOptionElement) => option.value);
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProject(formData);
    };

    const projectManagers = users.filter(u => u.role === Role.ProjectManager);
    const leadSupervisors = users.filter(u => u.role === Role.LeadSupervisor);

    return (
        <div className="bg-base-100 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary">Chỉnh sửa dự án</h2>
                <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <p className="text-lg text-gray-600 mb-6">{project.name}</p>

            <form onSubmit={handleSubmit} className="space-y-8">

                {permissions.canEditPersonnel(currentUser) && (
                     <fieldset className="p-4 border rounded-md">
                        <legend className="px-2 font-semibold text-gray-700">Gán Nhân sự Phụ trách (để phân quyền)</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                            <div>
                                <label htmlFor="projectManagerIds" className="block text-sm font-medium text-gray-700 mb-1">Cán bộ Quản lý (chọn nhiều)</label>
                                <select
                                    id="projectManagerIds"
                                    name="projectManagerIds"
                                    multiple
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary h-32 bg-white text-gray-900"
                                    value={formData.projectManagerIds}
                                    onChange={handleMultiSelectChange}
                                >
                                    {projectManagers.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="leadSupervisorIds" className="block text-sm font-medium text-gray-700 mb-1">Giám sát trưởng (chọn nhiều)</label>
                                <select
                                    id="leadSupervisorIds"
                                    name="leadSupervisorIds"
                                    multiple
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary h-32 bg-white text-gray-900"
                                    value={formData.leadSupervisorIds}
                                    onChange={handleMultiSelectChange}
                                >
                                    {leadSupervisors.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </fieldset>
                )}
                
                <fieldset className="p-4 border rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Thông tin Phê duyệt</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">Kế hoạch vốn</h4>
                            <Input label="Số Quyết định" name="capitalPlanApproval.decisionNumber" value={formData.capitalPlanApproval.decisionNumber} onChange={handleChange} />
                            <Input label="Ngày" name="capitalPlanApproval.date" value={toYMD(formData.capitalPlanApproval.date)} onChange={handleChange} type="date"/>
                        </div>
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">Phương án kỹ thuật</h4>
                            <Input label="Số Quyết định" name="technicalPlanApproval.decisionNumber" value={formData.technicalPlanApproval.decisionNumber} onChange={handleChange} />
                            <Input label="Ngày" name="technicalPlanApproval.date" value={toYMD(formData.technicalPlanApproval.date)} onChange={handleChange} type="date"/>
                        </div>
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">Dự toán</h4>
                            <Input label="Số Quyết định" name="budgetApproval.decisionNumber" value={formData.budgetApproval.decisionNumber} onChange={handleChange} />
                            <Input label="Ngày" name="budgetApproval.date" value={toYMD(formData.budgetApproval.date)} onChange={handleChange} type="date"/>
                        </div>
                    </div>
                </fieldset>

                 <fieldset className="p-4 border rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Mốc thời gian</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                        <Input label="Ngày triển khai thi công" name="constructionStartDate" value={toYMD(formData.constructionStartDate)} onChange={handleChange} type="date" />
                        <Input label="Ngày nghiệm thu theo kế hoạch" name="plannedAcceptanceDate" value={toYMD(formData.plannedAcceptanceDate)} onChange={handleChange} type="date" />
                    </div>
                </fieldset>

                <fieldset className="p-4 border rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Thông tin các Đơn vị & Cán bộ</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-3 p-4 bg-blue-50 rounded-md border border-blue-200">
                            <h4 className="font-medium text-gray-800">Cán bộ Quản lý Dự án</h4>
                            <Input label="Tên phòng" name="projectManagementUnit.departmentName" value={formData.projectManagementUnit?.departmentName || ''} onChange={handleChange} />
                            <Input label="Tên Cán bộ" name="projectManagementUnit.personnelName" value={formData.projectManagementUnit?.personnelName || ''} onChange={handleChange} />
                            <Input label="SĐT" name="projectManagementUnit.phone" value={formData.projectManagementUnit?.phone || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-3 p-4 bg-blue-50 rounded-md border border-blue-200">
                            <h4 className="font-medium text-gray-800">Giám sát A của đơn vị QLVH</h4>
                            <Input label="Tên XNDV" name="supervisorA.enterpriseName" value={formData.supervisorA?.enterpriseName || ''} onChange={handleChange} />
                            <Input label="Tên Cán bộ" name="supervisorA.personnelName" value={formData.supervisorA?.personnelName || ''} onChange={handleChange} />
                            <Input label="SĐT" name="supervisorA.phone" value={formData.supervisorA?.phone || ''} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">Đơn vị Thiết kế</h4>
                            <Input label="Tên công ty" name="designUnit.companyName" value={formData.designUnit.companyName} onChange={handleChange} />
                            <Input label="Chủ nhiệm đề án" name="designUnit.personnelName" value={formData.designUnit.personnelName} onChange={handleChange} />
                            <Input label="SĐT" name="designUnit.phone" value={formData.designUnit.phone} onChange={handleChange} />
                        </div>
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">Đơn vị Thi công</h4>
                            <Input label="Tên công ty" name="constructionUnit.companyName" value={formData.constructionUnit.companyName} onChange={handleChange} />
                            <Input label="Chỉ huy trưởng" name="constructionUnit.personnelName" value={formData.constructionUnit.personnelName} onChange={handleChange} />
                            <Input label="SĐT" name="constructionUnit.phone" value={formData.constructionUnit.phone} onChange={handleChange} />
                        </div>
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">Đơn vị Giám sát</h4>
                            <Input label="Tên công ty" name="supervisionUnit.companyName" value={formData.supervisionUnit.companyName} onChange={handleChange} />
                            <Input label="Giám sát trưởng" name="supervisionUnit.personnelName" value={formData.supervisionUnit.personnelName} onChange={handleChange} />
                            <Input label="SĐT" name="supervisionUnit.phone" value={formData.supervisionUnit.phone} onChange={handleChange} />
                        </div>
                    </div>
                </fieldset>

                <div className="flex justify-end space-x-3 pt-4">
                    <button 
                        type="button" 
                        onClick={onCancel}
                        className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        type="submit"
                        className="bg-success text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 transition-colors"
                    >
                        Lưu Thay Đổi
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditProjectForm;