import React, { useState, useRef, useEffect } from 'react';
import type { Project, User } from '../types.ts';
import { Role } from '../types.ts';
import { permissions } from '../services/permissions.ts';
import { XIcon, ChevronDownIcon } from './Icons.tsx';

interface EditProjectFormProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
    onCancel: () => void;
    users: User[];
    currentUser: User | null;
}

// Reusable component for a multi-select dropdown with checkboxes
const MultiSelectCheckbox: React.FC<{
    label: string;
    options: { value: string; label: string; }[];
    selectedValues: string[];
    onChange: (selected: string[]) => void;
    name: string;
}> = ({ label, options, selectedValues, onChange, name }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (value: string) => {
        const newSelection = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onChange(newSelection);
    };

    const selectedLabels = options
        .filter(opt => selectedValues.includes(opt.value))
        .map(opt => opt.label)
        .join(', ');

    return (
        <div className="relative" ref={wrapperRef}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <button
                type="button"
                id={name}
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-left text-gray-900 flex justify-between items-center h-10"
            >
                <span className="truncate pr-2">
                    {selectedLabels || <span className="text-gray-500">Chọn nhân sự...</span>}
                </span>
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    <ul>
                        {options.map(option => (
                            <li
                                key={option.value}
                                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                onClick={() => handleSelect(option.value)}
                            >
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary mr-3 shrink-0"
                                    checked={selectedValues.includes(option.value)}
                                    readOnly
                                />
                                <span className="text-sm text-gray-900">{option.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

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
    // Ensure nested objects exist for the form fields
    const initialFormData = {
        ...project,
        projectManagementUnits: (project.projectManagementUnits && project.projectManagementUnits.length > 0)
            ? project.projectManagementUnits
            : [{ departmentName: '', personnelName: '', phone: '' }],
        capitalPlanApproval: project.capitalPlanApproval || { decisionNumber: '', date: '' },
        technicalPlanStage: project.technicalPlanStage || { submissionDate: '', approvalDate: '' },
        budgetStage: project.budgetStage || { submissionDate: '', approvalDate: '' },
        designBidding: project.designBidding || { itbIssuanceDate: '', contractSignDate: '' },
        supervisionBidding: project.supervisionBidding || { itbIssuanceDate: '', contractSignDate: '' },
        constructionBidding: project.constructionBidding || { itbIssuanceDate: '', contractSignDate: '' },
        finalSettlementStage: project.finalSettlementStage || { submissionDate: '', approvalDate: '' },
    };
    const [formData, setFormData] = useState<Project>(initialFormData);

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

        if (keys[0] === 'projectManagementUnits' && keys.length === 3) {
            const index = parseInt(keys[1], 10);
            const field = keys[2];
            setFormData(prev => {
                const newUnits = [...(prev.projectManagementUnits || [])];
                if (newUnits[index]) {
                    newUnits[index] = { ...newUnits[index], [field]: finalValue };
                }
                return { ...prev, projectManagementUnits: newUnits };
            });
        }
        else if (keys.length > 1) {
            setFormData(prev => ({
                ...prev,
                [keys[0]]: {
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

    const handleMultiSelectCheckboxChange = (name: string, selectedIds: string[]) => {
        setFormData(prev => ({ ...prev, [name]: selectedIds }));
    };

    const handleAddPmContact = () => {
        setFormData(prev => ({
            ...prev,
            projectManagementUnits: [
                ...(prev.projectManagementUnits || []),
                { departmentName: '', personnelName: '', phone: '' }
            ]
        }));
    };
    
    const handleRemovePmContact = (index: number) => {
        setFormData(prev => {
            const newUnits = (prev.projectManagementUnits || []).filter((_, i) => i !== index);
             // Ensure at least one contact form remains
            if (newUnits.length === 0) newUnits.push({ departmentName: '', personnelName: '', phone: '' });
            return { ...prev, projectManagementUnits: newUnits };
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProject(formData);
    };

    const projectManagers = users.filter(u => u.role === Role.ProjectManager);
    const leadSupervisors = users.filter(u => u.role === Role.LeadSupervisor);

    const projectManagerOptions = projectManagers.map(user => ({ value: user.id, label: user.name }));
    const leadSupervisorOptions = leadSupervisors.map(user => ({ value: user.id, label: user.name }));

    return (
        <div className="bg-base-100 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary">Chỉnh sửa dự án</h2>
                <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            <p className="text-lg text-gray-600 mb-6">{project.name}</p>

            <form onSubmit={handleSubmit} className="space-y-8">

                 <fieldset className="p-4 border rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Kế hoạch Tiến độ (Google Sheet)</legend>
                    <div className="mt-2 space-y-4">
                        <div>
                            <Input 
                              label="Link nhúng (để hiển thị)" 
                              name="scheduleSheetUrl" 
                              value={formData.scheduleSheetUrl || ''} 
                              onChange={handleChange} 
                              placeholder="Dán link nhúng (src) từ Google Sheets..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Trong Google Sheet, chọn 'Tệp' > 'Chia sẻ' > 'Xuất bản lên web' > 'Nhúng', sau đó sao chép đường link trong thuộc tính 'src'.</p>
                        </div>
                         <div>
                            <Input 
                              label="Link Chỉnh sửa (để mở file gốc)" 
                              name="scheduleSheetEditUrl" 
                              value={formData.scheduleSheetEditUrl || ''} 
                              onChange={handleChange} 
                              placeholder="Dán link từ thanh địa chỉ trình duyệt..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Sao chép đường link bình thường từ thanh địa chỉ của trình duyệt (link có chữ /edit ở cuối).</p>
                        </div>
                    </div>
                </fieldset>

                {permissions.canEditPersonnel(currentUser) && (
                     <fieldset className="p-4 border rounded-md">
                        <legend className="px-2 font-semibold text-gray-700">Gán Nhân sự Phụ trách (để phân quyền)</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                           <MultiSelectCheckbox
                                label="Cán bộ Quản lý (chọn nhiều)"
                                name="projectManagerIds"
                                options={projectManagerOptions}
                                selectedValues={formData.projectManagerIds}
                                onChange={(selected) => handleMultiSelectCheckboxChange('projectManagerIds', selected)}
                            />
                           <MultiSelectCheckbox
                                label="Giám sát trưởng (chọn nhiều)"
                                name="leadSupervisorIds"
                                options={leadSupervisorOptions}
                                selectedValues={formData.leadSupervisorIds}
                                onChange={(selected) => handleMultiSelectCheckboxChange('leadSupervisorIds', selected)}
                            />
                        </div>
                    </fieldset>
                )}
                
                <fieldset className="p-4 border rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Các Mốc Thời gian Phê duyệt & Thi công</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 mt-4">
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">1. Giao danh mục</h4>
                            <Input label="Số QĐ giao" name="capitalPlanApproval.decisionNumber" value={formData.capitalPlanApproval?.decisionNumber || ''} onChange={handleChange} />
                            <Input label="Ngày giao DM" name="capitalPlanApproval.date" value={toYMD(formData.capitalPlanApproval?.date || '')} onChange={handleChange} type="date" />
                        </div>

                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">2. Đấu thầu: TV Thiết kế</h4>
                            <Input label="Ngày P.hành HSMT" name="designBidding.itbIssuanceDate" value={toYMD(formData.designBidding?.itbIssuanceDate || '')} onChange={handleChange} type="date" />
                            <Input label="Ngày ký Hợp đồng" name="designBidding.contractSignDate" value={toYMD(formData.designBidding?.contractSignDate || '')} onChange={handleChange} type="date" />
                        </div>

                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">3. Phê duyệt: P.án kỹ thuật</h4>
                            <Input label="Ngày nộp" name="technicalPlanStage.submissionDate" value={toYMD(formData.technicalPlanStage?.submissionDate || '')} onChange={handleChange} type="date" />
                            <Input label="Ngày duyệt" name="technicalPlanStage.approvalDate" value={toYMD(formData.technicalPlanStage?.approvalDate || '')} onChange={handleChange} type="date" />
                        </div>
                        
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">4. Phê duyệt: Dự toán</h4>
                            <Input label="Ngày nộp" name="budgetStage.submissionDate" value={toYMD(formData.budgetStage?.submissionDate || '')} onChange={handleChange} type="date" />
                            <Input label="Ngày duyệt" name="budgetStage.approvalDate" value={toYMD(formData.budgetStage?.approvalDate || '')} onChange={handleChange} type="date" />
                        </div>
                        
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">5. Đấu thầu: GS Thi công</h4>
                            <Input label="Ngày P.hành HSMT" name="supervisionBidding.itbIssuanceDate" value={toYMD(formData.supervisionBidding?.itbIssuanceDate || '')} onChange={handleChange} type="date" />
                            <Input label="Ngày ký Hợp đồng" name="supervisionBidding.contractSignDate" value={toYMD(formData.supervisionBidding?.contractSignDate || '')} onChange={handleChange} type="date" />
                        </div>

                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">6. Đấu thầu: TC Sửa chữa</h4>
                            <Input label="Ngày P.hành HSMT" name="constructionBidding.itbIssuanceDate" value={toYMD(formData.constructionBidding?.itbIssuanceDate || '')} onChange={handleChange} type="date" />
                            <Input label="Ngày ký Hợp đồng" name="constructionBidding.contractSignDate" value={toYMD(formData.constructionBidding?.contractSignDate || '')} onChange={handleChange} type="date" />
                        </div>

                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">7. Triển khai thi công</h4>
                            <Input label="Ngày triển khai" name="constructionStartDate" value={toYMD(formData.constructionStartDate)} onChange={handleChange} type="date" />
                            <Input label="Ngày nghiệm thu KH" name="plannedAcceptanceDate" value={toYMD(formData.plannedAcceptanceDate)} onChange={handleChange} type="date" />
                        </div>

                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">8. Quyết toán</h4>
                            <Input label="Ngày nộp" name="finalSettlementStage.submissionDate" value={toYMD(formData.finalSettlementStage?.submissionDate || '')} onChange={handleChange} type="date" />
                            <Input label="Ngày duyệt" name="finalSettlementStage.approvalDate" value={toYMD(formData.finalSettlementStage?.approvalDate || '')} onChange={handleChange} type="date" />
                        </div>
                    </div>
                </fieldset>

                <fieldset className="p-4 border rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Thông tin các Đơn vị & Cán bộ</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border md:col-span-1">
                             <h4 className="font-medium text-gray-800">Cán bộ Quản lý Dự án</h4>
                            {(formData.projectManagementUnits || []).map((contact, index) => (
                                <div key={index} className="space-y-3 p-3 border rounded-md relative bg-white shadow-sm">
                                    { (formData.projectManagementUnits?.length || 0) > 1 && (
                                        <button type="button" onClick={() => handleRemovePmContact(index)} className="absolute top-2 right-2 text-error hover:text-red-700 p-1 rounded-full bg-red-50 hover:bg-red-100" aria-label="Xóa cán bộ">
                                            <XIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                    <Input label={`Tên phòng ${ (formData.projectManagementUnits?.length || 0) > 1 ? `#${index + 1}` : ''}`} name={`projectManagementUnits.${index}.departmentName`} value={contact.departmentName} onChange={handleChange} />
                                    <Input label={`Tên Cán bộ ${ (formData.projectManagementUnits?.length || 0) > 1 ? `#${index + 1}` : ''}`} name={`projectManagementUnits.${index}.personnelName`} value={contact.personnelName} onChange={handleChange} />
                                    <Input label={`SĐT ${ (formData.projectManagementUnits?.length || 0) > 1 ? `#${index + 1}` : ''}`} name={`projectManagementUnits.${index}.phone`} value={contact.phone} onChange={handleChange} />
                                </div>
                            ))}
                            <button type="button" onClick={handleAddPmContact} className="text-sm text-secondary font-semibold hover:underline mt-2">
                                + Thêm cán bộ QLDA
                            </button>
                        </div>
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
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