import React from 'react';
import { useQuery } from 'react-query';
import { fetchUpcomingMatches, getBookmakerOdds } from '../services/api';
import { Match, BookmakerOdds } from '../types';
import { calculateArbitrage } from '../utils/arbitrageCalculator';
import { Calculator, TrendingUp, ChevronDown, ChevronUp, Building2 } from 'lucide-react';

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

export const UpcomingArbitrage: React.FC = () => {
  const [investment, setInvestment] = React.useState<number>(1000);
  const [expandedCards, setExpandedCards] = React.useState<Set<string>>(new Set());
  const { data: matches, error, isLoading } = useQuery('upcomingMatches', fetchUpcomingMatches);

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
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <p className="text-red-700">
            {error instanceof Error ? error.message : 'Failed to load matches'}
          </p>
        </div>
      </div>
    );
  }

  const getBestBookmaker = (odds: BookmakerOdds[], type: 'home' | 'draw' | 'away'): BookmakerOdds => {
    return odds.reduce((best, current) => {
      const currentOdd = current[`${type}Odds`];
      const bestOdd = best[`${type}Odds`];
      return currentOdd > bestOdd ? current : best;
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
                  Arbitrage Opportunities ({analyzedMatches.length})
                </h3>
              </div>
            </div>
            
            <div className="space-y-4">
              {analyzedMatches.length === 0 ? (
                <p className="text-gray-600">No arbitrage opportunities found at the moment.</p>
              ) : (
                analyzedMatches.map((item) => (
                  <div
                    key={item.match.id}
                    className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleCard(item.match.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {item.match.home_team} vs {item.match.away_team}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(item.match.commence_time).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className="text-green-600 font-semibold mr-2">
                            +${item.arbitrageResult.profit.toFixed(2)}
                          </span>
                          {expandedCards.has(item.match.id) ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {expandedCards.has(item.match.id) && (
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-3 rounded-md">
                              <div className="text-sm font-medium text-gray-600">Home</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {item.bestOdds.home.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <Building2 className="w-3 h-3 mr-1" />
                                {getBestBookmaker(item.bookmakerOdds, 'home').name}
                              </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <div className="text-sm font-medium text-gray-600">Draw</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {item.bestOdds.draw.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <Building2 className="w-3 h-3 mr-1" />
                                {getBestBookmaker(item.bookmakerOdds, 'draw').name}
                              </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <div className="text-sm font-medium text-gray-600">Away</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {item.bestOdds.away.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <Building2 className="w-3 h-3 mr-1" />
                                {getBestBookmaker(item.bookmakerOdds, 'away').name}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                            <div>
                              <h5 className="font-medium text-gray-700 mb-2">Required Stakes</h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Home:</span>
                                  <span className="font-medium">${item.arbitrageResult.stakes.home.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Draw:</span>
                                  <span className="font-medium">${item.arbitrageResult.stakes.draw.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Away:</span>
                                  <span className="font-medium">${item.arbitrageResult.stakes.away.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-700 mb-2">Returns</h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Investment:</span>
                                  <span className="font-medium">${item.arbitrageResult.totalInvestment.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Profit:</span>
                                  <span className="font-medium text-green-600">
                                    ${item.arbitrageResult.profit.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">ROI:</span>
                                  <span className="font-medium text-green-600">
                                    {((item.arbitrageResult.profit / item.arbitrageResult.totalInvestment) * 100).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-md">
                            <h5 className="font-medium text-gray-700 mb-2">All Bookmaker Odds</h5>
                            <div className="space-y-2">
                              {item.bookmakerOdds.map((bookie, index) => (
                                <div key={index} className="grid grid-cols-4 text-sm">
                                  <div className="font-medium text-gray-600">{bookie.name}</div>
                                  <div>{bookie.homeOdds.toFixed(2)}</div>
                                  <div>{bookie.drawOdds.toFixed(2)}</div>
                                  <div>{bookie.awayOdds.toFixed(2)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
                Total Profit Summary
              </h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-green-600 mb-1">
                    Total Profit
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    ${profitSummary.totalProfit.toFixed(2)}
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-600 mb-1">
                    Opportunities
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {profitSummary.opportunities}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Investment Required</span>
                  <span className="font-semibold">
                    ${profitSummary.totalInvestment.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Average Profit per Trade</span>
                  <span className="font-semibold text-green-600">
                    ${(profitSummary.totalProfit / profitSummary.opportunities || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Best ROI Found</span>
                  <span className="font-semibold text-green-600">
                    {profitSummary.bestROI.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Overall ROI</span>
                  <span className="font-semibold text-green-600">
                    {((profitSummary.totalProfit / profitSummary.totalInvestment) * 100 || 0).toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-yellow-800">
                  <strong>Note:</strong> These calculations assume all opportunities 
                  can be taken simultaneously. Market conditions may change rapidly.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 