import axios, { AxiosError } from 'axios';
import { Match, BookmakerOdds } from '../types';

const API_KEY = "92be5f2092808e096a11ddaa73648b97";
const BASE_URL = 'https://api.the-odds-api.com/v4/sports';

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

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

interface Sport {
  key: string;
  has_live_games: boolean;
}

export const fetchUpcomingMatches = async (): Promise<Match[]> => {
  try {
    const response = await api.get('/upcoming/odds', {
      params: {
        apiKey: API_KEY,
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

export const fetchLiveMatches = async (): Promise<Match[]> => {
  try {
    // First, get all available soccer competitions
    const sportsResponse = await api.get('/sports', {
      params: { apiKey: API_KEY }
    });

    // Filter for soccer competitions only
    const soccerSports = sportsResponse.data.filter(
      (sport: any) => sport.key.includes('soccer') && sport.active
    );

    console.log('Available soccer competitions:', soccerSports);

    // Fetch odds for each soccer competition
    const matchPromises = soccerSports.map(sport => 
      api.get(`/${sport.key}/odds`, {
        params: {
          apiKey: API_KEY,
          regions: 'eu',
          markets: 'h2h',
          oddsFormat: 'decimal',
          dateFormat: 'iso'
        }
      })
    );

    const responses = await Promise.all(matchPromises);
    
    // Filter for matches that are currently in-play
    const now = new Date();
    const allMatches = responses.flatMap(response => response.data || []);
    const liveMatches = allMatches.filter((match: Match) => {
      const matchTime = new Date(match.commence_time);
      // Consider a match "live" if it started within the last 2 hours
      return matchTime <= now && matchTime >= new Date(now.getTime() - 2 * 60 * 60 * 1000);
    });

    console.log('Found live matches:', liveMatches);

    return liveMatches;
  } catch (error) {
    console.error('Error fetching live matches:', error);
    handleApiError(error);
    return [];
  }
};

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