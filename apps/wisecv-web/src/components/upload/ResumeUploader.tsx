import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { Upload, FileText } from 'lucide-react';
import { uploadResume, improveResume } from '@/lib/api';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useProfile } from '@/hooks/use-profile';
import { useLoading } from '@/hooks/use-loading';

export default function ResumeUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const { profile } = useProfile();
  const { execute: executeUpload, isLoading: isUploading } = useLoading();

  const checkProfileCompleteness = () => {
    if (!profile) return true; // If no profile, proceed (user might not have set up profile yet)
    
    const missingFields = [];
    if (!profile.phoneNumber) missingFields.push('phone number');
    if (!profile.location && !profile.city && !profile.state && !profile.country) missingFields.push('address/location');
    
    return missingFields.length === 0 ? true : missingFields;
  };

  const proceedWithUpload = async () => {
    setShowProfileWarning(false);
    
    const result = await executeUpload(
      async () => {
        // Step 1: Upload resume
        const uploadResult = await uploadResume({ file, jobDescription });
        
        // Step 2: Improve resume with AI analysis
        const analysisResult = await improveResume(
          uploadResult.structured,
          jobDescription || undefined
        );
        
        return analysisResult;
      },
      {
        onSuccess: () => {
          toast.success('Analysis complete', {
            description: 'Your resume has been analyzed successfully'
          });
        },
        onError: (error: any) => {
          let message = 'Failed to analyze resume';
          if (error instanceof Error) message = error.message;
          toast.error('Error', {
            description: message
          });
        }
      }
    );
    
    if (result) {
      // Store analysis data in sessionStorage for the review page
      sessionStorage.setItem('resumeAnalysis', JSON.stringify(result));
      
      // Redirect to review page
      window.location.href = '/review';
    }
  };

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const selectedFile = e.dataTransfer.files[0];

        if (
          selectedFile.type === 'application/pdf' ||
          selectedFile.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          setFile(selectedFile);
        } else {
          toast.error('Invalid file type', {
            description: 'Please upload a PDF or DOCX file'
          });
        }
      }
    },
    []
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      if (
        selectedFile.type === 'application/pdf' ||
        selectedFile.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        setFile(selectedFile);
      } else {
        toast.error('Invalid file type.', {
          description: ' Please upload a PDF or DOCX file',
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('No file selected', {
        description: 'Please upload your resume'
      });
      return;
    }
    
    // Check profile completeness
    const profileCheck = checkProfileCompleteness();
    if (profileCheck !== true) {
      setShowProfileWarning(true);
      return;
    }
    
    await proceedWithUpload();
  };

  const missingFields = checkProfileCompleteness();
  const missingFieldsText = Array.isArray(missingFields) ? missingFields.join(' and ') : '';

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${isDragging
            ? 'border-cvwise-teal bg-blue-50'
            : file
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-cvwise-blue'
          } transition-colors`}
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

      {/* <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Job Description (Optional)
        </h3>
        <p className="text-sm text-gray-500">
          Paste a job description to get tailored resume suggestions
        </p>
        <Textarea
          placeholder="Paste job description here..."
          className="min-h-[150px]"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </div> */}

      <div className="text-center pt-4">
        <Button
          type="submit"
          className="btn-primary w-full md:w-auto md:px-16"
          disabled={!file || isUploading}
        >
          {isUploading ? 'Analyzing your resume...' : 'Analyze my resume'}
        </Button>
      </div>
    </form>

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
  </>
  );
}
