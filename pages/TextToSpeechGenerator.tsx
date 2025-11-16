
import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateSpeech } from '../services/geminiService';
import { SparklesIcon, LoadingSpinnerIcon, SpeakerWaveIcon } from '../components/icons';

// Audio utility functions, as per Live API documentation
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// Voice configuration
const voices = [
    { id: 'Kore', name: 'Kore (Female, Calm)' },
    { id: 'Puck', name: 'Puck (Male, Energetic)' },
    { id: 'Charon', name: 'Charon (Male, Deep)' },
    { id: 'Zephyr', name: 'Zephyr (Female, Gentle)' },
    { id: 'Fenrir', name: 'Fenrir (Male, Authoritative)' },
];

const MAX_CHARACTERS = 1000;
const CREDIT_COST = 1;

const TextToSpeechGenerator: React.FC<{ requestLogin?: () => void }> = ({ requestLogin }) => {
    const { user, spendCredit } = useAuth();
    const [text, setText] = useState('');
    const [selectedVoice, setSelectedVoice] = useState(voices[0].id);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

    const playAudio = () => {
        if (!audioBuffer || !audioContext) return;
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    };

    const handleGenerate = useCallback(async () => {
        if (!user) {
            requestLogin?.();
            return;
        }
        if (!text.trim()) {
            setError('Please enter some text to generate speech.');
            return;
        }
        if (text.length > MAX_CHARACTERS) {
            setError(`Text cannot exceed ${MAX_CHARACTERS} characters. You have ${text.length}.`);
            return;
        }
        if (user.credits < CREDIT_COST) {
            setError(`You need ${CREDIT_COST} credit to generate speech. Please buy more credits.`);
            return;
        }

        setIsLoading(true);
        setError(null);
        setAudioBuffer(null);

        try {
            spendCredit(CREDIT_COST);
            const base64Audio = await generateSpeech(text, selectedVoice);

            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            setAudioContext(ctx);

            const decodedData = decode(base64Audio);
            const buffer = await decodeAudioData(decodedData, ctx, 24000, 1);
            setAudioBuffer(buffer);

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate speech: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [text, selectedVoice, user, spendCredit, requestLogin]);
    
    const charCount = text.length;
    const charCountColor = charCount > MAX_CHARACTERS ? 'text-red-400' : 'text-slate-400';

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">
            <div className="w-full bg-slate-800 p-6 rounded-lg shadow-md flex flex-col">
                <h3 className="text-xl font-semibold text-slate-200 mb-4">Text to Convert</h3>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter the text you want to convert to speech..."
                    className="w-full flex-grow bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 transition-colors focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 resize-vertical"
                    rows={6}
                />
                <div className={`text-right text-sm mt-2 ${charCountColor}`}>
                    {charCount} / {MAX_CHARACTERS}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-800 p-4 rounded-lg shadow-md">
                <label htmlFor="voice-select" className="text-slate-300 font-medium">Select a Voice:</label>
                <select
                    id="voice-select"
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white rounded-md py-2 px-3 focus:ring-purple-500 focus:border-purple-500"
                >
                    {voices.map(voice => (
                        <option key={voice.id} value={voice.id}>{voice.name}</option>
                    ))}
                </select>
            </div>

            <button
                onClick={handleGenerate}
                disabled={!text.trim() || isLoading || charCount > MAX_CHARACTERS}
                className="inline-flex items-center justify-center px-8 py-4 font-bold text-lg text-white transition-all duration-200 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg hover:bg-gradient-to-br hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <><LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />Generating...</>
                ) : (
                    <><SparklesIcon className="-ml-1 mr-3 h-6 w-6" />Generate Speech ({CREDIT_COST} Credit)</>
                )}
            </button>
            
            {error && (
                <div className="text-center p-4 bg-red-800/50 border border-red-700 text-red-400 rounded-lg">
                    <p>{error}</p>
                </div>
            )}
            
            <div className="w-full">
                {isLoading && (
                    <div className="w-full h-20 bg-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500 mx-auto">
                        <LoadingSpinnerIcon className="w-8 h-8 animate-spin text-purple-400" />
                    </div>
                )}
                {!isLoading && audioBuffer && (
                    <div className="w-full bg-slate-800 rounded-lg p-4 flex items-center justify-center gap-4">
                        <p className="font-semibold text-slate-300">Generated Audio:</p>
                        <button onClick={playAudio} className="p-3 bg-green-600 rounded-full hover:bg-green-500 transition-colors shadow-lg">
                            <SpeakerWaveIcon className="w-6 h-6 text-white" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextToSpeechGenerator;
