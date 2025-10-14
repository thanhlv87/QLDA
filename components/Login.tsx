import React, { useState } from 'react';
import { LockClosedIcon, MailIcon } from './Icons';

const GoogleIcon: React.FC = () => (
    <svg className="w-5 h-5 mr-3" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 401.7 0 265.9c0-136 110.3-246.3 244-246.3 75.8 0 139.6 30.1 185.3 73.1l-68.5 67.2c-25.2-23.8-60-40.4-116.8-40.4-96.9 0-175.8 78.8-175.8 176.2s78.9 176.2 175.8 176.2c102.3 0 144.5-73.4 149-110.1H244V261.8h244z"></path>
    </svg>
);


interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  error: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGoogleLogin, error }) => {
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
  
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await onGoogleLogin();
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      
      <div className="w-full max-w-sm mb-8">
        <img 
          src="https://raw.githubusercontent.com/thanhlv87/pic/refs/heads/main/npsc.png" 
          alt="NPSC Logo"
          className="w-full h-auto"
        />
      </div>

      <div className="w-full max-w-md bg-neutral rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
        
        <form className="p-8 sm:p-10 space-y-6" onSubmit={handleSubmit}>
           <div className="text-center">
             <h2 className="text-3xl font-extrabold text-accent mb-2 tracking-tight">Chào mừng trở lại</h2>
             <p className="text-gray-500">Đăng nhập để thực hiện quản lý dự án</p>
          </div>
          
          {error && (
            <div className="bg-error/10 border-l-4 border-error text-error p-4 rounded-r-md" role="alert">
                <p className="font-bold">Lỗi Đăng nhập</p>
                <p>{error}</p>
            </div>
          )}
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MailIcon className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="nhap@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-shadow"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Mật khẩu
            </label>
             <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="password"
                  type="password"
                  placeholder="********"
                  className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-shadow"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full bg-accent hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-400/50 transform hover:scale-105" disabled={isLoading}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">hoặc</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 font-semibold py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <GoogleIcon />
            Đăng nhập với Google
          </button>

          <div className="text-center text-gray-500 text-sm pt-2 px-2">
            <p className="font-bold text-secondary">Lưu ý cho người dùng mới:</p>
            <p>
              Vui lòng sử dụng "Đăng nhập với Google". Sau lần đăng nhập đầu tiên, tài khoản của bạn sẽ ở trạng thái chờ. Hãy liên hệ Quản trị viên (Thanh Lê - 0982722036) để được phê duyệt và cấp quyền truy cập.
            </p>
          </div>

        </form>
      </div>
       <p className="text-center text-gray-500 text-xs mt-8">
        &copy;2025 NPSC.
      </p>
    </div>
  );
};

export default Login;