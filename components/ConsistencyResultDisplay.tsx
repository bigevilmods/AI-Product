
import React from 'react';
import type { ConsistencyResult } from '../types';
import { ShieldCheckIcon } from './icons';

interface ConsistencyResultDisplayProps {
  result: ConsistencyResult;
}

export const ConsistencyResultDisplay: React.FC<ConsistencyResultDisplayProps> = ({ result }) => {
  const isConsistent = result.consistent;
  const statusClass = isConsistent ? 'bg-green-800/50 border-green-700' : 'bg-red-800/50 border-red-700';
  const iconStatusClass = isConsistent ? 'text-green-400' : 'text-red-400';
  const titleStatusClass = isConsistent ? 'text-green-400' : 'text-red-400';

  return (
    <div className={`w-full max-w-2xl p-4 border rounded-lg shadow-md ${statusClass}`}>
      <div className="flex items-center mb-2">
        <ShieldCheckIcon className={`w-6 h-6 mr-3 ${iconStatusClass}`} />
        <h4 className={`text-lg font-bold ${titleStatusClass}`}>
          {isConsistent ? 'Prompt is Consistent' : 'Prompt May Be Inconsistent'}
        </h4>
      </div>
      <p className="text-slate-300 text-sm">{result.reason}</p>
    </div>
  );
};