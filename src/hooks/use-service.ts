import { useState, useEffect, useCallback, useRef } from 'react';
import { BaseService, ServiceResult, ServiceError } from '@/lib/services/base-service';
import { getService, ServiceName } from '@/lib/services/service-registry';
import { LoadingState, ErrorCode } from '@/types/common';
import { useLoading } from './use-loading';

/**
 * Service hook options
 */
export interface UseServiceOptions {
  immediate?: boolean;
  retries?: number;
  timeout?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (data: any) => void;
  onError?: (error: ServiceError) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dependencies?: any[];
}

/**
 * Service hook result
 */
export interface UseServiceResult<T> {
  data: T | null;
  loading: boolean;
  error: ServiceError | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (...args: any[]) => Promise<ServiceResult<T>>;
  retry: () => Promise<ServiceResult<T>>;
  reset: () => void;
  lastExecuted: Date | null;
}

/**
 * Enhanced service hook with standardized loading states
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useService<T = any>(
  serviceName: ServiceName,
  operation: string,
  options: UseServiceOptions = {}
): UseServiceResult<T> {
  const {
    immediate = false,
    retries = 3,
    timeout = 30000,
    onSuccess,
    onError,
    dependencies = [],
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ServiceError | null>(null);
  const [lastExecuted, setLastExecuted] = useState<Date | null>(null);
  const { isLoading: loading, setLoading } = useLoading();
  
  const serviceRef = useRef<BaseService | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastArgsRef = useRef<any[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get service instance
  useEffect(() => {
    try {
      serviceRef.current = getService(serviceName);
    } catch (error) {
      console.error(`Failed to get service ${serviceName}:`, error);
      setError(new ServiceError(
        `Service ${serviceName} not available`,
        ErrorCode.SERVICE_UNAVAILABLE
      ));
    }
  }, [serviceName]);

  // Execute service operation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const execute = useCallback(async (...args: any[]): Promise<ServiceResult<T>> => {
    if (!serviceRef.current) {
      const error = new ServiceError(
        `Service ${serviceName} not available`,
        ErrorCode.SERVICE_UNAVAILABLE
      );
      setError(error);
      return { success: false, error };
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    lastArgsRef.current = args;

    setLoading(true);
    setError(null);
    setLastExecuted(new Date());

    try {
      // Get the operation method from service
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = serviceRef.current as any;
      const operationMethod = service[operation];
      
      if (typeof operationMethod !== 'function') {
        throw new ServiceError(
          `Operation ${operation} not found on service ${serviceName}`,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Execute operation with timeout and abort signal
      const result = await operationMethod.apply(service, [
        ...args,
        {
          signal: abortControllerRef.current.signal,
          timeout,
          retries,
        },
      ]);

      if (result.success) {
        setData(result.data);
        setError(null);
        onSuccess?.(result.data);
      } else {
        setError(result.error!);
        onError?.(result.error!);
      }

      return result;
    } catch (error) {
      const serviceError = ServiceError.fromError(error);
      setError(serviceError);
      onError?.(serviceError);
      
      return {
        success: false,
        error: serviceError,
      };
    } finally {
      setLoading(false);
    }
  }, [serviceName, operation, timeout, retries, onSuccess, onError, setLoading]);

  // Retry last operation
  const retry = useCallback(async (): Promise<ServiceResult<T>> => {
    return execute(...lastArgsRef.current);
  }, [execute]);

  // Reset state
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLastExecuted(null);
    setLoading(false);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [setLoading]);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate && serviceRef.current) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    retry,
    reset,
    lastExecuted,
  };
}

/**
 * Hook for multiple service operations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useMultipleServices<T extends Record<string, any>>(
  operations: Array<{
    key: string;
    serviceName: ServiceName;
    operation: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args?: any[];
  }>,
  options: UseServiceOptions = {}
): {
  data: Partial<T>;
  loading: boolean;
  errors: Record<string, ServiceError | null>;
  execute: (key?: string) => Promise<void>;
  retry: (key?: string) => Promise<void>;
  reset: (key?: string) => void;
} {
  const [data, setData] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, ServiceError | null>>({});
  const { isLoading: loading, setLoading } = useLoading();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const servicesRef = useRef<Record<string, UseServiceResult<any>>>({});

  // Initialize service hooks
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newServices: Record<string, UseServiceResult<any>> = {};
    
    operations.forEach(({ key, serviceName, operation: op }) => {
      // Note: This is a simplified version. In practice, you'd need to handle
      // dynamic hook creation differently or restructure this approach.
      newServices[key] = {
        data: null,
        loading: false,
        error: null,
        execute: async () => ({ success: false, error: new ServiceError('Not implemented') }),
        retry: async () => ({ success: false, error: new ServiceError('Not implemented') }),
        reset: () => {},
        lastExecuted: null,
      };
    });
    
    servicesRef.current = newServices;
  }, [operations]);

  const execute = useCallback(async (key?: string) => {
    const targetOperations = key 
      ? operations.filter(op => op.key === key)
      : operations;

    setLoading(true);
    
    try {
      const results = await Promise.allSettled(
        targetOperations.map(async ({ key: opKey, serviceName, operation: op, args = [] }) => {
          const service = getService(serviceName);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const method = (service as any)[op];
          
          if (typeof method === 'function') {
            const result = await method.apply(service, args);
            return { key: opKey, result };
          }
          
          throw new Error(`Operation ${op} not found`);
        })
      );

      const newData = { ...data };
      const newErrors = { ...errors };

      results.forEach((result, index) => {
        const { key: opKey } = targetOperations[index];
        
        if (result.status === 'fulfilled') {
          const { result: serviceResult } = result.value;
          if (serviceResult.success) {
            newData[opKey as keyof T] = serviceResult.data;
            newErrors[opKey] = null;
          } else {
            newErrors[opKey] = serviceResult.error!;
          }
        } else {
          newErrors[opKey] = ServiceError.fromError(result.reason);
        }
      });

      setData(newData);
      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  }, [operations, data, errors, setLoading]);

  const retry = useCallback(async (key?: string) => {
    await execute(key);
  }, [execute]);

  const reset = useCallback((key?: string) => {
    if (key) {
      const newData = { ...data };
      const newErrors = { ...errors };
      delete newData[key as keyof T];
      delete newErrors[key];
      setData(newData);
      setErrors(newErrors);
    } else {
      setData({});
      setErrors({});
    }
  }, [data, errors]);

  return {
    data,
    loading,
    errors,
    execute,
    retry,
    reset,
  };
}

/**
 * Hook for paginated service operations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function usePaginatedService<T = any>(
  serviceName: ServiceName,
  operation: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialParams: Record<string, any> = {},
  options: UseServiceOptions = {}
) {
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    ...initialParams,
  });
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const serviceResult = useService<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }>(
    serviceName,
    operation,
    {
      ...options,
      onSuccess: (result) => {
        if (params.page === 1) {
          setAllData(result.data);
        } else {
          setAllData(prev => [...prev, ...result.data]);
        }
        setHasMore(result.pagination.hasMore);
        setTotal(result.pagination.total);
        options.onSuccess?.(result);
      },
    }
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || serviceResult.loading) return;
    
    const nextPage = params.page + 1;
    setParams(prev => ({ ...prev, page: nextPage }));
    
    return serviceResult.execute({ ...params, page: nextPage });
  }, [hasMore, serviceResult.loading, serviceResult.execute, params]);

  const refresh = useCallback(async () => {
    setParams(prev => ({ ...prev, page: 1 }));
    setAllData([]);
    setHasMore(true);
    
    return serviceResult.execute({ ...params, page: 1 });
  }, [serviceResult.execute, params]);

  const updateParams = useCallback((newParams: Partial<typeof params>) => {
    setParams(prev => ({ ...prev, ...newParams, page: 1 }));
    setAllData([]);
    setHasMore(true);
  }, []);

  return {
    data: allData,
    loading: serviceResult.loading,
    error: serviceResult.error,
    hasMore,
    total,
    params,
    loadMore,
    refresh,
    updateParams,
    execute: serviceResult.execute,
    retry: serviceResult.retry,
    reset: serviceResult.reset,
  };
}

/**
 * Hook for real-time service operations with polling
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function usePollingService<T = any>(
  serviceName: ServiceName,
  operation: string,
  intervalMs: number = 5000,
  options: UseServiceOptions = {}
) {
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<number | null>(null);
  
  const serviceResult = useService<T>(serviceName, operation, {
    ...options,
    immediate: false,
  });

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsPolling(true);
    
    // Execute immediately
    serviceResult.execute();
    
    // Set up polling
    intervalRef.current = window.setInterval(() => {
      serviceResult.execute();
    }, intervalMs);
  }, [serviceResult.execute, intervalMs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...serviceResult,
    isPolling,
    startPolling,
    stopPolling,
  };
}