import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

type GeneratorFunc<T> = (args: T) => Promise<string>;

export const usePromptGenerator = <T>(
  generatorFunc: GeneratorFunc<T>,
  creditCost: number = 1
) => {
  // FIX: `requestLogin` is not available on `useAuth`. It will be passed into the `generate` function directly.
  const { user, spendCredit } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');

  // FIX: The `generate` function now accepts an optional `requestLogin` callback.
  const generate = useCallback(async (args: T, validation: () => boolean, requestLogin?: () => void) => {
    if (!user) {
      if(requestLogin) requestLogin();
      return;
    }

    if (!validation()) {
      // The component using the hook is responsible for setting its specific validation error.
      return;
    }

    if (user.credits < creditCost) {
      setError(`You don't have enough credits. Cost: ${creditCost}.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPrompt('');

    try {
      spendCredit(creditCost);
      const prompt = await generatorFunc(args);
      setGeneratedPrompt(prompt);
    } catch (e) {
      console.error(e);
      setError('Failed to generate prompt. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  }, [user, creditCost, generatorFunc, spendCredit]);

  return { isLoading, error, generatedPrompt, generate, setError, setGeneratedPrompt };
};