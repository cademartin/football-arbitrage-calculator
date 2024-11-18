export interface Match {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

export interface Market {
  key: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number;
}

export interface BookmakerOdds {
  name: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
}

export interface ArbitrageResult {
  exists: boolean;
  profit: number;
  stakes: {
    home: number;
    draw: number;
    away: number;
  };
  totalInvestment: number;
}