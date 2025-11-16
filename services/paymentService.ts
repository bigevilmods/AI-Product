import type { Transaction } from '../types';
import { authService } from './authService';

// --- PRODUCTION ARCHITECTURE NOTE ---
// Este arquivo simula endpoints de backend para um ambiente de produção.
// O backend real (Node.js, etc.) seria o único a ter acesso ao banco de dados MySQL
// e às chaves secretas do Mercado Pago (ACCESS TOKEN).

const serverApi = {
    /**
     * Simulates a backend endpoint for creating a PIX payment.
     * The backend would use the Mercado Pago SDK with its secret ACCESS TOKEN.
     */
    async createPixPayment(amountInUSD: string, creditAmount: number, userEmail: string): Promise<{ qr_code: string; qr_code_base64: string, expiration: number }> {
        console.log(`[Payment Service] Simulating API call to POST /api/payments/pix`);
        // PRODUÇÃO: `const response = await fetch('/api/payments/pix', { method: 'POST', body: JSON.stringify(...) });`
        await new Promise(resolve => setTimeout(resolve, 1000));

        const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        return {
            qr_code: '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266554400005204000053039865802BR5913John Doe6009SAO PAULO62070503***6304ABCD',
            qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            expiration: expirationTime,
        };
    },

    /**
     * Simulates a backend endpoint for processing a card payment.
     * It receives a secure token from the frontend, not the raw card details.
     */
    async processCardPayment(token: string, amount: string, email: string): Promise<{ status: 'approved' | 'rejected', message: string }> {
        console.log(`[Payment Service] Simulating API call to POST /api/payments/card`);
        // PRODUÇÃO: `const response = await fetch('/api/payments/card', { method: 'POST', body: JSON.stringify({ token, amount, email }) });`
        await new Promise(resolve => setTimeout(resolve, 1500));

        // No backend real, você usaria o token de acesso para fazer a chamada à API de pagamento.
        // Se for bem-sucedido, você criaria o registro da transação no MySQL.
        // O webhook então concederia os créditos de forma confiável.
        // Para esta simulação, assumimos que é sempre aprovado.
        return {
            status: 'approved',
            message: 'Payment successful! Your credits will be added shortly after confirmation.'
        };
    },

    // Em produção, estas funções de admin buscariam dados de uma API de backend segura que consulta o MySQL.
    async getAllTransactions(): Promise<Transaction[]> {
        console.log('[Payment Service] Simulating API call to GET /api/admin/transactions');
        // PRODUÇÃO: `const response = await fetch('/api/admin/transactions'); return response.json();`
        await new Promise(resolve => setTimeout(resolve, 300));
        // Retornando dados de exemplo para o painel de administração.
        return [
            {
                id: 'tx_12345',
                userId: 'user-3',
                amountPaid: 9.00,
                creditsPurchased: 50,
                timestamp: Date.now() - 86400000,
                affiliateId: 'aff-user-4',
                commissionPaid: 1.35,
            }
        ];
    },

    async getTotalRevenue(): Promise<number> {
        console.log('[Payment Service] Simulating API call to GET /api/admin/revenue');
        // PRODUÇÃO: `const response = await fetch('/api/admin/revenue'); const data = await response.json(); return data.totalRevenue;`
        await new Promise(resolve => setTimeout(resolve, 100));
        return 9.00; // Exemplo estático
    }
};
// --- FIM DA SIMULAÇÃO DA API DO BACKEND ---


// --- Frontend Service (Client) ---
// Este código permanece no frontend e apenas chama a API simulada.

export const paymentService = {
  createPixPayment: (amountInUSD: string, creditAmount: number, userEmail: string) =>
    serverApi.createPixPayment(amountInUSD, creditAmount, userEmail),
    
  processCardPayment: (token: string, amount: string, email: string) =>
    serverApi.processCardPayment(token, amount, email),

  // Estas funções permanecem para a demonstração do painel de administração.
  getAllTransactions: () =>
    serverApi.getAllTransactions(),
  
  getTotalRevenue: () =>
    serverApi.getTotalRevenue()
};