import { registerForEvent } from '../src/services/registrationService';
import { ValidationError, ClientError } from '../src/utils/errors';

jest.mock('../src/models', () => ({
  Event: {
    findOne: jest.fn(),
  },
  Registration: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

import { Event, Registration } from '../src/models';

const futureDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const mockEvent = {
  id: 1,
  uuid: 'event-uuid-1',
  name: 'Test Event',
  capacity: 100,
  deadline: futureDeadline,
  registrations: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('registerForEvent', () => {
  it('throws ValidationError for invalid email', async () => {
    await expect(
      registerForEvent('event-uuid-1', 'not-an-email')
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError for empty email', async () => {
    await expect(
      registerForEvent('event-uuid-1', '')
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError for missing eventUuid', async () => {
    await expect(
      registerForEvent('', 'test@example.com')
    ).rejects.toThrow(ValidationError);
  });

  it('throws ClientError when event is not found', async () => {
    (Event.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      registerForEvent('non-existent', 'test@example.com')
    ).rejects.toThrow(ClientError);
  });

  it('throws ClientError when deadline has passed', async () => {
    const expiredEvent = { ...mockEvent, deadline: new Date('2000-01-01') };
    (Event.findOne as jest.Mock).mockResolvedValue(expiredEvent);

    await expect(
      registerForEvent('event-uuid-1', 'test@example.com')
    ).rejects.toThrow(ClientError);
  });

  it('throws ClientError when event is at full capacity', async () => {
    const fullEvent = { ...mockEvent, capacity: 2, registrations: [{ id: 1 }, { id: 2 }] };
    (Event.findOne as jest.Mock).mockResolvedValue(fullEvent);

    await expect(
      registerForEvent('event-uuid-1', 'test@example.com')
    ).rejects.toThrow(ClientError);
  });

  it('throws ClientError when email is already registered', async () => {
    (Event.findOne as jest.Mock).mockResolvedValue(mockEvent);
    (Registration.findOne as jest.Mock).mockResolvedValue({ id: 1, emailAddress: 'test@example.com' });

    await expect(
      registerForEvent('event-uuid-1', 'test@example.com')
    ).rejects.toThrow(ClientError);
  });

  it('returns registrationNo 00001 for first registration', async () => {
    (Event.findOne as jest.Mock).mockResolvedValue(mockEvent);
    (Registration.findOne as jest.Mock)
      .mockResolvedValueOnce(null)  // duplicate check
      .mockResolvedValueOnce(null); // last registration
    (Registration.create as jest.Mock).mockResolvedValue({
      uuid: 'reg-uuid-1',
      registrationNo: '00001',
    });

    const result = await registerForEvent('event-uuid-1', 'test@example.com');
    expect(result.registrationNo).toBe('00001');
  });

  it('increments registration number for subsequent registrations', async () => {
    (Event.findOne as jest.Mock).mockResolvedValue(mockEvent);
    (Registration.findOne as jest.Mock)
      .mockResolvedValueOnce(null)  // duplicate check
      .mockResolvedValueOnce({ registrationNo: '00005' }); // last registration
    (Registration.create as jest.Mock).mockResolvedValue({
      uuid: 'reg-uuid-2',
      registrationNo: '00006',
    });

    const result = await registerForEvent('event-uuid-1', 'test@example.com');
    expect(result.registrationNo).toBe('00006');
    const createCall = (Registration.create as jest.Mock).mock.calls[0][0];
    expect(createCall.registrationNo).toBe('00006');
  });

  it('pads registration number with leading zeros', async () => {
    (Event.findOne as jest.Mock).mockResolvedValue(mockEvent);
    (Registration.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    (Registration.create as jest.Mock).mockImplementation(async (data) => ({
      uuid: 'reg-uuid-3',
      registrationNo: data.registrationNo,
    }));

    const result = await registerForEvent('event-uuid-1', 'user@example.com');
    expect(result.registrationNo).toMatch(/^\d{5}$/);
    expect(result.registrationNo).toBe('00001');
  });
});
