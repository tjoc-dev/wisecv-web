import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLoading } from '@/hooks/use-loading';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  FileText,
  Briefcase,
  School,
  Award,
  Star,
  FilePlus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Sparkles,
  Copy,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from '@/components/ui/sonner';
import { useForm } from 'react-hook-form';
import { useProfile } from '@/hooks/use-profile';
import {
  createStructuredResume,
  updateStructuredResume,
  getUserStructuredResumes,
  validateStructuredResume,
  improveResume,
  type StructuredResumeData,
  type ExperienceData,
  type EducationData,
  type SkillData,
  type ProjectData,
  type CertificationData,
} from '@/lib/api';

// Section types
type Section =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications';

// Resume data types
interface ResumeData {
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
}

interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface EducationItem {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  link: string;
  technologies: string;
}

interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expirationDate: string;
  neverExpires: boolean;
}

interface SkillItem {
  id: string;
  name: string;
  level: number;
}


// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

export default function BuildResume() {
  // Navigation hook
  const navigate = useNavigate();
  
  // Profile hook for validation
  const { profile } = useProfile();
  
  // State for profile warning
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  
  // State for resume data
  const [resumeData, setResumeData] = useState<ResumeData>({
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
  });

  // State for active section
  const [activeSection, setActiveSection] = useState<Section>('summary');

  // State for editing sections
  const [editingItem, setEditingItem] = useState<ExperienceItem | EducationItem | ProjectItem | CertificationItem | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [skillLevel, setSkillLevel] = useState(5);
  
  // State for API integration
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  
  // Loading states using useLoading hook
  const { execute: executeSave, isLoading: isSaving } = useLoading();
  const { execute: executeLoad, isLoading: isLoading } = useLoading();
  const { execute: executeImprove, isLoading: isImproving } = useLoading();
  const { execute: executeCreateVersion, isLoading: isCreatingNewVersion } = useLoading();


  // Helper functions to convert API data to component types
  const convertExperienceData = (exp: ExperienceData): ExperienceItem => ({
    id: exp.id || generateId(),
    title: exp.position || '',
    company: exp.company || '',
    location: '', // Not in API data, set as empty
    startDate: exp.startDate || '',
    endDate: exp.endDate || '',
    current: exp.endDate ? false : true, // Infer from endDate presence
    description: exp.description || '',
  });

  const convertEducationData = (edu: EducationData): EducationItem => ({
    id: edu.id || generateId(),
    school: edu.school || '',
    degree: edu.degree || '',
    fieldOfStudy: edu.fieldOfStudy || '',
    startDate: edu.startDate || '',
    endDate: edu.endDate || '',
    description: edu.description || '',
  });

  const convertSkillData = (skill: SkillData): SkillItem => ({
    id: skill.id || generateId(),
    name: skill.name || '',
    level: skill.level ? parseInt(skill.level, 10) || 5 : 5,
  });

  const convertProjectData = (project: ProjectData): ProjectItem => ({
    id: project.id || generateId(),
    name: project.name || '',
    description: project.description || '',
    link: project.link || '',
    technologies: project.technologies || '',
  });

  const convertCertificationData = (cert: CertificationData): CertificationItem => ({
    id: cert.id || generateId(),
    name: cert.name || '',
    issuer: cert.issuer || '',
    date: cert.date || '',
    expirationDate: cert.expirationDate || '',
    neverExpires: !cert.expirationDate,
  });

  // Load existing resumes on component mount
  useEffect(() => {
    executeLoad(
      async () => {
        const resumes = await getUserStructuredResumes();
        if (resumes.length > 0) {
          // Load the most recent resume
          const latestResume = resumes[0];
          setCurrentResumeId(latestResume.id);
          setResumeData({
            summary: latestResume.summary || '',
            experience: (latestResume.experiences || []).map(convertExperienceData),
            education: (latestResume.educations || []).map(convertEducationData),
            skills: (latestResume.skills || []).map(convertSkillData),
            projects: (latestResume.projects || []).map(convertProjectData),
            certifications: (latestResume.certifications || []).map(convertCertificationData),
          });
        }
        return resumes;
      },
      {
        onError: (error) => {
          console.error('Failed to load resumes:', error);
          toast.error('Failed to load your resume data.');
        }
      }
    );
  }, [executeLoad]);

  // Handle summary update
  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResumeData({
      ...resumeData,
      summary: e.target.value,
    });
  };

  // Handle adding a new skill
  const handleAddSkill = () => {
    if (!newSkill.trim()) return;

    setResumeData({
      ...resumeData,
      skills: [...resumeData.skills, { id: generateId(), name: newSkill.trim(), level: skillLevel }],
    });

    setNewSkill('');
    toast.success(`"${newSkill}" has been added to your skills.`);
  };

  // Handle removing a skill
  const handleRemoveSkill = (skillToRemove: SkillItem) => {
    setResumeData({
      ...resumeData,
      skills: resumeData.skills.filter((skill) => skill !== skillToRemove),
    });

    toast.success('Skill removed successfully.');
  };

  // Check if profile is complete
  const checkProfileCompleteness = () => {
    if (!profile) return ['profile data'];
    
    const missingFields = [];
    if (!profile.phoneNumber) missingFields.push('phone number');
    if (!profile.location && !profile.city && !profile.state && !profile.country) missingFields.push('address');
    
    return missingFields.length > 0 ? missingFields : true;
  };

  // Convert component data to API format
  const convertToApiFormat = (): Omit<StructuredResumeData, 'id' | 'createdAt' | 'updatedAt'> => ({
    title: 'My Resume', // Default title
    summary: resumeData.summary,
    experiences: resumeData.experience.map(exp => ({
      company: exp.company,
      position: exp.title,
      startDate: exp.startDate,
      ...(exp.current || !exp.endDate ? {} : { endDate: exp.endDate }),
      description: exp.description,
    })),
    educations: resumeData.education.map(edu => ({
      school: edu.school,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startDate: edu.startDate,
      endDate: edu.endDate,
      description: edu.description,
    })),
    skills: resumeData.skills.map(skill => ({
       name: skill.name,
       level: skill.level.toString(),
     })),
    projects: resumeData.projects.map(project => ({
      name: project.name,
      description: project.description,
      link: project.link,
      technologies: project.technologies,
    })),
    certifications: resumeData.certifications.map(cert => ({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date,
      ...(cert.neverExpires || !cert.expirationDate ? {} : { expirationDate: cert.expirationDate }),
      neverExpires: cert.neverExpires,
    })),
  });

  // Proceed with saving the resume
  const proceedWithSave = async () => {
    setShowProfileWarning(false);
    
    const result = await executeSave(
      async () => {
        const apiData = convertToApiFormat();
        
        if (currentResumeId) {
          // Update existing resume
          await updateStructuredResume(currentResumeId, apiData);
          return { type: 'update' };
        } else {
          // Create new resume
          const newResume = await createStructuredResume(apiData);
          setCurrentResumeId(newResume.id!);
          return { type: 'create', resume: newResume };
        }
      },
      {
        onSuccess: () => {
          // Success handling will be done after the execute call
        },
        onError: (error) => {
          console.error('Failed to save resume:', error);
          toast.error('Failed to save your resume. Please try again.');
        }
      }
    );
    
    if (result) {
      if (result.type === 'update') {
        toast.success('Your resume has been updated successfully.');
      } else {
        toast.success('Your resume has been created successfully.');
      }
    }
  };

  // Handle saving the resume
  const handleSaveResume = () => {
    const profileCheck = checkProfileCompleteness();
    if (profileCheck !== true) {
      setShowProfileWarning(true);
      return;
    }
    
    proceedWithSave();
  };

  // Handle improving the resume
  const handleImproveResume = async () => {
    if (!currentResumeId) {
      toast.error('Please save your resume first before improving it.');
      return;
    }

    await executeImprove(
      async () => {
        const structuredData = convertToApiFormat();
        const result = await improveResume(structuredData);
        
        // Store the analysis data in sessionStorage for the Review page
        sessionStorage.setItem('resumeAnalysis', JSON.stringify(result));
        
        return result;
      },
      {
        onSuccess: () => {
          toast.success('Resume improvement suggestions generated successfully!');
          
          // Navigate to the Review page
          navigate('/review');
        },
        onError: (error) => {
          console.error('Failed to improve resume:', error);
          toast.error('Failed to improve resume. Please try again.');
        }
      }
    );
  };

  // Handle creating a new version
  const handleCreateNewVersion = async () => {
    setShowNewVersionDialog(false);
    
    await executeCreateVersion(
      async () => {
        const apiData = convertToApiFormat();
        
        // Create a new resume (this will be the new version)
        const newResume = await createStructuredResume(apiData);
        setCurrentResumeId(newResume.id!);
        
        return newResume;
      },
      {
        onSuccess: () => {
          toast.success('New version created successfully! You are now working on the latest version.');
        },
        onError: (error) => {
          console.error('Failed to create new version:', error);
          toast.error('Failed to create new version. Please try again.');
        }
      }
    );
  };

  // Open dialog for adding/editing an item
  const openItemDialog = (section: Section, item: ExperienceItem | EducationItem | ProjectItem | CertificationItem = null) => {
    setEditingSection(section);
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  // Handle form submit for various sections
  const handleExperienceSubmit = (data: Omit<ExperienceItem, 'id'>) => {
    if (editingItem) {
      // Update existing item
      setResumeData({
        ...resumeData,
        experience: resumeData.experience.map((item) =>
          item.id === editingItem.id ? { ...data, id: item.id } : item
        ),
      });
      toast.success('Experience updated successfully.');
    } else {
      // Add new item
      const newItem = { ...data, id: generateId() };
      setResumeData({
        ...resumeData,
        experience: [...resumeData.experience, newItem as ExperienceItem],
      });
      toast.success('Experience added successfully.');
    }
    setIsDialogOpen(false);
  };

  const handleEducationSubmit = (data: Omit<EducationItem, 'id'>) => {
    if (editingItem) {
      setResumeData({
        ...resumeData,
        education: resumeData.education.map((item) =>
          item.id === editingItem.id ? { ...data, id: item.id } : item
        ),
      });
      toast.success('Education updated successfully.');
    } else {
      const newItem = { ...data, id: generateId() };
      setResumeData({
        ...resumeData,
        education: [...resumeData.education, newItem as EducationItem],
      });
      toast.success('Education added successfully.');
    }
    setIsDialogOpen(false);
  };

  const handleProjectSubmit = (data: Omit<ProjectItem, 'id'>) => {
    if (editingItem) {
      setResumeData({
        ...resumeData,
        projects: resumeData.projects.map((item) =>
          item.id === editingItem.id ? { ...data, id: item.id } : item
        ),
      });
      toast.success('Project updated successfully.');
    } else {
      const newItem = { ...data, id: generateId() };
      setResumeData({
        ...resumeData,
        projects: [...resumeData.projects, newItem as ProjectItem],
      });
      toast.success('Project added successfully.');
    }
    setIsDialogOpen(false);
  };

  const handleCertificationSubmit = (data: Omit<CertificationItem, 'id'>) => {
    if (editingItem) {
      setResumeData({
        ...resumeData,
        certifications: resumeData.certifications.map((item) =>
          item.id === editingItem.id ? { ...data, id: item.id } : item
        ),
      });
      toast.success('Certification updated successfully.');
    } else {
      const newItem = { ...data, id: generateId() };
      setResumeData({
        ...resumeData,
        certifications: [
          ...resumeData.certifications,
          newItem as CertificationItem,
        ],
      });
      toast.success('Certification added successfully.');
    }
    setIsDialogOpen(false);
  };

  // Handle deleting an item
  const handleDeleteItem = (section: Section, itemId: string) => {
    if (section === 'summary') {
      return; // Can't delete summary
    }

    setResumeData({
      ...resumeData,
      [section]: resumeData[section].filter((item:ProjectItem | ExperienceItem | EducationItem | CertificationItem) => item.id !== itemId),
    });

    toast.success('Item removed successfully.');
  };

  // Render item dialogs based on the section
  const renderItemDialog = () => {
    if (!editingSection) return null;

    switch (editingSection) {
      case 'experience':
        return (
          <DialogContent className="sm:max-w-[550px]">
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const stillWorking = formData.get('current') === 'on';
              const data = {
                title: formData.get('title') as string,
                company: formData.get('company') as string,
                location: formData.get('location') as string,
                startDate: formData.get('startDate') as string,
                endDate: stillWorking ? '' : (formData.get('endDate') as string),
                current: stillWorking,
                description: formData.get('description') as string
              };
              handleExperienceSubmit(data);
            }}>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Experience' : 'Add Experience'}
                </DialogTitle>
                <DialogDescription>
                  Enter the details of your work experience.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingItem && 'title' in editingItem ? editingItem.title : ''}
                      placeholder="e.g. Software Engineer"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      name="company"
                      defaultValue={editingItem && 'company' in editingItem ? editingItem.company : ''}
                      placeholder="e.g. Acme Corporation"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      defaultValue={editingItem && 'location' in editingItem ? editingItem.location : ''}
                      placeholder="e.g. San Francisco, CA"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="month"
                      defaultValue={editingItem && 'startDate' in editingItem ? editingItem.startDate : ''}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="month"
                      defaultValue={editingItem && 'endDate' in editingItem ? editingItem.endDate : ''}
                      required={!(editingItem && 'current' in editingItem && editingItem.current)}
                      disabled={editingItem && 'current' in editingItem && editingItem.current}
                    />
                  </div>
                  <div className="col-span-2 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="current"
                      name="current"
                      defaultChecked={editingItem && 'current' in editingItem ? editingItem.current : false}
                      onChange={(e) => {
                        const endDateInput = document.getElementById('endDate') as HTMLInputElement;
                        if (endDateInput) {
                          endDateInput.required = !e.target.checked;
                          endDateInput.disabled = e.target.checked;
                          if (e.target.checked) {
                            endDateInput.value = '';
                          }
                        }
                      }}
                    />
                    <Label htmlFor="current" className="text-sm font-normal">
                      I still work here
                    </Label>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={4}
                      defaultValue={editingItem && 'description' in editingItem ? editingItem.description : ''}
                      placeholder="Describe your responsibilities and achievements..."
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        );

      case 'education':
        return (
          <DialogContent className="sm:max-w-[550px]">
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const data = {
                school: formData.get('school') as string,
                degree: formData.get('degree') as string,
                fieldOfStudy: formData.get('fieldOfStudy') as string,
                startDate: formData.get('startDate') as string,
                endDate: formData.get('endDate') as string,
                description: formData.get('description') as string
              };
              handleEducationSubmit(data);
            }}>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Education' : 'Add Education'}
                </DialogTitle>
                <DialogDescription>
                  Enter the details of your educational background.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="school">School</Label>
                    <Input
                      id="school"
                      name="school"
                      defaultValue={editingItem && 'school' in editingItem ? editingItem.school : ''}
                      placeholder="e.g. Stanford University"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="degree">Degree</Label>
                    <Input
                      id="degree"
                      name="degree"
                      defaultValue={editingItem && 'degree' in editingItem ? editingItem.degree : ''}
                      placeholder="e.g. Bachelor of Science"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="fieldOfStudy">Field of Study</Label>
                    <Input
                      id="fieldOfStudy"
                      name="fieldOfStudy"
                      defaultValue={editingItem && 'fieldOfStudy' in editingItem ? editingItem.fieldOfStudy : ''}
                      placeholder="e.g. Computer Science"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="month"
                      defaultValue={editingItem && 'startDate' in editingItem ? editingItem.startDate : ''}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="month"
                      defaultValue={editingItem && 'endDate' in editingItem ? editingItem.endDate : ''}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={3}
                      defaultValue={editingItem && 'description' in editingItem ? editingItem.description : ''}
                      placeholder="Additional information about your studies..."
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        );

      case 'projects':
        return (
          <DialogContent className="sm:max-w-[550px]">
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const data = {
                name: formData.get('name') as string,
                link: formData.get('link') as string,
                technologies: formData.get('technologies') as string,
                description: formData.get('description') as string
              };
              handleProjectSubmit(data);
            }}>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Project' : 'Add Project'}
                </DialogTitle>
                <DialogDescription>
                  Enter the details of your project.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingItem && 'name' in editingItem ? editingItem.name : ''}
                      placeholder="e.g. Personal Portfolio Website"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="link">Project Link</Label>
                    <Input
                      id="link"
                      name="link"
                      defaultValue={editingItem && 'link' in editingItem ? editingItem.link : ''}
                      placeholder="e.g. https://myproject.com"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="technologies">Technologies Used</Label>
                    <Input
                      id="technologies"
                      name="technologies"
                      defaultValue={editingItem && 'technologies' in editingItem ? editingItem.technologies : ''}
                      placeholder="e.g. React, Node.js, MongoDB"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={3}
                      defaultValue={editingItem && 'description' in editingItem ? editingItem.description : ''}
                      placeholder="Describe your project, its purpose, and your role..."
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        );

      case 'certifications':
        return (
          <DialogContent className="sm:max-w-[550px]">
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const neverExpires = formData.get('neverExpires') === 'on';
              const data = {
                name: formData.get('name') as string,
                issuer: formData.get('issuer') as string,
                date: formData.get('date') as string,
                expirationDate: neverExpires ? '' : (formData.get('expirationDate') as string),
                neverExpires: neverExpires
              };
              handleCertificationSubmit(data);
            }}>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Certification' : 'Add Certification'}
                </DialogTitle>
                <DialogDescription>
                  Enter the details of your certification.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Certification Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingItem && 'name' in editingItem ? editingItem.name : ''}
                      placeholder="e.g. AWS Certified Solutions Architect"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="issuer">Issuing Organization</Label>
                    <Input
                      id="issuer"
                      name="issuer"
                      defaultValue={editingItem && 'issuer' in editingItem ? editingItem.issuer : ''}
                      placeholder="e.g. Amazon Web Services"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Issue Date</Label>
                    <Input
                      id="date"
                      name="date"
                      type="month"
                      defaultValue={editingItem && 'date' in editingItem ? editingItem.date : ''}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="expirationDate">Expiration Date</Label>
                    <Input
                      id="expirationDate"
                      name="expirationDate"
                      type="month"
                      defaultValue={editingItem && 'expirationDate' in editingItem ? editingItem.expirationDate : ''}
                      disabled={(document.getElementById('neverExpires') as HTMLInputElement)?.checked || false}
                      required={!((document.getElementById('neverExpires') as HTMLInputElement)?.checked || false)}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="neverExpires"
                        name="neverExpires"
                        className="rounded border-gray-300"
                        defaultChecked={editingItem && 'neverExpires' in editingItem ? editingItem.neverExpires : false}
                        onChange={(e) => {
                          const expirationInput = document.getElementById('expirationDate') as HTMLInputElement;
                          if (expirationInput) {
                            expirationInput.disabled = e.target.checked;
                            expirationInput.required = !e.target.checked;
                            if (e.target.checked) {
                              expirationInput.value = '';
                            }
                          }
                        }}
                      />
                      <Label htmlFor="neverExpires" className="text-sm font-normal">
                        Never expires
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-8 bg-cvwise-light-gray">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading your resume data...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-8 bg-cvwise-light-gray">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-cvwise-blue-dark">
                Resume Builder
              </h1>
              <p className="text-gray-600">
                Create a professional resume in minutes
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleSaveResume}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Resume
                  </>
                )}
              </Button>
              {currentResumeId && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleImproveResume}
                    disabled={isImproving}
                  >
                    {isImproving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Improving...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Improve Resume
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewVersionDialog(true)}
                    disabled={isCreatingNewVersion}
                  >
                    {isCreatingNewVersion ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Create New Version
                      </>
                    )}
                  </Button>
                </>
              )}
              <Link to="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar with sections */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Resume Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <Button
                    variant={activeSection === 'summary' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveSection('summary')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Summary
                  </Button>
                  <Button
                    variant={
                      activeSection === 'experience' ? 'default' : 'ghost'
                    }
                    className="w-full justify-start"
                    onClick={() => setActiveSection('experience')}
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    Experience
                  </Button>
                  <Button
                    variant={
                      activeSection === 'education' ? 'default' : 'ghost'
                    }
                    className="w-full justify-start"
                    onClick={() => setActiveSection('education')}
                  >
                    <School className="mr-2 h-4 w-4" />
                    Education
                  </Button>
                  <Button
                    variant={activeSection === 'skills' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveSection('skills')}
                  >
                    <Award className="mr-2 h-4 w-4" />
                    Skills
                  </Button>
                  <Button
                    variant={activeSection === 'projects' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveSection('projects')}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Projects
                  </Button>
                  <Button
                    variant={
                      activeSection === 'certifications' ? 'default' : 'ghost'
                    }
                    className="w-full justify-start"
                    onClick={() => setActiveSection('certifications')}
                  >
                    <Award className="mr-2 h-4 w-4" />
                    Certifications
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Main content area */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>
                  {activeSection === 'summary' && 'Professional Summary'}
                  {activeSection === 'experience' && 'Work Experience'}
                  {activeSection === 'education' && 'Education'}
                  {activeSection === 'skills' && 'Skills'}
                  {activeSection === 'projects' && 'Projects'}
                  {activeSection === 'certifications' &&
                    'Certifications & Licenses'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Summary Section */}
                {activeSection === 'summary' && (
                  <div>
                    <Label htmlFor="summary">Professional Summary</Label>
                    <Textarea
                      id="summary"
                      placeholder="Write a brief summary of your professional background and key qualifications..."
                      className="mt-2 h-40"
                      value={resumeData.summary}
                      onChange={handleSummaryChange}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      A good summary highlights your most relevant
                      qualifications, skills, and achievements.
                    </p>
                  </div>
                )}

                {/* Experience Section */}
                {activeSection === 'experience' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-gray-500">
                        List your work experience, starting with the most recent
                        position.
                      </p>
                      <Button onClick={() => openItemDialog('experience')}>
                        <FilePlus className="mr-2 h-4 w-4" />
                        Add Experience
                      </Button>
                    </div>

                    {resumeData.experience.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-md">
                        <Briefcase className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">
                          No work experience added yet.
                        </p>
                        <p className="text-gray-500 text-sm">
                          Click the button above to add your work history.
                        </p>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="w-full">
                        {resumeData.experience.map((item, index) => (
                          <AccordionItem key={item.id} value={item.id}>
                            <AccordionTrigger>
                              <div className="flex items-center">
                                <div className="text-left">
                                  <div className="font-medium">
                                    {item.title}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {item.company}
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm font-medium">
                                    Location:{' '}
                                  </span>
                                  <span className="text-sm">
                                    {item.location}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium">
                                    Period:{' '}
                                  </span>
                                  <span className="text-sm">{`${item.startDate} - ${item.current ? 'Present' : item.endDate}`}</span>
                                </div>
                                <div>
                                  <p className="text-sm whitespace-pre-wrap">
                                    {item.description}
                                  </p>
                                </div>
                                <div className="flex justify-end space-x-2 mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      openItemDialog('experience', item)
                                    }
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteItem('experience', item.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
                )}

                {/* Education Section */}
                {activeSection === 'education' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-gray-500">
                        List your educational background, starting with the most
                        recent.
                      </p>
                      <Button onClick={() => openItemDialog('education')}>
                        <FilePlus className="mr-2 h-4 w-4" />
                        Add Education
                      </Button>
                    </div>

                    {resumeData.education.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-md">
                        <School className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">No education added yet.</p>
                        <p className="text-gray-500 text-sm">
                          Click the button above to add your education history.
                        </p>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="w-full">
                        {resumeData.education.map((item) => (
                          <AccordionItem key={item.id} value={item.id}>
                            <AccordionTrigger>
                              <div className="flex items-center">
                                <div className="text-left">
                                  <div className="font-medium">
                                    {item.school}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {item.degree} in {item.fieldOfStudy}
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm font-medium">
                                    Period:{' '}
                                  </span>
                                  <span className="text-sm">{`${item.startDate} - ${item.endDate}`}</span>
                                </div>
                                {item.description && (
                                  <div>
                                    <p className="text-sm whitespace-pre-wrap">
                                      {item.description}
                                    </p>
                                  </div>
                                )}
                                <div className="flex justify-end space-x-2 mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      openItemDialog('education', item)
                                    }
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteItem('education', item.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
                )}

                {/* Skills Section */}
                {activeSection === 'skills' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-gray-500">
                        Add your skills and areas of expertise.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 mb-4">
                      <div className="flex-grow">
                        <Input
                          placeholder="Add a skill (e.g., JavaScript, Project Management)"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                        />
                      </div>
                      <div className="w-24">
                        <select
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                          value={skillLevel}
                          onChange={(e) => setSkillLevel(Number(e.target.value))}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                            <option key={level} value={level}>
                              Level {level}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button onClick={handleAddSkill}>Add</Button>
                    </div>

                    {resumeData.skills.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-md">
                        <Award className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">No skills added yet.</p>
                        <p className="text-gray-500 text-sm">
                          Add your skills using the field above.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {resumeData.skills.map((skill) => (
                          <div
                            key={skill.id}
                            className="group flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm"
                          >
                            <span>{skill.name}</span>
                            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {skill.level}/10
                            </span>
                            <button
                              className="ml-2 text-gray-400 hover:text-red-500"
                              onClick={() => handleRemoveSkill(skill)}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Projects Section */}
                {activeSection === 'projects' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-gray-500">
                        Showcase your projects to demonstrate your skills and
                        experience.
                      </p>
                      <Button onClick={() => openItemDialog('projects')}>
                        <FilePlus className="mr-2 h-4 w-4" />
                        Add Project
                      </Button>
                    </div>

                    {resumeData.projects.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-md">
                        <Star className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">No projects added yet.</p>
                        <p className="text-gray-500 text-sm">
                          Click the button above to add your projects.
                        </p>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="w-full">
                        {resumeData.projects.map((item) => (
                          <AccordionItem key={item.id} value={item.id}>
                            <AccordionTrigger>
                              <div className="flex items-center">
                                <div className="text-left">
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {item.technologies}
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2">
                                {item.link && (
                                  <div>
                                    <span className="text-sm font-medium">
                                      Link:{' '}
                                    </span>
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-500 hover:underline"
                                    >
                                      {item.link}
                                    </a>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm whitespace-pre-wrap">
                                    {item.description}
                                  </p>
                                </div>
                                <div className="flex justify-end space-x-2 mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      openItemDialog('projects', item)
                                    }
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteItem('projects', item.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
                )}

                {/* Certifications Section */}
                {activeSection === 'certifications' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-gray-500">
                        Add your certifications and professional licenses.
                      </p>
                      <Button onClick={() => openItemDialog('certifications')}>
                        <FilePlus className="mr-2 h-4 w-4" />
                        Add Certification
                      </Button>
                    </div>

                    {resumeData.certifications.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-md">
                        <Award className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">
                          No certifications added yet.
                        </p>
                        <p className="text-gray-500 text-sm">
                          Click the button above to add your certifications.
                        </p>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="w-full">
                        {resumeData.certifications.map((item) => (
                          <AccordionItem key={item.id} value={item.id}>
                            <AccordionTrigger>
                              <div className="flex items-center">
                                <div className="text-left">
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {item.issuer}
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm font-medium">
                                    Issue Date:{' '}
                                  </span>
                                  <span className="text-sm">{item.date}</span>
                                </div>
                                {!item.neverExpires && item.expirationDate && (
                                  <div>
                                    <span className="text-sm font-medium">
                                      Expiration Date:{' '}
                                    </span>
                                    <span className="text-sm">
                                      {item.expirationDate}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-end space-x-2 mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      openItemDialog('certifications', item)
                                    }
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteItem(
                                        'certifications',
                                        item.id
                                      )
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Item Dialog (for adding/editing items) */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {renderItemDialog()}
          </Dialog>

          {/* Profile Warning Dialog */}
          <AlertDialog open={showProfileWarning} onOpenChange={setShowProfileWarning}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Incomplete Profile Information</AlertDialogTitle>
                <AlertDialogDescription>
                  {(() => {
                    const missingFields = checkProfileCompleteness();
                    const missingFieldsText = Array.isArray(missingFields) ? missingFields.join(' and ') : 'profile data';
                    return `Your profile is missing some important information (${missingFieldsText}). Your CV might not be complete without this information. Would you like to update your profile first or continue anyway?`;
                  })()}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => window.location.href = '/profile'}
                  className="mr-2"
                >
                  Update Profile
                </AlertDialogAction>
                <AlertDialogAction onClick={proceedWithSave}>
                  Continue Anyway
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* New Version Confirmation Dialog */}
          <AlertDialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Create New Version</AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to create a new version of your resume. This will create a copy of your current resume as a new version. The system will automatically use the latest version when fetching your resume data. Are you sure you want to proceed?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCreateNewVersion}>
                  Create New Version
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
      <Footer />
    </div>
  );
}
