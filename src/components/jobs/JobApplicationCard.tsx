import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { JobApplicationData } from '@/lib/api';
import { JobApplicationStatus } from '@/types/common';
import { formatDistanceToNow } from 'date-fns';
import {
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobApplicationCardProps {
  jobApplication: JobApplicationData;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onGenerate?: (id: string) => void;

  onDownloadCoverLetter?: (id: string) => void;
  isGenerating?: boolean;
  isDeleting?: boolean;
  className?: string;
}

const statusConfig = {
  [JobApplicationStatus.DRAFT]: {
    label: 'Draft',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  },
  [JobApplicationStatus.GENERATED]: {
    label: 'Generated',
    variant: 'default' as const,
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  },
  [JobApplicationStatus.DOWNLOADED]: {
    label: 'Downloaded',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-700 hover:bg-green-200',
  },
  [JobApplicationStatus.APPLIED]: {
    label: 'Applied',
    variant: 'default' as const,
    className: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  },
};

export function JobApplicationCard({
  jobApplication,
  onView,
  onEdit,
  onDelete,
  onGenerate,
  onDownloadCoverLetter,
  isGenerating = false,
  isDeleting = false,
  className,
}: JobApplicationCardProps) {
  const statusInfo = statusConfig[jobApplication.status];
  const canGenerate = jobApplication.status === JobApplicationStatus.DRAFT;
  const canDownload = jobApplication.status === JobApplicationStatus.GENERATED || 
                     jobApplication.status === JobApplicationStatus.DOWNLOADED ||
                     jobApplication.status === JobApplicationStatus.APPLIED;

  const formatSalary = (min?: number, max?: number, currency = 'USD') => {
    if (!min && !max) return null;
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    }
    
    return formatter.format(min || max || 0);
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              <Link 
                to={`/job-applications/${jobApplication.id}`}
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
              >
                {jobApplication.jobTitle}
              </Link>
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{jobApplication.companyName}</span>
            </div>
            {jobApplication.metadata?.location && (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{jobApplication.metadata?.location}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Badge 
              variant={statusInfo.variant}
              className={statusInfo.className}
            >
              {statusInfo.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={isDeleting}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(jobApplication.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(jobApplication.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canGenerate && onGenerate && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onGenerate(jobApplication.id)}
                      disabled={isGenerating}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {isGenerating ? 'Generating...' : 'Generate Content'}
                    </DropdownMenuItem>
                  </>
                )}
                {canDownload && onDownloadCoverLetter && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDownloadCoverLetter(jobApplication.id)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download Cover Letter
                    </DropdownMenuItem>
                  </>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(jobApplication.id)}
                      className="text-destructive focus:text-destructive"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Salary Information */}
          {(jobApplication.metadata?.salaryMin || jobApplication.metadata?.salaryMax) && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {formatSalary(
                  jobApplication.metadata?.salaryMin,
                  jobApplication.metadata?.salaryMax,
                  jobApplication.metadata?.salaryCurrency
                )}
              </span>
              {jobApplication.metadata?.salaryType && (
                <span className="text-muted-foreground">/ {jobApplication.metadata?.salaryType}</span>  
              )}
            </div>
          )}
          
          {/* Job Description Preview */}
          {jobApplication.jobDescription && (
            <div className="text-sm text-muted-foreground">
              <p className="line-clamp-2">
                {jobApplication.jobDescription}
              </p>
            </div>
          )}
          
          {/* Resume Information */}
          {jobApplication.selectedResumeId && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Resume:</span> {jobApplication.selectedResumeId}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              Created {formatDistanceToNow(new Date(jobApplication.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          {jobApplication.updatedAt !== jobApplication.createdAt && (
            <div className="text-xs">
              Updated {formatDistanceToNow(new Date(jobApplication.updatedAt), { addSuffix: true })}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}