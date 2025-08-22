import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/landing/HeroSection';
import ServiceCardsSection from '@/components/landing/ServiceCardsSection';
import JobApplicationSection from '@/components/landing/JobApplicationSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <ServiceCardsSection />
        <JobApplicationSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
}
