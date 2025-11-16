

export interface ImageFile {
  base64: string;
  mimeType: string;
}

export interface ConsistencyResult {
  consistent: boolean;
  reason: string;
}

export type LanguageCode = 'en' | 'pt' | 'fr' | 'es' | 'it' | 'af' | 'zh' | 'ja' | 'ar';

export type UserRole = 'user' | 'admin' | 'influencer' | 'affiliate';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  credits: number;
  // Affiliate System Fields
  affiliateId?: string; // Unique ID for affiliates
  commissionRate?: number; // e.g., 0.10 for 10%
  commissionEarned?: number; // Total commission earned in currency
  referredBy?: string; // The affiliateId of the user who referred them
}

export interface Transaction {
    id: string;
    userId: string;
    amountPaid: number; // In USD (e.g., 9.00)
    creditsPurchased: number;
    timestamp: number;
    affiliateId?: string; // The affiliate who gets the commission for this
    commissionPaid?: number; // The amount of commission paid
}

export type ImageModel = 'imagen-4.0-generate-001' | 'nano-banana' | 'grok-imagine';
export type VideoModel = 'gemini-veo' | 'openai-sora' | 'openai-sora-2';
export type AspectRatio = '1:1' | '9:16' | '16:9' | '4:3' | '3:4';

export interface StoryboardScene {
  scene: number;
  description: string;
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
}

declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
        MercadoPago: any;
    }
}
// FIX: Moved AppView and AppMode to this central types file to resolve circular dependencies.
export type AppView = 'home' | 'influencer' | 'productAd' | 'influencerOnly' | 'imageGenerator' | 'videoGenerator' | 'storyboardGenerator' | 'textToSpeechGenerator' | 'admin' | 'affiliate';
export type AppMode = 'influencer' | 'productAd' | 'influencerOnly' | 'imageGenerator' | 'videoGenerator' | 'storyboardGenerator' | 'textToSpeechGenerator';