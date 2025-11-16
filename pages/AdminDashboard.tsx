import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pixKey, setPixKey] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  useEffect(() => {
    if (user?.role === 'admin') {
      setIsLoading(true);
      const allUsers = authService.getAllUsers();
      setUsers(allUsers);
      const savedKey = localStorage.getItem('adminPixKey') || '';
      setPixKey(savedKey);
      setIsLoading(false);
    }
  }, [user]);

  const handleSavePixKey = () => {
    localStorage.setItem('adminPixKey', pixKey);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  if (isLoading) {
    return <div className="text-center p-10">Loading admin data...</div>;
  }
  
  if (user?.role !== 'admin') {
    return <div className="text-center p-10 text-red-400">Access Denied.</div>
  }

  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-white mb-6">User Management</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-slate-800 rounded-md">
            <thead>
              <tr className="bg-slate-700">
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-300">User ID</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-300">Email</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-300">Role</th>
                <th className="text-right py-3 px-4 uppercase font-semibold text-sm text-slate-300">Credits</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="py-3 px-4 font-mono text-xs">{u.id}</td>
                  <td className="py-3 px-4">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-800 text-purple-200' : 'bg-sky-800 text-sky-200'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4 font-bold text-amber-400">{u.credits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-white mb-6">Payment Settings</h2>
          <div className="max-w-md">
            <label htmlFor="pixKey" className="block text-slate-300 text-sm font-bold mb-2">Your PIX Key</label>
            <input
              id="pixKey"
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Enter your CPF, CNPJ, email, or phone number"
              className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-purple-500"
            />
             <p className="text-xs text-slate-500 mt-2">This key will be used to generate real PIX charges for users. It is stored securely in your browser's local storage and is never shared.</p>
             <div className="mt-4">
                <button
                    onClick={handleSavePixKey}
                    className="px-4 py-2 font-semibold text-sm bg-purple-600 text-white rounded-md hover:bg-purple-500 transition-colors duration-200 disabled:opacity-50"
                    disabled={!pixKey}
                >
                   {saveStatus === 'success' ? 'Saved!' : 'Save PIX Key'}
                </button>
             </div>
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;