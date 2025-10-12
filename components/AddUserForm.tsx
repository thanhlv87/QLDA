import React, { useState } from 'react';
import { Role, User, Project } from '../types';

interface AddUserFormProps {
  onAddUser: (userData: { name: string; role: Role; username: string; password: string; selectedProjectIds: string[] }) => void;
  onCancel: () => void;
  projects: Project[];
}

const AddUserForm: React.FC<AddUserFormProps> = ({ onAddUser, onCancel, projects }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>(Role.ProjectManager);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      alert('Vui lòng điền đầy đủ thông tin: Họ tên, Tên tài khoản, và Mật khẩu.');
      return;
    }
    onAddUser({ name, role, username, password, selectedProjectIds });
    // Clear form
    setName('');
    setRole(Role.ProjectManager);
    setUsername('');
    setPassword('');
    setSelectedProjectIds([]);
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
    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mt-4">
        <h4 className="text-lg font-bold text-primary mb-4">Thêm nhân sự mới</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    <input
                        id="userName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                        placeholder="VD: Hoàng Thị G"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="userRole" className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                    <select
                        id="userRole"
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white"
                    >
                        {assignableRoles.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="userUsername" className="block text-sm font-medium text-gray-700 mb-1">Tên tài khoản</label>
                    <input
                        id="userUsername"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                        placeholder="VD: hoangthig"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="userPassword" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                    <input
                        id="userPassword"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                        placeholder="••••••••"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gán vào dự án (tùy chọn)</label>
                <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border border-gray-300 p-3 bg-white">
                    {projects.length > 0 ? projects.map(project => (
                        <div key={project.id} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`project-${project.id}`}
                                checked={selectedProjectIds.includes(project.id)}
                                onChange={() => handleProjectSelection(project.id)}
                                className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300 rounded"
                            />
                            <label htmlFor={`project-${project.id}`} className="ml-3 block text-sm text-gray-800 cursor-pointer">
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
                    className="bg-secondary text-white font-bold py-2 px-4 rounded-md hover:bg-primary transition-colors"
                 >
                    Lưu Nhân sự
                </button>
            </div>
        </form>
    </div>
  );
};

export default AddUserForm;