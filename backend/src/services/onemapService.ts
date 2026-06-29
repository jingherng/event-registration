import axios from 'axios';
import logger from '../utils/logger';
import { ValidationError } from '../utils/errors';

const ONEMAP_AUTH_URL = 'https://www.onemap.gov.sg/api/auth/post/getToken';
const ONEMAP_SEARCH_URL = 'https://www.onemap.gov.sg/api/common/elastic/search';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  try {
    const response = await axios.post(ONEMAP_AUTH_URL, {
      email: process.env.ONEMAP_EMAIL,
      password: process.env.ONEMAP_PASSWORD,
    });
    cachedToken = response.data.access_token;
    // Cache for 2 days (token valid for 3 days)
    tokenExpiry = Date.now() + 2 * 24 * 60 * 60 * 1000;
    return cachedToken as string;
  } catch (error) {
    logger.error('Failed to get OneMap token', error);
    throw new Error('Failed to authenticate with OneMap API');
  }
}

export async function validateAndGetAddress(postalCode: string): Promise<string> {
  if (!/^\d{6}$/.test(postalCode)) {
    throw new ValidationError('Postal code must be a 6-digit number');
  }

  const token = await getToken();

  try {
    const response = await axios.get(ONEMAP_SEARCH_URL, {
      params: {
        searchVal: postalCode,
        returnGeom: 'N',
        getAddrDetails: 'Y',
        pageNum: 1,
      },
      headers: {
        Authorization: token,
      },
    });

    const results = response.data.results;
    if (!results || results.length === 0) {
      throw new ValidationError('Invalid postal code: no address found');
    }

    const first = results[0];
    const parts = [first.BLK_NO, first.ROAD_NAME, first.BUILDING, `SINGAPORE ${first.POSTAL}`]
      .filter((p: string) => p && p.trim() !== '' && p.trim() !== 'NIL');
    return parts.join(', ');
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    logger.error('OneMap search failed', error);
    throw new Error('Failed to validate postal code with OneMap');
  }
}
