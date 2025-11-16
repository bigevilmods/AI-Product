

import React from 'react';
import { UsersIcon, ProductAdIcon, UserIcon, ImageIcon, VideoGeneratorIcon, FilmIcon, SpeakerWaveIcon } from '../components/icons';
// FIX: To break a circular dependency, the AppView and AppMode types are now imported from a central types file.
import type { AppView } from '../types';

interface HomePageProps {
  navigateTo: (mode: AppView) => void;
}

// FIX: Changed JSX.Element to React.ReactNode to resolve namespace issue and maintain consistency with other components.
const features: { icon: React.ReactNode; title: string; description: string; mode: AppView }[] = [
  {
    icon: <UsersIcon className="w-12 h-12 mb-4 text-purple-300" />,
    title: 'Influencer + Product',
    description: 'Generate video prompts combining an influencer and a product for dynamic campaigns.',
    mode: 'influencer',
  },
  {
    icon: <ProductAdIcon className="w-12 h-12 mb-4 text-purple-300" />,
    title: 'Product Ad',
    description: 'Create compelling, product-focused video ad prompts that highlight key features.',
    mode: 'productAd',
  },
  {
    icon: <UserIcon className="w-12 h-12 mb-4 text-purple-300" />,
    title: 'Influencer Only',
    description: 'Develop creative video prompts centered solely on an influencer\'s actions and personality.',
    mode: 'influencerOnly',
  },
  {
    icon: <ImageIcon className="w-12 h-12 mb-4 text-purple-300" />,
    title: 'Image Generator',
    description: 'Transform your text prompts into stunning, high-quality images with AI.',
    mode: 'imageGenerator',
  },
  {
    icon: <VideoGeneratorIcon className="w-12 h-12 mb-4 text-purple-300" />,
    title: 'Video Generator',
    description: 'Bring your text prompts to life by generating complete video clips from them.',
    mode: 'videoGenerator',
  },
  {
    icon: <FilmIcon className="w-12 h-12 mb-4 text-purple-300" />,
    title: 'Storyboard Generator',
    description: 'Create a detailed storyboard from an idea, then generate a video from it.',
    mode: 'storyboardGenerator',
  },
   {
    icon: <SpeakerWaveIcon className="w-12 h-12 mb-4 text-purple-300" />,
    title: 'Text-to-Speech',
    description: 'Convert text into natural-sounding speech with a variety of voices.',
    mode: 'textToSpeechGenerator',
  },
];

const HomePage: React.FC<HomePageProps> = ({ navigateTo }) => {
  return (
    <>
        <div className="fixed inset-0 w-full h-full z-0 overflow-hidden">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                src="https://videos.pexels.com/video-files/853875/853875-hd_1920_1080_25fps.mp4"
            />
            <div className="absolute inset-0 w-full h-full bg-slate-900/60"></div>
        </div>
        <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Welcome to the PromptGen AI Suite
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-slate-300">
                Your hub for AI-powered content creation tools. Choose an option below to get started.
            </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
                <button
                    key={feature.mode}
                    onClick={() => navigateTo(feature.mode)}
                    className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-center transition-all duration-300 hover:border-purple-500 hover:scale-105 hover:bg-slate-800/70"
                >
                    <div className="flex justify-center items-center">
                        {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                </button>
            )).sort(() => 0.5 - Math.random()).slice(0, 6) /* Show 6 random items */}
        </div>
    </>
  );
};

export default HomePage;