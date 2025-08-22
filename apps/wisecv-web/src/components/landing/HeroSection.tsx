import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="bg-gradient-to-b from-cvwise-light-gray to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-cvwise-blue-dark mb-6">
              Your career companion
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-lg mb-8">
              Careers aren't what they used to be, but neither are you. From job
              search to promotion, we're with you every step. Where are you
              headed?
            </p>
            <div className="flex flex-wrap gap-4">
              <Button className="rounded-full bg-cvwise-blue hover:bg-cvwise-blue-dark transition-all">
                <Play size={16} className="mr-2" />
                Watch video
              </Button>
              <Link to="/auth">
                <Button
                  variant="outline"
                  className="rounded-full border-cvwise-blue text-cvwise-blue hover:bg-cvwise-blue hover:text-white transition-all"
                >
                  Get started
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="relative z-10">
              <img
                src="/lovable-uploads/1bf4981d-9ee9-41ff-aea3-be5d0ac6e6cc.png"
                alt="People confused about career directions with resume"
                className="rounded-lg shadow-xl mx-auto"
              />
            </div>
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-blue-50 rounded-full z-0"></div>
            <div className="absolute -bottom-5 -left-5 w-12 h-12 bg-blue-100 rounded-full z-0"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
