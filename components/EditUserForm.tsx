import React, { useState, useEffect } from 'react';
import { Role, User, Project } from '../types';

interface EditUserFormProps {
  user: User;
  projects: Project[];
  onUpdateUser: (userData: { userId: string; name: string; role: Role; username: string; selectedProjectIds: string[] }) => void;
  onCancel: () => void;
}

const EditUserForm: React.FC<EditUserFormProps> = ({ user, projects, onUpdateUser, onCancel }) => {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<Role>(user.role);
  const [username, setUsername] = useState(user.username || '');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  
  useEffect(() => {
    // Pre-populate the selected projects for the user being edited
    const assignedProjectIds = projects
      .filter(p => p.projectManagerIds.includes(user.id) || p.leadSupervisorIds.includes(user.id))
      .map(p => p.id);
    setSelectedProjectIds(assignedProjectIds);
  }, [user, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      alert('Vui lòng nhập Họ và tên và Tên tài khoản.');
      return;
    }
    onUpdateUser({ userId: user.id, name, role, username, selectedProjectIds });
  };
  
  const handleProjectSelection = (projectId: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const assignableRoles = [Role.ProjectManager, Role.LeadSupervisor];

  return (
    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mt-4">
        <h4 className="text-lg font-bold text-yellow-800 mb-4">Chỉnh sửa thông tin: {user.name}</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label htmlFor="editUserName" className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    <input
                        id="editUserName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="editUserUsername" className="block text-sm font-medium text-gray-700 mb-1">Tên tài khoản</label>
                    <input
                        id="editUserUsername"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="editUserRole" className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                    <select
                        id="editUserRole"
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white"
                    >
                        {assignableRoles.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Điều chỉnh phân công dự án</label>
                <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border border-gray-300 p-3 bg-white">
                    {projects.length > 0 ? projects.map(project => (
                        <div key={project.id} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`edit-project-${project.id}`}
                                checked={selectedProjectIds.includes(project.id)}
                                onChange={() => handleProjectSelection(project.id)}
                                className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300 rounded"
                            />
                            <label htmlFor={`edit-project-${project.id}`} className="ml-3 block text-sm text-gray-800 cursor-pointer">
                                {project.name}
                            </label>
                        </div>
                    )) : <p className="text-gray-500 italic text-sm">Không có dự án nào để gán.</p>}
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                    Hủy
                </button>
                 <button 
                    type="submit"
                    className="bg-success text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                 >
                    Lưu Thay Đổi
                </button>
            </div>
        </form>
    </div>
  );
};

export default EditUserForm;