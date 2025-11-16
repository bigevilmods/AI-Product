
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
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
      <button 
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 transition-transform duration-200 hover:scale-110"
        onClick={onClose}
        aria-label="Close fullscreen view"
      >
        <XIcon className="w-8 h-8" />
      </button>
      <div 
        className="relative max-w-full max-h-full" 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
      >
        <img src={src} alt="Fullscreen view" className="block max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl" />
      </div>
    </div>
  );
};

export default FullscreenImageViewer;
