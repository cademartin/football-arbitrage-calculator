import React from 'react';
import { Calculator, AlertCircle } from 'lucide-react';

interface OddsInputProps {
  bookmaker: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  onOddsChange: (type: 'home' | 'draw' | 'away', value: string) => void;
  readonly?: boolean;
}

export const OddsInput: React.FC<OddsInputProps> = ({
  bookmaker,
  homeOdds,
  drawOdds,
  awayOdds,
  onOddsChange,
  readonly = false,
}) => {
  const validateOdds = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 1 && num <= 1000;
  };

  const handleOddsChange = (type: 'home' | 'draw' | 'away', value: string) => {
    if (value === '' || validateOdds(value)) {
      onOddsChange(type, value);
    }
  };

  const getInputError = (value: number): string => {
    if (value < 1) return 'Odds must be at least 1';
    if (value > 1000) return 'Odds must be less than 1000';
    return '';
  };

  const renderInput = (
    label: string,
    type: 'home' | 'draw' | 'away',
    value: number
  ) => {
    const error = getInputError(value);
    
    return (
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          {label}
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="1"
            max="1000"
            value={value || ''}
            onChange={(e) => handleOddsChange(type, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="2.00"
            readOnly={readonly}
            aria-label={`${label} odds`}
          />
          {error && (
            <div className="absolute right-0 top-0 h-full flex items-center pr-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <Calculator className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">{bookmaker}</h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {renderInput('Home', 'home', homeOdds)}
        {renderInput('Draw', 'draw', drawOdds)}
        {renderInput('Away', 'away', awayOdds)}
      </div>
    </div>
  );
};