import React from 'react';
import { Construction } from 'lucide-react';

export const LiveArbitrage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Construction className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Live Betting Coming Soon
        </h2>
        <p className="text-gray-600 mb-4">
          We're working on integrating live betting functionality. 
          This feature will be available in the near future.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg inline-block">
          <p className="text-blue-800 text-sm">
            In the meantime, you can use our Upcoming Matches and Manual Calculator features.
          </p>
        </div>
      </div>
    </div>
  );
}; 