import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';
import { Loader2 } from 'lucide-react';

/**
 * Props for loading components
 */
interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

/**
 * Spinner loading indicator
 */
export function LoadingSpinner({ className, size = 'md', text }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

/**
 * Dots loading indicator
 */
export function LoadingDots({ className, size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-1 w-1',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
  };

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-current rounded-full animate-pulse',
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Pulse loading indicator
 */
export function LoadingPulse({ className, size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'bg-primary/20 rounded-full animate-ping',
          sizeClasses[size]
        )}
      />
    </div>
  );
}

/**
 * Card skeleton loader
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 space-y-4', className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  );
}

/**
 * Table skeleton loader
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className 
}: { 
  rows?: number; 
  columns?: number; 
  className?: string; 
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * List skeleton loader
 */
export function ListSkeleton({ 
  items = 5, 
  showAvatar = false, 
  className 
}: { 
  items?: number; 
  showAvatar?: boolean; 
  className?: string; 
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Form skeleton loader
 */
export function FormSkeleton({ 
  fields = 4, 
  className 
}: { 
  fields?: number; 
  className?: string; 
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/4" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
      ))}
      <Skeleton className="h-10 w-32" /> {/* Button */}
    </div>
  );
}

/**
 * Job card skeleton loader
 */
export function JobCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 border rounded-lg space-y-3', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" /> {/* Job title */}
          <Skeleton className="h-4 w-1/2" /> {/* Company */}
        </div>
        <Skeleton className="h-8 w-16" /> {/* Status badge */}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" /> {/* Tag */}
        <Skeleton className="h-6 w-20" /> {/* Tag */}
        <Skeleton className="h-6 w-14" /> {/* Tag */}
      </div>
    </div>
  );
}

/**
 * Profile skeleton loader
 */
export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      
      {/* Sections */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" /> {/* Section title */}
        <FormSkeleton fields={3} />
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" /> {/* Section title */}
        <FormSkeleton fields={2} />
      </div>
    </div>
  );
}

/**
 * Page skeleton loader
 */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-8 p-6', className)}>
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" /> {/* Page title */}
        <Skeleton className="h-4 w-96" /> {/* Page description */}
      </div>
      
      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CardSkeleton />
        </div>
        <div>
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading overlay component
 */
export function LoadingOverlay({ 
  isLoading, 
  children, 
  text = 'Loading...', 
  className 
}: {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  );
}