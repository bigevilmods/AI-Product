
import type { PixCharge, PaymentStatus, Transaction, CardPaymentResponse } from '../types';
import { authService } from './authService';

const pendingTransactions = new Map<string, { charge: PixCharge; confirmAt: number; amount: number; userId: string }>();

const mockTransactionDb: Transaction[] = [
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

// This function simulates a backend creating a payment with Mercado Pago SDK
const simulateMercadoPagoApiCall = (amountInUSD: string, userEmail: string): PixCharge => {
    const transactionId = `mp_${Date.now()}`;
    const qrCodeCopyPaste = `00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266554400005204000053039865405${amountInUSD}5802BR5913CIELO JORE6009SAO PAULO62070503***6304EAF2`;
    const qrCodeBase64 = "iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQMAAACXljzdAAAABlBMVEX///8AAABVwtN+AAABaklEQVR42uyYQY7DIAwEgf//0713PS4aSAhksmm3dZJkH1YgU+Abp64L4sXgT3I8b27xIAhCEIQgCEIQhCAI4Z+QaP27Y1+U+pv/CIIgCIIgCIIgCIIgCIIgCIIgCIIgCEI4b27xIAhCEIQgCEIQhCAI4Z+QaP27Y1+U+pv/CIIgCIIgCIIgCIIgCIIgCIIgCIIgCEI4b27xIAhCEIQgCEIQhCAI4Z+QaP27Y1+U+pv/CIIgCIIgCIIgCIIgCIIgCIIgCIIgCEI4b27xIAhCEIQgCEIQhCAI4Z+QaP27Y1+U+pv/CIIgCIIgCIIgCIIgCIIgCIIgCIIgCEI4b27xIAhCEIQgCEIQhCAI4Z+QaP27Y1+U+pv/CIIgCIIgCIIgCIIgCIIgCIIgCIIgCEI4b27xIAhCEIQgCEIQhCAI4Z+QaP27Y1+U+pv/CIIgCIIgCIIgCIIgCIIgCIIgCIIgCEI4b27xIAhCEIQgCEIQhCAI4Z+QaP27Y1+U+pv/CIIgCIIgCIIgCIIgCIIgCIIgCIIgCEK4P+wHFyT5p2jS2jEAAAAASUVORK5CYII=";

    return {
        id: transactionId,
        status: 'pending',
        point_of_interaction: {
            transaction_data: {
                qr_code: qrCodeCopyPaste,
                qr_code_base64: qrCodeBase64,
            },
        },
    };
};


export const paymentService = {
  async createPixCharge(amountInUSD: string, creditAmount: number, userId: string): Promise<PixCharge> {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
       const notConfiguredSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="50" font-size="6" text-anchor="middle">Payment system not configured.</text></svg>`;
       const notConfiguredCharge: PixCharge = {
           id: 'not-configured',
           status: 'pending',
           point_of_interaction: {
               transaction_data: {
                   qr_code: 'The payment system is not configured on the server. Please contact support.',
                   qr_code_base64: btoa(notConfiguredSvg)
               }
           }
       };
       return notConfiguredCharge;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    const payingUser = authService.getAllUsers().find(u => u.id === userId);
    if (!payingUser) throw new Error("User not found for payment.");

    const charge = simulateMercadoPagoApiCall(amountInUSD, payingUser.email);
    
    const confirmAt = Date.now() + 10000;
    pendingTransactions.set(charge.id, { charge, confirmAt, amount: creditAmount, userId });
    return charge;
  },

  async createCardPayment(amountInUSD: string, creditAmount: number, userId: string): Promise<CardPaymentResponse> {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
        return { id: 'not-configured', status: 'rejected', message: 'The payment system is not configured on the server.' };
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const transactionId = `card_${Date.now()}`;
    const allUsers = authService.getAllUsers();
    const payingUser = allUsers.find(u => u.id === userId);
    
    if (!payingUser) throw new Error("User not found for payment.");

    const amountPaid = parseFloat(amountInUSD);
    
    if (payingUser.referredBy) {
        const affiliate = allUsers.find(u => u.affiliateId === payingUser.referredBy);
        if (affiliate && affiliate.commissionRate) {
            const commission = amountPaid * affiliate.commissionRate;
            affiliate.commissionEarned = (affiliate.commissionEarned || 0) + commission;
            authService.updateUser(affiliate);
            
            mockTransactionDb.push({
                id: transactionId, userId: payingUser.id, amountPaid,
                creditsPurchased: creditAmount, timestamp: Date.now(),
                affiliateId: affiliate.affiliateId, commissionPaid: commission,
            });
        }
    } else {
         mockTransactionDb.push({
            id: transactionId, userId: payingUser.id, amountPaid,
            creditsPurchased: creditAmount, timestamp: Date.now(),
         });
    }

    return { id: transactionId, status: 'approved', message: 'Payment successful!' };
  },

  async getPaymentStatus(transactionId: string): Promise<{ status: PaymentStatus, amount: number }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const tx = pendingTransactions.get(transactionId);
    if (!tx) throw new Error("Transaction not found.");

    if (Date.now() >= tx.confirmAt && tx.charge.status === 'pending') {
      tx.charge.status = 'paid';
      
      const allUsers = authService.getAllUsers();
      const payingUser = allUsers.find(u => u.id === tx.userId);
      const amountPaid = parseFloat(tx.charge.point_of_interaction.transaction_data.qr_code.match(/54\d{2}([\d.]+)/)![1]);
      
      if (payingUser && payingUser.referredBy) {
          const affiliate = allUsers.find(u => u.affiliateId === payingUser.referredBy);
          if (affiliate && affiliate.commissionRate) {
              const commission = amountPaid * affiliate.commissionRate;
              
              affiliate.commissionEarned = (affiliate.commissionEarned || 0) + commission;
              authService.updateUser(affiliate);
              
              mockTransactionDb.push({
                  id: transactionId, userId: payingUser.id, amountPaid,
                  creditsPurchased: tx.amount, timestamp: Date.now(),
                  affiliateId: affiliate.affiliateId, commissionPaid: commission,
              });
          }
      } else if (payingUser) {
           mockTransactionDb.push({
              id: transactionId, userId: payingUser.id, amountPaid,
              creditsPurchased: tx.amount, timestamp: Date.now(),
           });
      }
      return { status: 'paid', amount: tx.amount };
    }
    return { status: 'pending', amount: 0 };
  },

  getAllTransactions(): Transaction[] {
      return mockTransactionDb;
  },
  
  getTotalRevenue(): number {
      return mockTransactionDb.reduce((sum, tx) => sum + tx.amountPaid, 0);
  }
};