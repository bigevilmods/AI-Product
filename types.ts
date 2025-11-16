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

// FIX: To resolve "Subsequent property declarations" TypeScript error, the AIStudio
// interface and window augmentation are defined here, creating a single global
// source of truth.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}
