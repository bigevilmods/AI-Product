
import type { PixCharge, PaymentStatus, Transaction } from '../types';
import { authService } from './authService';

const pendingTransactions = new Map<string, { charge: PixCharge; confirmAt: number; amount: number; userId: string }>();

const mockTransactionDb: Transaction[] = [
    {
        id: 'tx_12345',
        userId: 'user-3',
        amountPaid: 45.00,
        creditsPurchased: 50,
        timestamp: Date.now() - 86400000,
        affiliateId: 'aff-user-4',
        commissionPaid: 6.75,
    }
];

const formatField = (id: string, value: string): string => {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
};
const generateBRCode = (pixKey: string, amount: string, merchantName: string): string => {
  const payloadFormatIndicator = '000201';
  const merchantAccountInfo = formatField('00', 'br.gov.bcb.pix') + formatField('01', pixKey);
  const merchantAccount = formatField('26', merchantAccountInfo);
  const merchantCategoryCode = '52040000';
  const transactionCurrency = '5303986';
  const transactionAmount = formatField('54', amount.replace(',', '.'));
  const countryCode = '5802BR';
  const merchantNameFormatted = formatField('59', merchantName.substring(0, 25));
  const merchantCity = formatField('60', 'SAO PAULO');
  
  const payload = `${payloadFormatIndicator}${merchantAccount}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${merchantNameFormatted}${merchantCity}`;
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  const crc16 = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  return `${payload}6304${crc16}`;
};

export const paymentService = {
  async createPixCharge(amountInBRL: string, creditAmount: number, userId: string): Promise<PixCharge> {
    const pixKey = localStorage.getItem('adminPixKey');
    if (!pixKey) {
      const notConfiguredSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="50" font-size="6" text-anchor="middle">PIX not configured by admin.</text></svg>`;
      return {
        transactionId: 'not-configured',
        status: 'pending',
        copyPasteCode: 'PIX key is not configured in the admin panel.',
        qrCodeDataUrl: `data:image/svg+xml;base64,${btoa(notConfiguredSvg)}`,
      };
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    const transactionId = `pix_${Date.now()}`;
    const copyPasteCode = generateBRCode(pixKey, amountInBRL, 'AI PROMPT GEN');
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(copyPasteCode)}`;
    const response = await fetch(qrApiUrl);
    const blob = await response.blob();
    const qrCodeDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });

    const charge: PixCharge = { transactionId, status: 'pending', copyPasteCode, qrCodeDataUrl };
    const confirmAt = Date.now() + 10000;
    pendingTransactions.set(transactionId, { charge, confirmAt, amount: creditAmount, userId });
    return charge;
  },

  async getPaymentStatus(transactionId: string): Promise<{ status: PaymentStatus, amount: number }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const tx = pendingTransactions.get(transactionId);
    if (!tx) throw new Error("Transaction not found.");

    if (Date.now() >= tx.confirmAt && tx.charge.status === 'pending') {
      tx.charge.status = 'paid';
      
      const allUsers = authService.getAllUsers();
      const payingUser = allUsers.find(u => u.id === tx.userId);
      const amountPaid = parseFloat(tx.charge.copyPasteCode.match(/54\d{2}([\d.,]+)/)![1].replace(',', '.'));
      
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