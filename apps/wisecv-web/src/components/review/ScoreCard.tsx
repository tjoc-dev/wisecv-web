import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

interface ScoreCardProps {
  atsScore: number;
  readabilityScore: number;
  keywordScore?: number;
}

export default function ScoreCard({
  atsScore,
  readabilityScore,
  keywordScore,
}: ScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4 text-cvwise-blue-dark">
        Resume Score
      </h3>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">
                ATS Compatibility
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1">
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[200px] text-sm">
                      How well your resume will perform with Applicant Tracking
                      Systems used by employers
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(atsScore)}`}>
              {atsScore}%
            </span>
          </div>
          <Progress
            value={atsScore}
            className="h-2"
            indicatorClassName={getProgressColor(atsScore)}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">
                Readability
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1">
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[200px] text-sm">
                      How clear and easy to read your resume is for human
                      readers
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span
              className={`text-lg font-bold ${getScoreColor(readabilityScore)}`}
            >
              {readabilityScore}%
            </span>
          </div>
          <Progress
            value={readabilityScore}
            className="h-2"
            indicatorClassName={getProgressColor(readabilityScore)}
          />
        </div>

        {keywordScore !== undefined && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">
                  Keyword Match
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="ml-1">
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-sm">
                        How well your resume matches the job description
                        keywords
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span
                className={`text-lg font-bold ${getScoreColor(keywordScore)}`}
              >
                {keywordScore}%
              </span>
            </div>
            <Progress
              value={keywordScore}
              className="h-2"
              indicatorClassName={getProgressColor(keywordScore)}
            />
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Overall Rating
        </h4>
        <div className="flex items-center">
          <div className="text-3xl font-bold text-cvwise-blue-dark">
            {Math.round(
              (atsScore + readabilityScore + (keywordScore || 0)) /
                (keywordScore ? 3 : 2)
            )}
            %
          </div>
          <div className="ml-4 text-sm text-gray-600">
            {keywordScore
              ? 'Your resume has some issues that need addressing.'
              : 'Upload a job description for more targeted feedback.'}
          </div>
        </div>
      </div>
    </div>
  );
}
