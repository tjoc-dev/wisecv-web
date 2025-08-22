import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Enhanced architecture imports
import { useService } from '@/hooks/use-service';
import { useLoading } from '@/hooks/use-loading';
import { SERVICE_NAMES } from '@/lib/services/service-registry';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading';
import { ErrorState } from '@/components/error/ErrorStates';
import { FileType, UploadStatus } from '@/types/common';
import { useProfile } from '@/hooks/use-profile';

/**
 * File validation configuration
 */
const FILE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  allowedExtensions: ['.pdf', '.docx']
};

/**
 * Upload progress state
 */
interface UploadProgress {
  status: UploadStatus;
  progress: number;
  message: string;
}

/**
 * Enhanced Resume Uploader with new architecture patterns
 */
export default function EnhancedResumeUploader() {
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: UploadStatus.IDLE,
    progress: 0,
    message: ''
  });

  // Enhanced hooks
  const { profile } = useProfile();
  const { execute: executeWithLoading, isLoading: isProcessing } = useLoading();
  
  // Service hooks
  const {
    execute: uploadFile,
    loading: isUploading,
    error: uploadError,
    retry: retryUpload
  } = useService(SERVICE_NAMES.UPLOAD, 'uploadResume');

  const {
    execute: improveResume,
    loading: isAnalyzing,
    error: analysisError,
    retry: retryAnalysis
  } = useService(SERVICE_NAMES.RESUME, 'improveResume');

  /**
   * Validate uploaded file
   */
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (file.size > FILE_CONFIG.maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${FILE_CONFIG.maxSize / (1024 * 1024)}MB`
      };
    }

    if (!FILE_CONFIG.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only PDF and DOCX files are supported'
      };
    }

    return { valid: true };
  }, []);

  /**
   * Check profile completeness
   */
  const checkProfileCompleteness = useCallback(() => {
    if (!profile) return { complete: true };
    
    const missingFields: string[] = [];
    if (!profile.phoneNumber) missingFields.push('phone number');
    if (!profile.location && !profile.city && !profile.state && !profile.country) {
      missingFields.push('address/location');
    }
    
    return {
      complete: missingFields.length === 0,
      missingFields
    };
  }, [profile]);

  /**
   * Handle file selection
   */
  const handleFileSelection = useCallback((selectedFile: File) => {
    const validation = validateFile(selectedFile);
    
    if (!validation.valid) {
      toast.error('Invalid file', {
        description: validation.error
      });
      return;
    }

    setFile(selectedFile);
    setUploadProgress({
      status: UploadStatus.IDLE,
      progress: 0,
      message: 'File ready for upload'
    });
  }, [validateFile]);

  /**
   * Drag and drop handlers
   */
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, [handleFileSelection]);

  /**
   * File input handler
   */
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  }, [handleFileSelection]);

  /**
   * Progress callback for upload
   */
  const handleUploadProgress = useCallback((progress: number) => {
    setUploadProgress(prev => ({
      ...prev,
      status: UploadStatus.UPLOADING,
      progress,
      message: `Uploading... ${Math.round(progress)}%`
    }));
  }, []);

  /**
   * Process resume upload and analysis
   */
  const processResume = useCallback(async () => {
    if (!file) return;

    try {
      // Step 1: Upload resume
      setUploadProgress({
        status: UploadStatus.UPLOADING,
        progress: 0,
        message: 'Starting upload...'
      });

      const uploadResult = await uploadFile(file, handleUploadProgress);
      
      if (!uploadResult.success) {
        throw uploadResult.error;
      }

      setUploadProgress({
        status: UploadStatus.PROCESSING,
        progress: 50,
        message: 'Processing resume...'
      });

      // Step 2: Improve resume with AI analysis
      const analysisResult = await improveResume(
        uploadResult.data.structured,
        jobDescription || undefined
      );

      if (!analysisResult.success) {
        throw analysisResult.error;
      }

      setUploadProgress({
        status: UploadStatus.COMPLETED,
        progress: 100,
        message: 'Analysis complete!'
      });

      // Store analysis data for review page
      sessionStorage.setItem('resumeAnalysis', JSON.stringify(analysisResult.data));
      
      toast.success('Analysis complete', {
        description: 'Your resume has been analyzed successfully'
      });

      // Navigate to review page
      setTimeout(() => {
        window.location.href = '/review';
      }, 1000);

    } catch (error) {
      setUploadProgress({
        status: UploadStatus.FAILED,
        progress: 0,
        message: 'Upload failed'
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to process resume';
      toast.error('Processing failed', {
        description: errorMessage
      });
    }
  }, [file, jobDescription, uploadFile, improveResume, handleUploadProgress]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('No file selected', {
        description: 'Please upload your resume'
      });
      return;
    }

    // Check profile completeness
    const profileCheck = checkProfileCompleteness();
    if (!profileCheck.complete) {
      setShowProfileWarning(true);
      return;
    }

    await executeWithLoading(processResume, {
      onError: (error) => {
        console.error('Resume processing failed:', error);
      }
    });
  }, [file, checkProfileCompleteness, executeWithLoading, processResume]);

  /**
   * Proceed with upload despite profile warnings
   */
  const proceedWithUpload = useCallback(async () => {
    setShowProfileWarning(false);
    await executeWithLoading(processResume);
  }, [executeWithLoading, processResume]);

  /**
   * Retry failed operations
   */
  const handleRetry = useCallback(() => {
    if (uploadError) {
      retryUpload();
    } else if (analysisError) {
      retryAnalysis();
    }
  }, [uploadError, analysisError, retryUpload, retryAnalysis]);

  // Get profile check results
  const profileCheck = checkProfileCompleteness();
  const missingFieldsText = profileCheck.missingFields?.join(' and ') || '';
  
  // Determine if any operation is in progress
  const isOperationInProgress = isUploading || isAnalyzing || isProcessing;
  const hasError = uploadError || analysisError;

  return (
    <ErrorBoundary level="component">
      <div className="space-y-6">
        {/* Upload Progress Card */}
        {uploadProgress.status !== UploadStatus.IDLE && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {uploadProgress.status === UploadStatus.COMPLETED ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : uploadProgress.status === UploadStatus.FAILED ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <LoadingSpinner size="sm" />
                )}
                Upload Progress
              </CardTitle>
              <CardDescription>{uploadProgress.message}</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={uploadProgress.progress} className="w-full" />
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {hasError && (
          <ErrorState
            error={uploadError || analysisError}
            onRetry={handleRetry}
          />
        )}

        {/* Main Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-cvwise-teal bg-blue-50'
                : file
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-cvwise-blue'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {file ? (
              <div className="flex flex-col items-center">
                <div className="bg-green-100 p-3 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {file.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFile(null)}
                  className="text-sm"
                  disabled={isOperationInProgress}
                >
                  Replace file
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="bg-blue-50 p-3 rounded-full mb-4">
                  <Upload className="h-8 w-8 text-cvwise-blue" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Upload your resume
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Drag and drop your file here or click to browse
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Supported formats: PDF, DOCX (Max 5MB)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-input')?.click()}
                  disabled={isOperationInProgress}
                >
                  Browse files
                </Button>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center pt-4">
            <Button
              type="submit"
              className="btn-primary w-full md:w-auto md:px-16"
              disabled={!file || isOperationInProgress}
            >
              {isOperationInProgress ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  {isUploading ? 'Uploading...' : isAnalyzing ? 'Analyzing...' : 'Processing...'}
                </div>
              ) : (
                'Analyze my resume'
              )}
            </Button>
          </div>
        </form>

        {/* Profile Warning Dialog */}
        <AlertDialog open={showProfileWarning} onOpenChange={setShowProfileWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Incomplete Profile Information</AlertDialogTitle>
              <AlertDialogDescription>
                Your profile is missing some important information ({missingFieldsText}). 
                Your CV might not be complete without this information. 
                Would you like to update your profile first or continue anyway?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => window.location.href = '/profile'}
                className="mr-2"
              >
                Update Profile
              </AlertDialogAction>
              <AlertDialogAction onClick={proceedWithUpload}>
                Continue Anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Loading Overlay */}
        <LoadingOverlay 
          isLoading={isOperationInProgress}
          text="Processing your resume..."
        >
          <div />
        </LoadingOverlay>
      </div>
    </ErrorBoundary>
  );
}