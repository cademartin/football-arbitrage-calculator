import { calculateArbitrage } from '../arbitrageCalculator';

describe('arbitrageCalculator', () => {
  test('should detect arbitrage opportunity when one exists', () => {
    const result = calculateArbitrage(3.0, 3.5, 3.0, 1000);
    expect(result.exists).toBe(true);
    expect(result.profit).toBeGreaterThan(0);
  });

  test('should return no arbitrage when odds are unfavorable', () => {
    const result = calculateArbitrage(1.5, 2.0, 2.0, 1000);
    expect(result.exists).toBe(false);
    expect(result.profit).toBe(0);
  });

  test('stakes should sum up to total investment', () => {
    const investment = 1000;
    const result = calculateArbitrage(3.0, 3.5, 3.0, investment);
    const totalStakes = result.stakes.home + result.stakes.draw + result.stakes.away;
    expect(Math.round(totalStakes)).toBe(investment);
  });
}); 