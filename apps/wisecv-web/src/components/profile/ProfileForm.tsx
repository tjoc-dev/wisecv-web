import { useState, KeyboardEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Globe, X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']),
  jobTitle: z.string().min(2, { message: 'Please enter your job title.' }),
  experience: z.string().min(1, { message: 'Please select your experience level.' }),
  country: z.string().min(1, { message: 'Please select a country.' }),
  state: z.string().optional(),
  city: z.string().optional(),
  bio: z
    .string()
    .max(500, { message: 'Bio must not exceed 500 characters.' })
    .optional(),
  skills: z.array(z.string()).default([]).optional(),
});

type ProfileFormValues = z.infer<typeof formSchema>;

// Mock data - in a real app, this would come from an API
const countries = [
  { id: 'us', name: 'United States' },
  { id: 'ca', name: 'Canada' },
  { id: 'uk', name: 'United Kingdom' },
  { id: 'au', name: 'Australia' },
  { id: 'fr', name: 'France' },
  { id: 'de', name: 'Germany' },
  { id: 'in', name: 'India' },
  { id: 'jp', name: 'Japan' },
];

export default function ProfileForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default values - would come from user profile in a real app
  const defaultValues: Partial<ProfileFormValues> = {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    gender: 'prefer-not-to-say',
    jobTitle: 'Software Engineer',
    experience: 'mid-level',
    country: 'us',
    state: 'California',
    city: 'San Francisco',
    bio: 'Professional with 5+ years of experience in software development.',
    skills: ['JavaScript', 'TypeScript', 'React'],
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Profile updated:', data);
      setIsSubmitting(false);
      toast.success('Profile updated successfully');
    }, 1000);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full max-w-2xl"
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <div className="flex">
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md border-input bg-muted">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                      className="rounded-l-none"
                      placeholder="Enter your full name"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="flex">
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md border-input bg-muted">
                      <Mail className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                      className="rounded-l-none"
                      placeholder="Enter your email"
                      type="email"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <div className="flex">
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md border-input bg-muted">
                      <Phone className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                      className="rounded-l-none"
                      placeholder="Enter your phone number"
                      {...field}
                      value={field.value || ''}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-6"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="male" />
                      </FormControl>
                      <FormLabel className="font-normal">Male</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="female" />
                      </FormControl>
                      <FormLabel className="font-normal">Female</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="non-binary" />
                      </FormControl>
                      <FormLabel className="font-normal">Non-binary</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="prefer-not-to-say" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Prefer not to say
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Senior Software Engineer"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="mid-level">Mid-Level (2-5 years)</SelectItem>
                      <SelectItem value="senior">Senior (5-10 years)</SelectItem>
                      <SelectItem value="lead">Lead/Manager (10+ years)</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Location</h3>
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex">
                      <div className="flex items-center px-3 border border-r-0 rounded-l-md border-input bg-muted">
                        <Globe className="h-4 w-4 text-gray-500" />
                      </div>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full rounded-l-none">
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <div className="flex items-center px-3 border border-r-0 rounded-l-md border-input bg-muted">
                        <MapPin className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input
                        className="rounded-l-none"
                        placeholder="Enter your state"
                        {...field}
                        value={field.value || ''}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <div className="flex items-center px-3 border border-r-0 rounded-l-md border-input bg-muted">
                        <MapPin className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input
                        className="rounded-l-none"
                        placeholder="Enter your city"
                        {...field}
                        value={field.value || ''}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us a bit about yourself"
                    className="resize-none"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Skills</h3>
            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {field.value?.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1 px-3 py-1 text-sm"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => {
                                const newSkills = [...(field.value || [])];
                                newSkills.splice(index, 1);
                                field.onChange(newSkills);
                              }}
                              className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Add a skill and press Enter"
                          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = e.currentTarget.value.trim();
                              if (value && !field.value?.includes(value)) {
                                field.onChange([...(field.value || []), value]);
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.querySelector('input[placeholder="Add a skill and press Enter"]') as HTMLInputElement;
                            const value = input?.value.trim();
                            if (value && !field.value?.includes(value)) {
                              field.onChange([...(field.value || []), value]);
                              if (input) input.value = '';
                            }
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Profile'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
