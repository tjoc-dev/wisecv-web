import { Helmet } from 'react-helmet-async';
import { JobApplicationsList } from '@/components/jobs/JobApplicationsList';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface JobApplicationsPageProps {
  className?: string;
}

export function JobApplicationsPage({ className }: JobApplicationsPageProps) {
  const navigate = useNavigate();
  
  const handleCreateNew = () => {
    navigate('/job-applications/create');
  };
  
  const handleViewDetails = (id: string) => {
    navigate(`/job-applications/${id}`);
  };
  
  const handleEdit = (id: string) => {
    navigate(`/job-applications/${id}/edit`);
  };
  
  return (
    <>
      <Helmet>
        <title>Job Applications - WiseCV</title>
        <meta 
          name="description" 
          content="Manage your job applications, track your progress, and optimize your resumes with AI-powered insights." 
        />
      </Helmet>
      
      <div className={cn('container mx-auto px-4 py-8', className)}>
        {/* Navigation Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        <JobApplicationsList
          onCreateNew={handleCreateNew}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
        />
      </div>
    </>
  );
}