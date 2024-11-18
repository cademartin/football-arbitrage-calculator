import React from 'react';
import { Clock, Activity, Calculator } from 'lucide-react';

interface NavigationProps {
  currentPage: 'upcoming' | 'live' | 'calculator';
  onPageChange: (page: 'upcoming' | 'live' | 'calculator') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto">
        <div className="flex space-x-4">
          <button
            onClick={() => onPageChange('upcoming')}
            className={`flex items-center px-4 py-3 ${
              currentPage === 'upcoming'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4 mr-2" />
            Upcoming Matches
          </button>
          <button
            onClick={() => onPageChange('live')}
            className={`flex items-center px-4 py-3 ${
              currentPage === 'live'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4 mr-2" />
            Live Betting
          </button>
          <button
            onClick={() => onPageChange('calculator')}
            className={`flex items-center px-4 py-3 ${
              currentPage === 'calculator'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculator
          </button>
        </div>
      </div>
    </div>
  );
}; 