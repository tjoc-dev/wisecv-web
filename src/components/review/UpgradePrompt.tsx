import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProfile } from '@/hooks/use-profile';

export default function UpgradePrompt() {
  const { profile } = useProfile();

  // Only show upgrade prompt for FREE tier users
  if (!profile || profile.tier !== 'FREE') {
    return null;
  }
  const features = [
    'Access to more AI suggestions',
    'Remove watermark from downloaded files',
    'Access to upcoming features and improvement to aid your job search'
  ];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-cvwise-blue to-cvwise-navy p-6">
        <h3 className="text-xl font-bold text-white">
          Unlock Pro Features
        </h3>
        <p className="text-white/80 mt-2">
          Get the most out of WiseCV with a pro subscription
        </p>
      </div>

      <div className="p-6">
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircle className="text-cvwise-blue h-5 w-5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        <Link to="/pricing">
          <Button className="w-full btn-primary">Upgrade Now</Button>
        </Link>
      </div>
    </div>
  );
}
