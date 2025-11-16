
import React, { useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { authService } from '../services/authService';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import { GiftIcon } from '../components/icons';

interface AffiliateStat {
    affiliate: User;
    referrals: number;
    totalRevenue: number;
    totalCommission: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'management' | 'analytics'>('management');
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pixKey, setPixKey] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [currentNotification, setCurrentNotification] = useState<string | null>(null);
  const [isGrantingCredits, setIsGrantingCredits] = useState<User | null>(null);
  const [creditsToGrant, setCreditsToGrant] = useState<number>(100);
  const [commissionInputs, setCommissionInputs] = useState<{[key: string]: string}>({});

  const [stats, setStats] = useState<AffiliateStat[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchUsers = () => {
    const allUsers = authService.getAllUsers();
    setUsers(allUsers);
    const initialCommissions = allUsers.reduce((acc, u) => {
      if (u.role === 'affiliate' && u.commissionRate) {
        acc[u.id] = (u.commissionRate * 100).toString();
      }
      return acc;
    }, {} as {[key: string]: string});
    setCommissionInputs(initialCommissions);
    return allUsers;
  };

  const fetchAnalytics = (allUsers: User[]) => {
      const allTransactions = paymentService.getAllTransactions();
      const affiliates = allUsers.filter(u => u.role === 'affiliate');
      const affiliateStats = affiliates.map(affiliate => {
          const referredUsers = allUsers.filter(u => u.referredBy === affiliate.affiliateId);
          const referredUserIds = referredUsers.map(u => u.id);
          const revenueFromReferrals = allTransactions
              .filter(tx => referredUserIds.includes(tx.userId))
              .reduce((sum, tx) => sum + tx.amountPaid, 0);
          return {
              affiliate,
              referrals: referredUsers.length,
              totalRevenue: revenueFromReferrals,
              totalCommission: affiliate.commissionEarned || 0,
          };
      });
      setStats(affiliateStats);
      setTotalRevenue(paymentService.getTotalRevenue());
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      setIsLoading(true);
      const allUsers = fetchUsers();
      fetchAnalytics(allUsers);
      const savedKey = localStorage.getItem('adminPixKey') || '';
      setPixKey(savedKey);
      const savedNotification = localStorage.getItem('globalNotification');
      if (savedNotification) {
        try {
          const parsed = JSON.parse(savedNotification);
          setCurrentNotification(parsed.message);
          setNotificationMessage(parsed.message);
        } catch (e) { console.error("Error parsing notification.", e); }
      }
      setIsLoading(false);
    }
  }, [user]);

  const handleSavePixKey = () => {
    localStorage.setItem('adminPixKey', pixKey);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handlePublishNotification = () => {
    if (!notificationMessage.trim()) return;
    const notification = { id: Date.now(), message: notificationMessage.trim() };
    localStorage.setItem('globalNotification', JSON.stringify(notification));
    setCurrentNotification(notification.message);
    alert('Notification published!');
  };

  const handleClearNotification = () => {
    localStorage.removeItem('globalNotification');
    localStorage.removeItem('dismissedNotificationId');
    setCurrentNotification(null);
    setNotificationMessage('');
    alert('Notification cleared!');
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    authService.setUserRole(userId, newRole);
    fetchUsers();
  };

  const handleGrantCredits = () => {
    if (isGrantingCredits && creditsToGrant > 0) {
      authService.grantCredits(isGrantingCredits.id, creditsToGrant);
      fetchUsers();
      setIsGrantingCredits(null);
    }
  };
  
  const handleCommissionChange = (userId: string, value: string) => {
      setCommissionInputs(prev => ({...prev, [userId]: value}));
  };

  const handleSetCommission = (userId: string) => {
      const ratePercentage = parseFloat(commissionInputs[userId]);
      if (!isNaN(ratePercentage) && ratePercentage >= 0 && ratePercentage <= 100) {
          authService.setCommissionRate(userId, ratePercentage / 100);
          fetchUsers();
          alert('Commission rate updated!');
      } else {
          alert('Please enter a valid percentage (0-100).');
      }
  };
  
  const TabButton: React.FC<{tab: 'management' | 'analytics', children: React.ReactNode}> = ({ tab, children }) => {
      const isActive = activeTab === tab;
      return (
          <button
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold transition-colors
                  ${isActive 
                      ? 'border-b-2 border-purple-400 text-white' 
                      : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }`}
          >
              {children}
          </button>
      )
  };

  if (isLoading) return <div className="text-center p-10">Loading admin data...</div>;
  if (user?.role !== 'admin') return <div className="text-center p-10 text-red-400">Access Denied.</div>;

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <TabButton tab="management">Gerenciamento</TabButton>
          <TabButton tab="analytics">Análise Financeira</TabButton>
        </nav>
      </div>

      {activeTab === 'management' && (
        <div className="space-y-8">
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-white mb-6">Gerenciamento de Usuários</h2>
                <div className="overflow-x-auto">
                <table className="min-w-full bg-slate-800 rounded-md">
                    <thead>
                    <tr className="bg-slate-700">
                        <th className="py-3 px-4 text-left uppercase font-semibold text-sm text-slate-300">Email</th>
                        <th className="py-3 px-4 text-left uppercase font-semibold text-sm text-slate-300">Função</th>
                        <th className="py-3 px-4 text-left uppercase font-semibold text-sm text-slate-300">Afiliado ID</th>
                        <th className="py-3 px-4 text-center uppercase font-semibold text-sm text-slate-300">Comissão (%)</th>
                        <th className="py-3 px-4 text-right uppercase font-semibold text-sm text-slate-300">Créditos</th>
                        <th className="py-3 px-4 text-center uppercase font-semibold text-sm text-slate-300">Ações</th>
                    </tr>
                    </thead>
                    <tbody className="text-slate-200">
                    {users.map((u) => (
                        <tr key={u.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="py-3 px-4">{u.email}</td>
                        <td className="py-3 px-4">
                            <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)} className="bg-slate-700 border border-slate-600 rounded-md p-1 text-xs">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="influencer">Influencer</option>
                            <option value="affiliate">Affiliate</option>
                            </select>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">{u.affiliateId || 'N/A'}</td>
                        <td className="py-3 px-4">
                            {u.role === 'affiliate' && (
                            <div className="flex items-center justify-center gap-2">
                                <input
                                type="number"
                                value={commissionInputs[u.id] || ''}
                                onChange={(e) => handleCommissionChange(u.id, e.target.value)}
                                className="w-16 bg-slate-700 border border-slate-600 rounded-md p-1 text-xs text-center"
                                placeholder="%"
                                />
                                <button onClick={() => handleSetCommission(u.id)} className="px-2 py-1 text-xs bg-purple-600 rounded hover:bg-purple-500">Set</button>
                            </div>
                            )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-400">{u.credits}</td>
                        <td className="py-3 px-4 text-center">
                            {u.role === 'influencer' && (
                            <button onClick={() => setIsGrantingCredits(u)} className="p-2 rounded-full hover:bg-slate-600" title="Grant Credits">
                                <GiftIcon className="w-5 h-5 text-green-400"/>
                            </button>
                            )}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-white mb-6">Payment Settings</h2>
                    <div className="max-w-md">
                    <label htmlFor="pixKey" className="block text-slate-300 text-sm font-bold mb-2">Your PIX Key</label>
                    <input id="pixKey" type="text" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Enter your CPF, CNPJ, email, or phone number" className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-purple-500" />
                    <p className="text-xs text-slate-500 mt-2">This key will be used to generate real PIX charges for users. It is stored securely in your browser's local storage and is never shared.</p>
                    <div className="mt-4"><button onClick={handleSavePixKey} className="px-4 py-2 font-semibold text-sm bg-purple-600 text-white rounded-md hover:bg-purple-500 transition-colors duration-200 disabled:opacity-50" disabled={!pixKey}>{saveStatus === 'success' ? 'Saved!' : 'Save PIX Key'}</button></div>
                    </div>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-white mb-6">Global Notification</h2>
                    <div className="max-w-xl">
                    <label htmlFor="notificationMessage" className="block text-slate-300 text-sm font-bold mb-2">Notification Message</label>
                    <textarea id="notificationMessage" value={notificationMessage} onChange={(e) => setNotificationMessage(e.target.value)} placeholder="Announce a new feature or maintenance..." rows={3} className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-purple-500" />
                    <p className="text-xs text-slate-500 mt-2">This message will be displayed in a banner at the top of the site for all users.</p>
                    {currentNotification && (<div className="mt-4 p-3 bg-slate-900/50 rounded-md"><p className="text-xs text-slate-400">Current active notification:</p><p className="text-sm text-slate-200">{currentNotification}</p></div>)}
                    <div className="mt-4 flex gap-4">
                        <button onClick={handlePublishNotification} className="px-4 py-2 font-semibold text-sm bg-purple-600 text-white rounded-md hover:bg-purple-500 transition-colors duration-200 disabled:opacity-50" disabled={!notificationMessage.trim()}>Publish</button>
                        <button onClick={handleClearNotification} className="px-4 py-2 font-semibold text-sm bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors duration-200" disabled={!currentNotification}>Clear</button>
                    </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8">
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
                <h2 className="text-sm text-slate-400">Receita Total do Site</h2>
                <p className="text-4xl font-bold text-green-400">
                    {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-6">Desempenho dos Afiliados</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-slate-800 rounded-md">
                        <thead>
                            <tr className="bg-slate-700">
                                <th className="py-3 px-4 text-left uppercase font-semibold text-sm text-slate-300">Afiliado</th>
                                <th className="py-3 px-4 text-center uppercase font-semibold text-sm text-slate-300">Indicados</th>
                                <th className="py-3 px-4 text-right uppercase font-semibold text-sm text-slate-300">Receita Gerada</th>
                                <th className="py-3 px-4 text-right uppercase font-semibold text-sm text-slate-300">Comissão Paga</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-200">
                            {stats.map(stat => (
                                <tr key={stat.affiliate.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                    <td className="py-3 px-4">{stat.affiliate.email}</td>
                                    <td className="py-3 px-4 text-center font-mono">{stat.referrals}</td>
                                    <td className="py-3 px-4 text-right font-mono text-green-400">
                                        {stat.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-amber-400">
                                        {stat.totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                </tr>
                            ))}
                             {stats.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-6 text-slate-400">Nenhum afiliado ativo ou nenhuma transação encontrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
      
      {isGrantingCredits && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-sm p-6">
                <h3 className="text-xl font-bold text-white mb-4">Grant Credits to {isGrantingCredits.email}</h3>
                <label htmlFor="credits" className="block text-slate-300 text-sm font-bold mb-2">Amount</label>
                <input id="credits" type="number" value={creditsToGrant} onChange={(e) => setCreditsToGrant(parseInt(e.target.value, 10))} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2" />
                <div className="mt-6 flex justify-end gap-4">
                    <button onClick={() => setIsGrantingCredits(null)} className="px-4 py-2 font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">Cancel</button>
                    <button onClick={handleGrantCredits} className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-500">Confirm</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;