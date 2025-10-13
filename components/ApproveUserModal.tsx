import React, { useState } from 'react';
import { User, Role } from '../types';

interface ApproveUserModalProps {
  user: User;
  onApprove: (user: User, role: Role) => void;
  onCancel: () => void;
}

const ApproveUserModal: React.FC<ApproveUserModalProps> = ({ user, onApprove, onCancel }) => {
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      onApprove(user, selectedRole);
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in" 
        onClick={onCancel}
        role="dialog"
        aria-modal="true"
    >
        <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
        >
            <form onSubmit={handleSubmit}>
                <header className="p-4 border-b">
                    <h3 className="text-lg font-bold text-gray-800">Phê duyệt & Phân quyền</h3>
                    <p className="text-sm text-gray-500">Tài khoản: {user.email}</p>
                </header>
                <main className="p-6">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn vai trò để gán cho người dùng
                    </label>
                    <select
                        id="role"
                        name="role"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as Role)}
                        required
                    >
                        <option value="" disabled>-- Chọn vai trò --</option>
                        {Object.values(Role).map(roleValue => (
                            <option key={roleValue} value={roleValue}>{roleValue}</option>
                        ))}
                    </select>
                </main>
                <footer className="flex justify-end space-x-3 p-4 bg-gray-50 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={!selectedRole}
                        className="bg-success text-white font-bold py-2 px-4 rounded-md transition-colors hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Lưu & Phê duyệt
                    </button>
                </footer>
            </form>
        </div>
    </div>
  );
};

export default ApproveUserModal;