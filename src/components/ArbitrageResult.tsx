import React from 'react';
import { ArbitrageResult } from '../types';
import { TrendingUp, AlertTriangle } from 'lucide-react';

interface ArbitrageResultProps {
  result: ArbitrageResult;
}

export const ArbitrageResultDisplay: React.FC<ArbitrageResultProps> = ({ result }) => {
  if (!result.exists) {
    return (
      <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-md">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-orange-400 mr-2" />
          <p className="text-orange-700">No arbitrage opportunity found with these odds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
        <h3 className="text-xl font-semibold text-green-800">Arbitrage Opportunity Found!</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-medium text-gray-700 mb-3">Required Stakes</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Home:</span>
              <span className="font-semibold">${result.stakes.home.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Draw:</span>
              <span className="font-semibold">${result.stakes.draw.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Away:</span>
              <span className="font-semibold">${result.stakes.away.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg">
          <div className="space-y-3">
            <div>
              <p className="text-gray-600">Total Investment</p>
              <p className="text-2xl font-bold text-gray-900">
                ${result.totalInvestment.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Expected Profit</p>
              <p className="text-2xl font-bold text-green-600">
                ${result.profit.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">ROI</p>
              <p className="text-xl font-semibold text-blue-600">
                {((result.profit / result.totalInvestment) * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};