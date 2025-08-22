import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download, Eye, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScoreCard from '@/components/review/ScoreCard';
import SuggestionsList from '@/components/review/SuggestionsList';
import UpgradePrompt from '@/components/review/UpgradePrompt';
import { TemplateSelector } from '@/components/TemplateSelector';
import { fetchResumeAnalysis, finalizeImprovedResume, TemplateData, getImprovedResumes, generateResumeWithTemplate, getProfile, getImprovedResumeById, deleteImprovedResume } from '@/lib/api';
import { convertSuggestionsToStructuredData, generateFinalResumeText, Suggestion } from '@/utils/resumeDataConverter';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FeatureGate } from '@/components/tier/FeatureGate';
import { useTier } from '@/hooks/use-tier';
import { useAuth } from '@/hooks/use-auth';

// Enhanced architecture imports
import { useService } from '@/hooks/use-service';
import { useLoading } from '@/hooks/use-loading';
import { SERVICE_NAMES } from '@/lib/services/service-registry';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading';
import { ErrorState } from '@/components/error/ErrorStates';
import { toast } from '@/components/ui/sonner';

// Define the expected type for resume analysis data
interface ResumeAnalysis {
  atsScore: number;
  readabilityScore: number;
  keywordScore?: number;
  suggestions: Suggestion[];
}

function ReviewPage() {
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('resumeId');
  const { recordFeatureUsage } = useTier();
  const { user } = useAuth();
  
  // State management
  const [resumeData, setResumeData] = useState<ResumeAnalysis | null>(null);
  const [improvedResumeData, setImprovedResumeData] = useState<any>(null);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<string[]>([]);
  const [editedSuggestions, setEditedSuggestions] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [savedResumeId, setSavedResumeId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  
  // Enhanced loading states
  const {
    isLoading: isLoadingAnalysis,
    error: analysisError,
    setLoading: setAnalysisLoading,
    setError: setAnalysisError,
    reset: resetAnalysisLoading
  } = useLoading();
  
  // Service hooks for API operations
  const {
    execute: executeDelete,
    loading: isDeletingResume,
    error: deleteError,
    retry: retryDelete
  } = useService(SERVICE_NAMES.API, 'delete');
  
  const [isDownloadingResume, setIsDownloadingResume] = useState(false);
  const [downloadError, setDownloadError] = useState<Error | null>(null);

  const generateOriginalResumeText = () => {
    if (!resumeData?.suggestions) return '';
    
    const sections = resumeData.suggestions.reduce((acc, suggestion) => {
      if (!acc[suggestion.section]) {
        acc[suggestion.section] = [];
      }
      acc[suggestion.section].push(suggestion.original);
      return acc;
    }, {} as Record<string, string[]>);
    
    return Object.entries(sections)
      .map(([section, content]) => `${section.toUpperCase()}:\n${content.join('\n')}\n`)
      .join('\n');
  };

  const handleDownloadResume = useCallback(async () => {
    try {
      await recordFeatureUsage('resumeImprovement');
      
      if (improvedResumeData) {
        setShowTemplateSelector(true);
        return;
      }
      
      if (!savedResumeId) {
        const improvedResumes = await getImprovedResumes();
        if (improvedResumes.length === 0) {
          throw new Error('No improved resume found. Please apply changes first.');
        }
        const latestResume = improvedResumes[0];
        setSavedResumeId(latestResume.id);
      }
      
      setShowTemplateSelector(true);
    } catch (error) {
      console.error('Error preparing download:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to prepare download');
    }
  }, [recordFeatureUsage, improvedResumeData, savedResumeId]);

  const handleTemplateSelect = useCallback(async (template: TemplateData) => {
    try {
      setTemplateError(null);
      setIsDownloadingResume(true);
      setDownloadError(null);
      
      let resumeIdToUse = savedResumeId;
      let formattedText;
      
      if (improvedResumeData) {
        resumeIdToUse = improvedResumeData.id;
        formattedText = improvedResumeData.finalResumeText;
        
        if (improvedResumeData.status === 'draft') {
          await finalizeImprovedResume(resumeIdToUse);
        }
      } else {
        if (!resumeIdToUse) {
          throw new Error('No resume ID available');
        }
        
        await finalizeImprovedResume(resumeIdToUse);
        
        const improvedResumes = await getImprovedResumes();
        const currentImprovedResume = improvedResumes.find(resume => resume.id === resumeIdToUse);
        
        if (currentImprovedResume?.finalResumeText) {
          formattedText = currentImprovedResume.finalResumeText;
        } else {
          formattedText = generatePreviewText();
        }
      }
      
      const result = await generateResumeWithTemplate(
        undefined,
        template.id,
        undefined,
        formattedText
      );
      
      if (result?.success && result.data) {
        let url: string | null = null;
        let link: HTMLAnchorElement | null = null;
        
        try {
          // Create object URL for the blob
          url = window.URL.createObjectURL(result.data);
          
          // Create and configure download link
          link = document.createElement('a');
          link.href = url;
          link.download = `${template.displayName.replace(/[^a-zA-Z0-9]/g, '_')}_resume.pdf`;
          
          // Trigger download
          document.body.appendChild(link);
          link.click();
          
          setShowTemplateSelector(false);
          toast.success('Resume downloaded successfully!');
        } catch (downloadError) {
          console.error('Error during download:', downloadError);
          toast.error('Failed to download resume');
        } finally {
          // Clean up resources
          if (link && document.body.contains(link)) {
            document.body.removeChild(link);
          }
          if (url) {
            window.URL.revokeObjectURL(url);
          }
        }
      }
    } catch (error) {
      console.error('Error generating resume:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate resume';
      setTemplateError(errorMessage);
      setDownloadError(error instanceof Error ? error : new Error(errorMessage));
      toast.error('Failed to generate resume');
    } finally {
      setIsDownloadingResume(false);
    }
  }, [savedResumeId, improvedResumeData]);

  const handleTemplateSelectorCancel = () => {
    setShowTemplateSelector(false);
  };

  const handleResumeApplied = (resumeId: string) => {
    setSavedResumeId(resumeId);
  };

  const handleEditedSuggestionsChange = (editedSuggestions: Record<string, string>) => {
    setEditedSuggestions(editedSuggestions);
  };

  const handleDeleteResume = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteResume = useCallback(async () => {
    if (!resumeId) return;
    
    setShowDeleteDialog(false);
    
    try {
      await executeDelete(async () => {
        return await deleteImprovedResume(resumeId);
      });
      
      toast.success('Resume deleted successfully');
      window.location.href = '/dashboard';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete resume');
    }
  }, [resumeId, executeDelete]);

  const generateStructuredResumeData = () => {
    if (!resumeData?.suggestions) {
      return {
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: []
      };
    }

    return convertSuggestionsToStructuredData(resumeData.suggestions, acceptedSuggestions);
  };

  const getEffectiveSuggestionText = (suggestion: Suggestion) => {
    const editedText = editedSuggestions[suggestion.id];
    if (editedText) return editedText;
    
    return typeof suggestion.suggested === 'string' 
      ? suggestion.suggested 
      : JSON.stringify(suggestion.suggested, null, 2);
  };

  const generatePreviewText = (): string => {
    if (improvedResumeData?.finalResumeText) {
      return improvedResumeData.finalResumeText;
    }
    
    if (!resumeData?.suggestions) return '';
    
    const updatedSuggestions = resumeData.suggestions.map(suggestion => ({
      ...suggestion,
      suggested: getEffectiveSuggestionText(suggestion)
    }));
    
    return generateFinalResumeText(updatedSuggestions, acceptedSuggestions);
  };

  useEffect(() => {
    const loadResumeData = async () => {
      setAnalysisLoading(true);
      resetAnalysisLoading();
      
      try {
        // First, try to get analysis data from sessionStorage
        const storedAnalysis = sessionStorage.getItem('resumeAnalysis');
        if (storedAnalysis) {
          const analysisData = JSON.parse(storedAnalysis);
          
          const transformedData: ResumeAnalysis = {
            atsScore: analysisData.scores?.original?.ruleBased?.total || analysisData.scores?.original?.ai || 0,
            readabilityScore: analysisData.scores?.original?.ruleBased?.breakdown?.clarity || analysisData.scores?.original?.ruleBased?.breakdown?.formatting || 0,
            keywordScore: analysisData.scores?.original?.ruleBased?.breakdown?.keywords,
            suggestions: analysisData.sectionDiffs?.flatMap((diff: any) => {
              const suggestions: any[] = [];
              
              if (diff.suggestions && Array.isArray(diff.suggestions)) {
                suggestions.push(...diff.suggestions.map((suggestion: any) => ({
                  id: suggestion.id || `${diff.section}-${Date.now()}-${Math.random()}`,
                  section: diff.section || 'General',
                  type: suggestion.type || 'improvement',
                  original: suggestion.original || '',
                  suggested: suggestion.suggested || '',
                  impact: suggestion.impact || 'Improves resume quality',
                  severity: suggestion.severity || 'medium'
                })));
              }
              
              return suggestions;
            }).flat() || []
          };
          
          setResumeData(transformedData);
          sessionStorage.removeItem('resumeAnalysis');
          return;
        }
        
        // Try to fetch improved resume data from API if resumeId is provided
        if (resumeId) {
          try {
            const improvedResume = await getImprovedResumeById(resumeId);
            setImprovedResumeData(improvedResume);
            
            const transformedData: ResumeAnalysis = {
              atsScore: improvedResume.improvementScore || 0,
              readabilityScore: 0,
              keywordScore: 0,
              suggestions: []
            };
            
            setResumeData(transformedData);
            setSavedResumeId(improvedResume.id);
            
            if (improvedResume.metadata?.acceptedSuggestionIds) {
              setAcceptedSuggestions(improvedResume.metadata.acceptedSuggestionIds);
            }
          } catch (err) {
            console.error('Failed to fetch improved resume:', err);
            
            // Fallback: try to fetch original resume analysis
            const data = await fetchResumeAnalysis(resumeId);
            setResumeData(data);
          }
        } else {
          throw new Error('No resume ID provided. Please select a resume from the dashboard.');
        }
      } catch (error) {
        console.error('Failed to load resume data:', error);
        setAnalysisError(error instanceof Error ? error.message : 'Failed to load resume data');
      } finally {
        setAnalysisLoading(false);
      }
    };
    
    loadResumeData();
  }, [resumeId, setAnalysisLoading, setAnalysisError, resetAnalysisLoading]);

  if (isLoadingAnalysis) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center bg-cvwise-light-gray">
          <LoadingSpinner size="lg" text="Loading analysis..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center bg-cvwise-light-gray">
          <ErrorState 
            error={analysisError}
            onRetry={() => window.location.reload()}
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (!resumeData) return null;

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <LoadingOverlay isLoading={isDownloadingResume || isDeletingResume} text="Processing...">
          <main className="flex-grow py-12 bg-cvwise-light-gray">
            <div className="max-w-7xl mx-auto px-4">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-cvwise-blue-dark mb-2">
                  {improvedResumeData ? 'Improved Resume Details' : 'Resume Review Results'}
                </h1>
                <p className="text-gray-600">
                  {improvedResumeData 
                    ? 'View your improved resume with applied changes'
                    : 'Here\'s the AI analysis of your resume with suggested improvements'
                  }
                </p>
              </div>

              <FeatureGate feature="resumeImprovement" showUsage={true}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-8">
                    <ScoreCard
                      atsScore={resumeData.atsScore}
                      readabilityScore={resumeData.readabilityScore}
                      keywordScore={resumeData.keywordScore}
                    />

                    {improvedResumeData ? (
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4 text-cvwise-blue-dark">
                          Applied Changes Summary
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm text-gray-500">Status</div>
                            <div className="font-medium capitalize">{improvedResumeData.status}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Title</div>
                            <div className="font-medium">{improvedResumeData.title || 'Improved Resume'}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Improvement Score</div>
                            <div className="font-medium">{improvedResumeData.improvementScore || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Last Updated</div>
                            <div className="font-medium">{new Date(improvedResumeData.updatedAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <Button 
                            variant="outline" 
                            className="w-full justify-center"
                            onClick={() => setShowPreview(true)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Resume Content
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <SuggestionsList
                        suggestions={resumeData.suggestions || []}
                        resumeId={resumeId!}
                        originalResumeText={generateOriginalResumeText()}
                        acceptedSuggestions={acceptedSuggestions}
                        onAcceptedSuggestionsChange={setAcceptedSuggestions}
                        onPreviewClick={() => setShowPreview(true)}
                        onResumeApplied={handleResumeApplied}
                        onEditedSuggestionsChange={handleEditedSuggestionsChange}
                        user={user}
                      />
                    )}

                    <div className="bg-white rounded-lg shadow-md p-6">
                      {downloadError && (
                        <Alert className="mb-4 border-red-200 bg-red-50">
                          <AlertDescription className="text-red-800">
                            {downloadError.message || 'An error occurred during download'}
                          </AlertDescription>
                        </Alert>
                      )}
                      {templateError && (
                        <Alert className="mb-4 border-red-200 bg-red-50">
                          <AlertDescription className="text-red-800">
                            {templateError}
                          </AlertDescription>
                        </Alert>
                      )}
                      {deleteError && (
                        <Alert className="mb-4 border-red-200 bg-red-50">
                          <AlertDescription className="text-red-800">
                            {typeof deleteError === 'string' ? deleteError : 'An error occurred'}
                            <Button 
                              variant="link" 
                              size="sm" 
                              onClick={retryDelete}
                              className="ml-2 p-0 h-auto"
                            >
                              Retry
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-cvwise-blue-dark">
                            Download Your Resume
                          </h3>
                          <p className="text-gray-600 mt-1">
                            Get your {improvedResumeData ? 'improved' : 'analyzed'} resume in PDF format
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleDownloadResume}
                            disabled={isDownloadingResume}
                            className="bg-cvwise-blue hover:bg-cvwise-blue-dark"
                          >
                            {isDownloadingResume ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="mr-2 h-4 w-4" />
                            )}
                            Download PDF
                          </Button>
                          {improvedResumeData && (
                            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  onClick={handleDeleteResume}
                                  disabled={isDeletingResume}
                                >
                                  {isDeletingResume ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    'Delete'
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this improved resume? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={confirmDeleteResume}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <UpgradePrompt />
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold mb-4 text-cvwise-blue-dark">
                        Next Steps
                      </h3>
                      <ul className="space-y-2 text-gray-600">
                        <li>• Download your improved resume</li>
                        <li>• Apply to jobs with confidence</li>
                        <li>• Track your application success</li>
                        <li>• Continue improving with AI feedback</li>
                      </ul>
                      <div className="mt-4">
                        <Link to="/dashboard">
                          <Button variant="outline" className="w-full">
                            Back to Dashboard
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </FeatureGate>
            </div>
          </main>
        </LoadingOverlay>
        <Footer />
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resume Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Textarea
              value={generatePreviewText()}
              readOnly
              className="min-h-[400px] font-mono text-sm"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Selector Dialog */}
      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Resume Template</DialogTitle>
          </DialogHeader>
          <TemplateSelector
            onTemplateSelect={handleTemplateSelect}
            onCancel={handleTemplateSelectorCancel}
            isLoading={isDownloadingResume}
          />
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}

export default ReviewPage;
