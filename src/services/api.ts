import axios, { AxiosError } from 'axios';
import { Match, BookmakerOdds } from '../types';

// API Keys
const ODDS_API_KEY = "92be5f2092808e096a11ddaa73648b97";
const BETFAIR_API_KEY = process.env.VITE_BETFAIR_API_KEY || "";
const SPORTRADAR_KEY = process.env.VITE_SPORTRADAR_KEY || "";
const RAPID_API_KEY = process.env.VITE_RAPID_API_KEY || "";
const PINNACLE_API_KEY = process.env.VITE_PINNACLE_API_KEY || "";
const ONEXBET_API_KEY = process.env.VITE_ONEXBET_API_KEY || "";

// Base URLs
const ODDS_API_URL = 'https://api.the-odds-api.com/v4/sports';
const BETFAIR_URL = 'https://api.betfair.com/exchange/betting/rest/v1.0';
const SPORTRADAR_URL = 'https://api.sportradar.us/odds/v4/en';
const RAPID_API_URL = 'https://live-odds.p.rapidapi.com/v1';
const PINNACLE_URL = 'https://api.pinnacle.com/v1';
const ONEXBET_URL = 'https://1xbet.api-gateway.cloud';

const BLACKLISTED_BOOKMAKERS = ['suprabets'];

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isApiError: boolean = true
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API instances
const oddsApi = axios.create({
  baseURL: ODDS_API_URL,
  timeout: 10000,
});

const betfairApi = axios.create({
  baseURL: BETFAIR_URL,
  timeout: 10000,
  headers: {
    'X-Application': BETFAIR_API_KEY,
    'Accept': 'application/json'
  }
});

const rapidApi = axios.create({
  baseURL: RAPID_API_URL,
  timeout: 10000,
  headers: {
    'X-RapidAPI-Key': RAPID_API_KEY,
    'X-RapidAPI-Host': 'live-odds.p.rapidapi.com'
  }
});

const onexbetApi = axios.create({
  baseURL: ONEXBET_URL,
  timeout: 10000,
  headers: {
    'Authorization': `Bearer ${ONEXBET_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Fetch upcoming matches from The Odds API
export const fetchUpcomingMatches = async (): Promise<Match[]> => {
  try {
    const response = await oddsApi.get('/upcoming/odds', {
      params: {
        apiKey: ODDS_API_KEY,
        regions: 'eu',
        markets: 'h2h',
        oddsFormat: 'decimal',
        dateFormat: 'iso'
      }
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new ApiError('Invalid response format from API');
    }

    return response.data;
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

// Fetch live matches from multiple sources
export const fetchLiveMatches = async (): Promise<Match[]> => {
  try {
    const [betfairMatches, rapidApiMatches, onexbetMatches] = await Promise.allSettled([
      fetchBetfairLiveMatches(),
      fetchRapidApiLiveMatches(),
      fetch1xBetLiveMatches()
    ]);

    const allMatches: Match[] = [];

    if (betfairMatches.status === 'fulfilled') {
      allMatches.push(...betfairMatches.value);
    }
    if (rapidApiMatches.status === 'fulfilled') {
      allMatches.push(...rapidApiMatches.value);
    }
    if (onexbetMatches.status === 'fulfilled') {
      allMatches.push(...onexbetMatches.value);
    }

    const uniqueMatches = removeDuplicateMatches(allMatches);
    console.log('Found live matches:', uniqueMatches.length);
    return uniqueMatches;

  } catch (error) {
    handleApiError(error);
    return [];
  }
};

// Betfair live matches
async function fetchBetfairLiveMatches(): Promise<Match[]> {
  try {
    const response = await betfairApi.get('/listEvents', {
      params: {
        filter: {
          eventTypeIds: ['1'], // Soccer
          inPlayOnly: true
        }
      }
    });

    return response.data.map((event: any) => ({
      id: `betfair_${event.event.id}`,
      sport_key: 'soccer',
      sport_title: 'Soccer',
      commence_time: event.event.openDate,
      home_team: event.event.name.split(' v ')[0],
      away_team: event.event.name.split(' v ')[1],
      bookmakers: [{
        key: 'betfair',
        title: 'Betfair',
        markets: event.markets
      }]
    }));
  } catch (error) {
    console.error('Betfair API error:', error);
    return [];
  }
}

// RapidAPI live matches
async function fetchRapidApiLiveMatches(): Promise<Match[]> {
  try {
    const response = await rapidApi.get('/events/live', {
      params: {
        sport: 'soccer',
        region: 'eu'
      }
    });

    return response.data.events.map((event: any) => ({
      id: `rapid_${event.event_id}`,
      sport_key: 'soccer',
      sport_title: 'Soccer',
      commence_time: event.start_time,
      home_team: event.home_team,
      away_team: event.away_team,
      bookmakers: event.bookmakers
    }));
  } catch (error) {
    console.error('RapidAPI error:', error);
    return [];
  }
}

// 1xBet live matches
async function fetch1xBetLiveMatches(): Promise<Match[]> {
  try {
    const response = await onexbetApi.get('/sports/live', {
      params: {
        sport: 'Soccer',
        market_type: 'match_odds'
      }
    });

    return response.data.events.map((event: any) => ({
      id: `1xbet_${event.id}`,
      sport_key: 'soccer',
      sport_title: 'Soccer',
      commence_time: event.startTime,
      home_team: event.home.name,
      away_team: event.away.name,
      bookmakers: [{
        key: '1xbet',
        title: '1xBet',
        markets: [{
          key: 'h2h',
          outcomes: [
            {
              name: event.home.name,
              price: event.markets.match_odds.home
            },
            {
              name: 'Draw',
              price: event.markets.match_odds.draw
            },
            {
              name: event.away.name,
              price: event.markets.match_odds.away
            }
          ]
        }]
      }]
    }));
  } catch (error) {
    console.error('1xBet API error:', error);
    return [];
  }
}

// Remove duplicate matches based on team names
function removeDuplicateMatches(matches: Match[]): Match[] {
  const seen = new Set();
  return matches.filter(match => {
    const key = `${match.home_team}_${match.away_team}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const handleApiError = (error: unknown) => {
  console.error('API Error:', error);

  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      throw new ApiError('Invalid API key or unauthorized access', 401);
    }
    if (error.response?.status === 429) {
      throw new ApiError('API rate limit exceeded. Please try again later.', 429);
    }
    if (error.response?.status === 404) {
      throw new ApiError('API endpoint not found', 404);
    }
    throw new ApiError(
      `API Error: ${error.response?.data?.message || error.message}`,
      error.response?.status
    );
  }

  throw new ApiError('Failed to fetch matches. Please try again later.', 500);
};

export const getBookmakerOdds = (match: Match): BookmakerOdds[] => {
  if (!match.bookmakers?.length) {
    return [];
  }

  return match.bookmakers
    .filter(bookmaker => !BLACKLISTED_BOOKMAKERS.includes(bookmaker.key.toLowerCase()))
    .map(bookmaker => {
      const market = bookmaker.markets?.[0];
      if (!market?.outcomes?.length) {
        return {
          name: bookmaker.title,
          homeOdds: 0,
          drawOdds: 0,
          awayOdds: 0,
        };
      }

      return {
        name: bookmaker.title,
        homeOdds: market.outcomes.find(o => o.name === match.home_team)?.price || 0,
        drawOdds: market.outcomes.find(o => o.name === 'Draw')?.price || 0,
        awayOdds: market.outcomes.find(o => o.name === match.away_team)?.price || 0,
      };
    });
};