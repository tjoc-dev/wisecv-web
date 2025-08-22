import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { JobApplicationForm } from '@/components/jobs/JobApplicationForm';
import { useJobApplications } from '@/hooks/use-job-applications';
import { JobApplicationData, UpdateJobApplicationRequest } from '@/lib/api';
import { ArrowLeft, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditJobApplicationPageProps {
  className?: string;
}

export function EditJobApplicationPage({ className }: EditJobApplicationPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    currentJobApplication,
    isLoading,
    isUpdating,
    error,
    fetchJobApplicationById,
    updateExistingJobApplication,
    clearCurrentJobApplication,
  } = useJobApplications();
  
  useEffect(() => {
    if (id) {
      fetchJobApplicationById(id);
    }
    
    return () => {
      clearCurrentJobApplication();
    };
  }, [id, fetchJobApplicationById, clearCurrentJobApplication]);
  
  const handleBack = () => {
    if (currentJobApplication) {
      navigate(`/job-applications/${currentJobApplication.id}`);
    } else {
      navigate('/job-applications');
    }
  };
  
  const handleSubmit = async (data: UpdateJobApplicationRequest) => {
    if (!currentJobApplication) return;
    
    const success = await updateExistingJobApplication(currentJobApplication.id, data);
    if (success) {
      navigate(`/job-applications/${currentJobApplication.id}`);
    }
  };
  
  const handleCancel = () => {
    handleBack();
  };
  
  if (error) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        <Card className="border-destructive">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Application</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoading || !currentJobApplication) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{`Edit ${currentJobApplication.jobTitle} at ${currentJobApplication.companyName} - WiseCV`}</title>
        <meta 
          name="description" 
          content={`Edit job application for ${currentJobApplication.jobTitle} position at ${currentJobApplication.companyName}.`} 
        />
      </Helmet>
      
      <div className={cn('container mx-auto px-4 py-8', className)}>
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Application
          </Button>
          
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Job Application
          </h1>
          <p className="text-muted-foreground mt-2">
            Update the details for your {currentJobApplication.jobTitle} application at {currentJobApplication.companyName}.
          </p>
        </div>
        
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent>
            <JobApplicationForm
              jobApplication={currentJobApplication}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isUpdating}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}