
import React from 'react';
import InfluencerPromptGenerator from './pages/InfluencerPromptGenerator';
import ProductAdPromptGenerator from './pages/ProductAdPromptGenerator';
import InfluencerOnlyPromptGenerator from './pages/InfluencerOnlyPromptGenerator';
import ImageGenerator from './pages/ImageGenerator';
import VideoGenerator from './pages/VideoGenerator';

type AppMode = 'influencer' | 'productAd' | 'influencerOnly' | 'imageGenerator' | 'videoGenerator';

interface MainAppProps {
  mode: AppMode;
  requestLogin: () => void;
}

const modeConfig = {
  influencer: {
    title: 'Generate a creative video prompt featuring an influencer and a product.',
    component: <InfluencerPromptGenerator />,
  },
  productAd: {
    title: 'Generate a compelling video ad prompt for your product.',
    component: <ProductAdPromptGenerator />,
  },
  influencerOnly: {
    title: "Generate a unique video prompt focused on an influencer's actions.",
    component: <InfluencerOnlyPromptGenerator />,
  },
  imageGenerator: {
    title: 'Create stunning visuals from a text prompt.',
    component: <ImageGenerator />,
  },
  videoGenerator: {
    title: 'Generate a stunning video from a text prompt.',
    component: <VideoGenerator />,
  }
};

const MainApp: React.FC<MainAppProps> = ({ mode, requestLogin }) => {
  const currentMode = modeConfig[mode] || modeConfig.influencer;
  
  const getTitle = () => {
      switch(mode) {
          case 'imageGenerator': return 'AI Image Generator';
          case 'videoGenerator': return 'AI Video Generator';
          default: return 'AI Video Prompt Generator';
      }
  }
  
  const componentWithProps = React.cloneElement(currentMode.component, { requestLogin });

  return (
    <>
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          {getTitle()}
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