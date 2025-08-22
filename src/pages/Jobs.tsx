import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Bookmark, AlertCircle } from 'lucide-react';

import { JobSearchForm } from '@/components/jobs/JobSearchForm';
import { JobCard } from '@/components/jobs/JobCard';
import { searchJobs, getSavedJobs, saveJob, removeSavedJob, updateSavedJobStatus, JobSearchParams, JobSearchResult, SavedJob } from '@/lib/jobs';
import { useProfile } from '@/hooks/use-profile';
import { useAuth } from '@/hooks/use-auth';
import { useTier } from '@/hooks/use-tier';
import { useLoading } from '@/hooks/use-loading';
import { GenericError } from '@/components/error/ErrorStates';
import { FeatureGate } from '@/components/tier/FeatureGate';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const JobsPage = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchResults, setSearchResults] = useState<JobSearchResult[] | null>(null);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  
  const searchLoading = useLoading();
  const savedJobsLoading = useLoading();
  const saveJobLoading = useLoading();
  const removeJobLoading = useLoading();
  const statusUpdateLoading = useLoading();

  const { profile } = useProfile();
  const { user, isTokenExpired } = useAuth();
  const { recordFeatureUsage } = useTier();
  const navigate = useNavigate();

  // Check if profile is complete
  const isProfileComplete = Boolean(
    profile?.jobTitle &&
    profile.experience
  );

  // Load saved jobs
  const loadSavedJobs = useCallback(async () => {
    if (!user || isTokenExpired) return;

    await savedJobsLoading.execute(async () => {
      const jobs = await getSavedJobs();
      // Map saved jobs to include the job data in the job property
      const savedJobsWithJobData = jobs.map(job => ({
        ...job,
        job: job.job || {
          id: job.jobId,
          title: job.job?.title || 'Unknown Job',
          company: job.job?.company || 'Unknown Company',
          location: job.job?.location || 'Location not specified',
          description: job.job?.description || 'No description available',
          url: job.job?.url || '#',
          postedAt: job.job?.postedAt || new Date().toISOString(),
        }
      }));
      setSavedJobs(savedJobsWithJobData);
    }, {
      onError: () => toast.error('Failed to load saved jobs. Please try again.')
    });
  }, [user, isTokenExpired, savedJobsLoading]);

  // Initial load of saved jobs
  useEffect(() => {
    if (!isProfileComplete) {
      toast.error('Please complete your profile before accessing jobs');
      navigate('/profile');
      return;
    }

    loadSavedJobs();
  }, [isProfileComplete, navigate, user, isTokenExpired, loadSavedJobs]);

  // Handle job search
  const handleSearch = async (params: JobSearchParams) => {
    if (!user || isTokenExpired) {
      navigate('/login');
      return;
    }

    await searchLoading.execute(async () => {
      const result = await searchJobs({
        ...params
      });
      // The API returns jobs in the data property
      setSearchResults(Array.isArray(result?.data) ? result.data : []);
      setActiveTab('search');
    }, {
      onError: () => toast.error('Failed to search for jobs')
    });
  };

  // Handle saving a job
  const handleSaveJob = async (jobId: string) => {
    await saveJobLoading.execute(async () => {
      await saveJob(jobId);
      await recordFeatureUsage('jobApplication');
      await loadSavedJobs(); // Refresh saved jobs list
    }, {
      onSuccess: () => toast.success('Job saved successfully'),
      onError: () => toast.error('Failed to save job')
    });
  };

  // Handle removing a saved job
  const handleRemoveJob = async (id: string) => {
    await removeJobLoading.execute(async () => {
      await removeSavedJob(id);
      setSavedJobs(prev => prev.filter(job => job.id !== id));
    }, {
      onSuccess: () => toast.success('Job removed from saved jobs'),
      onError: () => toast.error('Failed to remove job')
    });
  };

  const handleStatusChange = async (id: string, status: string) => {
    await statusUpdateLoading.execute(async () => {
      await updateSavedJobStatus(id, status as 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED');
      await loadSavedJobs(); // Refresh to get updated status
    }, {
      onError: () => toast.error('Failed to update job status')
    });
  };

  // Show loading state
  if (!isProfileComplete) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-8">Find Your Next Opportunity</h1>

        <FeatureGate feature="jobCenter">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Jobs
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved Jobs
              {savedJobs.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {savedJobs.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <JobSearchForm
              onSubmit={handleSearch}
              isLoading={searchLoading.isLoading}
              initialValues={{
                title: profile?.jobTitle || '',
                location: profile?.location || ''
              }}
            />

            {searchLoading.error && (
               <GenericError
                 description={searchLoading.error.toString()}
                 onRetry={() => handleSearch({})}
               />
             )}

            <div className="space-y-4">
              {searchLoading.isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-lg" />
                ))
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((job) => (
                  <JobCard
                    key={job.job_id}
                    job={job}
                    isSaved={savedJobs.some(savedJob => savedJob.jobId === job.job_id)}
                    onSave={handleSaveJob}
                  />
                ))
              ) : !searchLoading.isLoading ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20 border-border">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchLoading.error ? 'Error loading results' : 'No jobs found'}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {searchLoading.error 
                      ? 'There was an issue loading your search results. Please try again.'
                      : 'We couldn\'t find any jobs matching your search criteria. Try adjusting your filters or search terms.'}
                    
                  </p>
                  {!searchLoading.error && (
                    <Button
                      variant="outline"
                      onClick={() => handleSearch({})}
                      className="gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Show all jobs
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            {savedJobsLoading.isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))
            ) : savedJobsLoading.error ? (
               <GenericError
                 description={savedJobsLoading.error.toString()}
                 onRetry={loadSavedJobs}
               />
             ) : savedJobs.length > 0 ? (
              savedJobs.map((savedJob) => (
                <JobCard
                  key={savedJob.id}
                  job={savedJob}
                  isSaved={true}
                  onRemove={handleRemoveJob}
                  onStatusChange={handleStatusChange}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No saved jobs yet</h3>
                <p className="text-muted-foreground mb-4">
                  Save jobs that interest you to keep track of them here.
                </p>
                <Button onClick={() => setActiveTab('search')}>
                  <Search className="h-4 w-4 mr-2" />
                  Search for jobs
                </Button>
              </div>
            )}
          </TabsContent>
          </Tabs>
        </FeatureGate>
      </main>
    </div>
  );
};

export default function JobsPageWithAuth() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <ProtectedRoute>
          <JobsPage />
        </ProtectedRoute>
      </main>
      <Footer />
    </div>
  );
}
