
import React from 'react';
import { UsersIcon, ProductAdIcon, UserIcon, ImageIcon, VideoGeneratorIcon } from '../components/icons';

type AppMode = 'influencer' | 'productAd' | 'influencerOnly' | 'imageGenerator' | 'videoGenerator';

interface HomePageProps {
  navigateTo: (mode: AppMode) => void;
}

const features = [
  {
    icon: <UsersIcon className="w-12 h-12 mb-4 text-purple-300" />,
    title: 'Influencer + Product',
    description: 'Generate video prompts combining an influencer and a product for dynamic campaigns.',
    mode: 'influencer' as AppMode,
  },
  {
    icon: <ProductAdIcon className="w-12 h-12 mb-4 text-purple-300" />,
    title: 'Product Ad',
    description: 'Create compelling, product-focused video ad prompts that highlight key features.',
    mode: 'productAd' as AppMode,
  },
  {
    icon: <UserIcon className="w-12 h-12 mb-4 text-purple-300" />,
    title: 'Influencer Only',
    description: 'Develop creative video prompts centered solely on an influencer\'s actions and personality.',
    mode: 'influencerOnly' as AppMode,
  },
  {
    icon: <ImageIcon className="w-12 h-12 mb-4 text-purple-300" />,
    title: 'Image Generator',
    description: 'Transform your text prompts into stunning, high-quality images with AI.',
    mode: 'imageGenerator' as AppMode,
  },
  {
    icon: <VideoGeneratorIcon className="w-12 h-12 mb-4 text-purple-300" />,
    title: 'Video Generator',
    description: 'Bring your text prompts to life by generating complete video clips from them.',
    mode: 'videoGenerator' as AppMode,
  },
];

const HomePage: React.FC<HomePageProps> = ({ navigateTo }) => {
  return (
    <>
        <div className="fixed top-0 left-0 w-full h-full z-0 overflow-hidden">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                src="https://videos.pexels.com/video-files/853875/853875-hd_1920_1080_25fps.mp4"
            />
            <div className="absolute top-0 left-0 w-full h-full bg-slate-900/60"></div>
        </div>
        <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Bem-vindo ao PromptGen AI Suite
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-slate-300">
                Sua central de ferramentas para criação de conteúdo com Inteligência Artificial. Escolha uma opção abaixo para começar.
            </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
                <button
                    key={feature.mode}
                    onClick={() => navigateTo(feature.mode)}
                    className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-center transition-all duration-300 hover:border-purple-500 hover:scale-105 hover:bg-slate-800/70"
                >
                    <div className="flex justify-center items-center">
                        {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.description}</p>
                </button>
            ))}
        </div>
    </>
  );
};

export default HomePage;