import { useState, useCallback } from 'react';

/**
 * Standard loading state interface
 */
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

/**
 * Options for async operations
 */
export interface AsyncOperationOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  showToast?: boolean;
}

/**
 * Standardized loading state hook for consistent loading patterns across components
 * 
 * @example
 * ```tsx
 * const { state, execute } = useLoading();
 * 
 * const handleSubmit = () => {
 *   execute(async () => {
 *     await someAsyncOperation();
 *   }, {
 *     onSuccess: () => console.log('Success!'),
 *     onError: (error) => console.error(error)
 *   });
 * };
 * ```
 */
export function useLoading(initialState: Partial<LoadingState> = {}) {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    isSuccess: false,
    ...initialState,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
      error: loading ? null : prev.error, // Clear error when starting new operation
      isSuccess: loading ? false : prev.isSuccess, // Clear success when starting new operation
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false,
      isSuccess: false,
    }));
  }, []);

  const setSuccess = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSuccess: true,
      isLoading: false,
      error: null,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      isSuccess: false,
    });
  }, []);

  /**
   * Execute an async operation with standardized loading state management
   */
  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ): Promise<T | null> => {
    try {
      setLoading(true);
      const result = await operation();
      setSuccess();
      options.onSuccess?.();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return null;
    }
  }, [setLoading, setSuccess, setError]);

  return {
    state,
    setLoading,
    setError,
    setSuccess,
    reset,
    execute,
    // Convenience getters
    isLoading: state.isLoading,
    error: state.error,
    isSuccess: state.isSuccess,
    hasError: !!state.error,
  };
}

/**
 * Hook for managing multiple loading states (useful for components with multiple async operations)
 */
export function useMultipleLoading() {
  const [states, setStates] = useState<Record<string, LoadingState>>({});

  const getState = useCallback((key: string): LoadingState => {
    return states[key] || { isLoading: false, error: null, isSuccess: false };
  }, [states]);

  const setLoading = useCallback((key: string, loading: boolean) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...getState(key),
        isLoading: loading,
        error: loading ? null : prev[key]?.error || null,
        isSuccess: loading ? false : prev[key]?.isSuccess || false,
      },
    }));
  }, [getState]);

  const setError = useCallback((key: string, error: string | null) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...getState(key),
        error,
        isLoading: false,
        isSuccess: false,
      },
    }));
  }, [getState]);

  const setSuccess = useCallback((key: string) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...getState(key),
        isSuccess: true,
        isLoading: false,
        error: null,
      },
    }));
  }, [getState]);

  const reset = useCallback((key?: string) => {
    if (key) {
      setStates(prev => {
        const newStates = { ...prev };
        delete newStates[key];
        return newStates;
      });
    } else {
      setStates({});
    }
  }, []);

  const execute = useCallback(async <T>(
    key: string,
    operation: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ): Promise<T | null> => {
    try {
      setLoading(key, true);
      const result = await operation();
      setSuccess(key);
      options.onSuccess?.();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(key, errorMessage);
      options.onError?.(errorMessage);
      return null;
    }
  }, [setLoading, setSuccess, setError]);

  return {
    states,
    getState,
    setLoading,
    setError,
    setSuccess,
    reset,
    execute,
    // Convenience methods
    isLoading: (key: string) => getState(key).isLoading,
    hasError: (key: string) => !!getState(key).error,
    isSuccess: (key: string) => getState(key).isSuccess,
    getError: (key: string) => getState(key).error,
  };
}