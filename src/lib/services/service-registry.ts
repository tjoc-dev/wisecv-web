import { serviceContainer, ServiceConfigRegistry, createServiceFactory } from './service-container';
import { ApiService, ApiServiceConfig } from './api-service';
import { BaseService } from './base-service';

/**
 * Application environment configuration
 */
interface AppConfig {
  apiBaseUrl: string;
  environment: 'development' | 'staging' | 'production';
  enableLogging: boolean;
  timeout: number;
  retryAttempts: number;
}

/**
 * Service names constants
 */
export const SERVICE_NAMES = {
  API: 'api',
  AUTH: 'auth',
  RESUME: 'resume',
  JOB: 'job',
  PAYMENT: 'payment',
  TIER: 'tier',
  PROFILE: 'profile',
  NOTIFICATION: 'notification',
  UPLOAD: 'upload',
  ANALYTICS: 'analytics',
} as const;

export type ServiceName = typeof SERVICE_NAMES[keyof typeof SERVICE_NAMES];

/**
 * Authentication service
 */
export class AuthService extends BaseService {
  async login(email: string, password: string) {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.post('/auth/login', { email, password });
      },
      'login'
    );
  }

  async logout() {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        const result = await apiService.post('/auth/logout');
        
        // Clear local storage
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        
        return result;
      },
      'logout'
    );
  }

  async refreshToken() {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.post('/auth/refresh');
      },
      'refreshToken'
    );
  }

  async getHealthStatus() {
    return this.execute(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async () => ({ status: 'healthy' as const, details: {} as any }),
      'healthCheck'
    );
  }
}

/**
 * Resume service
 */
export class ResumeService extends BaseService {
  async getResumes() {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.get('/resumes');
      },
      'getResumes'
    );
  }

  async createResume(data: unknown) {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.post('/resumes', data);
      },
      'createResume'
    );
  }

  async updateResume(id: string, data: unknown) {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.put(`/resumes/${id}`, data);
      },
      'updateResume'
    );
  }

  async deleteResume(id: string) {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.delete(`/resumes/${id}`);
      },
      'deleteResume'
    );
  }

  async improveResume(structuredData: unknown, jobDescription?: string) {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.post('/resumes/improve', {
          structuredData,
          jobDescription
        });
      },
      'improveResume'
    );
  }

  async getHealthStatus() {
    return this.execute(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async () => ({ status: 'healthy' as const, details: {} as any }),
      'healthCheck'
    );
  }
}

/**
 * Job service
 */
export class JobService extends BaseService {
  async getJobs() {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.get('/jobs');
      },
      'getJobs'
    );
  }

  async createJob(data: unknown) {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.post('/jobs', data);
      },
      'createJob'
    );
  }

  async updateJobStatus(id: string, status: string) {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.patch(`/jobs/${id}`, { status });
      },
      'updateJobStatus'
    );
  }

  async getHealthStatus() {
    return this.execute(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async () => ({ status: 'healthy' as const, details: {} as any }),
      'healthCheck'
    );
  }
}

/**
 * Payment service
 */
export class PaymentService extends BaseService {
  async getPaymentHistory() {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.get('/payments/history');
      },
      'getPaymentHistory'
    );
  }

  async createPayment(data: unknown) {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.post('/payments', data);
      },
      'createPayment'
    );
  }

  async checkPaymentStatus(paymentId: string) {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.get(`/payments/${paymentId}/status`);
      },
      'checkPaymentStatus'
    );
  }

  async getHealthStatus() {
    return this.execute(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async () => ({ status: 'healthy' as const, details: {} as any }),
      'healthCheck'
    );
  }
}

/**
 * Tier service
 */
export class TierService extends BaseService {
  async getCurrentTier() {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.get('/tier/current');
      },
      'getCurrentTier'
    );
  }

  async upgradeTier(tierType: string) {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.post('/tier/upgrade', { tierType });
      },
      'upgradeTier'
    );
  }

  async getUsage() {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.get('/tier/usage');
      },
      'getUsage'
    );
  }

  async getHealthStatus() {
    return this.execute(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async () => ({ status: 'healthy' as const, details: {} as any }),
      'healthCheck'
    );
  }
}

/**
 * Upload service
 */
export class UploadService extends BaseService {
  async uploadFile(file: File, onProgress?: (progress: number) => void) {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.upload('/upload', file, onProgress);
      },
      'uploadFile'
    );
  }

  async uploadResume(file: File, onProgress?: (progress: number) => void) {
    return this.execute(
      async () => {
        const apiService = serviceContainer.resolve<ApiService>(SERVICE_NAMES.API);
        return apiService.upload('/upload/resume', file, onProgress);
      },
      'uploadResume'
    );
  }

  async getHealthStatus() {
    return this.execute(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async () => ({ status: 'healthy' as const, details: {} as any }),
      'healthCheck'
    );
  }
}

/**
 * Get application configuration based on environment
 */
function getAppConfig(): AppConfig {
  const isDevelopment = import.meta.env.DEV;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
    (isDevelopment ? 'http://localhost:3000/api' : '/api');

  return {
    apiBaseUrl,
    environment: isDevelopment ? 'development' : 'production',
    enableLogging: isDevelopment,
    timeout: 30000,
    retryAttempts: 3,
  };
}

/**
 * Register all application services
 */
export function registerServices(): void {
  const appConfig = getAppConfig();

  // Register service configurations
  ServiceConfigRegistry.register(SERVICE_NAMES.API, {
    baseURL: appConfig.apiBaseUrl,
    timeout: appConfig.timeout,
    retryAttempts: appConfig.retryAttempts,
    enableLogging: appConfig.enableLogging,
  });

  // Register API service
  serviceContainer.singleton(
    SERVICE_NAMES.API,
    () => {
      const config: ApiServiceConfig = {
        baseURL: appConfig.apiBaseUrl,
        timeout: appConfig.timeout,
        retryAttempts: appConfig.retryAttempts,
        enableLogging: appConfig.enableLogging,
        defaultHeaders: {
          'Content-Type': 'application/json',
        },
      };

      const apiService = new ApiService(config);

      // Add request interceptor for auth token
      apiService.addRequestInterceptor((config) => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token && !config.headers?.Authorization) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        }
        // Ensure we return the config object properly
        return { ...config };
      });

      // Add response interceptor for token refresh
      apiService.addResponseInterceptor(async (response) => {
        if (response.status === 401) {
          // Token expired, try to refresh
          try {
            const refreshResult = await apiService.post('/auth/refresh');
            if (refreshResult.data?.token) {
              localStorage.setItem('authToken', refreshResult.data.token);
            }
          } catch (error) {
            // Refresh failed, redirect to login
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            window.location.href = '/login';
          }
        }
        return response;
      });

      return apiService;
    }
  );

  // Register business services
  serviceContainer.singleton(
    SERVICE_NAMES.AUTH,
    createServiceFactory(AuthService, SERVICE_NAMES.API)
  );

  serviceContainer.singleton(
    SERVICE_NAMES.RESUME,
    createServiceFactory(ResumeService, SERVICE_NAMES.API)
  );

  serviceContainer.singleton(
    SERVICE_NAMES.JOB,
    createServiceFactory(JobService, SERVICE_NAMES.API)
  );

  serviceContainer.singleton(
    SERVICE_NAMES.PAYMENT,
    createServiceFactory(PaymentService, SERVICE_NAMES.API)
  );

  serviceContainer.singleton(
    SERVICE_NAMES.TIER,
    createServiceFactory(TierService, SERVICE_NAMES.API)
  );

  serviceContainer.singleton(
    SERVICE_NAMES.UPLOAD,
    createServiceFactory(UploadService, SERVICE_NAMES.API)
  );
}

/**
 * Initialize services (call this in your app startup)
 */
export function initializeServices(): void {
  registerServices();
  
  // Perform health checks in development
  if (import.meta.env.DEV) {
    setTimeout(async () => {
      const services = [SERVICE_NAMES.API, SERVICE_NAMES.AUTH, SERVICE_NAMES.RESUME];
      
      for (const serviceName of services) {
        try {
          const service = serviceContainer.resolve<BaseService>(serviceName);
          const health = await service.getHealthStatus();
          console.log(`Service ${serviceName} health:`, health);
        } catch (error) {
          console.error(`Service ${serviceName} health check failed:`, error);
        }
      }
    }, 1000);
  }
}

/**
 * Get a service instance
 */
export function getService<T extends BaseService>(name: ServiceName): T {
  return serviceContainer.resolve<T>(name);
}

/**
 * Service health monitor
 */
export class ServiceHealthMonitor {
  private static instance: ServiceHealthMonitor;
  private healthStatus = new Map<string, boolean>();
  private checkInterval: number | null = null;

  static getInstance(): ServiceHealthMonitor {
    if (!ServiceHealthMonitor.instance) {
      ServiceHealthMonitor.instance = new ServiceHealthMonitor();
    }
    return ServiceHealthMonitor.instance;
  }

  startMonitoring(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = window.setInterval(() => {
      this.checkAllServices();
    }, intervalMs);

    // Initial check
    this.checkAllServices();
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getHealthStatus(serviceName: string): boolean {
    return this.healthStatus.get(serviceName) ?? false;
  }

  getAllHealthStatus(): Record<string, boolean> {
    return Object.fromEntries(this.healthStatus);
  }

  private async checkAllServices(): Promise<void> {
    const services = Object.values(SERVICE_NAMES);
    
    for (const serviceName of services) {
      try {
        if (serviceContainer.has(serviceName)) {
          const service = serviceContainer.resolve<BaseService>(serviceName);
          const result = await service.getHealthStatus();
          this.healthStatus.set(serviceName, result.success);
        }
      } catch (error: unknown) {
        this.healthStatus.set(serviceName, false);
        console.error(`Health check failed for ${serviceName}:`, error);
      }
    }
  }
}