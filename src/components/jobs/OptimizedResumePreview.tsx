import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { JobApplicationData } from '@/lib/api';
import {
  FileText,
  Download,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TemplateDownloadModal } from './TemplateDownloadModal';
import { useJobApplications } from '@/hooks/use-job-applications';

interface OptimizedResumePreviewProps {
  jobApplication: JobApplicationData;
  className?: string;
  enableEdit?: boolean;
  onSectionEdit?: (section: string, content: string) => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

interface EditableSectionProps {
  title: string;
  icon: React.ReactNode;
  content: string;
  sectionKey: string;
  enableEdit?: boolean;
  onEdit?: (section: string, content: string) => void;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-lg transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-left">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function EditableSection({ title, icon, content, sectionKey, enableEdit, onEdit, defaultOpen = true }: EditableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  
  const handleSave = () => {
    if (onEdit) {
      onEdit(sectionKey, editContent);
    }
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-lg transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-left">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {enableEdit && isOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(!isEditing);
              }}
              className="h-6 w-6 p-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              placeholder="Edit section content..."
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                className="flex items-center gap-1"
              >
                <Save className="h-3 w-3" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono bg-muted/30 p-4 rounded-lg">
            {content || 'No content available'}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}



export function OptimizedResumePreview({
  jobApplication,
  className,
  enableEdit = false,
  onSectionEdit,
}: OptimizedResumePreviewProps) {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const { downloadResumeWithTemplate, isLoading } = useJobApplications();
  
  const handleTemplateDownload = async (templateId: string) => {
    try {
      await downloadResumeWithTemplate(
        jobApplication.id,
        templateId,
        `${jobApplication.jobTitle}_${jobApplication.companyName}_resume.pdf`
      );
    } catch (error) {
      // Error handling is done in the hook
      console.error('Download failed:', error);
    }
  };
  
  const handleResumeEdit = (content: string) => {
    if (onSectionEdit) {
      onSectionEdit('optimizedResume', content);
    }
  };

  if (!jobApplication.optimizedResumeText) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Optimized Resume</h3>
          <p className="text-muted-foreground">
            Generate optimized content to see the preview here.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>
                Optimized Resume
              </CardTitle>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Optimized
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Download Resume PDF</AlertDialogTitle>
                    <AlertDialogDescription>
                      Please ensure all details on this page are correct before downloading. You can edit the content to reflect the correct data if needed. Do you want to proceed with the download?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      setShowTemplateModal(true);
                      setShowDownloadDialog(false);
                    }}>
                      Download
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Resume Content */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[800px]">
            <div className="p-6">
              <EditableSection
                title="Optimized Resume"
                icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                content={jobApplication.optimizedResumeText || ''}
                sectionKey="optimizedResume"
                enableEdit={enableEdit}
                onEdit={(_, content) => handleResumeEdit(content)}
                defaultOpen={true}
              />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <TemplateDownloadModal
         isOpen={showTemplateModal}
         onClose={() => setShowTemplateModal(false)}
         onDownload={handleTemplateDownload}
         isDownloading={isLoading}
         jobTitle={jobApplication.jobTitle}
         companyName={jobApplication.companyName}
       />
    </div>
  );
}