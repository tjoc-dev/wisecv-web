import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Layout, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageStats {
  cvs: {
    used: number;
    limit: number | 'unlimited';
  };
  downloads: {
    used: number;
    limit: number | 'unlimited';
    resetDate?: string;
  };
  templates: {
    used: number;
    limit: number | 'unlimited';
  };
  storage?: {
    used: number; // in MB
    limit: number | 'unlimited'; // in MB
  };
}

interface UsageStatsCardProps {
  usage: UsageStats;
  tier: 'free' | 'basic' | 'pro';
  className?: string;
}

const tierColors = {
  free: 'text-gray-600',
  basic: 'text-blue-600',
  pro: 'text-purple-600'
};

export default function UsageStatsCard({ usage, tier, className }: UsageStatsCardProps) {
  const formatLimit = (limit: number | 'unlimited') => {
    return limit === 'unlimited' ? '∞' : limit.toLocaleString();
  };

  const calculatePercentage = (used: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited') return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageStatus = (used: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited') return 'unlimited';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    return 'normal';
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'unlimited': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  const formatStorage = (sizeInMB: number) => {
    if (sizeInMB < 1024) {
      return `${sizeInMB.toFixed(1)} MB`;
    }
    return `${(sizeInMB / 1024).toFixed(1)} GB`;
  };

  const formatResetDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const usageItems = [
    {
      icon: FileText,
      label: 'CVs Created',
      used: usage.cvs.used,
      limit: usage.cvs.limit,
      status: getUsageStatus(usage.cvs.used, usage.cvs.limit),
      description: 'Total CVs in your account'
    },
    {
      icon: Download,
      label: 'Downloads',
      used: usage.downloads.used,
      limit: usage.downloads.limit,
      status: getUsageStatus(usage.downloads.used, usage.downloads.limit),
      description: usage.downloads.resetDate 
        ? `Resets on ${formatResetDate(usage.downloads.resetDate)}`
        : 'Monthly download limit'
    },
    {
      icon: Layout,
      label: 'Templates Access',
      used: usage.templates.used,
      limit: usage.templates.limit,
      status: getUsageStatus(usage.templates.used, usage.templates.limit),
      description: 'Available template designs'
    }
  ];

  // Add storage if provided
  if (usage.storage) {
    usageItems.push({
      icon: TrendingUp,
      label: 'Storage Used',
      used: usage.storage.used,
      limit: usage.storage.limit,
      status: getUsageStatus(usage.storage.used, usage.storage.limit),
      description: 'File storage space'
    });
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
            <CardDescription>
              Track your subscription usage and limits
            </CardDescription>
          </div>
          <Badge variant="outline" className={cn('capitalize', tierColors[tier])}>
            {tier} Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {usageItems.map((item, index) => {
          const percentage = calculatePercentage(item.used, item.limit);
          const isStorage = item.label === 'Storage Used';
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.status === 'critical' && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  {item.status === 'warning' && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {isStorage ? formatStorage(item.used) : item.used.toLocaleString()} / {isStorage && item.limit !== 'unlimited' ? formatStorage(item.limit as number) : formatLimit(item.limit)}
                  </div>
                  {item.limit !== 'unlimited' && (
                    <div className={cn(
                      'text-xs',
                      item.status === 'critical' ? 'text-red-600' :
                      item.status === 'warning' ? 'text-yellow-600' :
                      'text-gray-500'
                    )}>
                      {percentage.toFixed(0)}% used
                    </div>
                  )}
                </div>
              </div>
              
              {item.limit !== 'unlimited' && (
                <div className="space-y-1">
                  <Progress 
                    value={percentage} 
                    className="h-2"
                  />
                  <div className={cn(
                    'flex items-center justify-between text-xs',
                    item.status === 'critical' ? 'text-red-600' :
                    item.status === 'warning' ? 'text-yellow-600' :
                    'text-gray-500'
                  )}>
                    <span>{item.description}</span>
                    {item.status === 'critical' && (
                      <span className="font-medium">Limit reached!</span>
                    )}
                    {item.status === 'warning' && (
                      <span className="font-medium">Near limit</span>
                    )}
                  </div>
                </div>
              )}
              
              {item.limit === 'unlimited' && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-green-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-full"></div>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Unlimited</span>
                </div>
              )}
              
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
          );
        })}

        {/* Usage Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">
                {usage.cvs.used}
              </div>
              <div className="text-xs text-gray-500">Total CVs</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">
                {usage.downloads.used}
              </div>
              <div className="text-xs text-gray-500">Downloads</div>
            </div>
          </div>
        </div>

        {/* Upgrade Suggestion */}
        {(tier === 'free' || tier === 'basic') && (
          usageItems.some(item => item.status === 'warning' || item.status === 'critical')
        ) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800">
                  Approaching Usage Limits
                </p>
                <p className="text-xs text-yellow-700">
                  Consider upgrading your plan to get more resources and avoid interruptions.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}