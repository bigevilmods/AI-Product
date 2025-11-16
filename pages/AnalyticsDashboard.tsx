
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { paymentService } from '../services/paymentService';
import type { User, Transaction } from '../types';

interface AffiliateStat {
    affiliate: User;
    referrals: number;
    totalRevenue: number;
    totalCommission: number;
}

const AnalyticsDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<AffiliateStat[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'admin') {
            const allUsers = authService.getAllUsers();
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
            setIsLoading(false);
        }
    }, [user]);
    
    if (user?.role !== 'admin') {
        return <div className="text-center p-10 text-red-400">Access Denied.</div>;
    }
    
    if (isLoading) {
        return <div className="text-center p-10">Loading analytics data...</div>;
    }

    return (
        <div className="space-y-8">
            <header className="text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  Análise Financeira
                </h1>
                <p className="mt-2 text-lg text-slate-400">
                  Acompanhe a receita e o desempenho dos afiliados.
                </p>
            </header>
            
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
                                    {/* FIX: The 'referrals' count is on the 'stat' object itself, not the nested 'affiliate' object. */}
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
                                    <td colSpan={4} className="text-center py-6 text-slate-400">Nenhum afiliado ativo encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
