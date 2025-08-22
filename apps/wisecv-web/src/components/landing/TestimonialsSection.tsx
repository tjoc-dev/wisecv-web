export default function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        'I landed two interviews within a week after optimising my resume with WiseCV. The AI suggestions were spot-on for my industry.',
      author: 'Sarah T.',
      role: 'Marketing Specialist',
      avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    },
    {
      quote:
        'As a career changer, I struggled to highlight my transferable skills. WiseCV helped me rework my resume and I got my dream job!',
      author: 'Michael K.',
      role: 'Software Developer',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    },
    {
      quote:
        'The ATS compatibility check was a game-changer. My applications are actually getting seen by recruiters now.',
      author: 'Jessica L.',
      role: 'Finance Analyst',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
  ];

  return (
    <div className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-cvwise-blue-dark mb-4">
            Success Stories
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of professionals who have improved their career
            prospects with WiseCV
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-cvwise-light-gray p-6 rounded-lg border border-gray-100 shadow-sm"
            >
              <div className="flex items-center mb-6">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-semibold text-cvwise-blue-dark">
                    {testimonial.author}
                  </h4>
                  <p className="text-gray-500 text-sm">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-600 italic">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
