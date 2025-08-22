import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { saveImprovedResume, CreateImprovedResumeRequest } from '@/lib/api';
import { 
  convertSuggestionsToAcceptedData, 
  generateFinalResumeText,
  parseFormattedText
} from '@/utils/resumeDataConverter';
import { useTier } from '@/hooks/use-tier';
import { toast } from '@/components/ui/sonner';
import { User } from '@/hooks/use-auth';

interface Suggestion {
  id: string;
  section: string;
  type: string;
  original: unknown;
  suggested: unknown;
  reason: string;
  severity: 'high' | 'medium' | 'low';
}

interface SuggestionsListProps {
  suggestions: Suggestion[];
  resumeId: string;
  originalResumeText: string;
  acceptedSuggestions: string[];
  onAcceptedSuggestionsChange: (suggestions: string[]) => void;
  onPreviewClick?: () => void;
  onApplySuccess?: () => void;
  onResumeApplied?: (resumeId: string) => void;
  onEditedSuggestionsChange?: (editedSuggestions: Record<string, string>) => void;
  user?: User | null;
}

export default function SuggestionsList({
  suggestions,
  resumeId,
  originalResumeText,
  acceptedSuggestions,
  onAcceptedSuggestionsChange,
  onPreviewClick,
  onApplySuccess,
  onResumeApplied,
  onEditedSuggestionsChange,
  user,
}: SuggestionsListProps) {
  const { checkAccess } = useTier();
  const [rejectedSuggestions, setRejectedSuggestions] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [editedSuggestions, setEditedSuggestions] = useState<Record<string, string>>({});
  const [changesApplied, setChangesApplied] = useState(false);
  const [lastAppliedSuggestions, setLastAppliedSuggestions] = useState<string[]>([]);
  const [showApplyWarning, setShowApplyWarning] = useState(false);

  const handleAccept = (id: string) => {
    onAcceptedSuggestionsChange([...acceptedSuggestions, id]);
    setRejectedSuggestions(rejectedSuggestions.filter((item) => item !== id));
    // Reset applied state when suggestions change
    setChangesApplied(false);
  };

  const handleReject = (id: string) => {
    setRejectedSuggestions([...rejectedSuggestions, id]);
    onAcceptedSuggestionsChange(acceptedSuggestions.filter((item) => item !== id));
    // Reset applied state when suggestions change
    setChangesApplied(false);
  };

  const handleSuggestionEdit = (id: string, newText: string) => {
    const updatedEditedSuggestions = {
      ...editedSuggestions,
      [id]: newText
    };
    setEditedSuggestions(updatedEditedSuggestions);
    // Reset applied state when suggestions are edited
    setChangesApplied(false);
    // Notify parent component about the edited suggestions
    if (onEditedSuggestionsChange) {
      onEditedSuggestionsChange(updatedEditedSuggestions);
    }
  };

  const getEffectiveSuggestionText = (suggestion: Suggestion) => {
    const editedText = editedSuggestions[suggestion.id];
    if (editedText) return editedText;
    
    return typeof suggestion.suggested === 'string' 
      ? suggestion.suggested 
      : JSON.stringify(suggestion.suggested, null, 2);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Minor';
      default:
        return 'Info';
    }
  };

  // Check if current accepted suggestions are different from last applied
  const hasUnappliedChanges = () => {
    if (changesApplied && lastAppliedSuggestions.length === acceptedSuggestions.length) {
      return !acceptedSuggestions.every(id => lastAppliedSuggestions.includes(id));
    }
    return !changesApplied || acceptedSuggestions.length !== lastAppliedSuggestions.length;
  };

  const handleApplyAll = () => {
    // Prevent applying if no changes or changes already applied
    if (!hasUnappliedChanges()) {
      return;
    }
    // Show warning dialog before applying
    setShowApplyWarning(true);
  };

  const confirmApplyChanges = async () => {
    setShowApplyWarning(false);
    setApplying(true);
    setApplyError(null);
    
    try {
      // Check feature access before making the API call
      const accessResult = await checkAccess('resumeImprovement');
      if (!accessResult.allowed) {
        setApplyError(accessResult.reason || 'You have reached your resume improvement limit. Please upgrade your plan to continue.');
        toast.error(accessResult.reason || 'Resume improvement limit reached');
        setApplying(false);
        return;
      }
      
      // Create updated suggestions with edited text
      const updatedSuggestions = suggestions.map(suggestion => ({
        ...suggestion,
        suggested: getEffectiveSuggestionText(suggestion)
      }));

      // Generate the final resume text by applying accepted suggestions
      const finalResumeText = generateFinalResumeText(updatedSuggestions, acceptedSuggestions);

      // Generate structured resume data from accepted suggestions
      // Add safety check to prevent split error on undefined/empty text
      const structuredData = finalResumeText && typeof finalResumeText === 'string' && finalResumeText.trim().length > 0
        ? parseFormattedText(finalResumeText)
        : {
            summary: '',
            experience: [],
            education: [],
            skills: { languages: [], frameworks: [], databases: [], devops: [], methodologies: [], architecture: [], tools: [], other: [] },
            projects: [],
            certifications: []
          };
      
      // Build proper acceptedSuggestions object with structured data
        const acceptedSuggestionsData = convertSuggestionsToAcceptedData(updatedSuggestions, acceptedSuggestions);
      
      // Prepare the data for the improved resume endpoint
      const improvedResumeData: CreateImprovedResumeRequest = {
        acceptedSuggestions: acceptedSuggestionsData,
        finalResumeText,
        originalResumeId: resumeId,
        title: `${user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Improved Resume'} - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        metadata: {
          totalSuggestions: suggestions.length,
          acceptedCount: acceptedSuggestions.length,
          rejectedCount: rejectedSuggestions.length,
          appliedAt: new Date().toISOString(),
          structuredData: structuredData, // Store structured data for proper resume generation
          acceptedSuggestionIds: acceptedSuggestions, // Keep track of original IDs for reference
          suggestionsApplied: acceptedSuggestions.map(id => {
            const suggestion = suggestions.find(s => s.id === id);
            return {
              id,
              section: suggestion?.section,
              type: suggestion?.type,
              original: suggestion?.original,
              suggested: getEffectiveSuggestionText(suggestion!)
            };
          })
        },
        improvementScore: suggestions.length > 0 ? (acceptedSuggestions.length / suggestions.length) * 100 : 0
      };

      // Save the improved resume
      const savedImprovedResume = await saveImprovedResume(improvedResumeData);
      
      console.log('Improved resume saved successfully:', savedImprovedResume);
      
      // Mark changes as applied and store the applied suggestions
      setChangesApplied(true);
      setLastAppliedSuggestions([...acceptedSuggestions]);
      
      // Notify parent component with the saved resume ID
      if (onResumeApplied && savedImprovedResume.id) {
        onResumeApplied(savedImprovedResume.id);
      }
      
      if (onApplySuccess) onApplySuccess();
    } catch (err) {
      setApplyError(
        err instanceof Error ? err.message : 'Failed to save improved resume'
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-cvwise-blue-dark">
          Suggested Improvements
        </h3>
        <p className="text-gray-600 mt-2">
          Review and apply these AI-suggested improvements to strengthen your
          resume.
        </p>
      </div>

      <div className="p-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No suggestions found. Your resume is in good shape!
          </div>
        ) : (
          <div className="space-y-6">
            {suggestions.map((suggestion) => {
              const isAccepted = acceptedSuggestions.includes(suggestion.id);
              const isRejected = rejectedSuggestions.includes(suggestion.id);

              return (
                <div
                  key={suggestion.id}
                  className={`p-4 border rounded-md transition-colors ${
                    isAccepted
                      ? 'border-green-200 bg-green-50'
                      : isRejected
                        ? 'border-gray-200 bg-gray-50 opacity-60'
                        : 'border-blue-100 bg-blue-50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-3">
                    <div>
                      <div className="text-sm text-gray-500">
                        {suggestion.section}
                      </div>
                      <div className="text-sm font-medium text-gray-700 mt-1">
                        {suggestion.type}
                      </div>
                    </div>

                    <div
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getSeverityColor(suggestion.severity)} inline-block mt-2 md:mt-0`}
                    >
                      {getSeverityLabel(suggestion.severity)}
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Original Text
                      </div>
                      <div className="text-sm bg-white p-2 rounded border border-gray-200">
                        {typeof suggestion.original === 'string' 
                          ? suggestion.original 
                          : JSON.stringify(suggestion.original, null, 2)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Suggested Text
                      </div>
                      <Textarea
                        value={getEffectiveSuggestionText(suggestion)}
                        onChange={(e) => handleSuggestionEdit(suggestion.id, e.target.value)}
                        disabled={changesApplied}
                        className={`text-sm font-medium min-h-[80px] max-h-[300px] resize-y ${
                          changesApplied 
                            ? 'bg-gray-100 border border-gray-300 cursor-not-allowed' 
                            : 'bg-white border border-green-200'
                        }`}
                        placeholder={changesApplied ? "Changes have been applied and cannot be edited" : "Edit the suggested text..."}
                        rows={Math.max(3, Math.ceil(getEffectiveSuggestionText(suggestion).length / 80))}
                      />
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">Reason</div>
                      <div className="text-xs text-gray-700">
                        {suggestion.reason}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant={isRejected ? 'destructive' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={() => handleReject(suggestion.id)}
                      disabled={isAccepted || changesApplied}
                    >
                      <X className="mr-1 h-3 w-3" /> Reject
                    </Button>

                    <Button
                      variant={isAccepted ? 'default' : 'outline'}
                      size="sm"
                      className={`text-xs ${isAccepted ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      onClick={() => handleAccept(suggestion.id)}
                      disabled={isRejected || changesApplied}
                    >
                      <Check className="mr-1 h-3 w-3" /> Accept
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-gray-700 font-medium">
              {acceptedSuggestions.length} of {suggestions.length} changes
              accepted
            </span>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onPreviewClick}
              className="border-cvwise-blue text-cvwise-blue hover:bg-cvwise-blue hover:text-white"
            >
              <Eye className="mr-2 h-4 w-4" /> Preview Changes
            </Button>
            <AlertDialog open={showApplyWarning} onOpenChange={setShowApplyWarning}>
              <AlertDialogTrigger asChild>
                <Button
                  className="btn-primary"
                  onClick={handleApplyAll}
                  disabled={applying || acceptedSuggestions.length === 0 || !hasUnappliedChanges()}
                >
                  {applying ? 'Applying...' : 
                   changesApplied && !hasUnappliedChanges() ? 'Changes Applied' : 
                   'Apply All Changes'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apply Changes to Resume</AlertDialogTitle>
                  <AlertDialogDescription>
                    Please ensure all changes are correct before proceeding. Once applied, the resume cannot be edited and will be saved permanently. You can review your changes in the preview before applying.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmApplyChanges}>
                    Apply Changes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {applyError && (
          <div className="text-red-600 text-sm mt-2">{applyError}</div>
        )}
      </div>
    </div>
  );
}
