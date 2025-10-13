import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';

interface EditUserFormProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onCancel: () => void;
}

const EditUserForm: React.FC<EditUserFormProps> = ({ user, onUpdateUser, onCancel }) => {
  const [formData, setFormData] = useState<User>(user);

  useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(formData);
  };

  return (
    <div className="bg-base-100 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200 animate-fade-in">
      <h2 className="text-2xl font-bold text-primary mb-6">Chỉnh sửa Người dùng</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
          <input
            id="name"
            name="name"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            value={formData.email}
            readOnly
            disabled
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
          <select
            id="role"
            name="role"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
            value={formData.role}
            onChange={handleChange}
            required
          >
            {Object.values(Role).map(roleValue => (
              <option key={roleValue} value={roleValue}>{roleValue}</option>
            ))}
          </select>
        </div>
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
};

export default EditUserForm;