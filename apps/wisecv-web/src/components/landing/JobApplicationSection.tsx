import { Button } from '@/components/ui/button';

export default function JobApplicationSection() {
  const companies = [
    {
      name: 'Nike',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/120px-Logo_NIKE.svg.png',
    },
    {
      name: 'Airbnb',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Airbnb_Logo_B%C3%A9lo.svg/120px-Airbnb_Logo_B%C3%A9lo.svg.png',
    },
    {
      name: 'Visa',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/120px-Visa_Inc._logo.svg.png',
    },
  ];

  return (
    <div className="bg-blue-50 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-cvwise-blue-dark mb-6">
              We find the job
              <br />
              and apply for you
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Our team will help with your job search from start to finish.
              We'll source jobs for you, apply for you, and help you land the
              job you want.
            </p>
            <Button className="rounded-full bg-cvwise-blue hover:bg-cvwise-blue-dark transition-all">
              Learn more
            </Button>
          </div>

          <div className="relative">
            <div className="bg-white rounded-xl shadow-lg p-6 relative z-10">
              <div className="flex flex-wrap justify-center gap-8 mb-8">
                {companies.map((company, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center w-20 h-20"
                  >
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="max-w-full max-h-full"
                    />
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Maria Lopez Fernandez</p>
                    <p className="text-sm text-gray-500">Resume</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-md p-2 text-xs text-gray-500">
                  Applied to 14 positions • 3 interviews scheduled
                </div>
              </div>
            </div>
            <div className="absolute -top-10 -left-10 w-20 h-20 bg-blue-100 rounded-full z-0"></div>
            <div className="absolute -bottom-5 -right-5 w-12 h-12 bg-blue-200 rounded-full z-0"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
