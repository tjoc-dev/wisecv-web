import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getUserImprovedResumes, StructuredResumeData } from '@/lib/api';
import {
  FileText,
  Calendar,
  User,
  Briefcase,
  GraduationCap,
  Check,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';

interface ResumeSelectorProps {
  selectedResumeId?: string;
  onResumeSelect: (resumeId: string) => void;
  className?: string;
  variant?: 'card' | 'dropdown';
}

interface ResumeCardProps {
  resume: StructuredResumeData;
  isSelected: boolean;
  onSelect: () => void;
}

function ResumeCard({ resume, isSelected, onSelect }: ResumeCardProps) {
  const getExperienceYears = () => {
    if (!resume.experiences || resume.experiences.length === 0) return 0;
    
    const totalMonths = resume.experiences.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                    (end.getMonth() - start.getMonth());
      return total + Math.max(0, months);
    }, 0);
    
    return Math.round(totalMonths / 12 * 10) / 10;
  };
  
  const getEducationLevel = () => {
    if (!resume.educations || resume.educations.length === 0) return null;
    
    const degrees = resume.educations.map(edu => edu.degree).filter(Boolean);
    if (degrees.length === 0) return null;
    
    // Simple logic to determine highest degree
    const degreeHierarchy = ['PhD', 'Doctorate', 'Master', 'Bachelor', 'Associate'];
    for (const level of degreeHierarchy) {
      if (degrees.some(degree => degree.toLowerCase().includes(level.toLowerCase()))) {
        return level;
      }
    }
    
    return degrees[0];
  };
  
  const experienceYears = getExperienceYears();
  const educationLevel = getEducationLevel();
  
  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary border-primary'
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-medium truncate">
                {resume.personalInfo?.fullName || 'Unnamed Resume'}
              </h3>
              {isSelected && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                Updated {formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {/* Professional Title */}
          {resume.personalInfo?.professionalTitle && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{resume.personalInfo.professionalTitle}</span>
            </div>
          )}
          
          {/* Experience */}
          {experienceYears > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-3 w-3 text-muted-foreground" />
              <span>{experienceYears} years experience</span>
            </div>
          )}
          
          {/* Education */}
          {educationLevel && (
            <div className="flex items-center gap-2 text-sm">
              <GraduationCap className="h-3 w-3 text-muted-foreground" />
              <span>{educationLevel} degree</span>
            </div>
          )}
          
          {/* Skills Preview */}
          {resume.skills && resume.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {resume.skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill.name}
                </Badge>
              ))}
              {resume.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{resume.skills.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ResumeSelector({
  selectedResumeId,
  onResumeSelect,
  className,
  variant = 'card',
}: ResumeSelectorProps) {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<StructuredResumeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchResumes = async () => {
    try {
       setIsLoading(true);
       setError(null);
       const resumeData = await getUserImprovedResumes();
       setResumes(resumeData);
     } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch resumes';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error fetching resumes:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    useEffect(() => {
      fetchResumes();
    }, []);
    
    const handleResumeSelect = (resumeId: string) => {
      onResumeSelect(resumeId);
    };
    
    const handleCreateNew = () => {
       navigate('/build');
     };
     
     const handleRefresh = () => {
    fetchResumes();
  };
  
  if (variant === 'dropdown') {
    return (
      <div className={className}>
        <Select value={selectedResumeId} onValueChange={handleResumeSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a resume" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <SelectItem value="loading" disabled>
                Loading resumes...
              </SelectItem>
            ) : resumes.length > 0 ? (
              resumes.map((resume) => (
                <SelectItem key={resume.id} value={resume.id!}>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{resume.personalInfo?.fullName || 'Unnamed Resume'}</span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="empty" disabled>
                No resumes found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        
        {resumes.length === 0 && !isLoading && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNew}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Resume
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Select Resume</h3>
          <p className="text-sm text-muted-foreground">
            Choose which resume to optimize for this job application
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateNew}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Resume
          </Button>
        </div>
      </div>
      
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <FileText className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : resumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              isSelected={selectedResumeId === resume.id}
              onSelect={() => handleResumeSelect(resume.id!)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No resumes found</h3>
            <p className="text-muted-foreground mb-4">
              You need to create a resume before you can apply for jobs.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Resume
            </Button>
          </CardContent>
        </Card>
      )}
      
      {selectedResumeId && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span className="font-medium">Resume selected:</span>
            <span>
              {resumes.find(r => r.id === selectedResumeId)?.personalInfo?.fullName || 'Selected Resume'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}