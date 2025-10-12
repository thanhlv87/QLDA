
import React from 'react';
import type { User } from '../types';
import { Role } from '../types';

interface HeaderProps {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  users: User[];
}

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

const Header: React.FC<HeaderProps> = ({ currentUser, setCurrentUser, users }) => {
  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = event.target.value;
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (selectedUser) {
      setCurrentUser(selectedUser);
    }
  };

  return (
    <header className="bg-primary shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">Bảng Điều Khiển Quản Lý Dự Án</h1>
          </div>
          <div className="flex items-center">
             <div className="flex items-center text-white mr-4">
                <UserIcon />
                <span>{currentUser?.name} ({currentUser?.role})</span>
             </div>
            <select
              value={currentUser?.id || ''}
              onChange={handleRoleChange}
              className="bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            >
              <option value="" disabled>Switch User Role</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
