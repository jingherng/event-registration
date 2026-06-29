import { getAdminEvents, createEvent, getPublicEvents, getEventTrend } from '../src/services/eventService';
import { ValidationError, ClientError } from '../src/utils/errors';

// Mock dependencies
jest.mock('../src/models', () => ({
  Employee: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
  Event: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Registration: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../src/services/onemapService', () => ({
  validateAndGetAddress: jest.fn(),
}));

jest.mock('../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

import { Employee, Event, Registration } from '../src/models';
import * as onemapService from '../src/services/onemapService';

const mockEmployee = { id: 1, uuid: 'emp-uuid-1', name: 'Alice Johnson' };
const mockEvent = {
  id: 1,
  uuid: 'event-uuid-1',
  name: 'Test Event',
  dateTime: new Date('2026-12-01T10:00:00Z'),
  address: '1 Test Street, SINGAPORE 123456',
  postalCode: '123456',
  deadline: new Date('2026-11-30T00:00:00Z'),
  capacity: 100,
  handlerId: 1,
  createdAt: new Date('2026-06-01T00:00:00Z'),
  updatedAt: new Date('2026-06-01T00:00:00Z'),
  handler: mockEmployee,
  registrations: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getAdminEvents', () => {
  it('returns paginated events', async () => {
    (Event.findAll as jest.Mock).mockResolvedValue([mockEvent]);

    const result = await getAdminEvents({ page: 1 });

    expect(result.total).toBe(1);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].uuid).toBe('event-uuid-1');
    expect(result.events[0].handler.name).toBe('Alice Johnson');
  });

  it('filters by search term in name', async () => {
    (Event.findAll as jest.Mock).mockResolvedValue([mockEvent]);

    const result = await getAdminEvents({ page: 1, search: 'Test' });
    expect(result.events).toHaveLength(1);
  });

  it('excludes events that do not match search', async () => {
    (Event.findAll as jest.Mock).mockResolvedValue([mockEvent]);

    const result = await getAdminEvents({ page: 1, search: 'ZZZNotExists' });
    expect(result.events).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('filters open events only when open=true', async () => {
    const closedEvent = {
      ...mockEvent,
      uuid: 'closed-event',
      deadline: new Date('2000-01-01'), // past deadline
    };
    (Event.findAll as jest.Mock).mockResolvedValue([mockEvent, closedEvent]);

    const result = await getAdminEvents({ page: 1, open: true });
    expect(result.events).toHaveLength(1);
    expect(result.events[0].uuid).toBe('event-uuid-1');
  });

  it('includes all events when open filter is not set', async () => {
    const closedEvent = {
      ...mockEvent,
      uuid: 'closed-event',
      deadline: new Date('2000-01-01'),
    };
    (Event.findAll as jest.Mock).mockResolvedValue([mockEvent, closedEvent]);

    const result = await getAdminEvents({ page: 1 });
    expect(result.total).toBe(2);
  });

  it('calculates registrationCount from registrations array', async () => {
    const eventWithRegs = {
      ...mockEvent,
      registrations: [{ id: 1 }, { id: 2 }, { id: 3 }],
    };
    (Event.findAll as jest.Mock).mockResolvedValue([eventWithRegs]);

    const result = await getAdminEvents({ page: 1 });
    expect(result.events[0].registrationCount).toBe(3);
  });

  it('marks event as closed when capacity reached', async () => {
    const fullEvent = {
      ...mockEvent,
      capacity: 2,
      registrations: [{ id: 1 }, { id: 2 }],
    };
    (Event.findAll as jest.Mock).mockResolvedValue([fullEvent]);

    const result = await getAdminEvents({ page: 1, open: true });
    expect(result.events).toHaveLength(0);
  });

  it('paginates results correctly', async () => {
    const events = Array.from({ length: 15 }, (_, i) => ({
      ...mockEvent,
      uuid: `event-${i}`,
      name: `Event ${i}`,
    }));
    (Event.findAll as jest.Mock).mockResolvedValue(events);

    const page1 = await getAdminEvents({ page: 1 });
    expect(page1.events).toHaveLength(10);
    expect(page1.total).toBe(15);

    const page2 = await getAdminEvents({ page: 2 });
    expect(page2.events).toHaveLength(5);
  });
});

describe('createEvent', () => {
  const validInput = {
    name: 'New Event',
    dateTime: '2027-01-15T10:00:00Z',
    postalCode: '018989',
    deadline: '2027-01-10T00:00:00Z',
    capacity: 50,
    handlerUuid: 'emp-uuid-1',
  };

  it('throws ValidationError when required fields are missing', async () => {
    await expect(
      createEvent({ ...validInput, name: '' })
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError for non-positive capacity', async () => {
    await expect(
      createEvent({ ...validInput, capacity: -1 })
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when deadline is in the past', async () => {
    await expect(
      createEvent({ ...validInput, deadline: '2020-01-01T00:00:00Z' })
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when deadline is after event date', async () => {
    await expect(
      createEvent({ ...validInput, deadline: '2027-01-20T00:00:00Z', dateTime: '2027-01-15T10:00:00Z' })
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when event name is duplicate', async () => {
    (Event.findOne as jest.Mock).mockResolvedValue(mockEvent);
    await expect(createEvent(validInput)).rejects.toThrow(ValidationError);
  });

  it('throws ClientError when handler not found', async () => {
    (Event.findOne as jest.Mock).mockResolvedValue(null);
    (Employee.findOne as jest.Mock).mockResolvedValue(null);
    await expect(createEvent(validInput)).rejects.toThrow(ClientError);
  });

  it('throws ValidationError when handler already has an open event', async () => {
    (Event.findOne as jest.Mock).mockResolvedValue(null);
    (Employee.findOne as jest.Mock).mockResolvedValue(mockEmployee);
    (Event.findAll as jest.Mock).mockResolvedValue([
      { ...mockEvent, registrations: [], deadline: new Date('2027-06-01'), capacity: 100 },
    ]);
    await expect(createEvent(validInput)).rejects.toThrow(ValidationError);
  });

  it('creates event successfully with valid input', async () => {
    (Event.findOne as jest.Mock).mockResolvedValue(null);
    (Employee.findOne as jest.Mock).mockResolvedValue(mockEmployee);
    (Event.findAll as jest.Mock).mockResolvedValue([]);
    (onemapService.validateAndGetAddress as jest.Mock).mockResolvedValue('1 TEST RD, SINGAPORE 018989');
    (Event.create as jest.Mock).mockResolvedValue({ ...mockEvent, uuid: 'new-event-uuid' });

    const result = await createEvent(validInput);
    expect(Event.create).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

describe('getPublicEvents', () => {
  it('returns only open events', async () => {
    const closedEvent = { ...mockEvent, uuid: 'closed', deadline: new Date('2000-01-01'), registrations: [] };
    (Event.findAll as jest.Mock).mockResolvedValue([mockEvent, closedEvent]);

    const result = await getPublicEvents();
    expect(result).toHaveLength(1);
    expect(result[0].uuid).toBe('event-uuid-1');
  });

  it('excludes events at full capacity', async () => {
    const fullEvent = { ...mockEvent, capacity: 1, registrations: [{ id: 1 }] };
    (Event.findAll as jest.Mock).mockResolvedValue([fullEvent]);

    const result = await getPublicEvents();
    expect(result).toHaveLength(0);
  });

  it('returns correct fields', async () => {
    (Event.findAll as jest.Mock).mockResolvedValue([mockEvent]);

    const result = await getPublicEvents();
    expect(result[0]).toHaveProperty('uuid');
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('dateTime');
    expect(result[0]).toHaveProperty('address');
  });
});

describe('getEventTrend', () => {
  it('throws ClientError when event not found', async () => {
    (Event.findOne as jest.Mock).mockResolvedValue(null);
    await expect(getEventTrend('non-existent')).rejects.toThrow(ClientError);
  });

  it('returns trend data spanning from creation to deadline', async () => {
    const event = {
      ...mockEvent,
      createdAt: new Date('2026-06-01T00:00:00Z'),
      deadline: new Date('2026-06-03T23:59:59Z'),
    };
    (Event.findOne as jest.Mock).mockResolvedValue(event);
    (Registration.findAll as jest.Mock).mockResolvedValue([
      { createdAt: new Date('2026-06-02T10:00:00Z') },
    ]);

    const result = await getEventTrend('event-uuid-1');
    expect(result).toHaveLength(3); // June 1, 2, 3
    expect(result[1].newRegistrationCount).toBe(1);
    expect(result[2].registrationCount).toBe(1);
  });

  it('shows cumulative registration count', async () => {
    const event = {
      ...mockEvent,
      createdAt: new Date('2026-06-01T00:00:00Z'),
      deadline: new Date('2026-06-02T23:59:59Z'),
    };
    (Event.findOne as jest.Mock).mockResolvedValue(event);
    (Registration.findAll as jest.Mock).mockResolvedValue([
      { createdAt: new Date('2026-06-01T09:00:00Z') },
      { createdAt: new Date('2026-06-01T10:00:00Z') },
      { createdAt: new Date('2026-06-02T11:00:00Z') },
    ]);

    const result = await getEventTrend('event-uuid-1');
    expect(result[0].newRegistrationCount).toBe(2);
    expect(result[0].registrationCount).toBe(2);
    expect(result[1].newRegistrationCount).toBe(1);
    expect(result[1].registrationCount).toBe(3);
  });
});
