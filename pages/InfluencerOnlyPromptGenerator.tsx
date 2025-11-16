
import React, { useState } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { PromptDisplay } from '../components/PromptDisplay';
import { ConsistencyResultDisplay } from '../components/ConsistencyResultDisplay';
import { generateInfluencerOnlyPrompt } from '../services/geminiService';
import type { ImageFile, LanguageCode } from '../types';
import { UploadIcon, SparklesIcon, LoadingSpinnerIcon, ShieldCheckIcon } from '../components/icons';
import { usePromptGenerator } from '../hooks/usePromptGenerator';
import { useConsistencyCheck } from '../hooks/useConsistencyCheck';

interface InfluencerOnlyPromptGeneratorProps {
  requestLogin?: () => void;
}

const InfluencerOnlyPromptGenerator: React.FC<InfluencerOnlyPromptGeneratorProps> = ({ requestLogin }) => {
  const [influencerImage, setInfluencerImage] = useState<ImageFile | null>(null);
  const [actions, setActions] = useState<string>('');
  const [language, setLanguage] = useState<LanguageCode>('en');

  // FIX: Explicitly provided the generic type for `usePromptGenerator` to correctly type the `args` parameter.
  const { isLoading, error, generatedPrompt, generate, setError, setGeneratedPrompt } = usePromptGenerator<{
    influencerImage: ImageFile;
    actions: string;
    language: LanguageCode;
  }>(
      (args) => generateInfluencerOnlyPrompt(args.influencerImage, args.actions, args.language)
  );

  const { isTesting, result, check, checkError, setResult } = useConsistencyCheck(generatedPrompt);

  const handleGeneratePrompt = () => {
    const validation = () => {
        if (!influencerImage || !actions.trim()) {
            setError('Please upload an influencer image and describe the actions.');
            return false;
        }
        return true;
    };
    setResult(null);
    // FIX: Pass `requestLogin` to the `generate` function.
    generate({ influencerImage, actions, language }, validation, requestLogin);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <ImageUploader
          title="Influencer Image"
          onImageUpload={(files) => setInfluencerImage(files[0] || null)}
          icon={<UploadIcon />}
        />
        <div className="bg-slate-800 p-6 rounded-lg shadow-md flex flex-col h-full">
            <h3 className="text-xl font-semibold text-slate-200 mb-4">Influencer's Actions</h3>
            <textarea
                value={actions}
                onChange={(e) => setActions(e.target.value)}
                placeholder="e.g., The influencer is joyfully dancing in a sunlit park, then they look at the camera, wink, and point towards the sky."
                className="w-full flex-grow bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 transition-colors focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 resize-none"
                rows={8}
            />
        </div>
      </div>

      <div className="flex justify-center items-center">
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="appearance-none bg-slate-800 border border-slate-700 text-white font-semibold py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-slate-700 focus:border-purple-500"
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

      <div className="flex justify-center items-center">
        <button
          onClick={handleGeneratePrompt}
          disabled={!influencerImage || !actions.trim() || isLoading}
          className="inline-flex items-center justify-center px-8 py-4 font-bold text-lg text-white transition-all duration-200 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg hover:bg-gradient-to-br hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />
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

      {(error || checkError) && (
        <div className="text-center p-4 bg-red-800/50 border border-red-700 text-red-400 rounded-lg">
          <p>{error || checkError}</p>
        </div>
      )}

      {generatedPrompt && (
        <div className="flex flex-col items-center gap-6">
          <PromptDisplay prompt={generatedPrompt} />

          <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => check(requestLogin)}
                disabled={isTesting}
                className="inline-flex items-center justify-center px-6 py-3 font-semibold text-base text-white transition-all duration-200 bg-slate-700 rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? (
                  <>
                    <LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Testing...
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="-ml-1 mr-2 h-5 w-5" />
                    Test Consistency
                  </>
                )}
              </button>

              {result && (
                <ConsistencyResultDisplay result={result} />
              )}
          </div>
        </div>
      )}
    </>
  );
};

export default InfluencerOnlyPromptGenerator;