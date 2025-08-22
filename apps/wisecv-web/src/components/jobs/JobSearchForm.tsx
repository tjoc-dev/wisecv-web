import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { JobSearchParams } from '@/lib/jobs';
import { useProfile } from '@/hooks/use-profile';

interface JobSearchFormProps {
  onSubmit: (data: JobSearchParams) => void;
  isLoading?: boolean;
  initialValues?: Partial<JobSearchParams>;
}

export function JobSearchForm({ onSubmit, isLoading, initialValues }: JobSearchFormProps) {
  const { profile } = useProfile();
  const { register, handleSubmit, watch } = useForm<JobSearchParams>({
    defaultValues: {
      title: profile?.jobTitle || '',
      location: profile?.location || '',
      ...initialValues,
    },
  });

  const currentTitle = watch('title');
  const currentLocation = watch('location');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Job Title or Keywords</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="title"
              placeholder="e.g. Software Engineer, React, Node.js"
              className="pl-10"
              {...register('title')}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="location"
              placeholder="City, state, or remote"
              className="pl-10"
              {...register('location')}
            />
          </div>
        </div>
        
        <div className="flex items-end">
          <Button 
            type="submit" 
            className="w-full md:w-auto"
            disabled={isLoading || (!currentTitle && !currentLocation)}
          >
            {isLoading ? 'Searching...' : 'Search Jobs'}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <span className="font-medium">Suggestions:</span>
        <button 
          type="button" 
          className="hover:text-primary"
          onClick={() => {
            onSubmit({ title: `${profile?.jobTitle || ''}`, location: 'Remote' });
          }}
        >
          Remote {profile?.jobTitle || 'jobs'}
        </button>
        <span>•</span>
        <button 
          type="button" 
          className="hover:text-primary"
          onClick={() => {
            onSubmit({ title: profile?.jobTitle || '', location: profile?.location || '' });
          }}
        >
          {profile?.jobTitle || 'Jobs'} in {profile?.location || 'your area'}
        </button>
      </div>
    </form>
  );
}
