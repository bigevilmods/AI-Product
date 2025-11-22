import type { Transaction } from '../types';
import { authService } from './authService';

// --- ARQUITETURA DE PRODUÇÃO COM FIREBASE ---
// Este arquivo simula chamadas a endpoints de API que, em produção, seriam Firebase Cloud Functions.
// O backend (Cloud Functions) seria o único a ter acesso às chaves secretas do Mercado Pago (ACCESS TOKEN)
// e a lógica segura para modificar o Firestore (ex: conceder créditos).

const serverApi = {
    /**
     * Simula uma Cloud Function (HTTP Trigger) para criar um pagamento PIX.
     * A função receberia os detalhes do pagamento, se comunicaria com a API do Mercado Pago
     * usando o SDK do servidor e retornaria os dados do PIX para o cliente.
     */
    async createPixPayment(amountInUSD: string, creditAmount: number, userEmail: string): Promise<{ qr_code: string; qr_code_base64: string, expiration: number }> {
        console.log(`[Payment Service] Simulating call to a Firebase Cloud Function (createPixPayment)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const expirationTime = Date.now() + 10 * 60 * 1000;
        return {
            qr_code: '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266554400005204000053039865802BR5913John Doe6009SAO PAULO62070503***6304ABCD',
            // FIX: Replaced with an optimized and compact base64 for a sample QR code image.
            qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0AQMAAADgS1GnAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAAIJJREFUOMtjYKAQNpgZGBgYGBkZGBgaGBgYGFgYGRgZmBgYGBgYjCBYmBkYGBgYGEgYGBgYGAmYGBgYGBiYGFgYGBgYmBiYGBgYGBgYWBgYGBgYmBgYGBgZmBgYGFgYGEgYGFgYGBhAMDAwMDAwMDQzMDAwMDLIGBgYGBhZgAACDABbZAlRmLPvWwAAAABJRU5ErkJggg==',
            expiration: expirationTime,
        };
    },

    /**
     * Simula uma Cloud Function (HTTP Trigger) para processar um pagamento com cartão.
     * A função receberia um token seguro do frontend, e não os detalhes brutos do cartão.
     * No backend, usaria o ACCESS TOKEN do Mercado Pago para processar o pagamento.
     * Se bem-sucedido, criaria um registro da transação no Firestore.
     * **IMPORTANTE:** Os créditos seriam concedidos por um webhook do Mercado Pago que chama outra Cloud Function,
     * garantindo que os créditos só sejam adicionados após a confirmação do pagamento.
     */
    async processCardPayment(token: string, amount: string, email: string): Promise<{ status: 'approved' | 'rejected', message: string }> {
        console.log(`[Payment Service] Simulating call to a Firebase Cloud Function (processCardPayment)`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
            status: 'approved',
            message: 'Payment successful! Your credits will be added shortly after confirmation.'
        };
    },

    // Em produção, estas funções de admin chamariam Cloud Functions que consultam o Firestore com permissões elevadas.
    async getAllTransactions(): Promise<Transaction[]> {
        console.log('[Payment Service] Simulating call to a Firebase Cloud Function (getAllTransactions)');
        await new Promise(resolve => setTimeout(resolve, 300));
        return [
            {
                id: 'tx_12345',
                userId: 'user-3', // Este ID viria de um usuário real no Firestore
                amountPaid: 9.00,
                creditsPurchased: 50,
                timestamp: Date.now() - 86400000,
                affiliateId: 'aff-user-4', // Este ID viria de um afiliado real
                commissionPaid: 1.35,
            }
        ];
    },

    async getTotalRevenue(): Promise<number> {
        console.log('[Payment Service] Simulating call to a Firebase Cloud Function (getTotalRevenue)');
        await new Promise(resolve => setTimeout(resolve, 100));
        return 9.00;
    }
};
// --- FIM DA SIMULAÇÃO DA API DO BACKEND ---


// --- Frontend Service (Client) ---
// Este código permanece no frontend e apenas chama os endpoints simulados da API (Cloud Functions).
export const paymentService = {
  createPixPayment: (amountInUSD: string, creditAmount: number, userEmail: string) =>
    serverApi.createPixPayment(amountInUSD, creditAmount, userEmail),
    
  processCardPayment: (token: string, amount: string, email: string) =>
    serverApi.processCardPayment(token, amount, email),

  getAllTransactions: () =>
    serverApi.getAllTransactions(),
  
  getTotalRevenue: () =>
    serverApi.getTotalRevenue()
};