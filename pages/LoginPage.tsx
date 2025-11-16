
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinnerIcon, XIcon } from '../components/icons';

interface LoginPageProps {
  onClose: () => void;
}

type AuthMode = 'login' | 'register';

const LoginPage: React.FC<LoginPageProps> = ({ onClose }) => {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        setError("Email and password are required.");
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setEmail('');
    setPassword('');
  }

  return (
    <div 
        className="fixed inset-0 bg-black/70 flex flex-col justify-center items-center p-4 z-[100]"
        onClick={onClose}
    >
      <div 
        className="w-full max-w-sm relative bg-slate-800 shadow-2xl rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
         <button 
            type="button" 
            onClick={onClose} 
            className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors z-10"
            aria-label="Close login modal"
          >
            <XIcon className="w-6 h-6" />
          </button>
          
          <div className="flex border-b border-slate-700">
              <button 
                onClick={() => handleModeChange('login')}
                className={`flex-1 py-3 font-semibold transition-colors ${mode === 'login' ? 'text-white bg-slate-700/50' : 'text-slate-400 hover:bg-slate-700/20'}`}
              >
                Login
              </button>
              <button 
                onClick={() => handleModeChange('register')}
                className={`flex-1 py-3 font-semibold transition-colors ${mode === 'register' ? 'text-white bg-slate-700/50' : 'text-slate-400 hover:bg-slate-700/20'}`}
              >
                Registrar
              </button>
          </div>
          
        <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="mt-2 text-base text-slate-400">
              {mode === 'login' ? 'Login to continue' : 'Get started with 5 free credits!'}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow-sm appearance-none border border-slate-600 rounded-md w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow-sm appearance-none border border-slate-600 rounded-md w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
              id="password"
              type="password"
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
             {error && <p className="text-red-500 text-xs italic mt-2">{error}</p>}
          </div>
          <div className="flex items-center justify-between">
            <button
              className="w-full inline-flex items-center justify-center px-4 py-2 font-bold text-white transition-all duration-200 bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                  <>
                    <LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    {mode === 'login' ? 'Signing In...' : 'Registering...'}
                  </>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </div>
          {mode === 'login' && (
            <div className="text-center mt-6 text-xs text-slate-500">
              <p className="mb-1">Demo credentials:</p>
              <p>User: <span className="font-mono">user@demo.com</span> / <span className="font-mono">password</span></p>
              <p>Admin: <span className="font-mono">admin@demo.com</span> / <span className="font-mono">password</span></p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;