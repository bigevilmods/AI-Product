
import React, { useState, useEffect } from 'react';
import { setUserApiKey, getUserApiKey, clearUserApiKey } from '../services/api';
import { KeyIcon, XIcon } from './icons';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  useEffect(() => {
    if (isOpen) {
      const currentKey = getUserApiKey();
      setApiKey(currentKey || '');
      setSaveStatus('idle');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      setUserApiKey(apiKey.trim());
    } else {
      clearUserApiKey();
    }
    setSaveStatus('success');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <KeyIcon className="w-6 h-6 text-purple-400" />
                Custom API Key
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
                <XIcon className="w-6 h-6" />
            </button>
        </div>
        <div className="p-6">
            <p className="text-slate-400 mb-4 text-sm">
                If you want to use your own API key from another server or project, enter it here. This will override the default key for this session.
            </p>
            <label htmlFor="apiKeyInput" className="block text-sm font-medium text-slate-300 mb-2">
                Your Google AI API Key
            </label>
            <input
                id="apiKeyInput"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="shadow-sm appearance-none border border-slate-600 rounded-md w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-slate-500 mt-2">The key is stored securely in your browser's local storage.</p>
        </div>
        <div className="p-6 bg-slate-900/50 rounded-b-lg flex justify-end gap-4">
            <button onClick={onClose} className="px-4 py-2 font-semibold bg-slate-600 hover:bg-slate-500 rounded-md text-sm">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 font-semibold bg-purple-600 hover:bg-purple-500 rounded-md text-sm">
                {saveStatus === 'success' ? 'Saved!' : 'Save Key'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;