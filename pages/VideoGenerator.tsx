

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateVideo } from '../services/geminiService';
import { SparklesIcon, LoadingSpinnerIcon, UserIcon, XIcon } from '../components/icons';
import ModelSelector from '../components/ModelSelector';
import type { VideoModel, ImageFile } from '../types';

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

type VideoStyle = 'default' | 'casual' | 'formal';

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ requestLogin }) => {
  const { user, spendCredit } = useAuth();
  const [prompt, setPrompt] = useState<string>('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<VideoModel>('gemini-veo');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [duration, setDuration] = useState<number>(5);
  const [videoStyle, setVideoStyle] = useState<VideoStyle>('default');
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [startImage, setStartImage] = useState<ImageFile | null>(null);
  const [isCapturingFrame, setIsCapturingFrame] = useState<boolean>(false);
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
            setApiKeySelected(true);
            setError(null);
        } catch (e) {
            console.error("Error opening API key selection:", e);
            setError("Could not open the API key selection dialog.");
        }
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCapturingFrame(true);
    setError(null);
    setStartImage(null);
    
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.muted = true;
    videoEl.src = URL.createObjectURL(file);

    videoEl.onloadedmetadata = () => {
        videoEl.currentTime = videoEl.duration;
    };

    videoEl.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            const base64 = dataUrl.split(',')[1];
            setStartImage({ base64, mimeType: 'image/jpeg' });
        } else {
            setError("Failed to create canvas to capture frame.");
        }
        URL.revokeObjectURL(videoEl.src);
        setIsCapturingFrame(false);
    };

    videoEl.onerror = () => {
        setError("Could not load video to capture frame.");
        URL.revokeObjectURL(videoEl.src);
        setIsCapturingFrame(false);
    };
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

    // Apply Video Style Logic
    let finalPrompt = prompt;
    if (videoStyle === 'casual') {
        finalPrompt += " Visual Style: Create a casual, genuine video. It should not look like a promotional video. Aim for an informal, authentic vibe, like user-generated content.";
    } else if (videoStyle === 'formal') {
        finalPrompt += " Visual Style: Create a formal product presentation video. It should convey credibility, seriousness, and conviction. Professional commercial look.";
    }

    try {
      spendCredit(creditCost);
      const videoUrl = await generateVideo(finalPrompt, selectedModel, aspectRatio, duration, startImage);
      setGeneratedVideoUrl(videoUrl);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate video: ${errorMessage}`);
      if (isVEOSelected && errorMessage.includes("API key error")) {
          setApiKeySelected(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [prompt, user, spendCredit, selectedModel, aspectRatio, duration, isVEOSelected, requestLogin, startImage, videoStyle]);
  
  if (isVEOSelected && !apiKeySelected) {
      return (
          <div className="text-center p-8 bg-slate-800 rounded-lg shadow-md max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">API Key Required for VEO</h3>
              <p className="text-slate-300 mb-4">Video generation with Veo requires you to select your own API key. Billing will be applied to the project associated with this key.</p>
              <p className="text-sm text-slate-400 mb-6">For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline text-purple-400 hover:text-purple-300">billing documentation</a>.</p>
              <button
                  onClick={handleSelectKey}
                  className="inline-flex items-center justify-center px-6 py-3 font-semibold text-base text-white transition-all duration-200 bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500"
              >
                  Select API Key
              </button>
              {error && <p className="mt-4 text-red-400">{error}</p>}
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
            placeholder={`e.g., A neon hologram of a cat driving at top speed, cinematic, ${aspectRatio} aspect ratio.`}
            className="w-full flex-grow bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 transition-colors focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 resize-vertical"
            rows={4}
          />
        </div>

        <div className="w-full bg-slate-800 p-6 rounded-lg shadow-md flex flex-col">
          <h3 className="text-xl font-semibold text-slate-200 mb-4">Start Video from Last Frame (Optional)</h3>
          <div className="flex items-center flex-wrap gap-4">
            <input
              type="file"
              accept="video/*"
              id="video-upload"
              className="hidden"
              onChange={handleVideoUpload}
              disabled={isLoading || isCapturingFrame}
            />
            <label
              htmlFor="video-upload"
              className={`inline-flex items-center px-4 py-2 rounded-md font-semibold transition-colors cursor-pointer ${isLoading || isCapturingFrame ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              Upload Video
            </label>
            {isCapturingFrame && (
              <div className="flex items-center gap-2 text-slate-400">
                <LoadingSpinnerIcon className="w-5 h-5 animate-spin" />
                <span>Capturing frame...</span>
              </div>
            )}
            {startImage && (
              <div className="relative">
                <img
                  src={`data:${startImage.mimeType};base64,${startImage.base64}`}
                  alt="Captured last frame"
                  className="w-32 h-auto rounded-md border-2 border-purple-500"
                />
                <button
                    onClick={() => {
                        setStartImage(null);
                        const input = document.getElementById('video-upload') as HTMLInputElement;
                        if (input) input.value = '';
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-500"
                    aria-label="Remove captured frame"
                >
                    <XIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">Upload a video to use its final frame as the starting point for the new generation.</p>
        </div>

        <div className="w-full flex flex-col gap-4 bg-slate-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-slate-200">Settings</h3>
            <div className="flex flex-col md:flex-row gap-6">
                
                <div className="flex flex-col gap-2">
                    <span className="text-slate-300 font-medium text-sm">Aspect Ratio</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAspectRatio('9:16')}
                            className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${aspectRatio === '9:16' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        >
                            9:16
                        </button>
                        <button
                            onClick={() => setAspectRatio('16:9')}
                            className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${aspectRatio === '16:9' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        >
                            16:9
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-slate-300 font-medium text-sm">Video Style</span>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setVideoStyle('default')}
                            className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${videoStyle === 'default' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        >
                            Default
                        </button>
                        <button
                            onClick={() => setVideoStyle('casual')}
                            className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${videoStyle === 'casual' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        >
                            Casual
                        </button>
                        <button
                            onClick={() => setVideoStyle('formal')}
                            className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${videoStyle === 'formal' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        >
                            Formal
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2 w-full max-w-xs">
                    <div className="flex justify-between items-center">
                        <label htmlFor="duration-slider" className="text-slate-300 font-medium text-sm">Duration</label>
                        <span className="text-xs font-semibold text-white bg-slate-700 rounded px-2 py-0.5">{duration}s</span>
                    </div>
                    <input
                        id="duration-slider"
                        type="range"
                        min="4"
                        max="8"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer range-thumb-purple"
                        style={{'--thumb-color': 'rgb(168 85 247)'} as React.CSSProperties}
                    />
                </div>

            </div>
        </div>


        <div className="flex justify-center">
          <button
            onClick={handleGenerateVideo}
            disabled={!prompt.trim() || isLoading || selectedModelInfo?.disabled}
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
                {selectedModelInfo?.disabled ? 'Model Unavailable' : 'Generate Video (5 Credits)'}
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="text-center p-4 bg-red-800/50 border border-red-700 text-red-400 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        <div className="w-full">
          {isLoading && (
              <div className={`w-full max-w-sm ${aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-[16/9]'} bg-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500 mx-auto p-4 text-center`}>
                  <LoadingSpinnerIcon className="w-12 h-12 animate-spin text-purple-400" />
                  <p className="mt-4 font-semibold text-lg text-slate-400">{loadingMessage}</p>
              </div>
          )}
          {!isLoading && generatedVideoUrl && (
              <div className={`w-full max-w-sm ${aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-[16/9]'} bg-black rounded-lg shadow-lg overflow-hidden mx-auto`}>
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
              <div className={`w-full max-w-sm ${aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-[16/9]'} bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500 mx-auto`}>
                  <UserIcon className="w-16 h-16" />
                  <p className="mt-4 font-semibold text-slate-400">Your generated video will appear here</p>
              </div>
          )}
        </div>
      </div>
      <style>{`
        .range-thumb-purple::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: var(--thumb-color);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #fff;
        }
        .range-thumb-purple::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: var(--thumb-color);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #fff;
        }
      `}</style>
    </>
  );
};

export default VideoGenerator;
