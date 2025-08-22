import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthForm from '@/components/auth/AuthForm';

export default function Auth() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-cvwise-blue-dark mb-2">
              Welcome to WiseCV
            </h1>
            <p className="text-gray-600">
              Log in or create an account to start improving your resume
            </p>
          </div>

          <AuthForm />
        </div>
      </div>
      <Footer />
    </div>
  );
}
