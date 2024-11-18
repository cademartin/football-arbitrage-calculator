import React from 'react';
import { Match } from '../types';
import { Ball } from 'lucide-react';

interface MatchSelectorProps {
  matches: Match[];
  selectedMatch: Match | null;
  onSelectMatch: (match: Match) => void;
}

export const MatchSelector: React.FC<MatchSelectorProps> = ({
  matches,
  selectedMatch,
  onSelectMatch,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex items-center mb-4">
        <Ball className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Select Match</h3>
      </div>
      <select
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={selectedMatch?.id || ''}
        onChange={(e) => {
          const match = matches.find((m) => m.id === e.target.value);
          if (match) onSelectMatch(match);
        }}
      >
        <option value="">Select a match...</option>
        {matches.map((match) => (
          <option key={match.id} value={match.id}>
            {match.home_team} vs {match.away_team} - {new Date(match.commence_time).toLocaleString()}
          </option>
        ))}
      </select>
    </div>
  );
};