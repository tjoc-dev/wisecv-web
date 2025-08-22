import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="text-center px-4">
          <h1 className="text-6xl font-bold text-cvwise-blue-dark mb-6">404</h1>
          <h2 className="text-3xl font-semibold text-cvwise-blue-dark mb-4">
            Page not found
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            We couldn't find the page you're looking for. It might have been
            moved or doesn't exist.
          </p>
          <Link to="/">
            <Button className="btn-primary">Return to Home</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
