import { ArrowRight } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      title: 'Upload Your Resume',
      description: 'Drag & drop your existing resume in PDF or Word format',
      icon: '📄',
    },
    {
      title: 'AI Analysis',
      description:
        'Our AI reviews your resume for improvements and ATS compatibility',
      icon: '🤖',
    },
    {
      title: 'Get Personalized Feedback',
      description:
        "Review detailed suggestions to improve your resume's effectiveness",
      icon: '💡',
    },
    {
      title: 'Apply Changes & Download',
      description: 'Accept AI suggestions and download your improved resume',
      icon: '⬇️',
    },
  ];

  return (
    <div className="bg-cvwise-light-gray py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-cvwise-blue-dark mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Improve your resume in just a few minutes with our simple process
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center md:w-1/4"
            >
              <div className="bg-white w-20 h-20 flex items-center justify-center rounded-full shadow-md mb-6 text-3xl">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-cvwise-blue-dark">
                {step.title}
              </h3>
              <p className="text-gray-600">{step.description}</p>

              {index < steps.length - 1 && (
                <div className="hidden md:flex justify-center my-8">
                  <ArrowRight
                    className="text-cvwise-blue rotate-0 md:rotate-0"
                    size={24}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
