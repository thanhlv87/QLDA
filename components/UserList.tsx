import React from 'react';
import type { User } from '../types';

interface UserListProps {
  users: User[];
  onEditUser: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({ users, onEditUser }) => {
  return (
    <div className="bg-base-100 p-6 rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-primary mb-6">Danh sách Người dùng</h2>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover">
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-outline btn-secondary"
                    onClick={() => onEditUser(user)}
                  >
                    Chỉnh sửa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;
