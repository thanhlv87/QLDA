import React, { useState } from 'react';
import type { Project, User } from '../types';
import { Role } from '../types';

interface AddProjectFormProps {
    onAddProject: (project: Omit<Project, 'id'>) => void;
    onCancel: () => void;
    users: User[];
}

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, type = 'text', ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            id={props.name}
            type={type}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
            {...props}
        />
    </div>
);

const toYMD = (dmy: string): string => {
    if (!dmy || typeof dmy !== 'string') return '';
    const parts = dmy.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const toDMY = (ymd: string): string => {
    if (!ymd || typeof ymd !== 'string') return '';
    const parts = ymd.split('-');
    if (parts.length !== 3) return '';
    const [year, month, day] = parts;
    return `${day.padStart(2,'0')}/${month.padStart(2,'0')}/${year}`;
};

const initialState: Omit<Project, 'id'> = {
  name: '',
  projectManagerIds: [],
  leadSupervisorIds: [],
  constructionStartDate: '',
  plannedAcceptanceDate: '',
  capitalPlanApproval: { decisionNumber: '', date: '' },
  technicalPlanApproval: { decisionNumber: '', date: '' },
  budgetApproval: { decisionNumber: '', date: '' },
  designUnit: { name: '', phone: '' },
  constructionUnit: { name: '', phone: '' },
  supervisionUnit: { name: '', phone: '' }
};


const AddProjectForm: React.FC<AddProjectFormProps> = ({ onAddProject, onCancel, users }) => {
    const [formData, setFormData] = useState<Omit<Project, 'id'>>(initialState);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'date' ? toDMY(value) : value;
        const keys = name.split('.');

        if (keys.length > 1) {
            setFormData(prev => ({
                ...prev,
                [keys[0]]: {
                    // Fix: The type of `prev[keys[0]]` is a union that includes non-object types,
                    // which cannot be spread. Since the logic ensures this code path only runs for
                    // nested objects, we cast it to `Record<string, any>` to satisfy TypeScript.
                    ...(prev[keys[0] as keyof typeof prev] as Record<string, any>),
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
            .filter(option => option.selected)
            .map(option => option.value);
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddProject(formData);
    };

    const projectManagers = users.filter(u => u.role === Role.ProjectManager);
    const leadSupervisors = users.filter(u => u.role === Role.LeadSupervisor);

    return (
        <div className="bg-base-100 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200 animate-fade-in max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary">Thêm dự án mới</h2>
                <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 font-semibold">
                    &larr; Quay lại
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                 <Input label="Tên Dự án" name="name" value={formData.name} onChange={handleChange} required />
                
                 <fieldset className="p-4 border rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Nhân sự Phụ trách</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                        <div>
                            <label htmlFor="projectManagerIds" className="block text-sm font-medium text-gray-700 mb-1">Cán bộ Quản lý (chọn nhiều)</label>
                            <select
                                id="projectManagerIds"
                                name="projectManagerIds"
                                multiple
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary h-32"
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
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary h-32"
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
                        <Input label="Ngày triển khai thi công" name="constructionStartDate" value={toYMD(formData.constructionStartDate)} onChange={handleChange} type="date" required />
                        <Input label="Ngày nghiệm thu theo kế hoạch" name="plannedAcceptanceDate" value={toYMD(formData.plannedAcceptanceDate)} onChange={handleChange} type="date" required />
                    </div>
                </fieldset>

                 <fieldset className="p-4 border rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Thông tin các Đơn vị</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">Đơn vị Thiết kế</h4>
                            <Input label="Chủ nhiệm" name="designUnit.name" value={formData.designUnit.name} onChange={handleChange} />
                            <Input label="SĐT" name="designUnit.phone" value={formData.designUnit.phone} onChange={handleChange} />
                        </div>
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">Đơn vị Thi công</h4>
                            <Input label="Chỉ huy trưởng" name="constructionUnit.name" value={formData.constructionUnit.name} onChange={handleChange} />
                            <Input label="SĐT" name="constructionUnit.phone" value={formData.constructionUnit.phone} onChange={handleChange} />
                        </div>
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">Đơn vị Giám sát</h4>
                            <Input label="Tên đơn vị" name="supervisionUnit.name" value={formData.supervisionUnit.name} onChange={handleChange} />
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
                        Tạo Dự án
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddProjectForm;