
import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateImage } from '../services/geminiService';
import { SparklesIcon, LoadingSpinnerIcon, ImageIcon } from '../components/icons';
import FullscreenImageViewer from '../components/FullscreenImageViewer';
import ModelSelector from '../components/ModelSelector';
import type { ImageModel, AspectRatio } from '../types';

interface ImageGeneratorProps {
  requestLogin?: () => void;
}

const imageModels = [
    { id: 'imagen-4.0-generate-001', name: 'Imagen 4.0', description: 'Highest quality images, supports multiple generations.' },
    { id: 'nano-banana', name: 'Nano Banana', description: 'Fast, efficient, single image generation.' },
    { id: 'grok-imagine', name: 'Grok Imagine', description: 'Coming soon.', disabled: true },
];

const imageAspectRatios: { id: AspectRatio, name: string }[] = [
    { id: '1:1', name: 'Square' },
    { id: '9:16', name: 'Portrait' },
    { id: '16:9', name: 'Landscape' },
    { id: '4:3', name: 'Photo' },
    { id: '3:4', name: 'Tall' },
];

const aspectRatioClasses: Record<AspectRatio, string> = {
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16]',
    '16:9': 'aspect-[16/9]',
    '4:3': 'aspect-[4/3]',
    '3:4': 'aspect-[3/4]',
};


const ImageGenerator: React.FC<ImageGeneratorProps> = ({ requestLogin }) => {
  const { user, spendCredit } = useAuth();
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ImageModel>('imagen-4.0-generate-001');
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const isNanoBanana = selectedModel === 'nano-banana';
  const currentCreditCost = isNanoBanana ? 1 : numberOfImages;

  const handleGenerateImage = useCallback(async () => {
    if (!user) {
      requestLogin?.();
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt to generate an image.');
      return;
    }
    
    if (user.credits < currentCreditCost) {
      setError(`You need ${currentCreditCost} credit${currentCreditCost > 1 ? 's' : ''} for this generation. Please buy more credits.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      spendCredit(currentCreditCost);
      const imageUrls = await generateImage(prompt, currentCreditCost, selectedModel, aspectRatio);
      setGeneratedImages(imageUrls);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate image: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, user, spendCredit, selectedModel, numberOfImages, aspectRatio, requestLogin]);

  return (
    <>
      <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
        <ModelSelector
            models={imageModels}
            selectedModel={selectedModel}
            onSelectModel={(modelId) => setSelectedModel(modelId as ImageModel)}
        />
        
        <div className="w-full bg-slate-800 p-6 rounded-lg shadow-md flex flex-col">
          <h3 className="text-xl font-semibold text-slate-200 mb-4">Image Prompt</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A cinematic shot of a robot holding a red skateboard, golden hour lighting."
            className="w-full flex-grow bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 transition-colors focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 resize-vertical"
            rows={4}
          />
        </div>

        {!isNanoBanana && (
            <div className="flex flex-col items-center gap-6 bg-slate-800 p-4 rounded-lg shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-medium">Number of Images:</span>
                  {[1, 2, 3, 4].map((num) => (
                      <button
                          key={num}
                          onClick={() => setNumberOfImages(num)}
                          className={`w-10 h-10 rounded-md font-bold transition-colors ${numberOfImages === num ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                      >
                          {num}
                      </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <span className="text-slate-300 font-medium">Aspect Ratio:</span>
                    {imageAspectRatios.map((ratio) => (
                        <button
                            key={ratio.id}
                            onClick={() => setAspectRatio(ratio.id)}
                            className={`px-3 h-10 rounded-md font-semibold transition-colors ${aspectRatio === ratio.id ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            title={ratio.name}
                        >
                            {ratio.id}
                        </button>
                    ))}
                </div>
            </div>
        )}


        <div className="flex justify-center">
          <button
            onClick={handleGenerateImage}
            disabled={!prompt.trim() || isLoading}
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
                Generate Image{currentCreditCost > 1 ? 's' : ''} ({currentCreditCost} Credit{currentCreditCost > 1 ? 's' : ''})
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
              <div className={`w-full max-w-lg ${aspectRatioClasses[aspectRatio]} bg-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500 mx-auto`}>
                  <LoadingSpinnerIcon className="w-12 h-12 animate-spin text-purple-400" />
                  <p className="mt-4 font-semibold text-slate-400">Creating your masterpiece...</p>
              </div>
          )}
          {!isLoading && generatedImages.length > 0 && (
              <div className={`grid gap-2 mx-auto ${generatedImages.length > 1 ? 'grid-cols-2 max-w-lg' : 'grid-cols-1 max-w-md'}`}>
                  {generatedImages.map((src, index) => (
                      <div 
                        key={index} 
                        className={`${aspectRatioClasses[aspectRatio]} bg-black rounded-lg shadow-lg overflow-hidden cursor-pointer`}
                        onClick={() => setSelectedImage(src)}
                      >
                          <img 
                            src={src} 
                            alt={`AI generated ${index + 1}`} 
                            className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                          />
                      </div>
                  ))}
              </div>
          )}
          {!isLoading && generatedImages.length === 0 && (
              <div className={`w-full max-w-lg ${aspectRatioClasses[aspectRatio]} bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500 mx-auto`}>
                  <ImageIcon className="w-16 h-16" />
                  <p className="mt-4 font-semibold text-slate-400">Your generated images will appear here</p>
              </div>
          )}
        </div>
      </div>
      
      {selectedImage && (
        <FullscreenImageViewer
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};

export default ImageGenerator;
