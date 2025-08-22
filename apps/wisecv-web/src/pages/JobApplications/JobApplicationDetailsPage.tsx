import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { OptimizedResumePreview } from '@/components/jobs/OptimizedResumePreview';
import { CoverLetterPreview } from '@/components/jobs/CoverLetterPreview';
import { useJobApplications } from '@/hooks/use-job-applications';
import { JobApplicationStatus } from '@/types/common';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Sparkles,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  FileText,
  User,
  Globe,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ImprovedResumeData, getImprovedResumeById } from '@/lib/api';

interface JobApplicationDetailsPageProps {
  className?: string;
}

const statusConfig = {
  [JobApplicationStatus.DRAFT]: {
    label: 'Draft',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-700',
    description: 'Application is in draft mode. Generate optimized content to proceed.',
  },
  [JobApplicationStatus.GENERATED]: {
    label: 'Generated',
    variant: 'default' as const,
    className: 'bg-blue-100 text-blue-700',
    description: 'Optimized content has been generated. Ready to download and apply.',
  },
  [JobApplicationStatus.DOWNLOADED]: {
    label: 'Downloaded',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-700',
    description: 'Documents have been downloaded. Ready to submit your application.',
  },
  [JobApplicationStatus.APPLIED]: {
    label: 'Applied',
    variant: 'default' as const,
    className: 'bg-purple-100 text-purple-700',
    description: 'Application has been submitted. Good luck!',
  },
};

export function JobApplicationDetailsPage({ className }: JobApplicationDetailsPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [resumeData, setResumeData] = useState<ImprovedResumeData | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResumeDownloadDialog, setShowResumeDownloadDialog] = useState(false);
  const [showCoverLetterDownloadDialog, setShowCoverLetterDownloadDialog] = useState(false);

  const {
    currentJobApplication,
    isLoading,
    isGenerating,
    isDownloading,
    isDeleting,
    isUpdating,
    error,
    fetchJobApplicationById,
    updateExistingJobApplication,
    deleteJobApplicationById,
    generateContent,
    downloadResume,
    downloadCover,
    markAsApplied,
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

  // Fetch structured resume when job application is loaded
  useEffect(() => {
    const fetchResume = async () => {
      if (currentJobApplication?.selectedResumeId && !resumeData) {
        setIsLoadingResume(true);
        try {
          const resume = await getImprovedResumeById(currentJobApplication.selectedResumeId);
          setResumeData(resume);
        } catch (error) {
          console.error('Failed to fetch structured resume:', error);
        } finally {
          setIsLoadingResume(false);
        }
      }
    };

    fetchResume();
  }, [currentJobApplication?.selectedResumeId, resumeData]);

  const handleBack = () => {
    navigate('/job-applications');
  };

  const handleEdit = () => {
    if (currentJobApplication) {
      navigate(`/job-applications/${currentJobApplication.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!currentJobApplication) return;
    await deleteJobApplicationById(currentJobApplication.id);
    navigate('/job-applications');
  };

  const handleGenerate = async () => {
    if (currentJobApplication) {
      await generateContent(currentJobApplication.id);
      setActiveTab('resume'); // Switch to resume tab to see the generated content
    }
  };



  const handleDownloadCoverLetter = async () => {
    if (currentJobApplication) {
      const filename = `${currentJobApplication.companyName}-${currentJobApplication.jobTitle}-cover-letter.txt`;
      await downloadCover(currentJobApplication.id, filename);
    }
  };

  const handleUpdateCoverLetter = async (content: string) => {
    if (currentJobApplication) {
      await updateExistingJobApplication(currentJobApplication.id, {
        optimizedCoverLetter: content,
      });
    }
  };

  const handleMarkAsApplied = async () => {
    if (currentJobApplication) {
      await markAsApplied(currentJobApplication.id);
    }
  };

  const handleSectionEdit = async (section: string, content: string) => {
    if (currentJobApplication) {
      console.log(`Editing section ${section}:`, content);
      
      // Update the optimized resume text with the edited content
      if (section === 'optimizedResume') {
        await updateExistingJobApplication(currentJobApplication.id, {
          optimizedResumeText: content,
          metadata: {
            ...currentJobApplication.metadata,
            lastEditedSection: section,
            lastEditedAt: new Date().toISOString(),
          }
        });
      } else {
        // For other sections, just update metadata for now
        await updateExistingJobApplication(currentJobApplication.id, {
          metadata: {
            ...currentJobApplication.metadata,
            lastEditedSection: section,
            lastEditedAt: new Date().toISOString(),
          }
        });
      }
    }
  };

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
              Back to Applications
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
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[currentJobApplication.status] || {
    label: 'Unknown',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-700',
    description: 'Unknown status',
  };
  const canGenerate = currentJobApplication.status === JobApplicationStatus.DRAFT;
  const canDownload = currentJobApplication.status === JobApplicationStatus.GENERATED ||
    currentJobApplication.status === JobApplicationStatus.DOWNLOADED ||
    currentJobApplication.status === JobApplicationStatus.APPLIED;
  const canMarkAsApplied = currentJobApplication.status === JobApplicationStatus.DOWNLOADED;

  return (
    <>
      <Helmet>
        <title>{`${currentJobApplication.jobTitle} at ${currentJobApplication.companyName} - WiseCV`}</title>
        <meta
          name="description"
          content={`Job application details for ${currentJobApplication.jobTitle} position at ${currentJobApplication.companyName}.`}
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

          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold tracking-tight truncate">
                {currentJobApplication.jobTitle}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{currentJobApplication.companyName}</span>
                </div>
                {currentJobApplication.metadata?.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{currentJobApplication.metadata?.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Badge
                variant={statusInfo.variant}
                className={statusInfo.className}
              >
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {canGenerate && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Optimized Content'}
            </Button>
          )}

          {canDownload && (
            <>
              <AlertDialog open={showResumeDownloadDialog} onOpenChange={setShowResumeDownloadDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isDownloading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Resume
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Download Resume</AlertDialogTitle>
                    <AlertDialogDescription>
                      Please ensure all details on this page are correct before downloading. You can edit the content to reflect the correct data if needed. Do you want to proceed with the download?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      if (currentJobApplication) {
                        downloadResume(currentJobApplication.id);
                      }
                      setShowResumeDownloadDialog(false);
                    }}>
                      Download
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <AlertDialog open={showCoverLetterDownloadDialog} onOpenChange={setShowCoverLetterDownloadDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isDownloading}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Cover Letter
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Download Cover Letter</AlertDialogTitle>
                    <AlertDialogDescription>
                      Please ensure all details on this page are correct before downloading. You can edit the content to reflect the correct data if needed. Do you want to proceed with the download?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      handleDownloadCoverLetter();
                      setShowCoverLetterDownloadDialog(false);
                    }}>
                      Download
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {canMarkAsApplied && (
            <Button
              onClick={handleMarkAsApplied}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isUpdating ? 'Marking as Applied...' : 'Mark as Applied'}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isDeleting}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Application</AlertDialogTitle>
                <AlertDialogDescription>
                  {currentJobApplication && (
                    `Are you sure you want to delete the application for "${currentJobApplication.jobTitle}" at ${currentJobApplication.companyName}? This action cannot be undone.`
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    handleDelete();
                    setShowDeleteDialog(false);
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="resume">Optimized Resume</TabsTrigger>
            <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Application Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <Badge
                    variant={statusInfo.variant}
                    className={statusInfo.className}
                  >
                    {statusInfo.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {statusInfo.description}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Created {currentJobApplication.createdAt && !isNaN(new Date(currentJobApplication.createdAt).getTime()) 
                        ? formatDistanceToNow(new Date(currentJobApplication.createdAt), { addSuffix: true })
                        : 'Unknown date'
                      }
                    </span>
                  </div>
                  {currentJobApplication.updatedAt !== currentJobApplication.createdAt && (
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Updated {currentJobApplication.updatedAt && !isNaN(new Date(currentJobApplication.updatedAt).getTime())
                          ? formatDistanceToNow(new Date(currentJobApplication.updatedAt), { addSuffix: true })
                          : 'Unknown date'
                        }
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Job Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Position</label>
                    <p className="font-medium">{currentJobApplication.jobTitle}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company</label>
                    <p className="font-medium">{currentJobApplication.companyName}</p>
                  </div>
                  {currentJobApplication.metadata?.location && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <p className="font-medium">{currentJobApplication.metadata?.location}</p>
                    </div>
                  )}
                  {(currentJobApplication.metadata?.salaryMin || currentJobApplication.metadata?.salaryMax) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Salary</label>
                      <p className="font-medium">
                        {formatSalary(
                          currentJobApplication.metadata?.salaryMin,
                          currentJobApplication.metadata?.salaryMax,
                          currentJobApplication.metadata?.salaryCurrency
                        )}
                        {currentJobApplication.metadata?.salaryType && (
                           <span className="text-muted-foreground ml-1">/ {currentJobApplication.metadata?.salaryType}</span>
                         )}
                      </p>
                    </div>
                  )}
                </div>

                {currentJobApplication.jobUrl && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Job Posting</label>
                    <div className="mt-1">
                      <a
                        href={currentJobApplication.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <Globe className="h-4 w-4" />
                        View Original Posting
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}

                {currentJobApplication.jobDescription && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Job Description</label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {currentJobApplication.jobDescription}
                      </p>
                    </div>
                  </div>
                )}

                {currentJobApplication.metadata?.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {currentJobApplication.metadata?.notes}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resume Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Resume Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">Selected Resume ID:</span>
                  <span className="ml-2 font-mono">{currentJobApplication.selectedResumeId}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resume">
            <OptimizedResumePreview
              jobApplication={currentJobApplication}
              enableEdit={true}
              onSectionEdit={handleSectionEdit}
            />
          </TabsContent>

          <TabsContent value="cover-letter">
            {isLoadingResume ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-48 mx-auto" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                    <p className="text-muted-foreground">Loading resume data...</p>
                  </div>
                </CardContent>
              </Card>
            ) : resumeData ? (
              <CoverLetterPreview
                jobApplication={currentJobApplication}
                resume={resumeData}
                onDownload={handleDownloadCoverLetter}
                onUpdate={handleUpdateCoverLetter}
                isDownloading={isDownloading}
                isUpdating={isUpdating}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Resume Data Not Available</h3>
                  <p className="text-muted-foreground">
                    Unable to load resume data. Please try refreshing the page.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}