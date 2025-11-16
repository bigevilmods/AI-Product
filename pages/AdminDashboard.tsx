
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
              className={`py-4 px-1 text-sm font-semibold border-b-2 transition-colors ${isActive ? 'border-purple-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}
          >
              {children}
          </button>
      )
  };

  if (isLoading) return <div className="text-center p-10">Loading admin data...</div>;
  if (user?.role !== 'admin') return <div className="text-center p-10 text-red-400">Access Denied.</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <TabButton tab="management">Management</TabButton>
          <TabButton tab="analytics">Financial Analytics</TabButton>
        </nav>
      </div>

      {activeTab === 'management' && (
        <div className="flex flex-col gap-8">
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-6">User Management</h2>
                <div className="overflow-x-auto">
                <table className="min-w-full bg-slate-800 rounded-md">
                    <thead>
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700/50 rounded-tl-md">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700/50">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700/50">Affiliate ID</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700/50">Commission (%)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700/50">Credits</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700/50 rounded-tr-md">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                    {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3 text-sm text-slate-200">{u.email}</td>
                        <td className="px-4 py-3">
                            <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)} className="bg-slate-700 border border-slate-600 rounded-md py-1 px-2 text-sm focus:ring-purple-500 focus:border-purple-500">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="influencer">Influencer</option>
                            <option value="affiliate">Affiliate</option>
                            </select>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-slate-400">{u.affiliateId || 'N/A'}</td>
                        <td className="px-4 py-3">
                            {u.role === 'affiliate' && (
                            <div className="flex items-center justify-center gap-2">
                                <input
                                type="number"
                                value={commissionInputs[u.id] || ''}
                                onChange={(e) => handleCommissionChange(u.id, e.target.value)}
                                className="w-16 bg-slate-700 border border-slate-600 rounded-md p-1 text-center text-sm"
                                placeholder="%"
                                />
                                <button onClick={() => handleSetCommission(u.id)} className="px-2 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-500 rounded text-white">Set</button>
                            </div>
                            )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-amber-400">{u.credits}</td>
                        <td className="px-4 py-3 text-center">
                            {u.role === 'influencer' && (
                            <button onClick={() => setIsGrantingCredits(u)} className="p-2 rounded-full hover:bg-slate-700" title="Grant Credits">
                                <GiftIcon className="w-5 h-5 text-green-400" />
                            </button>
                            )}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-4">Global Notification</h2>
                <div>
                <label htmlFor="notificationMessage" className="block text-sm font-medium text-slate-300 mb-2">Notification Message</label>
                <textarea id="notificationMessage" value={notificationMessage} onChange={(e) => setNotificationMessage(e.target.value)} placeholder="Announce a new feature or maintenance..." rows={3} className="shadow-sm appearance-none border border-slate-600 rounded-md w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y" />
                <p className="text-xs text-slate-500 mt-2">This message will be displayed in a banner at the top of the site for all users.</p>
                {currentNotification && (<div className="mt-4 p-3 bg-slate-900/50 rounded-md"><p className="text-xs text-slate-400">Current active notification:</p><p className="text-sm text-slate-200">{currentNotification}</p></div>)}
                <div className="mt-4 flex gap-4">
                    <button onClick={handlePublishNotification} className="px-4 py-2 font-semibold bg-purple-600 hover:bg-purple-500 rounded-md text-sm" disabled={!notificationMessage.trim()}>Publish</button>
                    <button onClick={handleClearNotification} className="px-4 py-2 font-semibold bg-red-600 hover:bg-red-500 rounded-md text-sm" disabled={!currentNotification}>Clear</button>
                </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-8">
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-xl">
                <h2 className="text-sm text-slate-400">Total Site Revenue</h2>
                <p className="text-4xl font-bold text-green-400">
                    {totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6">Affiliate Performance</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-slate-800 rounded-md">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700/50 rounded-tl-md">Affiliate</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700/50">Referrals</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700/50">Revenue Generated</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700/50 rounded-tr-md">Commission Paid</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {stats.map(stat => (
                                <tr key={stat.affiliate.id} className="hover:bg-slate-700/30">
                                    <td className="px-4 py-3 text-sm text-slate-200">{stat.affiliate.email}</td>
                                    <td className="px-4 py-3 text-center font-mono text-sm">{stat.referrals}</td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-green-400">
                                        {stat.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-amber-400">
                                        {stat.totalCommission.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </td>
                                </tr>
                            ))}
                             {stats.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center p-6 text-slate-400">No active affiliates or transactions found.</td>
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
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-sm">
              <div className="p-6">
                <h3 className="text-lg font-bold mb-4">Grant Credits to {isGrantingCredits.email}</h3>
                <label htmlFor="credits" className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                <input id="credits" type="number" value={creditsToGrant} onChange={(e) => setCreditsToGrant(parseInt(e.target.value, 10))} className="shadow-sm appearance-none border border-slate-600 rounded-md w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="p-4 bg-slate-900/50 flex justify-end gap-4">
                  <button onClick={() => setIsGrantingCredits(null)} className="px-4 py-2 font-semibold bg-slate-600 hover:bg-slate-500 rounded-md text-sm">Cancel</button>
                  <button onClick={handleGrantCredits} className="px-4 py-2 font-semibold bg-green-600 hover:bg-green-500 rounded-md text-sm">Confirm</button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;