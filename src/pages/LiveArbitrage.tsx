import React from 'react';
import { useQuery } from 'react-query';
import { fetchLiveMatches, getBookmakerOdds } from '../services/api';
import { Match, BookmakerOdds } from '../types';
import { calculateArbitrage } from '../utils/arbitrageCalculator';
import { Calculator, TrendingUp, ChevronDown, ChevronUp, Building2, RefreshCw } from 'lucide-react';

interface MatchWithArbitrage {
  match: Match;
  arbitrageResult: ReturnType<typeof calculateArbitrage>;
  bestOdds: {
    home: number;
    draw: number;
    away: number;
  };
  bookmakerOdds: BookmakerOdds[];
}

export const LiveArbitrage: React.FC = () => {
  const [investment, setInvestment] = React.useState<number>(1000);
  const [expandedCards, setExpandedCards] = React.useState<Set<string>>(new Set());

  const { data: matches, error, isLoading, refetch } = useQuery(
    'liveMatches',
    fetchLiveMatches,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const toggleCard = (matchId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(matchId)) {
        newSet.delete(matchId);
      } else {
        newSet.add(matchId);
      }
      return newSet;
    });
  };

  const analyzedMatches = React.useMemo(() => {
    if (!matches) return [];

    return matches.map(match => {
      const bookmakerOdds = getBookmakerOdds(match);
      const bestOdds = {
        home: Math.max(...bookmakerOdds.map(b => b.homeOdds)),
        draw: Math.max(...bookmakerOdds.map(b => b.drawOdds)),
        away: Math.max(...bookmakerOdds.map(b => b.awayOdds)),
      };

      const arbitrageResult = calculateArbitrage(
        bestOdds.home,
        bestOdds.draw,
        bestOdds.away,
        investment
      );

      return {
        match,
        arbitrageResult,
        bestOdds,
        bookmakerOdds,
      };
    })
    .filter(item => item.arbitrageResult.exists)
    .sort((a, b) => b.arbitrageResult.profit - a.arbitrageResult.profit);
  }, [matches, investment]);

  const profitSummary = React.useMemo(() => {
    return analyzedMatches.reduce((summary, item) => {
      return {
        totalProfit: summary.totalProfit + item.arbitrageResult.profit,
        totalInvestment: summary.totalInvestment + item.arbitrageResult.totalInvestment,
        opportunities: summary.opportunities + 1,
        bestROI: Math.max(summary.bestROI, 
          (item.arbitrageResult.profit / item.arbitrageResult.totalInvestment) * 100
        ),
      };
    }, {
      totalProfit: 0,
      totalInvestment: 0,
      opportunities: 0,
      bestROI: 0,
    });
  }, [analyzedMatches]);

  const getBestBookmaker = (odds: BookmakerOdds[], type: 'home' | 'draw' | 'away'): BookmakerOdds => {
    return odds.reduce((best, current) => {
      const currentOdd = current[`${type}Odds`];
      const bestOdd = best[`${type}Odds`];
      return currentOdd > bestOdd ? current : best;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md space-y-2">
          <p className="text-red-700 font-medium">
            {error instanceof Error ? error.message : 'Failed to load matches'}
          </p>
          <p className="text-sm text-red-600">
            Note: Live betting data might be limited based on API availability and match schedules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Live Betting Arbitrage</h1>
        <button
          onClick={() => refetch()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Odds
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <Calculator className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Investment Amount</h3>
        </div>
        <input
          type="number"
          value={investment}
          onChange={(e) => setInvestment(Math.max(0, Number(e.target.value)))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          min="1"
          step="100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Live Opportunities ({analyzedMatches.length})
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {matches?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-2">No live matches found at the moment.</p>
                  <p className="text-sm text-gray-500">
                    Live matches will appear here during active game times.
                  </p>
                </div>
              ) : analyzedMatches.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-2">
                    Found {matches?.length} live matches, but no arbitrage opportunities.
                  </p>
                  <p className="text-sm text-gray-500">
                    Keep checking back as odds change during the games.
                  </p>
                </div>
              ) : (
                analyzedMatches.map((item) => (
                  <div
                    key={item.match.id}
                    className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Match card content - same as UpcomingArbitrage */}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
            <div className="flex items-center mb-6">
              <Calculator className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">
                Live Profit Summary
              </h3>
            </div>

            {/* Summary content - same as UpcomingArbitrage */}
          </div>
        </div>
      </div>
    </div>
  );
}; 