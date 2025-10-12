

import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  error: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    await onLogin(email, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      
      <div className="w-full max-w-md">
        <img 
          src="https://raw.githubusercontent.com/thanhlv87/pic/refs/heads/main/npsc.png" 
          alt="NPSC Logo"
          className="w-full h-auto mb-8"
        />
      </div>

      <div className="w-full max-w-md bg-neutral rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
        
        <form className="p-8 space-y-6" onSubmit={handleSubmit}>
          <h2 className="text-3xl font-bold text-center text-primary mb-2">Chào mừng trở lại</h2>
          <p className="text-center text-gray-500 mb-8">Đăng nhập để tiếp tục quản lý dự án</p>
          
          {error && (
            <div className="bg-error/10 border-l-4 border-error text-error p-4" role="alert">
                <p className="font-bold">Lỗi Đăng nhập</p>
                <p>{error}</p>
            </div>
          )}
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="nhap@email.com"
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              placeholder="********"
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-accent hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-400/50" disabled={isLoading}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;