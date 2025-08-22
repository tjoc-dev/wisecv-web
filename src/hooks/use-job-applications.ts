import { useState, useEffect, useCallback } from 'react';
import {
  JobApplicationData,
  JobApplicationFilters,
  JobApplicationStats,
  CreateJobApplicationRequest,
  UpdateJobApplicationRequest,
  getJobApplications,
  getJobApplicationById,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
  generateOptimizedContent,
  downloadOptimizedResume,
  downloadOptimizedResumeWithTemplate,
  downloadCoverLetter,
  getJobApplicationStats,
  markJobApplicationAsApplied,
} from '@/lib/api';
import { useAuth } from './use-auth';
import { toast } from '@/components/ui/sonner';

interface UseJobApplicationsReturn {
  // Data
  jobApplications: JobApplicationData[];
  currentJobApplication: JobApplicationData | null;
  stats: JobApplicationStats | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isGenerating: boolean;
  isDownloading: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchJobApplications: (filters?: JobApplicationFilters) => Promise<void>;
  fetchJobApplicationById: (id: string) => Promise<void>;
  createNewJobApplication: (data: CreateJobApplicationRequest) => Promise<JobApplicationData | null>;
  updateExistingJobApplication: (id: string, data: UpdateJobApplicationRequest) => Promise<JobApplicationData | null>;
  deleteJobApplicationById: (id: string) => Promise<void>;
  generateContent: (id: string) => Promise<void>;
  downloadResume: (id: string, filename?: string) => Promise<void>;
  downloadResumeWithTemplate: (id: string, templateId: string, filename?: string) => Promise<void>;
  downloadCover: (id: string, filename?: string) => Promise<void>;
  markAsApplied: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
  clearCurrentJobApplication: () => void;
}

export function useJobApplications(initialFilters?: JobApplicationFilters): UseJobApplicationsReturn {
  const { user } = useAuth();
  
  // Data state
  const [jobApplications, setJobApplications] = useState<JobApplicationData[]>([]);
  const [currentJobApplication, setCurrentJobApplication] = useState<JobApplicationData | null>(null);
  const [stats, setStats] = useState<JobApplicationStats | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Current filters
  const [currentFilters, setCurrentFilters] = useState<JobApplicationFilters | undefined>(initialFilters);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Clear current job application
  const clearCurrentJobApplication = useCallback(() => {
    setCurrentJobApplication(null);
  }, []);
  
  // Fetch job applications
  const fetchJobApplications = useCallback(async (filters?: JobApplicationFilters) => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const filtersToUse = filters || currentFilters;
      setCurrentFilters(filtersToUse);
      
      const response = await getJobApplications(filtersToUse);
      setJobApplications(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job applications';
      setError(errorMessage);
      console.error('Error fetching job applications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentFilters]);
  
  // Fetch job application by ID
  const fetchJobApplicationById = useCallback(async (id: string) => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const jobApplication = await getJobApplicationById(id);
      setCurrentJobApplication(jobApplication);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job application';
      setError(errorMessage);
      console.error('Error fetching job application:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);
  
  // Create new job application
  const createNewJobApplication = useCallback(async (data: CreateJobApplicationRequest): Promise<JobApplicationData | null> => {
    if (!user?.id) return null;
    
    try {
      setIsCreating(true);
      setError(null);
      
      const newJobApplication = await createJobApplication(data);
      
      // Add to the beginning of the list
      setJobApplications(prev => [newJobApplication, ...prev]);
      
      // Update pagination total
      setPagination(prev => prev ? {
        ...prev,
        total: prev.total + 1
      } : null);
      
      toast.success('Job application created successfully');
      return newJobApplication;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create job application';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error creating job application:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [user?.id]);
  
  // Update job application
  const updateExistingJobApplication = useCallback(async (id: string, data: UpdateJobApplicationRequest): Promise<JobApplicationData | null> => {
    if (!user?.id) return null;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      const updatedJobApplication = await updateJobApplication(id, data);
      
      // Update in the list
      setJobApplications(prev => 
        prev.map(app => app.id === id ? updatedJobApplication : app)
      );
      
      // Update current job application if it's the same one
      if (currentJobApplication?.id === id) {
        setCurrentJobApplication(updatedJobApplication);
      }
      
      toast.success('Job application updated successfully');
      return updatedJobApplication;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update job application';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error updating job application:', err);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, currentJobApplication?.id]);
  
  // Delete job application
  const deleteJobApplicationById = useCallback(async (id: string) => {
    if (!user?.id) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      await deleteJobApplication(id);
      
      // Remove from the list
      setJobApplications(prev => prev.filter(app => app.id !== id));
      
      // Update pagination total
      setPagination(prev => prev ? {
        ...prev,
        total: Math.max(0, prev.total - 1)
      } : null);
      
      // Clear current job application if it's the same one
      if (currentJobApplication?.id === id) {
        setCurrentJobApplication(null);
      }
      
      toast.success('Job application deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete job application';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error deleting job application:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [user?.id, currentJobApplication?.id]);
  
  // Generate optimized content
  const generateContent = useCallback(async (id: string) => {
    if (!user?.id) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      
      const updatedJobApplication = await generateOptimizedContent(id);
      
      // Update in the list
      setJobApplications(prev => 
        prev.map(app => app.id === id ? updatedJobApplication : app)
      );
      
      // Update current job application if it's the same one
      if (currentJobApplication?.id === id) {
        setCurrentJobApplication(updatedJobApplication);
      }
      
      toast.success('Optimized content generated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate optimized content';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error generating optimized content:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [user?.id, currentJobApplication?.id]);
  
  // Download resume
  const downloadResume = useCallback(async (id: string, filename?: string) => {
    if (!user?.id) return;
    
    try {
      setIsDownloading(true);
      setError(null);
      
      const blob = await downloadOptimizedResume(id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `optimized-resume-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Resume downloaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download resume';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error downloading resume:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [user?.id]);

  // Download resume with template
  const downloadResumeWithTemplate = useCallback(async (id: string, templateId: string, filename?: string) => {
    if (!user?.id) return;
    
    try {
      setIsDownloading(true);
      setError(null);
      
      const blob = await downloadOptimizedResumeWithTemplate(id, templateId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `optimized-resume-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Resume downloaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download resume';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error downloading resume:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [user?.id]);
  
  // Download cover letter
  const downloadCover = useCallback(async (id: string, filename?: string) => {
    if (!user?.id) return;
    
    try {
      setIsDownloading(true);
      setError(null);
      
      const blob = await downloadCoverLetter(id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `cover-letter-${id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Cover letter downloaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download cover letter';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error downloading cover letter:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [user?.id]);
  
  // Fetch statistics
  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setError(null);
      const statsData = await getJobApplicationStats();
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics';
      setError(errorMessage);
      console.error('Error fetching job application stats:', err);
    }
  }, [user?.id]);
  
  // Mark job application as applied
  const markAsApplied = useCallback(async (id: string) => {
    if (!user?.id) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      const updatedJobApplication = await markJobApplicationAsApplied(id);
      
      // Update in the list
      setJobApplications(prev => 
        prev.map(app => app.id === id ? updatedJobApplication : app)
      );
      
      // Update current job application if it's the same one
      if (currentJobApplication?.id === id) {
        setCurrentJobApplication(updatedJobApplication);
      }
      
      toast.success('Job application marked as applied successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark job application as applied';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error marking job application as applied:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, currentJobApplication?.id]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchJobApplications(),
      fetchStats()
    ]);
  }, [fetchJobApplications, fetchStats]);
  
  // Initial load
  useEffect(() => {
    if (user?.id) {
      refreshData();
    }
  }, [user?.id, refreshData]);
  
  return {
    // Data
    jobApplications,
    currentJobApplication,
    stats,
    pagination,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isGenerating,
    isDownloading,
    
    // Error state
    error,
    
    // Actions
    fetchJobApplications,
    fetchJobApplicationById,
    createNewJobApplication,
    updateExistingJobApplication,
    deleteJobApplicationById,
    generateContent,
    downloadResume,
    downloadResumeWithTemplate,
    downloadCover,
    markAsApplied,
    fetchStats,
    refreshData,
    clearError,
    clearCurrentJobApplication,
  };
}