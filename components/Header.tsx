import React, { useState } from 'react';
import type { User } from '../types';
import { MenuIcon, XIcon } from './Icons';

interface HeaderProps {
    user: User | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="bg-primary text-white shadow-md p-4 flex justify-between items-center sticky top-0 z-30">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Phần mềm quản lý dự án - NPSC</h1>
            {user && (
                <div className="relative">
                    {/* Desktop Menu */}
                    <div className="hidden sm:flex items-center space-x-4">
                        <div>
                            <span className="font-medium">Chào, {user.name} ({user.role || 'Chờ duyệt'})</span>
                        </div>
                        <button
                            onClick={onLogout}
                            className="bg-accent hover:opacity-90 text-white font-bold py-2 px-4 rounded transition-colors"
                        >
                            Đăng xuất
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="sm:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none p-1">
                            {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                        </button>
                    </div>

                    {/* Mobile Menu Dropdown */}
                    {isMenuOpen && (
                        <div className="sm:hidden absolute top-full right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-40 ring-1 ring-black ring-opacity-5 animate-fade-in">
                            <div className="px-4 py-3 border-b">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.role || 'Chờ duyệt'}</p>
                            </div>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onLogout();
                                    setIsMenuOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Đăng xuất
                            </a>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};

export default Header;