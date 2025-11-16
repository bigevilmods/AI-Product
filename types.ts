export interface ImageFile {
  base64: string;
  mimeType: string;
}

export interface ConsistencyResult {
  consistent: boolean;
  reason: string;
}

export type LanguageCode = 'en' | 'pt' | 'fr' | 'es' | 'it' | 'af' | 'zh' | 'ja' | 'ar';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  credits: number;
}

export type PaymentStatus = 'pending' | 'paid';

export interface PixCharge {
  transactionId: string;
  status: PaymentStatus;
  copyPasteCode: string;
  qrCodeDataUrl: string; // The QR code will be a data URL (e.g., SVG)
}

export type ImageModel = 'imagen-4.0-generate-001' | 'nano-banana' | 'grok-imagine';
export type VideoModel = 'gemini-veo' | 'openai-sora' | 'openai-sora-2';