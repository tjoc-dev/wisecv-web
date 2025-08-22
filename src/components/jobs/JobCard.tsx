import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, ExternalLink, Bookmark, X } from 'lucide-react';
import { JobSearchResult, SavedJob } from '@/lib/jobs';
import { useState } from 'react';

type JobCardProps = {
  job: JobSearchResult | SavedJob;
  isSaved?: boolean;
  onSave?: (id: string) => Promise<void>;
  onRemove?: (id: string) => Promise<void>;
  onStatusChange?: (id: string, status: string) => Promise<void>;
};

export function JobCard({
  job,
  isSaved = false,
  onSave,
  onRemove,
  onStatusChange,
}: JobCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Determine if this is a SavedJob or JobSearchResult
  const isSavedJob = 'id' in job;
  const jobData = isSavedJob ? (job as SavedJob).job : job as JobSearchResult;
  
  // State for status dropdown
  const [currentStatus, setCurrentStatus] = useState<SavedJob['status']>(
    isSavedJob ? (job as SavedJob).status : 'SAVED'
  );

  const handleSave = async () => {
    if (!onSave || isSaved) return;
    
    try {
      setIsSaving(true);
      // Use job_id from the job data since that's the unique identifier from the API
      const jobId = 'job_id' in job ? job.job_id : job.id;
      if (!jobId) {
        throw new Error('Job ID not found');
      }
      await onSave(jobId);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove || !isSavedJob) return;
    
    try {
      setIsRemoving(true);
      await onRemove((job as SavedJob).id);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!onStatusChange || !isSavedJob) return;
    
    try {
      setCurrentStatus(status as SavedJob['status']);
      await onStatusChange((job as SavedJob).id, status);
    } catch (error) {
      // Revert status on error
      setCurrentStatus((job as SavedJob).status);
      throw error;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{jobData.title}</CardTitle>
          <div className="flex gap-2">
            {onSave && !isSaved && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
            {onRemove && isSavedJob && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={isRemoving}
              >
                <X className="h-4 w-4 mr-2" />
                {isRemoving ? 'Removing...' : 'Remove'}
              </Button>
            )}
          </div>
        </div>
        {/* <div className="text-sm text-muted-foreground">
          {jobData.company} • {jobData.location}
        </div> */}
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm line-clamp-3">
          {jobData.description}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-0">
        <div className="text-xs text-muted-foreground flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDistanceToNow(new Date(jobData.postedAt), { addSuffix: true })}
        </div>
        <div className="flex gap-2">
          {onStatusChange && isSavedJob && (
            <select
              className="text-xs p-1 border rounded bg-background"
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="SAVED">Saved</option>
              <option value="APPLIED">Applied</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
            </select>
          )}
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a 
              href={jobData.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View Job
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
