import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { useTier } from '@/hooks/use-tier';
import { useJobApplications } from '@/hooks/use-job-applications';
import { TierGuard } from '@/hooks/use-tier-guard';
import { TierStatus } from '@/components/tier/TierStatus';
import { TierBadge } from '@/components/tier/TierBadge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { getImprovedResumes, ImprovedResumeData } from '@/lib/api';
import {
  Briefcase,
  Check,
  FileText,
  Search,
  Upload,
  FilePen,
  Send,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from '@/components/ui/sonner';
function DashboardContent() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { userTier, isLoading: tierLoading } = useTier();
  const { stats, isLoading: statsLoading, fetchStats } = useJobApplications();

  // Initialize all state at the top of the component
  const [resumes, setResumes] = useState<ImprovedResumeData[]>([]);
  const [resumesLoading, setResumesLoading] = useState(true);

  // Fetch job application stats on component mount
  useEffect(() => {
    if (user?.id) {
      fetchStats();
    }
  }, [user?.id, fetchStats]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // User profile data derived from useProfile hook
  const userProfile = {
    title: profile?.jobTitle || 'No title set',
    location: [profile?.city, profile?.country].filter(Boolean).join(', ') || 'Location not set',
    experience: profile?.experience ? `${profile.experience.charAt(0).toUpperCase() + profile.experience.slice(1)}` : 'Experience not set',
    skills: profile?.skills || [],
  };

  // Fetch improved resumes
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setResumesLoading(true);
        const improvedResumes = await getImprovedResumes();
        // Sort by creation date (most recent first) and take only the first 3
        const sortedResumes = improvedResumes
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
        setResumes(sortedResumes);
      } catch (error) {
        console.error('Failed to fetch resumes:', error);
        toast.error('Failed to load resumes');
      } finally {
        setResumesLoading(false);
      }
    };

    fetchResumes();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-8 bg-cvwise-light-gray">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-cvwise-blue-dark">
                  Welcome, {user?.firstName || 'User'}
                </h1>
                {userTier && <TierBadge tier={userTier.tier} size="sm" />}
              </div>
              <p className="text-gray-600">
                Manage your resumes, cover letters and job applications
              </p>
            </div>
          </div>

          {/* Career Persona Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-bold">Primary Persona</h2>
              </div>

              <Link to="/profile">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Search className="mr-2 h-4 w-4" /> Update Profile
                </Button>
              </Link>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      From your profile:
                    </p>

                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium pl-0 py-2">
                            Title
                          </TableCell>
                          <TableCell className="py-2">
                            {userProfile.title}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium pl-0 py-2">
                            Location
                          </TableCell>
                          <TableCell className="py-2">
                            {userProfile.location}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium pl-0 py-2">
                            Experience
                          </TableCell>
                          <TableCell className="py-2">
                            {userProfile.experience}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium pl-0 py-2">
                            Skills Identified
                          </TableCell>
                          <TableCell className="py-2">
                            {userProfile.skills.join(', ')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* My Resumes Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-bold">My Resumes</h2>
              </div>

              <div className="flex gap-3">
                <Link to="/build">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                    <FilePen className="mr-2 h-4 w-4" /> Build Your Resume
                  </Button>
                </Link>
                <Link to="/upload">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Upload className="mr-2 h-4 w-4" /> Upload New Resume
                  </Button>
                </Link>
              </div>
            </div>

              {resumesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden animate-pulse">
                      <CardHeader className="bg-white p-4 pb-2 border-b">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-2 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
                  <p className="text-gray-500 mb-4">Start by uploading or building your first resume</p>
                  <div className="flex gap-3 justify-center">
                    <Link to="/build">
                      <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                        <FilePen className="mr-2 h-4 w-4" /> Build Resume
                      </Button>
                    </Link>
                    <Link to="/upload">
                      <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                        <Upload className="mr-2 h-4 w-4" /> Upload Resume
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {resumes.map((resume) => (
                    <Card key={resume.id} className="overflow-hidden">
                      <CardHeader className="bg-white p-4 pb-2 border-b">
                        <h3
                          className="font-medium text-gray-900 truncate"
                          title={resume.title || 'Untitled Resume'}
                        >
                          {resume.title || 'Untitled Resume'}
                        </h3>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-500">
                            Status
                          </span>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${resume.status === 'finalized'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {resume.status === 'finalized' ? 'Finalized' : 'Draft'}
                            </span>
                          </div>
                        </div>

                        {resume.improvementScore && (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-500">
                                Improvement Score
                              </span>
                              <div className="flex items-center">
                                {resume.improvementScore >= 80 && (
                                  <div className="bg-gray-100 p-0.5 rounded-full mr-1">
                                    <Check className="h-3 w-3 text-green-600" />
                                  </div>
                                )}
                                <span className="font-bold">{resume.improvementScore}%</span>
                              </div>
                            </div>

                            <div className="bg-gray-200 h-2 rounded-full overflow-hidden mb-4">
                              <div
                                className={`h-full rounded-full ${resume.improvementScore >= 80
                                    ? 'bg-green-500'
                                    : resume.improvementScore >= 60
                                      ? 'bg-blue-500'
                                      : 'bg-blue-400'
                                  }`}
                                style={{
                                  width: `${resume.improvementScore}%`,
                                }}
                              />
                            </div>
                          </>
                        )}

                        <div className="text-sm text-gray-600">
                          <p>Created: {formatDate(resume.createdAt)}</p>
                          <p>Suggestions: {resume.metadata?.acceptedCount || 0} applied</p>
                        </div>
                      </CardContent>
                      <CardFooter className="p-3 pt-2 border-t">
                        <Link to={`/review?resumeId=${resume.originalResumeId || resume.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Job Applications Section */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Send className="h-6 w-6 text-blue-500" />
                  <h2 className="text-xl font-bold">Job Applications</h2>
                </div>

                <div className="flex gap-3">
                  <Link to="/job-applications/create">
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                      <Send className="mr-2 h-4 w-4" /> New Application
                    </Button>
                  </Link>
                  <Link to="/job-applications">
                    <Button variant="outline">
                      View All Applications
                    </Button>
                  </Link>
                </div>
              </div>

              <p className="text-gray-700 mb-4">
                Track your job applications and generate optimized resumes and cover letters.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
                  <CardContent className="p-6 text-center">
                    <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Create Application</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Start a new job application with AI-optimized content
                    </p>
                    <Link to="/job-applications/create">
                      <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                        Get Started
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {statsLoading ? '...' : stats?.total || 0}
                    </div>
                    <p className="text-sm text-gray-600">All Applications</p>
                  </CardContent>
                </Card>

                <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          {statsLoading ? '...' : stats?.applied || 0}
                        </div>
                        <p className="text-sm text-gray-600">Applications Sent</p>
                      </CardContent>
                    </Card>
              </div>
            </section>


            {/* Tier Status Section */}
            {!tierLoading && userTier && (
              <section className="mt-10">
                <TierStatus />
              </section>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
}

export default function Dashboard() {
  return (
    <TierGuard
      fallback={
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow py-8 bg-cvwise-light-gray">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading information...</span>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <DashboardContent />
    </TierGuard>
  );
}
