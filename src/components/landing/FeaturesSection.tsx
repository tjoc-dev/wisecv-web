import { CheckCircle } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      title: 'Quick Review',
      description:
        'Get detailed feedback on your resume in less than 60 seconds',
      icon: '⚡',
    },
    {
      title: 'ATS Compatibility',
      description:
        'Ensure your resume passes through Applicant Tracking Systems',
      icon: '✓',
    },
    {
      title: 'Tailored Suggestions',
      description:
        'Receive personalized improvements based on your industry and role',
      icon: '🎯',
    },
    {
      title: 'Score & Metrics',
      description: 'See how your resume measures up against industry standards',
      icon: '📊',
    },
    {
      title: 'Job Description Matching',
      description: 'Optimize your resume for specific job descriptions',
      icon: '🔍',
    },
    {
      title: 'One-Click Fixes',
      description: 'Apply AI-suggested improvements with a single click',
      icon: '🪄',
    },
  ];

  return (
    <div className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-cvwise-blue-dark mb-4">
            Features Designed to Help You Stand Out
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered tools analyze your resume to give you the best chance
            of landing interviews
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-cvwise-light-gray p-6 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-cvwise-blue-dark">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center bg-gradient-to-r from-cvwise-blue to-cvwise-teal p-8 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to improve your resume?
          </h3>
          <p className="text-white mb-6 max-w-2xl mx-auto">
            Join thousands of job seekers who have improved their chances with
            WiseCV.co
          </p>
          <a
            href="/upload"
            className="inline-block bg-white text-cvwise-blue-dark font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Try for Free — No Credit Card Required
          </a>
        </div>
      </div>
    </div>
  );
}
