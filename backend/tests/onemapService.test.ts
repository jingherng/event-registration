import { ValidationError } from '../src/utils/errors';
// Logger mock applied for all tests in this file
jest.mock('../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

describe('validateAndGetAddress', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('throws ValidationError for non-6-digit postal code', async () => {
    jest.doMock('axios', () => ({ post: jest.fn(), get: jest.fn() }));
    const { validateAndGetAddress } = require('../src/services/onemapService');
    await expect(validateAndGetAddress('12345')).rejects.toThrow('6-digit');
    await expect(validateAndGetAddress('1234567')).rejects.toThrow('6-digit');
    await expect(validateAndGetAddress('abcdef')).rejects.toThrow('6-digit');
  });

  it('throws Error when OneMap auth fails', async () => {
    jest.doMock('axios', () => ({
      post: jest.fn().mockRejectedValue(new Error('Network error')),
      get: jest.fn(),
    }));
    const { validateAndGetAddress } = require('../src/services/onemapService');
    await expect(validateAndGetAddress('018989')).rejects.toThrow(
      'Failed to authenticate with OneMap API'
    );
  });

  it('throws ValidationError when no results returned', async () => {
    jest.doMock('axios', () => ({
      post: jest.fn().mockResolvedValue({ data: { access_token: 'mock-token' } }),
      get: jest.fn().mockResolvedValue({ data: { results: [] } }),
    }));
    const { validateAndGetAddress } = require('../src/services/onemapService');
    await expect(validateAndGetAddress('999999')).rejects.toThrow('no address found');
  });

  it('returns formatted address for valid postal code', async () => {
    jest.doMock('axios', () => ({
      post: jest.fn().mockResolvedValue({ data: { access_token: 'mock-token' } }),
      get: jest.fn().mockResolvedValue({
        data: {
          results: [
            {
              BLK_NO: '1',
              ROAD_NAME: 'TEST ROAD',
              BUILDING: 'TEST BUILDING',
              POSTAL: '018989',
            },
          ],
        },
      }),
    }));
    const { validateAndGetAddress } = require('../src/services/onemapService');
    const address = await validateAndGetAddress('018989');
    expect(address).toContain('TEST ROAD');
    expect(address).toContain('SINGAPORE 018989');
  });
});
