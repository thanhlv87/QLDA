import React, { useState, useMemo } from 'react';
import type { User } from '../types.ts';
import UserList from './UserList.tsx';
import EditUserForm from './EditUserForm.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import { ArrowLeftIcon } from './Icons.tsx';

interface UserManagementProps {
    users: User[];
    currentUser: User;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    onBack: () => void;
    onApproveUser: (user: User) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, currentUser, onUpdateUser, onDeleteUser, onBack, onApproveUser }) => {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

    const { pendingUsers, activeUsers } = useMemo(() => {
        const pending: User[] = [];
        const active: User[] = [];
        users.forEach(user => {
            if (!user.role) {
                pending.push(user);
            } else {
                active.push(user);
            }
        });
        return { pendingUsers: pending, activeUsers: active };
    }, [users]);


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
            <header className="flex justify-between items-center mb-6">
                 <div>
                    <button onClick={onBack} className="text-secondary hover:text-accent font-semibold flex items-center">
                        <ArrowLeftIcon className="h-5 w-5 mr-2" />
                        Trở về Dashboard
                    </button>
                    <h2 className="text-3xl font-bold text-gray-800 mt-2">Quản lý Người dùng</h2>
                </div>
            </header>

            <section className="mb-10">
                <div className="p-4 sm:p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg shadow-md">
                    <h3 className="text-lg sm:text-xl font-bold text-yellow-800 mb-4">Tài khoản chờ Phê duyệt ({pendingUsers.length})</h3>
                    {pendingUsers.length > 0 ? (
                        <div className="space-y-3">
                            {pendingUsers.map(user => (
                                <div key={user.id} className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                                    <div>
                                        <p className="font-semibold text-gray-800">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                    <button 
                                        onClick={() => onApproveUser(user)}
                                        className="bg-success text-white font-bold py-1 px-3 rounded-md hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                                    >
                                        Phê duyệt
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600 italic">Không có tài khoản nào đang chờ phê duyệt.</p>
                    )}
                </div>
            </section>
            
            <section>
                 <h3 className="text-xl font-bold text-gray-800 mb-4">Tài khoản đang hoạt động ({activeUsers.length})</h3>
                <UserList
                    users={activeUsers}
                    currentUser={currentUser}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                />
            </section>

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