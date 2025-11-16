import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { LinkIcon, CopyIcon, CheckIcon, UsersIcon } from '../components/icons';

const AffiliateDashboard: React.FC = () => {
    const { user } = useAuth();
    const [referralLink, setReferralLink] = useState('');
    const [referredUsersCount, setReferredUsersCount] = useState(0);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (user?.role === 'affiliate' && user.affiliateId) {
                const link = `${window.location.origin}${window.location.pathname}?ref=${user.affiliateId}`;
                setReferralLink(link);

                const allUsers = await authService.getAllUsers();
                const count = allUsers.filter(u => u.referredBy === user.affiliateId).length;
                setReferredUsersCount(count);
            }
        };
        loadData();
    }, [user]);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    if (user?.role !== 'affiliate') {
        return <div className="text-center p-10 text-red-400">Access Denied.</div>;
    }

    return (
        <div className="flex flex-col gap-8">
            <header className="text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  Affiliate Dashboard
                </h1>
                <p className="mt-2 text-lg text-slate-400">
                  Track your performance and share your link.
                </p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-lg shadow-xl flex items-center gap-4">
                    <div className="p-3 rounded-full bg-purple-600/30">
                        <UsersIcon className="w-8 h-8 text-purple-300" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Referred Users</p>
                        <p className="text-3xl font-bold text-white">{referredUsersCount}</p>
                    </div>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-lg shadow-xl flex items-center gap-4">
                     <div className="p-3 rounded-full bg-green-600/30 flex items-center justify-center w-14 h-14">
                        <span className="text-2xl font-bold text-green-300">$</span>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Total Commission</p>
                        <p className="text-3xl font-bold text-white">
                            {user.commissionEarned?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) ?? '$0.00'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-2">Your Referral Link</h2>
                <p className="text-slate-400 mb-4">Share this link. You'll earn a <span className="font-bold text-amber-400">{((user.commissionRate || 0) * 100)}%</span> commission on all credit purchases made by users who sign up through it.</p>
                <div className="flex items-center gap-2 bg-slate-900/50 p-3 rounded-lg">
                    <LinkIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <input
                        type="text"
                        readOnly
                        value={referralLink}
                        className="w-full bg-transparent text-slate-200 font-mono text-sm border-none outline-none"
                    />
                    <button
                        onClick={handleCopy}
                        className="flex items-center px-3 py-1.5 text-sm font-medium bg-slate-700 rounded-md hover:bg-purple-600 transition-colors"
                    >
                        {isCopied ? (
                            <CheckIcon className="w-4 h-4 text-green-400" />
                        ) : (
                            <CopyIcon className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AffiliateDashboard;
