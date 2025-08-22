import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EnhancedResumeUploader from '@/components/upload/EnhancedResumeUploader';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

export default function Upload() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-12 bg-cvwise-light-gray">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Upload Your Resume
              </h1>
              <p className="text-xl text-gray-600">
                Get AI-powered insights and improvements for your resume
              </p>
            </div>
            <ErrorBoundary level="page">
              <EnhancedResumeUploader />
            </ErrorBoundary>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
