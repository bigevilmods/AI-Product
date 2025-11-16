
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinnerIcon, XIcon } from '../components/icons';

interface LoginPageProps {
  onClose: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onClose }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('user@demo.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login({ email, password });
      onClose(); // Close modal on successful login
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 flex flex-col justify-center items-center p-4 z-[100]"
        onClick={onClose}
    >
      <div 
        className="w-full max-w-sm relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Welcome Back
            </h1>
            <p className="mt-2 text-lg text-slate-400">
              Login to continue
            </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-slate-800 shadow-2xl rounded-lg px-8 pt-6 pb-8 mb-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors"
            aria-label="Close login modal"
          >
            <XIcon className="w-6 h-6" />
          </button>
          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-purple-500"
              id="email"
              type="email"
              placeholder="user@demo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white mb-3 leading-tight focus:outline-none focus:shadow-outline focus:border-purple-500"
              id="password"
              type="password"
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
             {error && <p className="text-red-500 text-xs italic">{error}</p>}
          </div>
          <div className="flex items-center justify-between">
            <button
              className="inline-flex items-center justify-center w-full px-4 py-3 font-bold text-white transition-all duration-200 bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                  <>
                    <LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Signing In...
                  </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
          <div className="text-center mt-6 text-xs text-slate-500">
            <p>Demo credentials:</p>
            <p>User: <span className="font-mono">user@demo.com</span> / <span className="font-mono">password</span></p>
            <p>Admin: <span className="font-mono">admin@demo.com</span> / <span className="font-mono">password</span></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
