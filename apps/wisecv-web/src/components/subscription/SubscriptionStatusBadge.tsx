import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionStatusBadgeProps {
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  active: {
    label: 'Active',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle
  },
  past_due: {
    label: 'Past Due',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle
  },
  unpaid: {
    label: 'Unpaid',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle
  },
  trialing: {
    label: 'Trial',
    variant: 'outline' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock
  },
  incomplete: {
    label: 'Incomplete',
    variant: 'outline' as const,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: AlertTriangle
  }
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5'
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
};

export default function SubscriptionStatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true, 
  className 
}: SubscriptionStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        config.className,
        sizeClasses[size],
        'inline-flex items-center gap-1.5 font-medium',
        className
      )}
    >
      {showIcon && (
        <Icon className={iconSizes[size]} />
      )}
      {config.label}
    </Badge>
  );
}

// Export status types for use in other components
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete';

// Utility function to get status color class
export const getStatusColorClass = (status: SubscriptionStatus): string => {
  return statusConfig[status].className;
};

// Utility function to check if status is active
export const isActiveStatus = (status: SubscriptionStatus): boolean => {
  return status === 'active' || status === 'trialing';
};

// Utility function to check if status requires attention
export const requiresAttention = (status: SubscriptionStatus): boolean => {
  return status === 'past_due' || status === 'unpaid' || status === 'incomplete';
};