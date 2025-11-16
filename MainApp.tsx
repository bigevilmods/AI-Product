
import React from 'react';
import InfluencerPromptGenerator from './pages/InfluencerPromptGenerator';
import ProductAdPromptGenerator from './pages/ProductAdPromptGenerator';
import InfluencerOnlyPromptGenerator from './pages/InfluencerOnlyPromptGenerator';
import ImageGenerator from './pages/ImageGenerator';
import VideoGenerator from './pages/VideoGenerator';
import StoryboardGenerator from './pages/StoryboardGenerator';
import TextToSpeechGenerator from './pages/TextToSpeechGenerator';
// FIX: To break a circular dependency, the AppMode type is now imported from a central types file.
import type { AppMode } from './types';

interface MainAppProps {
  mode: AppMode;
  requestLogin: () => void;
}

const modeConfig = {
  influencer: {
    headerTitle: 'AI Video Prompt Generator',
    title: 'Generate a creative video prompt featuring an influencer and a product.',
    component: <InfluencerPromptGenerator />,
  },
  productAd: {
    headerTitle: 'AI Video Prompt Generator',
    title: 'Generate a compelling video ad prompt for your product.',
    component: <ProductAdPromptGenerator />,
  },
  influencerOnly: {
    headerTitle: 'AI Video Prompt Generator',
    title: "Generate a unique video prompt focused on an influencer's actions.",
    component: <InfluencerOnlyPromptGenerator />,
  },
  imageGenerator: {
    headerTitle: 'AI Image Generator',
    title: 'Create stunning visuals from a text prompt.',
    component: <ImageGenerator />,
  },
  videoGenerator: {
    headerTitle: 'AI Video Generator',
    title: 'Generate a stunning video from a text prompt.',
    component: <VideoGenerator />,
  },
  storyboardGenerator: {
    headerTitle: 'AI Storyboard Generator',
    title: 'Create a video from a storyboard.',
    component: <StoryboardGenerator />,
  },
  textToSpeechGenerator: {
    headerTitle: 'AI Text-to-Speech Generator',
    title: 'Convert your text into high-quality spoken audio.',
    component: <TextToSpeechGenerator />,
  }
};

const MainApp: React.FC<MainAppProps> = ({ mode, requestLogin }) => {
  const currentMode = modeConfig[mode] || modeConfig.influencer;
  
  const componentWithProps = React.cloneElement(currentMode.component, { requestLogin });

  return (
    <>
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          {currentMode.headerTitle}
        </h1>
        <p className="mt-2 text-lg text-slate-400">
          {currentMode.title}
        </p>
      </header>

      <main className="flex flex-col gap-8">
        {componentWithProps}
      </main>
    </>
  );
};

export default MainApp;
