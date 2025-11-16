

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateVideo } from '../services/geminiService';
import { SparklesIcon, LoadingSpinnerIcon, UserIcon } from '../components/icons';
import ModelSelector from '../components/ModelSelector';
import type { VideoModel } from '../types';

// FIX: The AIStudio interface and window augmentation were moved to `types.ts`
// to create a single source of truth for this global type and resolve a
// "Subsequent property declarations" TypeScript error.

interface VideoGeneratorProps {
  requestLogin?: () => void;
}

const loadingMessages = [
  "Brewing up your video potion...",
  "Teaching pixels to dance...",
  "Assembling cinematic magic...",
  "Untangling digital film stock...",
  "Directing an army of transistors...",
  "Polishing the final cut...",
  "This can take a few minutes, hang tight!",
];

const videoModels = [
    { id: 'gemini-veo', name: 'Gemini VEO', description: 'Google\'s state-of-the-art video model.' },
    { id: 'openai-sora', name: 'OpenAI Sora', description: 'Coming soon.', disabled: true },
    { id: 'openai-sora-2', name: 'Sora 2', description: 'Coming soon.', disabled: true },
];

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ requestLogin }) => {
  const { user, spendCredit } = useAuth();
  const [prompt, setPrompt] = useState<string>('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<VideoModel>('gemini-veo');
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const messageIntervalRef = useRef<number | null>(null);

  const isVEOSelected = selectedModel === 'gemini-veo';
  const selectedModelInfo = videoModels.find(m => m.id === selectedModel);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && isVEOSelected) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      }
    };
    checkApiKey();
  }, [isVEOSelected]);

  useEffect(() => {
    if (isLoading) {
      messageIntervalRef.current = window.setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 3000);
    } else {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
      setLoadingMessage(loadingMessages[0]);
    }
    return () => {
        if (messageIntervalRef.current) {
            clearInterval(messageIntervalRef.current);
        }
    };
  }, [isLoading]);
  
  const handleSelectKey = async () => {
    if (window.aistudio) {
        try {
            await window.aistudio.openSelectKey();
            // Assume success and optimistically update UI
            setApiKeySelected(true);
            setError(null);
        } catch (e) {
            console.error("Error opening API key selection:", e);
            setError("Could not open the API key selection dialog.");
        }
    }
  };

  const handleGenerateVideo = useCallback(async () => {
    if (!user) {
      requestLogin?.();
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt to generate a video.');
      return;
    }
    
    const creditCost = 5;
    if (user.credits < creditCost) {
      setError(`You need ${creditCost} credits to generate a video. Please buy more credits.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);

    try {
      spendCredit(creditCost);
      const videoUrl = await generateVideo(prompt, selectedModel);
      setGeneratedVideoUrl(videoUrl);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate video: ${errorMessage}`);
      // If API key error, prompt user to select again.
      if (isVEOSelected && errorMessage.includes("API key error")) {
          setApiKeySelected(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [prompt, user, spendCredit, selectedModel, isVEOSelected, requestLogin]);
  
  if (isVEOSelected && !apiKeySelected) {
      return (
          <div className="text-center p-8 bg-slate-800 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-white mb-4">API Key Required for VEO</h3>
              <p className="text-slate-300 mb-6">Video generation with Veo requires you to select your own API key. Billing will be applied to the project associated with this key.</p>
              <p className="text-xs text-slate-400 mb-6">For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-400">billing documentation</a>.</p>
              <button
                  onClick={handleSelectKey}
                  className="px-6 py-3 font-semibold text-lg text-white bg-purple-600 rounded-md hover:bg-purple-500 transition-colors"
              >
                  Select API Key
              </button>
              {error && <p className="text-red-400 mt-4">{error}</p>}
          </div>
      );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
        <ModelSelector 
            models={videoModels}
            selectedModel={selectedModel}
            onSelectModel={(modelId) => setSelectedModel(modelId as VideoModel)}
        />
        <div className="w-full bg-slate-800 p-6 rounded-lg shadow-md flex flex-col">
          <h3 className="text-xl font-semibold text-slate-200 mb-4">Video Prompt</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A neon hologram of a cat driving at top speed, cinematic, 9:16 aspect ratio."
            className="w-full flex-grow bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 resize-y"
            rows={4}
          />
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleGenerateVideo}
            disabled={!prompt.trim() || isLoading || selectedModelInfo?.disabled}
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
                {selectedModelInfo?.disabled ? 'Model Unavailable' : 'Generate Video (5 Credits)'}
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="text-center p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg w-full">
            <p>{error}</p>
          </div>
        )}

        <div className="w-full flex justify-center mt-4">
          {isLoading && (
              <div className="w-full max-w-sm aspect-[9/16] bg-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <LoadingSpinnerIcon className="w-12 h-12 animate-spin text-purple-400" />
                  <p className="mt-4 font-semibold text-lg">{loadingMessage}</p>
              </div>
          )}
          {!isLoading && generatedVideoUrl && (
              <div className="w-full max-w-sm aspect-[9/16] bg-black rounded-lg shadow-lg overflow-hidden">
                  <video
                    src={generatedVideoUrl} 
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain" 
                  />
              </div>
          )}
          {!isLoading && !generatedVideoUrl && (
              <div className="w-full max-w-sm aspect-[9/16] bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                  <UserIcon className="w-16 h-16" />
                  <p className="mt-4 font-semibold">Your generated video will appear here</p>
              </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VideoGenerator;