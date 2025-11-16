import type { PixCharge, PaymentStatus } from '../types';

// In-memory map to simulate a database of pending transactions
const pendingTransactions = new Map<string, { charge: PixCharge; confirmAt: number; amount: number }>();

// --- Real PIX QR Code Generation Logic ---

// Function to format a field for the BR Code
const formatField = (id: string, value: string): string => {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
};

// Simplified BR Code generator
const generateBRCode = (pixKey: string, amount: string, merchantName: string): string => {
  const payloadFormatIndicator = '000201';
  const merchantAccountInfo = formatField('00', 'br.gov.bcb.pix') + formatField('01', pixKey);
  const merchantAccount = formatField('26', merchantAccountInfo);
  const merchantCategoryCode = '52040000'; // No specific category
  const transactionCurrency = '5303986'; // BRL
  const transactionAmount = formatField('54', amount.replace(',', '.'));
  const countryCode = '5802BR';
  const merchantNameFormatted = formatField('59', merchantName.substring(0, 25)); // Max 25 chars
  const merchantCity = formatField('60', 'SAO PAULO'); // Static city for simplicity
  
  const payload = `${payloadFormatIndicator}${merchantAccount}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${merchantNameFormatted}${merchantCity}`;

  // CRC16 Calculation (Standard for PIX)
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
  async createPixCharge(amountInBRL: string, creditAmount: number): Promise<PixCharge> {
    const pixKey = localStorage.getItem('adminPixKey');
    if (!pixKey) {
      // In a real app, this would be a more user-friendly error.
      // For this app, we return a "not configured" state.
      const notConfiguredSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="50" font-size="6" text-anchor="middle">PIX not configured by admin.</text></svg>`;
      return {
        transactionId: 'not-configured',
        status: 'pending',
        copyPasteCode: 'PIX key is not configured in the admin panel.',
        qrCodeDataUrl: `data:image/svg+xml;base64,${btoa(notConfiguredSvg)}`,
      };
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const transactionId = `pix_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const copyPasteCode = generateBRCode(pixKey, amountInBRL, 'AI PROMPT GEN');
    
    // Use an external API to generate the QR code image from the BR Code text
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(copyPasteCode)}`;
    const response = await fetch(qrApiUrl);
    const blob = await response.blob();
    const qrCodeDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });

    const charge: PixCharge = {
      transactionId,
      status: 'pending',
      copyPasteCode,
      qrCodeDataUrl,
    };

    // Simulate payment confirmation after 10 seconds
    const confirmAt = Date.now() + 10000;
    pendingTransactions.set(transactionId, { charge, confirmAt, amount: creditAmount });

    return charge;
  },

  async getPaymentStatus(transactionId: string): Promise<{ status: PaymentStatus, amount: number }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tx = pendingTransactions.get(transactionId);
    if (!tx) {
        throw new Error("Transaction not found.");
    }

    if (Date.now() >= tx.confirmAt) {
      tx.charge.status = 'paid';
      return { status: 'paid', amount: tx.amount };
    }

    return { status: 'pending', amount: 0 };
  },
};