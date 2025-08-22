import { LoadingState, ErrorCode } from '@/types/common';

/**
 * Base configuration for all services
 */
export interface ServiceConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableLogging?: boolean;
}

/**
 * Service operation result
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  metadata?: {
    requestId?: string;
    timestamp: Date;
    duration?: number;
  };
}

/**
 * Standardized service error
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    public statusCode?: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ServiceError';
  }

  static fromError(error: unknown, code?: ErrorCode): ServiceError {
    if (error instanceof ServiceError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new ServiceError(error.message, code);
    }
    
    return new ServiceError(
      typeof error === 'string' ? error : 'Unknown error occurred',
      code
    );
  }
}

/**
 * Service operation options
 */
export interface ServiceOptions {
  signal?: AbortSignal;
  timeout?: number;
  retries?: number;
  metadata?: Record<string, any>;
}

/**
 * Base service class with common functionality
 */
export abstract class BaseService {
  protected config: ServiceConfig;
  protected logger: ServiceLogger;

  constructor(config: ServiceConfig = {}) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableLogging: true,
      ...config,
    };
    this.logger = new ServiceLogger(this.constructor.name, this.config.enableLogging);
  }

  /**
   * Execute a service operation with standardized error handling and logging
   */
  protected async execute<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: ServiceOptions = {}
  ): Promise<ServiceResult<T>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    this.logger.info(`Starting operation: ${operationName}`, { requestId, ...options.metadata });

    try {
      // Set up timeout if specified
      const timeoutMs = options.timeout || this.config.timeout!;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new ServiceError('Operation timeout', ErrorCode.SERVICE_UNAVAILABLE, 408));
        }, timeoutMs);
      });

      // Execute operation with timeout
      const data = await Promise.race([
        operation(),
        timeoutPromise,
      ]);

      const duration = Date.now() - startTime;
      this.logger.info(`Operation completed: ${operationName}`, { requestId, duration });

      return {
        success: true,
        data,
        metadata: {
          requestId,
          timestamp: new Date(),
          duration,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const serviceError = ServiceError.fromError(error);
      
      this.logger.error(`Operation failed: ${operationName}`, {
        requestId,
        duration,
        error: serviceError.message,
        code: serviceError.code,
      });

      return {
        success: false,
        error: serviceError,
        metadata: {
          requestId,
          timestamp: new Date(),
          duration,
        },
      };
    }
  }

  /**
   * Execute operation with retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: ServiceOptions = {}
  ): Promise<ServiceResult<T>> {
    const maxRetries = options.retries ?? this.config.retryAttempts!;
    let lastError: ServiceError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = this.config.retryDelay! * Math.pow(2, attempt - 1); // Exponential backoff
        this.logger.info(`Retrying operation: ${operationName} (attempt ${attempt}/${maxRetries})`);
        await this.delay(delay);
      }

      const result = await this.execute(operation, operationName, options);
      
      if (result.success) {
        return result;
      }

      lastError = result.error!;
      
      // Don't retry for certain error types
      if (this.shouldNotRetry(lastError)) {
        break;
      }
    }

    return {
      success: false,
      error: lastError!,
      metadata: {
        requestId: this.generateRequestId(),
        timestamp: new Date(),
      },
    };
  }

  /**
   * Check if error should not be retried
   */
  private shouldNotRetry(error: ServiceError): boolean {
    const nonRetryableCodes = [
      ErrorCode.AUTHENTICATION_ERROR,
      ErrorCode.AUTHORIZATION_ERROR,
      ErrorCode.VALIDATION_ERROR,
      ErrorCode.NOT_FOUND,
    ];
    
    return nonRetryableCodes.includes(error.code) || 
           (error.statusCode !== undefined && error.statusCode >= 400 && error.statusCode < 500);
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service health status
   */
  abstract getHealthStatus(): Promise<ServiceResult<{ status: 'healthy' | 'unhealthy'; details?: any }>>;
}

/**
 * Service logger with structured logging
 */
export class ServiceLogger {
  constructor(
    private serviceName: string,
    private enabled: boolean = true
  ) {}

  info(message: string, metadata?: Record<string, any>) {
    if (this.enabled) {
      console.log(`[${this.serviceName}] INFO: ${message}`, metadata || {});
    }
  }

  warn(message: string, metadata?: Record<string, any>) {
    if (this.enabled) {
      console.warn(`[${this.serviceName}] WARN: ${message}`, metadata || {});
    }
  }

  error(message: string, metadata?: Record<string, any>) {
    if (this.enabled) {
      console.error(`[${this.serviceName}] ERROR: ${message}`, metadata || {});
    }
  }

  debug(message: string, metadata?: Record<string, any>) {
    if (this.enabled) {
      console.debug(`[${this.serviceName}] DEBUG: ${message}`, metadata || {});
    }
  }
}

/**
 * Service state management
 */
export class ServiceState {
  private state: LoadingState = LoadingState.IDLE;
  private error: ServiceError | null = null;
  private lastUpdated: Date = new Date();

  getState(): LoadingState {
    return this.state;
  }

  getError(): ServiceError | null {
    return this.error;
  }

  getLastUpdated(): Date {
    return this.lastUpdated;
  }

  setLoading() {
    this.state = LoadingState.LOADING;
    this.error = null;
    this.lastUpdated = new Date();
  }

  setSuccess() {
    this.state = LoadingState.SUCCESS;
    this.error = null;
    this.lastUpdated = new Date();
  }

  setError(error: ServiceError) {
    this.state = LoadingState.ERROR;
    this.error = error;
    this.lastUpdated = new Date();
  }

  setIdle() {
    this.state = LoadingState.IDLE;
    this.error = null;
    this.lastUpdated = new Date();
  }

  isLoading(): boolean {
    return this.state === LoadingState.LOADING;
  }

  hasError(): boolean {
    return this.state === LoadingState.ERROR;
  }

  isSuccess(): boolean {
    return this.state === LoadingState.SUCCESS;
  }
}