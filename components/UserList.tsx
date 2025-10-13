import React from 'react';
import type { User } from '../types';
import { permissions } from '../services/permissions';

interface UserListProps {
    users: User[];
    currentUser: User;
    onEdit: (user: User) => void;
    onDelete: (userId: string, userName: string) => void;
}

const UserList: React.FC<UserListProps> = ({ users, currentUser, onEdit, onDelete }) => {
    return (
        <div className="bg-base-100 shadow-md rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tên
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Vai trò
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Hành động</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-4">
                                        <button
                                            onClick={() => onEdit(user)}
                                            className="text-secondary hover:text-accent transition-colors"
                                        >
                                            Chỉnh sửa
                                        </button>
                                        {permissions.canDeleteUser(currentUser) && (
                                            <button
                                                onClick={() => onDelete(user.id, user.name)}
                                                className={`text-error hover:text-red-700 transition-colors ${user.id === currentUser.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={user.id === currentUser.id}
                                                aria-label={`Xóa ${user.name}`}
                                            >
                                                Xóa
                                            </button>
                                        )}
                                    </div>
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