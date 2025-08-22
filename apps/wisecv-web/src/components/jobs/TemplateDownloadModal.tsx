import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTemplates, TemplateData } from '@/lib/api';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading';
import { GenericError } from '@/components/error/ErrorStates';

interface TemplateDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (templateId: string) => Promise<void>;
  isDownloading?: boolean;
  jobTitle?: string;
  companyName?: string;
}

export function TemplateDownloadModal({
  isOpen,
  onClose,
  onDownload,
  isDownloading = false,
  jobTitle,
  companyName
}: TemplateDownloadModalProps) {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Fetch templates when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const templatesData = await getTemplates();
      setTemplates(templatesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    try {
      await onDownload(selectedTemplate);
      onClose();
    } catch (err) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    if (!isDownloading) {
      setSelectedTemplate(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Resume
          </DialogTitle>
          <DialogDescription>
            {jobTitle && companyName ? (
              `Choose a template for your ${jobTitle} resume at ${companyName}`
            ) : (
              'Choose a template for your resume download'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="ml-2">Loading templates...</span>
            </div>
          ) : error ? (
            <GenericError
              title="Failed to load templates"
              description={error}
              onRetry={fetchTemplates}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-96 pr-2">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:shadow-md',
                      selectedTemplate === template.id
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:border-primary/50'
                    )}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm">{template.displayName}</CardTitle>
                        </div>
                        {selectedTemplate === template.id && (
                          <Badge variant="default" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                      {template.description && (
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    {template.previewImageUrl && (
                      <CardContent className="pt-0">
                        <div className="aspect-[3/4] bg-muted rounded-md overflow-hidden">
                          <img
                            src={template.previewImageUrl}
                            alt={`${template.displayName} preview`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {selectedTemplate ? (
                    `Selected: ${templates.find(t => t.id === selectedTemplate)?.displayName}`
                  ) : (
                    'Select a template to continue'
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isDownloading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDownload}
                    disabled={!selectedTemplate || isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}