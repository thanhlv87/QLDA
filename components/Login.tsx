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
    // Use bg-neutral which is defined, instead of an undefined class
    <div className="min-h-screen flex items-center justify-center bg-neutral px-4">
      {/* Replaced 'card' and component classes with standard Tailwind utilities for styling */}
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Replaced 'card-body' with standard padding */}
        <form className="p-8" onSubmit={handleSubmit}>
          {/* Ensured title text color is dark and visible */}
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Đăng nhập</h2>
          {error && (
            // Replaced 'alert alert-error' with standard Tailwind classes for a visible error message
            <div className="bg-error/10 border-l-4 border-error text-error p-4 mb-4" role="alert">
                <p className="font-bold">Lỗi Đăng nhập</p>
                <p>{error}</p>
            </div>
          )}
          {/* Replaced 'form-control' with simple div and spacing */}
          <div className="mb-4">
            {/* Ensured label text color is dark and visible */}
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            {/* Replaced 'input input-bordered' with standard Tailwind classes for a visible input field */}
            <input
              id="email"
              type="email"
              placeholder="nhap@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              placeholder="********"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mt-6">
            {/* Replaced 'btn btn-primary' with standard Tailwind classes for a visible button */}
            <button type="submit" className="w-full bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
