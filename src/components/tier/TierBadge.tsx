import { Badge } from '@/components/ui/badge';
import { Crown, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: 'FREE' | 'BASIC' | 'PRO';
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const tierConfig = {
  FREE: {
    label: 'Free',
    icon: Star,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  BASIC: {
    label: 'Basic',
    icon: Zap,
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  PRO: {
    label: 'Pro',
    icon: Crown,
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
};

export function TierBadge({ tier, className, showIcon = true, size = 'md' }: TierBadgeProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge
      className={cn(
        config.className,
        sizeClasses[size],
        'font-medium border',
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(iconSizes[size], 'mr-1')} />
      )}
      {config.label}
    </Badge>
  );
}