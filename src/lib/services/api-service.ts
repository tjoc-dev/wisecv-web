import { BaseService, ServiceConfig, ServiceResult, ServiceError, ServiceOptions } from './base-service';
import { ErrorCode } from '@/types/common';

/**
 * HTTP method types
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
}

/**
 * API request configuration
 */
export interface ApiRequestConfig {
  method: HttpMethod;
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * API service configuration
 */
export interface ApiServiceConfig extends ServiceConfig {
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
  };
}

/**
 * Request interceptor function
 */
export type RequestInterceptor = (config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>;

/**
 * Response interceptor function
 */
export type ResponseInterceptor = (response: ApiResponse) => ApiResponse | Promise<ApiResponse>;

/**
 * Enhanced API service with HTTP functionality
 */
export class ApiService extends BaseService {
  protected apiConfig: ApiServiceConfig;

  constructor(config: ApiServiceConfig) {
    super(config);
    this.apiConfig = {
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
      interceptors: {
        request: [],
        response: [],
      },
      ...config,
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.apiConfig.interceptors!.request!.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.apiConfig.interceptors!.response!.push(interceptor);
  }

  /**
   * Make HTTP request
   */
  async request<T = any>(
    config: ApiRequestConfig,
    options: ServiceOptions = {}
  ): Promise<ServiceResult<T>> {
    return this.executeWithRetry(
      () => this.makeRequest<T>(config),
      `${config.method} ${config.url}`,
      options
    );
  }

  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    params?: Record<string, any>,
    options: ServiceOptions = {}
  ): Promise<ServiceResult<T>> {
    return this.request<T>(
      {
        method: HttpMethod.GET,
        url,
        params,
      },
      options
    );
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    options: ServiceOptions = {}
  ): Promise<ServiceResult<T>> {
    return this.request<T>(
      {
        method: HttpMethod.POST,
        url,
        data,
      },
      options
    );
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    options: ServiceOptions = {}
  ): Promise<ServiceResult<T>> {
    return this.request<T>(
      {
        method: HttpMethod.PUT,
        url,
        data,
      },
      options
    );
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    options: ServiceOptions = {}
  ): Promise<ServiceResult<T>> {
    return this.request<T>(
      {
        method: HttpMethod.PATCH,
        url,
        data,
      },
      options
    );
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string,
    options: ServiceOptions = {}
  ): Promise<ServiceResult<T>> {
    return this.request<T>(
      {
        method: HttpMethod.DELETE,
        url,
      },
      options
    );
  }

  /**
   * Upload file with progress tracking
   */
  async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    options: ServiceOptions = {}
  ): Promise<ServiceResult<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.executeWithRetry(
      () => this.makeUploadRequest<T>(url, formData, onProgress),
      `UPLOAD ${url}`,
      options
    );
  }

  /**
   * Download file
   */
  async download(
    url: string,
    filename?: string,
    options: ServiceOptions = {}
  ): Promise<ServiceResult<Blob>> {
    return this.executeWithRetry(
      () => this.makeDownloadRequest(url, filename),
      `DOWNLOAD ${url}`,
      options
    );
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<ServiceResult<{ status: 'healthy' | 'unhealthy'; details?: any }>> {
    try {
      const result = await this.get('/health');
      return {
        success: true,
        data: {
          status: result.success ? 'healthy' : 'unhealthy',
          details: result.data,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: ServiceError.fromError(error),
      };
    }
  }

  /**
   * Internal method to make HTTP request
   */
  private async makeRequest<T>(config: ApiRequestConfig): Promise<T> {
    // Apply request interceptors
    let requestConfig = { ...config };
    for (const interceptor of this.apiConfig.interceptors!.request!) {
      const interceptedConfig = await interceptor(requestConfig);
      // Ensure interceptor returns a valid config object
      if (!interceptedConfig || typeof interceptedConfig !== 'object') {
        throw new ServiceError(
          'Request interceptor returned invalid config',
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }
      requestConfig = interceptedConfig;
    }

    // Validate config before building URL
    if (!requestConfig.url || typeof requestConfig.url !== 'string') {
      throw new ServiceError(
        `Invalid request config: url must be a string, got ${typeof requestConfig.url}`,
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Build full URL
    const fullUrl = this.buildUrl(requestConfig.url, requestConfig.params);

    // Prepare headers
    const headers = {
      ...this.apiConfig.defaultHeaders,
      ...requestConfig.headers,
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: requestConfig.method,
      headers,
      signal: requestConfig.signal,
    };

    // Add body for non-GET requests
    if (requestConfig.data && requestConfig.method !== HttpMethod.GET) {
      if (requestConfig.data instanceof FormData) {
        fetchOptions.body = requestConfig.data;
        // Remove Content-Type header for FormData (browser will set it with boundary)
        delete headers['Content-Type'];
      } else {
        fetchOptions.body = JSON.stringify(requestConfig.data);
      }
    }

    // Make request
    const response = await fetch(fullUrl, fetchOptions);

    // Handle response
    const apiResponse = await this.handleResponse<T>(response);

    // Apply response interceptors
    let finalResponse = apiResponse;
    for (const interceptor of this.apiConfig.interceptors!.response!) {
      finalResponse = await interceptor(finalResponse);
    }

    return finalResponse.data;
  }

  /**
   * Handle file upload with progress
   */
  private async makeUploadRequest<T>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', async () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } else {
            reject(new ServiceError(
              `Upload failed: ${xhr.statusText}`,
              this.getErrorCodeFromStatus(xhr.status),
              xhr.status
            ));
          }
        } catch (error) {
          reject(ServiceError.fromError(error));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ServiceError('Upload failed', ErrorCode.NETWORK_ERROR));
      });

      xhr.addEventListener('timeout', () => {
        reject(new ServiceError('Upload timeout', ErrorCode.TIMEOUT_ERROR));
      });

      // Set headers
      const token = this.getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // Start upload
      xhr.open('POST', this.buildUrl(url));
      xhr.send(formData);
    });
  }

  /**
   * Handle file download
   */
  private async makeDownloadRequest(url: string, filename?: string): Promise<Blob> {
    const fullUrl = this.buildUrl(url);
    const headers: Record<string, string> = {};

    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(fullUrl, { headers });

    if (!response.ok) {
      throw new ServiceError(
        `Download failed: ${response.statusText}`,
        this.getErrorCodeFromStatus(response.status),
        response.status
      );
    }

    const blob = await response.blob();

    // Trigger download if filename is provided
    if (filename) {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }

    return blob;
  }

  /**
   * Handle fetch response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let data: T;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as unknown as T;
    }

    if (!response.ok) {
      throw new ServiceError(
        `HTTP ${response.status}: ${response.statusText}`,
        this.getErrorCodeFromStatus(response.status),
        response.status,
        { responseData: data }
      );
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers,
    };
  }

  /**
   * Build full URL with base URL and query parameters
   */
  private buildUrl(url: string, params?: Record<string, any>): string {
    // Add type safety check for url parameter
    if (typeof url !== 'string') {
      throw new ServiceError(
        `Invalid URL parameter: expected string, got ${typeof url}`,
        ErrorCode.VALIDATION_ERROR
      );
    }
    
    const fullUrl = url.startsWith('http') ? url : `${this.apiConfig.baseURL}${url}`;
    
    if (!params) {
      return fullUrl;
    }

    const urlObj = new URL(fullUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });

    return urlObj.toString();
  }

  /**
   * Get auth token from storage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  /**
   * Map HTTP status codes to error codes
   */
  private getErrorCodeFromStatus(status: number): ErrorCode {
    switch (status) {
      case 400:
        return ErrorCode.VALIDATION_ERROR;
      case 401:
        return ErrorCode.AUTHENTICATION_ERROR;
      case 403:
        return ErrorCode.AUTHORIZATION_ERROR;
      case 404:
        return ErrorCode.NOT_FOUND;
      case 409:
        return ErrorCode.RESOURCE_CONFLICT;
      case 429:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      case 500:
        return ErrorCode.INTERNAL_SERVER_ERROR;
      case 502:
      case 503:
      case 504:
        return ErrorCode.SERVICE_UNAVAILABLE;
      default:
        return status >= 500 ? ErrorCode.INTERNAL_SERVER_ERROR : ErrorCode.UNKNOWN_ERROR;
    }
  }
}