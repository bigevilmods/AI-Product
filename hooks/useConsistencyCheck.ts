import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { testPromptConsistency } from '../services/geminiService';
import type { ConsistencyResult } from '../types';

export const useConsistencyCheck = (prompt: string) => {
    // FIX: `requestLogin` is not available on `useAuth`. It will be passed into the `check` function directly.
    const { user } = useAuth();
    const [isTesting, setIsTesting] = useState<boolean>(false);
    const [result, setResult] = useState<ConsistencyResult | null>(null);
    const [checkError, setCheckError] = useState<string | null>(null);

    // FIX: The `check` function now accepts an optional `requestLogin` callback.
    const check = useCallback(async (requestLogin?: () => void) => {
        if (!prompt) return;

        if (!user) {
            if(requestLogin) requestLogin();
            return;
        }

        setIsTesting(true);
        setResult(null);
        setCheckError(null);

        try {
            const consistencyResult = await testPromptConsistency(prompt);
            setResult(consistencyResult);
        } catch (e) {
            console.error(e);
            setCheckError('Failed to test prompt consistency. Please check the console for details.');
        } finally {
            setIsTesting(false);
        }
    }, [prompt, user]);

    return { isTesting, result, checkError, check, setResult };
};