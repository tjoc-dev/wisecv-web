
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { TierProvider } from './hooks/use-tier';
import { HelmetProvider } from 'react-helmet-async';

// Import pages
import Index from './pages/Index';
import Auth from './pages/Auth';
import Upload from './pages/Upload';
import Review from './pages/Review';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Pricing from './pages/Pricing';
import NotFound from './pages/NotFound';
import BuildResume from './pages/BuildResume';
import JobsPage from './pages/Jobs';
import VerifyEmail from './pages/VerifyEmail';
import {
  JobApplicationsPage,
  CreateJobApplicationPage,
  JobApplicationDetailsPage,
  EditJobApplicationPage,
} from './pages/JobApplications';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const queryClient = new QueryClient();

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HelmetProvider>
          <TierProvider>
            <Sonner />
            <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="*" element={<NotFound />} />

              {/* Protected routes */}
              <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
              <Route path="/review" element={<ProtectedRoute><Review /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
              <Route path="/build" element={<ProtectedRoute><BuildResume /></ProtectedRoute>} />
              
              {/* Job Applications routes */}
              <Route path="/job-applications" element={<ProtectedRoute><JobApplicationsPage /></ProtectedRoute>} />
              <Route path="/job-applications/create" element={<ProtectedRoute><CreateJobApplicationPage /></ProtectedRoute>} />
              <Route path="/job-applications/:id" element={<ProtectedRoute><JobApplicationDetailsPage /></ProtectedRoute>} />
              <Route path="/job-applications/:id/edit" element={<ProtectedRoute><EditJobApplicationPage /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </TierProvider>
        </HelmetProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
