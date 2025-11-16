import React, { useState, useCallback } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { PromptDisplay } from '../components/PromptDisplay';
import { ConsistencyResultDisplay } from '../components/ConsistencyResultDisplay';
import { generateVideoPrompt, testPromptConsistency } from '../services/geminiService';
import type { ImageFile, ConsistencyResult, LanguageCode } from '../types';
import { UploadIcon, SparklesIcon, LoadingSpinnerIcon, ShieldCheckIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';

const InfluencerPromptGenerator: React.FC = () => {
  const { user, spendCredit } = useAuth();
  const [influencerImage, setInfluencerImage] = useState<ImageFile | null>(null);
  const [productImages, setProductImages] = useState<ImageFile[] | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<LanguageCode>('en');

  const [isTestingConsistency, setIsTestingConsistency] = useState<boolean>(false);
  const [consistencyResult, setConsistencyResult] = useState<ConsistencyResult | null>(null);

  const handleGeneratePrompt = useCallback(async () => {
    if (!influencerImage || !productImages || productImages.length === 0) {
      setError('Please upload both an influencer and at least one product image.');
      return;
    }
    
    if (user && user.credits < 1) {
        setError("You don't have enough credits to generate a prompt. Please buy more credits.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPrompt('');
    setConsistencyResult(null); // Reset consistency result on new generation

    try {
      spendCredit(); // Deduct credit
      const prompt = await generateVideoPrompt(influencerImage, productImages, language);
      setGeneratedPrompt(prompt);
    } catch (e) {
      console.error(e);
      setError('Failed to generate prompt. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  }, [influencerImage, productImages, language, user, spendCredit]);
  
  const handleTestConsistency = useCallback(async () => {
    if (!generatedPrompt) return;

    setIsTestingConsistency(true);
    setConsistencyResult(null);
    setError(null);

    try {
      const result = await testPromptConsistency(generatedPrompt);
      setConsistencyResult(result);
    } catch (e) {
      console.error(e);
      setError('Failed to test prompt consistency. Please check the console for details.');
    } finally {
      setIsTestingConsistency(false);
    }
  }, [generatedPrompt]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ImageUploader
          title="Influencer Image"
          onImageUpload={(files) => setInfluencerImage(files[0] || null)}
          icon={<UploadIcon className="w-10 h-10 text-slate-500" />}
        />
        <ImageUploader
          title="Product Image(s)"
          onImageUpload={setProductImages}
          icon={<UploadIcon className="w-10 h-10 text-slate-500" />}
          multiple={true}
        />
      </div>

      <div className="flex justify-center">
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="appearance-none bg-slate-800 border border-slate-700 text-white font-semibold py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-slate-700 focus:border-purple-500 transition-colors duration-200"
            aria-label="Select dialogue language"
          >
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
            <option value="it">Italiano</option>
            <option value="af">Afrikaans</option>
            <option value="zh">中文 (Chinese)</option>
            <option value="ja">日本語 (Japanese)</option>
            <option value="ar">العربية (Arabic)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleGeneratePrompt}
          disabled={!influencerImage || !productImages || productImages.length === 0 || isLoading || (user?.credits ?? 0) < 1}
          className="inline-flex items-center justify-center px-8 py-4 font-bold text-lg text-white transition-all duration-200 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon className="-ml-1 mr-3 h-6 w-6" />
              Generate Prompt (1 Credit)
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="text-center p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {generatedPrompt && (
        <div className="space-y-6">
          <PromptDisplay prompt={generatedPrompt} />

          <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleTestConsistency}
                disabled={isTestingConsistency}
                className="inline-flex items-center justify-center px-6 py-3 font-semibold text-md text-white transition-all duration-200 bg-slate-700 rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingConsistency ? (
                  <>
                    <LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Testing...
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="-ml-1 mr-2 h-5 w-5" />
                    Test Consistency
                  </>
                )}
              </button>

              {consistencyResult && (
                <ConsistencyResultDisplay result={consistencyResult} />
              )}
          </div>
        </div>
      )}
    </>
  );
};

export default InfluencerPromptGenerator;
