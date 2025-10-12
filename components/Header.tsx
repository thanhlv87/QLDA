import React from 'react';
import type { User } from '../types';

interface HeaderProps {
    user: User | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
    return (
        <header className="bg-primary text-white shadow-md p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Quản lý Tiến độ Thi công</h1>
            {user && (
                <div className="flex items-center space-x-4">
                    <span className="hidden sm:block">Chào, {user.name} ({user.role})</span>
                    <button
                        onClick={onLogout}
                        className="bg-accent hover:opacity-90 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Đăng xuất
                    </button>
                </div>
            )}
        </header>
    );
};

export default Header;
