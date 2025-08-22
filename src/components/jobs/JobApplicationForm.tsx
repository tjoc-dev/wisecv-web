import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ResumeSelector } from './ResumeSelector';
import {
  JobApplicationData,
  CreateJobApplicationRequest,
  UpdateJobApplicationRequest,
} from '@/lib/api';
import {
  Building2,
  MapPin,
  DollarSign,
  FileText,
  Link as LinkIcon,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { JobApplicationStatus } from '@/types/common';

const jobApplicationSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(200, 'Job title is too long'),
  company: z.string().min(1, 'Company name is required').max(100, 'Company name is too long'),
  location: z.string().optional(),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters').max(5000, 'Job description is too long'),
  jobUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  resumeId: z.string().min(1, 'Please select a resume'),
  salaryMin: z.number().min(0, 'Salary must be positive').optional(),
  salaryMax: z.number().min(0, 'Salary must be positive').optional(),
  salaryCurrency: z.string().optional(),
  salaryType: z.enum(['hourly', 'monthly', 'yearly']).optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
}).refine((data) => {
  if (data.salaryMin && data.salaryMax) {
    return data.salaryMin <= data.salaryMax;
  }
  return true;
}, {
  message: 'Minimum salary cannot be greater than maximum salary',
  path: ['salaryMax'],
});

type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;

interface JobApplicationFormProps {
  jobApplication?: JobApplicationData;
  onSubmit: (data: CreateJobApplicationRequest | UpdateJobApplicationRequest) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'NGN', label: 'NGN (₦)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

const salaryTypes = [
  { value: 'hourly', label: 'Per Hour' },
  { value: 'monthly', label: 'Per Month' },
  { value: 'yearly', label: 'Per Year' },
];

export function JobApplicationForm({
  jobApplication,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
}: JobApplicationFormProps) {
  const isEditing = !!jobApplication;

  const form = useForm<JobApplicationFormData>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      jobTitle: jobApplication?.jobTitle || '',
      company: jobApplication?.companyName || '',
      location: jobApplication?.metadata?.location || '',
      jobDescription: jobApplication?.jobDescription || '',
      jobUrl: jobApplication?.jobUrl || '',
      resumeId: jobApplication?.selectedResumeId || '',
      salaryMin: jobApplication?.metadata?.salaryMin || undefined,
      salaryMax: jobApplication?.metadata?.salaryMax || undefined,
      salaryCurrency: jobApplication?.metadata?.salaryCurrency || 'USD',
      salaryType: jobApplication?.metadata?.salaryType || 'yearly',
      notes: jobApplication?.metadata?.notes || '',
    },
  });

  const [selectedResumeId, setSelectedResumeId] = useState(jobApplication?.selectedResumeId || '');

  // Update form when resume is selected
  useEffect(() => {
    if (selectedResumeId) {
      form.setValue('resumeId', selectedResumeId);
    }
  }, [selectedResumeId, form]);

  const handleSubmit = async (data: JobApplicationFormData) => {
    try {
      const submitData = {
        jobDescription: data.jobDescription,
        selectedResumeId: data.resumeId,
        applicationTitle: data.jobTitle, // Map jobTitle to applicationTitle
        companyName: data.company, // Map company to companyName
        jobTitle: data.jobTitle,
        jobUrl: data.jobUrl || undefined,
        metadata: {
          location: data.location || undefined,
          salaryMin: data.salaryMin || undefined,
          salaryMax: data.salaryMax || undefined,
          salaryCurrency: data.salaryCurrency || undefined,
          salaryType: data.salaryType || undefined,
          notes: data.notes || undefined,
        },
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting job application:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={cn('max-w-4xl mx-auto', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {isEditing ? 'Edit Job Application' : 'Create New Job Application'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isEditing
                  ? 'Update your job application details'
                  : 'Fill in the details for your new job application'}
              </p>
            </div>
            {isEditing && jobApplication && (
              <Badge
                variant="secondary"
                className={cn(
                  jobApplication.status === JobApplicationStatus.DRAFT && 'bg-gray-100 text-gray-700',
                  jobApplication.status === JobApplicationStatus.GENERATED && 'bg-blue-100 text-blue-700',
                  jobApplication.status === JobApplicationStatus.DOWNLOADED && 'bg-green-100 text-green-700',
                  jobApplication.status === JobApplicationStatus.APPLIED && 'bg-purple-100 text-purple-700'
                )}
              >
                {jobApplication.status}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Senior Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Google" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. San Francisco, CA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jobUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Link to the job posting
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Job Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Job Description</h3>
                </div>

                <FormField
                  control={form.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste the full job description here..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include the complete job description to help generate optimized content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Salary Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Salary Information</h3>
                  <span className="text-sm text-muted-foreground">(Optional)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="salaryMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Salary</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="50000"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salaryMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Salary</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="80000"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salaryCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salaryType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {salaryTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Resume Selection */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="resumeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ResumeSelector
                          selectedResumeId={selectedResumeId}
                          onResumeSelect={setSelectedResumeId}
                        />
                      </FormControl>
                      <FormDescription>
                        Choose the resume to optimize for this job application
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Notes */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes or reminders..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Personal notes about this application (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-4 pt-6">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting
                    ? (isEditing ? 'Updating...' : 'Creating...')
                    : (isEditing ? 'Update Application' : 'Create Application')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}