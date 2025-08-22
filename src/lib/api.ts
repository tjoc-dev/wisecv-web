// src/lib/api.ts
// Utility for WiseCV API integration using Axios for better error handling and future token support

import axios, { AxiosError, AxiosInstance } from 'axios';
import { initializeFCMForUser } from './messaging';
import { setupAuthInterceptor } from './auth-interceptor';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Export the api instance for use in other modules
export { api };

// Request interceptor for auth token and app name
api.interceptors.request.use((config) => {
  // Add auth token if available
  const token = localStorage.getItem('accessToken');
  if (token) {
    (config.headers as Record<string, string>)['Authorization'] =
      `Bearer ${token}`;
  }

  // Add x-app-name header for all requests
  (config.headers as Record<string, string>)['x-app-name'] = 'wisecv';

  return config;
});

// Setup global 401 error handling
setupAuthInterceptor(api);

export async function uploadResume({
  file,
  jobDescription,
}: {
  file: File;
  jobDescription?: string;
}) {
  const formData = new FormData();
  formData.append('resume', file);
  if (jobDescription) formData.append('jobDescription', jobDescription);
  try {
    const response = await api.post('/wisecv/upload-resume', formData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to upload resume');
  }
}

export async function improveResume(structuredResume?: any, jobDescription?: string, formattedText?: string) {
  try {
    const response = await api.post('/wisecv/improve', {
      structured: structuredResume,
      jobDescription,
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to improve resume');
  }
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Token expiry in milliseconds
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    emailVerified: boolean;
    role: string;
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, expiresIn, user } = response.data;

    // Store tokens and user data
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    // Calculate and store token expiry time
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem('tokenExpiresAt', expiryTime.toString());

    // Initialize FCM for the authenticated user
    try {
      await initializeFCMForUser();
    } catch (fcmError) {
      console.warn('FCM initialization failed, but login was successful:', fcmError);
    }

    return response.data;
  } catch (error) {
    throw new Error('Invalid email or password');
  }
}

/**
 * Get user's country from IP address
 * @returns Promise with country code
 */
async function getCountryFromIP(): Promise<string> {
  try {
    const response = await axios.get('https://ipapi.co/json/');
    return response.data.country_code;
  } catch (error) {
    console.error('Error detecting country:', error);
    return 'US'; // Default to US if detection fails
  }
}

/**
 * Determine currency based on country code
 * @param countryCode ISO country code
 * @returns Currency code (NGN for Nigeria, USD for others)
 */
function getCurrencyFromCountry(countryCode: string): string {
  return countryCode === 'NG' ? 'NGN' : 'USD';
}

export async function signup(email: string, password: string, firstName: string, lastName: string, captchaToken?: string | null): Promise<AuthResponse> {
  try {
    // Get country from IP
    const country = await getCountryFromIP();
    // Determine currency based on country
    const currency = getCurrencyFromCountry(country);
    // Set appname as required
    const appName = 'wisecv';

    const payload: any = {
      email,
      password,
      appName,
      country,
      currency,
      firstName,
      lastName,
    };

    // Include captcha token if provided
    if (captchaToken) {
      payload.captchaToken = captchaToken;
    }

    const response = await api.post('/auth/signup', payload);

    const { accessToken, refreshToken, expiresIn, user } = response.data;

    // Store tokens and user data
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    // Calculate and store token expiry time
    // Convert expiresIn from seconds to milliseconds (1 second = 1000 milliseconds)
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem('tokenExpiresAt', expiryTime.toString());

    // Initialize FCM for the new user
    try {
      await initializeFCMForUser();
    } catch (fcmError) {
      console.warn('FCM initialization failed, but signup was successful:', fcmError);
    }

    return response.data;
  } catch (error) {
    throw new Error('Could not create account');
  }
}

export async function fetchResumeAnalysis(resumeId: string) {
  try {
    const response = await api.get(`/wisecv/resume-history`, {
      params: { id: resumeId },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch resume analysis');
  }
}

export async function generateResumeWithTemplate(
  structured?: any,
  templateId?: string,
  avatar?: string,
  formattedText?: string
) {
  try {
    const payload: any = { templateId, avatar };

    if (formattedText) {
      payload.formattedText = formattedText;
    } else if (structured) {
      payload.structured = structured;
    } else {
      throw new Error('Either structured resume data or formatted text is required');
    }

    const response = await api.post('/wisecv/generate', payload, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to generate resume');
  }
}

// Structured Resume API Functions
export interface StructuredResumeData {
  id?: string;
  personalInfo?: PersonalInfoData;
  title: string;
  summary?: string;
  experiences?: ExperienceData[];
  educations?: EducationData[];
  skills?: SkillData[];
  projects?: ProjectData[];
  certifications?: CertificationData[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PersonalInfoData {
  professionalTitle?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  location?: string;
}

export interface ExperienceData {
  id?: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
  order?: number;
}

export interface EducationData {
  id?: string;
  school: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  order?: number;
}

export interface SkillData {
  id?: string;
  name: string;
  level?: string;
  order?: number;
}

export interface ProjectData {
  id?: string;
  name: string;
  link?: string;
  technologies?: string;
  description?: string;
  order?: number;
}

export interface CertificationData {
  id?: string;
  name: string;
  issuer: string;
  date: string;
  expirationDate?: string;
  neverExpires?: boolean;
  order?: number;
}

/**
 * Create a new structured resume
 */
export async function createStructuredResume(data: Omit<StructuredResumeData, 'id' | 'createdAt' | 'updatedAt'>): Promise<StructuredResumeData> {
  try {
    const response = await api.post('/wisecv/structured', data);
    return response.data.data;
  } catch (error) {
    throw new Error('Failed to create structured resume');
  }
}

/**
 * Update an existing structured resume
 */
export async function updateStructuredResume(id: string, data: Partial<StructuredResumeData>): Promise<StructuredResumeData> {
  try {
    const response = await api.put(`/wisecv/structured/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw new Error('Failed to update structured resume');
  }
}

/**
 * Get a specific structured resume by ID
 */
export async function getStructuredResume(id: string): Promise<StructuredResumeData> {
  try {
    const response = await api.get(`/wisecv/structured/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error('Failed to fetch structured resume');
  }
}

/**
 * Get all structured resumes for the current user
 */
export async function getUserStructuredResumes(): Promise<StructuredResumeData[]> {
  try {
    const response = await api.get('/wisecv/structured');
    return response.data.data;
  } catch (error) {
    throw new Error('Failed to fetch user structured resumes');
  }
}

/**
 * Delete a structured resume
 */
export async function deleteStructuredResume(id: string): Promise<void> {
  try {
    await api.delete(`/wisecv/structured/${id}`);
  } catch (error) {
    throw new Error('Failed to delete structured resume');
  }
}

/**
 * Validate a structured resume
 */
export async function validateStructuredResume(data: StructuredResumeData): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
  try {
    const response = await api.post('/wisecv/structured/validate', data);
    return response.data.data;
  } catch (error) {
    throw new Error('Failed to validate structured resume');
  }
}

export async function forgotPassword(email: string): Promise<void> {
  try {
    await api.post('/auth/forgot-password', { email });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw new Error('Failed to send password reset email');
  }
}

export async function verifyEmail(token: string): Promise<{ status: string; message: string }> {
  try {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Email verification failed');
    }
    throw new Error('Failed to verify email');
  }
}

export async function requestEmailVerification(email: string): Promise<void> {
  try {
    await api.post('/auth/request-email-verification', { email });
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to send verification email');
    }
    throw new Error('Failed to send verification email');
  }
}

export interface ProfileData {
  id: string | null;
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  jobTitle?: string;
  experience?: string;
  professionalTitle?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  skills?: string[];
  bio?: string;
  website?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  tier?: 'FREE' | 'BASIC' | 'PRO';
  createdAt: string | null;
  updatedAt: string | null;
}

const PROFILE_STORAGE_KEY = 'wisecv_profile';

export async function getProfile(force = false): Promise<ProfileData> {
  // Check cache first if not forcing refresh
  if (!force) {
    const cached = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        // If cache is still valid (1 hour), return it
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          console.log('Returning cached profile data');
          return data;
        }
      } catch (e) {
        console.warn('Failed to parse cached profile, fetching fresh data');
      }
    }
  }

  try {
    console.log('Fetching fresh profile data...');
    const response = await api.get('/wisecv/profile/me');

    // Handle the API response structure
    if (response.data && response.data.status === 'success' && response.data.data) {
      const profileData = response.data.data;

      // Save to localStorage with timestamp
      localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({
          data: profileData,
          timestamp: Date.now()
        })
      );

      console.log('Profile data fetched and cached');
      return profileData;
    }

    throw new Error('Invalid response format from server');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;
          status?: string;
          data?: unknown;
        };
        status?: number;
        headers?: Record<string, unknown>;
      };
    };

    console.error('Error fetching profile:', {
      message: errorMessage,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
      headers: axiosError.response?.headers
    });

    // If we have cached data and the error is not auth-related, return cached data
    if (axiosError.response?.status !== 401 && axiosError.response?.status !== 403) {
      const cached = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (cached) {
        try {
          const { data } = JSON.parse(cached);
          console.warn('Using cached profile due to API error');
          return data;
        } catch (e) {
          // Ignore cache parsing errors
        }
      }
    }

    const serverMessage = axiosError.response?.data?.message;
    throw new Error(serverMessage || 'Failed to fetch profile');
  }
}

export async function updateProfile(data: Partial<ProfileData>): Promise<ProfileData> {
  try {
    console.log('Updating profile with data:', data);
    const response = await api.put('/wisecv/profile/me', data);
    console.log('Update profile response:', response.data);

    // Handle the API response structure
    if (response.data && response.data.status === 'success' && response.data.data) {
      const updatedProfile = response.data.data;

      // Update the cache with the new profile data
      localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({
          data: updatedProfile,
          timestamp: Date.now()
        })
      );

      console.log('Profile updated and cache refreshed');
      return updatedProfile;
    }

    throw new Error('Invalid response format from server');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error updating profile:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });

      const serverMessage = error.response?.data?.message || 'An error occurred while updating profile';
      throw new Error(serverMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error updating profile:', error);
    throw new Error(errorMessage);
  }
}

export interface FCMToken {
  id: string;
  token: string;
  channel: 'WEB' | 'MOBILE';
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch user's FCM tokens from the server
 * @returns Promise with array of FCM tokens
 */
export async function getFCMTokens(): Promise<FCMToken[]> {
  try {
    const response = await api.get('/fcm/tokens');

    if (response.data && response.data.status === 'success' && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching FCM tokens:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const serverMessage = error.response?.data?.message || 'Failed to fetch FCM tokens';
      throw new Error(serverMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error fetching FCM tokens:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Register FCM token with the server
 * @param token FCM registration token
 * @param channel Token channel (WEB or MOBILE)
 * @returns Promise with registration result
 */
export async function registerFCMToken(token: string, channel: 'WEB' | 'MOBILE' = 'WEB'): Promise<void> {
  try {
    const response = await api.post('/fcm/token', {
      token,
      channel
    });

    if (response.data && response.data.status === 'success') {
      console.log('FCM token registered successfully:', response.data);
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error registering FCM token:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const serverMessage = error.response?.data?.message || 'Failed to register FCM token';
      throw new Error(serverMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error registering FCM token:', error);
    throw new Error(errorMessage);
  }
}

// Improved Resume API Functions
export interface ImprovedResumeData {
  id: string;
  userId: string;
  personalInfo?: PersonalInfoData;
  originalResumeId?: string;
  acceptedSuggestions: Record<string, any>;
  finalResumeText: string;
  metadata?: any;
  improvementScore?: number;
  status: 'draft' | 'finalized';
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateImprovedResumeRequest {
  acceptedSuggestions: Record<string, any>;
  finalResumeText: string;
  originalResumeId?: string;
  title?: string;
  metadata?: any;
  improvementScore?: number;
}

/**
 * Save accepted changes from an improved resume
 */
export async function saveImprovedResume(data: CreateImprovedResumeRequest): Promise<ImprovedResumeData> {
  try {
    const response = await api.post('/wisecv/improved', data);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Invalid response format from server');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error saving improved resume:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const serverMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to save improved resume';
      throw new Error(serverMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error saving improved resume:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Get all improved resumes for the authenticated user
 */
export async function getImprovedResumes(filters?: {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}): Promise<ImprovedResumeData[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
    if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());

    const response = await api.get(`/wisecv/improved?${params.toString()}`);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Invalid response format from server');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching improved resumes:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const serverMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to fetch improved resumes';
      throw new Error(serverMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error fetching improved resumes:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Get all improved resumes for the current user (compatible with ResumeSelector)
 */
export async function getUserImprovedResumes(): Promise<StructuredResumeData[]> {
  try {
    const response = await api.get('/wisecv/improved');
    return response.data.data;
  } catch (error) {
    throw new Error('Failed to fetch user improved resumes');
  }
}

/**
 * Get a specific improved resume by ID
 */
export async function getImprovedResumeById(id: string): Promise<ImprovedResumeData> {
  try {
    const response = await api.get(`/wisecv/improved/${id}`);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Invalid response format from server');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching improved resume:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const serverMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to fetch improved resume';
      throw new Error(serverMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error fetching improved resume:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Finalize an improved resume
 */
export async function finalizeImprovedResume(id: string): Promise<ImprovedResumeData> {
  try {
    const response = await api.post(`/wisecv/improved/${id}/finalize`);
    return response.data.data;
  } catch (error) {
    console.error('Error finalizing improved resume:', error);
    throw new Error('Failed to finalize improved resume');
  }
}

export async function deleteImprovedResume(id: string): Promise<void> {
  try {
    await api.delete(`/wisecv/improved/${id}`);
  } catch (error) {
    console.error('Error deleting improved resume:', error);
    throw new Error('Failed to delete improved resume');
  }
}

// Template-related interfaces and functions
export interface TemplateData {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  previewImageUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

/**
 * Get all available resume templates
 */
export async function getTemplates(category?: string): Promise<TemplateData[]> {
  try {
    const params = category ? { category } : {};
    const response = await api.get('/wisecv/templates', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw new Error('Failed to fetch templates');
  }
}

/**
 * Get a specific template by ID
 */
export async function getTemplateById(id: string): Promise<TemplateData> {
  try {
    const response = await api.get(`/wisecv/templates/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw new Error('Failed to fetch template');
  }
}

// Job Application API Functions
export interface JobApplicationData {
  id: string;
  userId: string;
  jobDescription: string;
  selectedResumeId: string;
  optimizedResumeText?: string;
  optimizedCoverLetter?: string;
  applicationTitle: string;
  companyName: string;
  jobTitle: string;
  jobUrl?: string;
  status: 'DRAFT' | 'GENERATED' | 'DOWNLOADED' | 'APPLIED';
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobApplicationRequest {
  jobDescription: string;
  selectedResumeId: string;
  applicationTitle: string;
  companyName: string;
  jobTitle: string;
  jobUrl?: string;
  metadata?: any;
}

export interface UpdateJobApplicationRequest {
  jobDescription?: string;
  selectedResumeId?: string;
  applicationTitle?: string;
  optimizedResumeText?: string;
  optimizedCoverLetter?: string;
  companyName?: string;
  jobTitle?: string;
  jobUrl?: string;
  status?: 'DRAFT' | 'GENERATED' | 'DOWNLOADED' | 'APPLIED';
  metadata?: any;
}

export interface JobApplicationFilters {
  status?: string;
  companyName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}

export interface JobApplicationStats {
  total: number;
  draft: number;
  generated: number;
  downloaded: number;
  applied: number;
  byCompany: Record<string, number>;
  recentApplications: number; // last 30 days
}

/**
 * Create a new job application
 */
export async function createJobApplication(data: CreateJobApplicationRequest): Promise<JobApplicationData> {
  try {
    const response = await api.post('/job-applications', data);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Invalid response format from server');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error creating job application:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const serverMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create job application';
      throw new Error(serverMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error creating job application:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Get all job applications for the authenticated user
 */
export async function getJobApplications(filters?: JobApplicationFilters): Promise<{
  data: JobApplicationData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.companyName) params.append('companyName', filters.companyName);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
    if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/job-applications?${params.toString()}`);

    if (response.data && response.data.data) {
      return {
        data: response.data.data,
        pagination: response.data.pagination || {
          page: 1,
          limit: 10,
          total: response.data.data.length,
          totalPages: 1
        }
      };
    }

    throw new Error('Invalid response format from server');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching job applications:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const serverMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to fetch job applications';
      throw new Error(serverMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error fetching job applications:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Get a specific job application by ID
 */
export async function getJobApplicationById(id: string): Promise<JobApplicationData> {
  try {
    const response = await api.get(`/job-applications/${id}`);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Invalid response format from server');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching job application:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const serverMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to fetch job application';
      throw new Error(serverMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error fetching job application:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Update a job application
 */
export async function updateJobApplication(id: string, data: UpdateJobApplicationRequest): Promise<JobApplicationData> {
  try {
    const response = await api.put(`/job-applications/${id}`, data);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Invalid response format from server');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error updating job application:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const serverMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update job application';
      throw new Error(serverMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error updating job application:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Delete a job application
 */
export async function deleteJobApplication(id: string): Promise<void> {
  try {
    await api.delete(`/job-applications/${id}`);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error deleting job application:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const serverMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete job application';
      throw new Error(serverMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error deleting job application:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Generate optimized content for a job application
 */
export async function generateOptimizedContent(id: string): Promise<JobApplicationData> {
  try {
    const response = await api.post(`/job-applications/${id}/generate`);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Invalid response format from server');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error generating optimized content:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const serverMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to generate optimized content';
      throw new Error(serverMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error generating optimized content:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Download optimized resume for a job application
 */
export async function downloadOptimizedResume(id: string): Promise<Blob> {
  try {
    const response = await api.get(`/job-applications/${id}/download-resume`, {
      responseType: 'blob'
    });

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error downloading optimized resume:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      throw new Error('Failed to download optimized resume');
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error downloading optimized resume:', error);
    throw new Error(errorMessage);
  }
}

export async function downloadOptimizedResumeWithTemplate(id: string, templateId: string): Promise<Blob> {
  try {
    const response = await api.post(`/job-applications/${id}/download-resume-with-template`, {
      templateId
    }, {
      responseType: 'blob'
    });

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error downloading optimized resume with template:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      throw new Error('Failed to download optimized resume with template');
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error downloading optimized resume with template:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Download cover letter for a job application
 */
export async function downloadCoverLetter(id: string): Promise<Blob> {
  try {
    const response = await api.get(`/job-applications/${id}/download-cover-letter`, {
      responseType: 'blob'
    });

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error downloading cover letter:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      throw new Error('Failed to download cover letter');
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error downloading cover letter:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Get job application statistics
 */
export async function getJobApplicationStats(): Promise<JobApplicationStats> {
  try {
    const response = await api.get('/job-applications/stats');

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Invalid response format from server');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching job application stats:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const serverMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to fetch job application statistics';
      throw new Error(serverMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error fetching job application stats:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Mark a job application as applied
 */
export async function markJobApplicationAsApplied(id: string): Promise<JobApplicationData> {
  try {
    const response = await api.post(`/job-applications/${id}/mark-applied`);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Invalid response format from server');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error marking job application as applied:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const serverMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to mark job application as applied';
      throw new Error(serverMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error marking job application as applied:', error);
    throw new Error(errorMessage);
  }
}