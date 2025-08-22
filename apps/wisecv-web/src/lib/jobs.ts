import axios from 'axios';
import { setupAuthInterceptor } from './auth-interceptor';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'x-app-name': 'wisecv',
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Setup global 401 error handling
setupAuthInterceptor(api);

export interface JobSearchResult {
  id: string;  // Changed from number to string to match job_id from API
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  postedAt: string;
  job_id?: string;  // Adding this to match the API response structure
}

export interface SavedJob {
  id: string;
  jobId: string;  // Changed from number to string to match JobSearchResult.id
  status: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';
  notes?: string;
  appliedAt?: string;
  interviewAt?: string;
  createdAt: string;
  updatedAt: string;
  job: JobSearchResult;
}

export interface JobSearchParams {
  title?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export interface JobSearchResponse {
  success: boolean;
  data: JobSearchResult[];
  total?: number;
  page?: number;
  limit?: number;
}

export async function searchJobs(params: JobSearchParams): Promise<JobSearchResponse> {
  try {
    const response = await api.get('/wisecv/jobs/search', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw new Error('Failed to search jobs');
  }
}

export async function getSavedJobs(): Promise<SavedJob[]> {
  try {
    const response = await api.get('/wisecv/saved-jobs');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    throw new Error('Failed to fetch saved jobs');
  }
}

export async function saveJob(jobId: string): Promise<SavedJob> {
  try {
    const response = await api.post('/wisecv/saved-jobs', { jobId });
    return response.data.data;
  } catch (error) {
    console.error('Error saving job:', error);
    throw new Error('Failed to save job');
  }
}

export async function removeSavedJob(id: string): Promise<void> {
  try {
    await api.delete(`/wisecv/saved-jobs/${id}`);
  } catch (error) {
    console.error('Error removing saved job:', error);
    throw new Error('Failed to remove saved job');
  }
}

export async function updateSavedJobStatus(
  id: string, 
  status: SavedJob['status'],
  notes?: string
): Promise<SavedJob> {
  try {
    const response = await api.patch(`/wisecv/saved-jobs/${id}`, { status, notes });
    return response.data.data;
  } catch (error) {
    console.error('Error updating job status:', error);
    throw new Error('Failed to update job status');
  }
}
