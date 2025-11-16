
import React from 'react';
import { XIcon } from './icons';

interface FullscreenImageViewerProps {
  src: string;
  onClose: () => void;
}

const FullscreenImageViewer: React.FC<FullscreenImageViewerProps> = ({ src, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" 
      onClick={onClose}
    >
      <style>{`.animate-fade-in { animation: fadeIn 0.2s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <button 
        className="absolute top-4 right-4 text-white z-10 hover:scale-110 transition-transform"
        onClick={onClose}
        aria-label="Close fullscreen view"
      >
        <XIcon className="w-8 h-8" />
      </button>
      <div 
        className="relative max-w-full max-h-full" 
        onClick={(e) => e.stopPropagation()}
      >
        <img src={src} alt="Fullscreen view" className="block max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl" />
      </div>
    </div>
  );
};

export default FullscreenImageViewer;