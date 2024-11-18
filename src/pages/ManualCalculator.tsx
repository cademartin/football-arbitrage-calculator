import React from 'react';
import { Calculator, Plus, RefreshCw } from 'lucide-react';

interface Bet {
  odds: string;
  stake: string;
  payout: number;
}

export const ManualCalculator: React.FC = () => {
  const [bets, setBets] = React.useState<Bet[]>([
    { odds: '', stake: '', payout: 0 },
    { odds: '', stake: '', payout: 0 },
  ]);
  const [totalStake, setTotalStake] = React.useState<string>('1000');
  const [calculationResult, setCalculationResult] = React.useState<{
    totalPayout: number;
    totalStake: number;
    profit: number;
    roi: number;
    isArbitrage: boolean;
    margin: number;
  } | null>(null);

  const handleOddsChange = (index: number, value: string) => {
    const newBets = [...bets];
    newBets[index] = {
      ...newBets[index],
      odds: value,
      payout: 0
    };
    setBets(newBets);
    setCalculationResult(null);
  };

  const addBet = () => {
    setBets([...bets, { odds: '', stake: '', payout: 0 }]);
    setCalculationResult(null);
  };

  const reset = () => {
    setBets([
      { odds: '', stake: '', payout: 0 },
      { odds: '', stake: '', payout: 0 },
    ]);
    setTotalStake('1000');
    setCalculationResult(null);
  };

  const calculate = () => {
    const validOdds = bets
      .map(bet => parseFloat(bet.odds))
      .filter(odds => !isNaN(odds) && odds > 1);

    if (validOdds.length < 2) {
      alert('Please enter valid odds (greater than 1) for at least 2 bets');
      return;
    }

    const investment = parseFloat(totalStake);
    if (isNaN(investment) || investment <= 0) {
      alert('Please enter a valid investment amount');
      return;
    }

    // Calculate implied probabilities
    const impliedProbs = validOdds.map(odds => 1 / odds);
    const totalImpliedProb = impliedProbs.reduce((sum, prob) => sum + prob, 0);
    const margin = totalImpliedProb - 1;
    const isArbitrage = margin < 0;

    if (!isArbitrage) {
      setCalculationResult({
        totalPayout: 0,
        totalStake: investment,
        profit: 0,
        roi: 0,
        isArbitrage: false,
        margin: margin * 100
      });
      return;
    }

    // Calculate optimal stakes for arbitrage
    const calculatedBets = bets.map((bet, index) => {
      const odds = validOdds[index];
      if (!odds) return bet;

      const impliedProb = 1 / odds;
      const stake = (investment * impliedProb) / totalImpliedProb;
      const payout = stake * odds;

      return {
        ...bet,
        stake: stake.toFixed(2),
        payout
      };
    });

    setBets(calculatedBets);

    const totalPayout = calculatedBets[0].payout; // All payouts should be equal in perfect arbitrage
    const totalStakeNum = calculatedBets.reduce((sum, bet) => sum + parseFloat(bet.stake || '0'), 0);
    const profit = totalPayout - totalStakeNum;
    const roi = (profit / totalStakeNum) * 100;

    setCalculationResult({
      totalPayout,
      totalStake: totalStakeNum,
      profit,
      roi,
      isArbitrage: true,
      margin: margin * 100
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-green-900 rounded-lg shadow-lg">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4 text-white font-semibold mb-2">
          <div>Enter Odds & Stake</div>
          <div className="text-right">Stake</div>
          <div className="text-right">Payout</div>
          <div></div>
        </div>

        {bets.map((bet, index) => (
          <div key={index} className="grid grid-cols-4 gap-4 items-center">
            <div className="flex items-center">
              <span className="text-white mr-2">Bet {index + 1}</span>
              <input
                type="number"
                value={bet.odds}
                onChange={(e) => handleOddsChange(index, e.target.value)}
                className="w-full bg-black text-white px-3 py-2 rounded"
                placeholder={`Please Enter Bet ${index + 1} Odds`}
                step="0.01"
                min="1.01"
              />
            </div>
            <div className="text-white text-right">
              ${bet.stake || '0.00'}
            </div>
            <div className="text-white text-right">
              ${bet.payout.toFixed(2)}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-4 gap-4 items-center">
          <div className="flex items-center">
            <span className="text-white mr-2">Total Stake ($)</span>
            <input
              type="number"
              value={totalStake}
              onChange={(e) => setTotalStake(e.target.value)}
              className="w-full bg-black text-white px-3 py-2 rounded"
              placeholder="Enter total stake"
              step="100"
              min="1"
            />
          </div>
        </div>

        <div className="flex space-x-4 mt-4">
          <button
            onClick={addBet}
            className="flex items-center px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            MORE BETS
          </button>
          <button
            onClick={reset}
            className="flex items-center px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            RESET
          </button>
        </div>

        <button
          onClick={calculate}
          className="w-full px-6 py-3 bg-green-700 text-white rounded hover:bg-green-600 font-bold text-lg"
        >
          CALCULATE
        </button>

        {calculationResult && (
          <div className="mt-6 space-y-4">
            <div className={`p-4 rounded-lg ${
              calculationResult.isArbitrage ? 'bg-green-800' : 'bg-red-800'
            }`}>
              <div className="text-white font-bold">
                {calculationResult.isArbitrage 
                  ? 'Arbitrage Opportunity Found!'
                  : 'No Arbitrage Opportunity'}
              </div>
              <div className="text-white text-sm">
                Total Margin: {calculationResult.margin.toFixed(2)}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-white">
              <div className="text-right">Total Payout:</div>
              <div className="text-right">${calculationResult.totalPayout.toFixed(2)}</div>
              
              <div className="text-right">Total Stake:</div>
              <div className="text-right">${calculationResult.totalStake.toFixed(2)}</div>
              
              <div className="text-right">Profit:</div>
              <div className="text-right">${calculationResult.profit.toFixed(2)}</div>
              
              <div className="text-right">ROI:</div>
              <div className="text-right">{calculationResult.roi.toFixed(2)}%</div>
            </div>

            {calculationResult.isArbitrage && (
              <div className="bg-green-800 p-4 rounded-lg text-white text-sm">
                <div className="font-bold mb-2">How to place these bets:</div>
                {bets.map((bet, index) => bet.stake && (
                  <div key={index} className="flex justify-between">
                    <span>Bet {index + 1} (Odds: {bet.odds}):</span>
                    <span className="font-bold">${bet.stake}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 