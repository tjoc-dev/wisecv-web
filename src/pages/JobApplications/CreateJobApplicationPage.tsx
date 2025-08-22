import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { JobApplicationForm } from '@/components/jobs/JobApplicationForm';
import { useJobApplications } from '@/hooks/use-job-applications';
import { CreateJobApplicationRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';

interface CreateJobApplicationPageProps {
  className?: string;
}

export function CreateJobApplicationPage({ className }: CreateJobApplicationPageProps) {
  const navigate = useNavigate();
  const { createNewJobApplication, isCreating } = useJobApplications();
  
  const handleSubmit = async (data: CreateJobApplicationRequest) => {
    try {
      const newJobApplication = await createNewJobApplication(data);
      if (newJobApplication) {
        toast.success('Job application created successfully!');
        navigate(`/job-applications/${newJobApplication.id}`);
      }
    } catch (error) {
      console.error('Error creating job application:', error);
      toast.error('Failed to create job application. Please try again.');
    }
  };
  
  const handleCancel = () => {
    navigate('/job-applications');
  };
  
  const handleBack = () => {
    navigate('/job-applications');
  };
  
  return (
    <>
      <Helmet>
        <title>Create Job Application - WiseCV</title>
        <meta 
          name="description" 
          content="Create a new job application and optimize your resume with AI-powered insights for better job matching." 
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
            Back to Job Applications
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Job Application</h1>
            <p className="text-muted-foreground mt-2">
              Fill in the job details and select a resume to create your application. 
              Our AI will help optimize your content for the best match.
            </p>
          </div>
        </div>
        
        {/* Form */}
        <JobApplicationForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isCreating}
        />
      </div>
    </>
  );
}