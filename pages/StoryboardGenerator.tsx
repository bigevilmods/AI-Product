

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateStoryboard, generateImage, generateVideo } from '../services/geminiService';
import { SparklesIcon, LoadingSpinnerIcon, ImageIcon } from '../components/icons';
import type { StoryboardScene } from '../types';

interface StoryboardGeneratorProps {
  requestLogin?: () => void;
}

const loadingMessages = [
  "Brewing up your video potion...",
  "Teaching pixels to dance...",
  "Assembling cinematic magic...",
  "This can take a few minutes, hang tight!",
];

const StoryboardGenerator: React.FC<StoryboardGeneratorProps> = ({ requestLogin }) => {
    const { user, spendCredit } = useAuth();
    const [prompt, setPrompt] = useState<string>('');
    const [storyboard, setStoryboard] = useState<StoryboardScene[] | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    const [isLoadingStoryboard, setIsLoadingStoryboard] = useState(false);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);
    
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(true); // Default to true, check on generate
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    
    useEffect(() => {
        let interval: number;
        if (isLoadingVideo) {
            interval = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    return loadingMessages[(currentIndex + 1) % loadingMessages.length];
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isLoadingVideo]);
    
    const handleGenerateStoryboard = useCallback(async () => {
        if (!user) { requestLogin?.(); return; }
        if (!prompt.trim()) { setError('Please enter a video idea.'); return; }
        if (user.credits < 1) { setError('You need at least 1 credit to generate a storyboard.'); return; }

        setIsLoadingStoryboard(true);
        setError(null);
        setStoryboard(null);
        setGeneratedVideoUrl(null);
        try {
            spendCredit(1);
            const scenes = await generateStoryboard(prompt);
            setStoryboard(scenes);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoadingStoryboard(false);
        }
    }, [prompt, user, spendCredit, requestLogin]);

    const handleUpdateScene = (index: number, field: 'description' | 'imagePrompt', value: string) => {
        if (!storyboard) return;
        const newStoryboard = [...storyboard];
        newStoryboard[index][field] = value;
        setStoryboard(newStoryboard);
    };

    const handleGenerateImage = useCallback(async (sceneIndex: number) => {
        if (!user) { requestLogin?.(); return; }
        if (!storyboard) return;
        if (user.credits < 1) { setError('You need at least 1 credit to generate an image.'); return; }

        const newStoryboard = [...storyboard];
        newStoryboard[sceneIndex].isGeneratingImage = true;
        setStoryboard(newStoryboard);
        setError(null);

        try {
            spendCredit(1);
            const [imageUrl] = await generateImage(storyboard[sceneIndex].imagePrompt, 1, 'imagen-4.0-generate-001', '16:9');
            
            setStoryboard(prev => {
                if (!prev) return null;
                const updated = [...prev];
                updated[sceneIndex].imageUrl = imageUrl;
                updated[sceneIndex].isGeneratingImage = false;
                return updated;
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred generating the image.');
             setStoryboard(prev => {
                if (!prev) return null;
                const updated = [...prev];
                updated[sceneIndex].isGeneratingImage = false;
                return updated;
            });
        }
    }, [storyboard, user, spendCredit, requestLogin]);
    
    const handleGenerateVideo = useCallback(async () => {
        if (!user) { requestLogin?.(); return; }
        if (!storyboard) { setError('Please generate a storyboard first.'); return; }
        if (user.credits < 5) { setError('You need at least 5 credits to generate a video.'); return; }

        if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
            setApiKeySelected(false);
            setError("API Key Required for VEO. Please select your API key.");
            return;
        }

        setIsLoadingVideo(true);
        setError(null);
        setGeneratedVideoUrl(null);

        const videoPrompt = storyboard.map(s => `Scene ${s.scene}: ${s.description}`).join('\n');
        
        try {
            spendCredit(5);
            const url = await generateVideo(videoPrompt, 'gemini-veo', '16:9', 8);
            setGeneratedVideoUrl(url);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate video: ${errorMessage}`);
            if (errorMessage.includes("API key error")) {
                setApiKeySelected(false);
            }
        } finally {
            setIsLoadingVideo(false);
        }
    }, [storyboard, user, spendCredit, requestLogin]);
    
    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true);
            setError(null);
        }
    };

    const allImagesGenerated = storyboard?.every(s => s.imageUrl);

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-6xl mx-auto">
            {/* Step 1: Prompt Input */}
            <div className="w-full bg-slate-800 p-6 rounded-lg shadow-md flex flex-col">
                <h3 className="text-xl font-semibold text-slate-200 mb-4">1. Your Video Idea</h3>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A cinematic commercial for a new brand of coffee called 'Nova Brew'."
                    className="w-full flex-grow bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 transition-colors focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 resize-vertical"
                    rows={3}
                    disabled={isLoadingStoryboard || !!storyboard}
                />
            </div>

            <button
                onClick={handleGenerateStoryboard}
                disabled={!prompt.trim() || isLoadingStoryboard || !!storyboard}
                className="inline-flex items-center justify-center px-8 py-3 font-bold text-base text-white transition-all duration-200 bg-purple-600 rounded-lg shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoadingStoryboard ? <><LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />Generating Storyboard...</> : <><SparklesIcon className="-ml-1 mr-3 h-5 w-5" />Generate Storyboard (1 Credit)</>}
            </button>
            
            {error && <div className="text-center p-4 w-full bg-red-800/50 border border-red-700 text-red-400 rounded-lg"><p>{error}</p></div>}
            
            {/* Step 2: Edit Storyboard */}
            {isLoadingStoryboard && <LoadingSpinnerIcon className="w-10 h-10 animate-spin text-purple-400" />}
            {storyboard && (
                <div className="w-full flex flex-col gap-6">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-200 mb-4 text-center">2. Edit Your Storyboard & Generate Scene Images</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {storyboard.map((scene, index) => (
                                <div key={scene.scene} className="bg-slate-800 p-4 rounded-lg shadow-md flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                       <h4 className="font-bold text-lg text-purple-300">Scene {scene.scene}</h4>
                                       <button onClick={() => handleGenerateImage(index)} disabled={scene.isGeneratingImage || isLoadingVideo} className="px-3 py-1 text-xs font-semibold bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50">
                                          {scene.isGeneratingImage ? <LoadingSpinnerIcon className="w-4 h-4 animate-spin" /> : 'Generate Image (1 Credit)'}
                                       </button>
                                    </div>
                                    <div className="aspect-video bg-slate-900/50 rounded flex items-center justify-center">
                                       {scene.isGeneratingImage && <LoadingSpinnerIcon className="w-8 h-8 animate-spin text-purple-400" />}
                                       {!scene.isGeneratingImage && scene.imageUrl && <img src={scene.imageUrl} alt={`Scene ${scene.scene}`} className="w-full h-full object-cover rounded" />}
                                       {!scene.isGeneratingImage && !scene.imageUrl && <ImageIcon className="w-12 h-12 text-slate-600" />}
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-400">Description</label>
                                        <textarea value={scene.description} onChange={e => handleUpdateScene(index, 'description', e.target.value)} rows={3} className="mt-1 w-full text-xs bg-slate-700/50 border border-slate-600 rounded p-2 focus:ring-1 focus:ring-purple-500 focus:border-purple-500" />
                                    </div>
                                     <div>
                                        <label className="text-sm font-semibold text-slate-400">Image Prompt</label>
                                        <textarea value={scene.imagePrompt} onChange={e => handleUpdateScene(index, 'imagePrompt', e.target.value)} rows={2} className="mt-1 w-full text-xs bg-slate-700/50 border border-slate-600 rounded p-2 focus:ring-1 focus:ring-purple-500 focus:border-purple-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 3: Generate Video */}
                    <div className="text-center flex flex-col items-center gap-4">
                        <h3 className="text-xl font-semibold text-slate-200">3. Generate Your Video</h3>
                        {!apiKeySelected && (
                            <div className="text-center p-4 bg-slate-800 rounded-lg shadow-md max-w-lg">
                                <p className="text-slate-300 mb-4">Video generation with Veo requires you to select your own API key.</p>
                                <button onClick={handleSelectKey} className="px-4 py-2 font-semibold text-sm bg-purple-600 rounded-md hover:bg-purple-700">Select API Key</button>
                            </div>
                        )}
                        <button
                            onClick={handleGenerateVideo}
                            disabled={!allImagesGenerated || isLoadingVideo || !apiKeySelected}
                            className="inline-flex items-center justify-center px-8 py-3 font-bold text-base text-white transition-all duration-200 bg-green-600 rounded-lg shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!allImagesGenerated ? "Please generate an image for every scene first." : ""}
                        >
                            {isLoadingVideo ? <><LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />Generating Video...</> : <>Generate Video (5 Credits)</>}
                        </button>
                    </div>
                </div>
            )}
            
            {/* Step 4: View and Export */}
            <div className="w-full">
                {isLoadingVideo && (
                    <div className="w-full max-w-md aspect-video bg-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500 mx-auto p-4 text-center">
                        <LoadingSpinnerIcon className="w-12 h-12 animate-spin text-purple-400" />
                        <p className="mt-4 font-semibold text-lg text-slate-400">{loadingMessage}</p>
                    </div>
                )}
                {generatedVideoUrl && !isLoadingVideo && (
                     <div className="w-full flex flex-col items-center gap-6">
                        <h3 className="text-xl font-semibold text-slate-200">4. Your Masterpiece is Ready!</h3>
                        <div className="w-full max-w-md aspect-video bg-black rounded-lg shadow-lg overflow-hidden mx-auto">
                            <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                        </div>
                        <a href={generatedVideoUrl} download="storyboard-video.mp4" className="inline-flex items-center justify-center px-6 py-2 font-semibold text-base text-white transition-all duration-200 bg-purple-600 rounded-lg shadow-md hover:bg-purple-700">
                            Export Video
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoryboardGenerator;