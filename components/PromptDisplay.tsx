
import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from './icons';

interface PromptDisplayProps {
  prompt: string;
}

const formatPrompt = (text: string) => {
    return text
        .split('\n')
        .map(line => line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-300 font-bold">$1</strong>'))
        .join('<br />');
};

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompt }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-slate-800 rounded-lg shadow-lg overflow-hidden">
      <div className="bg-slate-700/50 p-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-200">Generated Prompt</h3>
        <button
          onClick={handleCopy}
          className="flex items-center px-3 py-1.5 text-sm font-medium bg-slate-600 hover:bg-purple-600 rounded-md transition-colors duration-200"
        >
          {copied ? (
            <>
              <CheckIcon className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <CopyIcon className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="p-6">
        <div 
          className="text-slate-300 whitespace-pre-wrap leading-relaxed font-mono text-sm"
          dangerouslySetInnerHTML={{ __html: formatPrompt(prompt) }}
        />
      </div>
    </div>
  );
};