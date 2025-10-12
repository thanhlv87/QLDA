import React, { useState } from 'react';
import type { User } from '../types';
import UserList from './UserList';
import EditUserForm from './EditUserForm';
import ConfirmationModal from './ConfirmationModal';

interface UserManagementProps {
    users: User[];
    currentUser: User;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    onBack: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, currentUser, onUpdateUser, onDeleteUser, onBack }) => {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

    const handleEditClick = (user: User) => {
        setEditingUser(user);
    };

    const handleUpdate = (updatedUser: User) => {
        onUpdateUser(updatedUser);
        setEditingUser(null);
    };

    const handleDeleteClick = (userId: string, userName: string) => {
        setUserToDelete({ id: userId, name: userName });
    };

    const confirmDelete = () => {
        if (userToDelete) {
            onDeleteUser(userToDelete.id);
            setUserToDelete(null);
        }
    };

    if (editingUser) {
        return (
            <EditUserForm
                user={editingUser}
                onUpdateUser={handleUpdate}
                onCancel={() => setEditingUser(null)}
            />
        );
    }
    
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                 <div>
                    <button onClick={onBack} className="text-secondary hover:text-accent font-semibold flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Trở về Dashboard
                    </button>
                    <h2 className="text-3xl font-bold text-gray-800 mt-2">Quản lý Người dùng</h2>
                </div>
            </div>

            <UserList
                users={users}
                currentUser={currentUser}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
            />

            {userToDelete && (
                 <ConfirmationModal
                    message={`Bạn có chắc chắn muốn xóa người dùng "${userToDelete.name}"?\nHành động này sẽ xóa vĩnh viễn tài khoản khỏi hệ thống.`}
                    onConfirm={confirmDelete}
                    onCancel={() => setUserToDelete(null)}
                />
            )}
        </div>
    );
};

export default UserManagement;
