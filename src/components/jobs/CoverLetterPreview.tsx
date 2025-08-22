import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ImprovedResumeData, JobApplicationData } from '@/lib/api';
import {
  FileText,
  Download,
  Edit,
  Save,
  X,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Building2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from '@/components/ui/sonner';

interface CoverLetterPreviewProps {
  jobApplication: JobApplicationData;
  resume: ImprovedResumeData;
  onDownload?: () => void;
  onUpdate?: (content: string) => void;
  isDownloading?: boolean;
  isUpdating?: boolean;
  className?: string;
}

export function CoverLetterPreview({
  jobApplication,
  resume,
  onDownload,
  onUpdate,
  isDownloading = false,
  isUpdating = false,
  className,
}: CoverLetterPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(jobApplication.optimizedCoverLetter || '');
  const [isCopied, setIsCopied] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  const coverLetterContent = jobApplication.optimizedCoverLetter || '';

  if (!coverLetterContent) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Cover Letter</h3>
          <p className="text-muted-foreground">
            Generate optimized content to see the cover letter here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(coverLetterContent);
  };

  const handleSave = async () => {
    if (onUpdate) {
      await onUpdate(editedContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(coverLetterContent);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetterContent);
      setIsCopied(true);
      toast.success('Cover letter copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatCoverLetterContent = (content: string) => {
    // Split content into paragraphs and format
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    return paragraphs;
  };

  const formattedParagraphs = formatCoverLetterContent(coverLetterContent);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Cover Letter</CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={isCopied}
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              {onUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isEditing ? handleCancel : handleEdit}
                  disabled={isUpdating}
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              )}
              {isEditing && onUpdate && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isUpdating}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
              )}
              {onDownload && (
                <AlertDialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={isDownloading}
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloading ? 'Downloading...' : 'Download .txt'}
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
                        onDownload();
                        setShowDownloadDialog(false);
                      }}>
                        Download
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cover Letter Content */}
      <Card>
        <CardContent className="p-0">
          {isEditing ? (
            <div className="p-6">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[600px] font-mono text-sm"
                placeholder="Edit your cover letter content..."
              />
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>{editedContent.length} characters</span>
                <span>Use Shift+Enter for line breaks</span>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="p-6">
                {/* Letter Header */}
                <div className="mb-8">
                  <div className="text-right mb-6">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(), 'MMMM d, yyyy')}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{jobApplication.companyName}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Hiring Manager</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Re: Application for {jobApplication.jobTitle}
                    </div>
                  </div>
                </div>

                {/* Letter Content */}
                <div className="space-y-4 leading-relaxed">
                  {formattedParagraphs.map((paragraph, index) => {
                    // Check if this is a greeting or closing
                    const isGreeting = paragraph.toLowerCase().includes('dear') ||
                      paragraph.toLowerCase().includes('hello') ||
                      paragraph.toLowerCase().includes('to whom it may concern');
                    const isClosing = paragraph.toLowerCase().includes('sincerely') ||
                      paragraph.toLowerCase().includes('best regards') ||
                      paragraph.toLowerCase().includes('yours truly') ||
                      paragraph.toLowerCase().includes('thank you');

                    return (
                      <p
                        key={index}
                        className={cn(
                          'text-sm',
                          isGreeting && 'font-medium',
                          isClosing && 'mt-6'
                        )}
                      >
                        {paragraph}
                      </p>
                    );
                  })}
                </div>

                {/* Signature Area */}
                <div className="mt-8 pt-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {resume?.personalInfo?.fullName || 'Your Name'}
                    </p>
                    {resume?.personalInfo?.email && (
                      <p className="text-sm text-muted-foreground">
                        {resume.personalInfo.email}
                      </p>
                    )}
                    {resume?.personalInfo?.phoneNumber && (
                      <p className="text-sm text-muted-foreground">
                        {resume.personalInfo.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Letter Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Word Count:</span>
              <span>{coverLetterContent.split(/\s+/).length} words</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Generated:</span>
              <span>
                {jobApplication.updatedAt && format(new Date(jobApplication.updatedAt), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Position:</span>
              <span className="truncate">{jobApplication.jobTitle}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}