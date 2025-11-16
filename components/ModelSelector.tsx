
import React from 'react';

interface Model {
  id: string;
  name: string;
  description: string;
  disabled?: boolean;
}

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModel, onSelectModel }) => {
  return (
    <div className="w-full max-w-4xl bg-slate-800 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-slate-200 mb-3 px-2">Select a Model</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => onSelectModel(model.id)}
            disabled={model.disabled}
            className={`p-3 border-2 rounded-lg text-left transition-all duration-200
              ${selectedModel === model.id 
                ? 'border-purple-500 bg-purple-900/50 scale-105 shadow-lg' 
                : 'border-slate-700 hover:border-purple-400 hover:bg-slate-700/50'}
              ${model.disabled ? 'opacity-40 cursor-not-allowed' : ''}
            `}
          >
            <p className="font-bold text-white">{model.name}</p>
            <p className="text-xs text-slate-400 mt-1">{model.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;