export const calculateArbitrage = (
  homeOdds: number,
  drawOdds: number,
  awayOdds: number,
  investment: number = 1000
): {
  exists: boolean;
  profit: number;
  stakes: { home: number; draw: number; away: number };
  totalInvestment: number;
} => {
  // Calculate implied probabilities
  const homeProb = 1 / homeOdds;
  const drawProb = 1 / drawOdds;
  const awayProb = 1 / awayOdds;
  
  // Calculate total margin
  const totalMargin = homeProb + drawProb + awayProb;
  
  // Check if arbitrage exists (total margin < 1)
  if (totalMargin >= 1) {
    return {
      exists: false,
      profit: 0,
      stakes: { home: 0, draw: 0, away: 0 },
      totalInvestment: 0
    };
  }
  
  // Calculate individual stakes
  const homeStake = (investment * homeProb) / totalMargin;
  const drawStake = (investment * drawProb) / totalMargin;
  const awayStake = (investment * awayProb) / totalMargin;
  
  // Calculate profit
  const expectedReturn = investment / totalMargin;
  const profit = expectedReturn - investment;
  
  return {
    exists: true,
    profit,
    stakes: {
      home: homeStake,
      draw: drawStake,
      away: awayStake
    },
    totalInvestment: investment
  };
};