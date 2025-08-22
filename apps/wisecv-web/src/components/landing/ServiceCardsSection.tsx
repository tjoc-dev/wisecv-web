import { Card, CardContent } from '@/components/ui/card';

export default function ServiceCardsSection() {
  const services = [
    {
      title: 'Find a New Job',
      description: 'Search your next role',
      icon: '🔍',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Meet with a coach',
      description: 'Get personalized guidance',
      icon: '👩‍💼',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Find & track jobs',
      description: 'Manage your applications',
      icon: '📊',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Know your worth',
      description: 'Salary insights and data',
      icon: '💰',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Build your career path',
      description: 'Plan your future growth',
      icon: '🚀',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <div className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-[80%] bg-blue-50 rounded-3xl -z-10"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="md:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="h-full flex flex-col">
                <div className="p-2 bg-blue-50 rounded-md w-fit">
                  <span className="text-lg">✨</span>
                </div>
                <h3 className="text-lg font-semibold mt-4">Find a New Job</h3>
                <p className="text-gray-500 mt-2">Search your next role</p>
                <div className="mt-auto text-right">
                  <button className="text-blue-500 font-medium">→</button>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {services.slice(1).map((service, index) => (
                <Card key={index} className="border border-gray-100 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-col h-full">
                      <div
                        className={`p-2 ${service.bgColor} rounded-md w-fit`}
                      >
                        <span className="text-lg">{service.icon}</span>
                      </div>
                      <h3 className="text-lg font-semibold mt-4">
                        {service.title}
                      </h3>
                      <p className="text-gray-500 mt-2">
                        {service.description}
                      </p>
                      <div className="mt-auto text-right">
                        <button className="text-blue-500 font-medium">→</button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
