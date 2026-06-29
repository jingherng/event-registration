import { Employee, Event, Registration } from '../models';
import { validateAndGetAddress } from './onemapService';
import { ValidationError, ClientError } from '../utils/errors';
import logger from '../utils/logger';

export interface CreateEventInput {
  name: string;
  dateTime: string;
  postalCode: string;
  deadline: string;
  capacity: number;
  handlerUuid: string;
}

export interface AdminEventListParams {
  page: number;
  search?: string;
  open?: boolean;
}

export async function getAdminEvents(params: AdminEventListParams) {
  const { page, search, open } = params;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  const now = new Date();

  const events = await Event.findAll({
    include: [
      {
        model: Employee,
        as: 'handler',
        attributes: ['uuid', 'name'],
      },
      {
        model: Registration,
        as: 'registrations',
        attributes: ['id'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  let mapped = events.map((event: any) => {
    const regCount: number = (event.registrations || []).length;
    const isOpen = event.deadline > now && regCount < event.capacity;
    return {
      uuid: event.uuid as string,
      createdAt: event.createdAt as Date,
      name: event.name as string,
      dateTime: event.dateTime as Date,
      address: event.address as string,
      deadline: event.deadline as Date,
      capacity: event.capacity as number,
      registrationCount: regCount,
      handler: {
        uuid: event.handler.uuid as string,
        name: event.handler.name as string,
      },
      isOpen,
    };
  });

  if (search) {
    const q = search.toLowerCase();
    mapped = mapped.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.address.toLowerCase().includes(q) ||
        e.handler.name.toLowerCase().includes(q)
    );
  }

  if (open === true) {
    mapped = mapped.filter((e) => e.isOpen);
  }

  const total = mapped.length;
  const paginatedEvents = mapped.slice(offset, offset + pageSize);

  // Remove internal isOpen flag from response
  const responseEvents = paginatedEvents.map(({ isOpen: _isOpen, ...rest }) => rest);

  return { total, events: responseEvents };
}

export async function createEvent(input: CreateEventInput) {
  const { name, dateTime, postalCode, deadline, capacity, handlerUuid } = input;

  if (!name || !dateTime || !postalCode || !deadline || !capacity || !handlerUuid) {
    throw new ValidationError('All fields are required');
  }

  if (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0) {
    throw new ValidationError('Capacity must be a positive integer');
  }

  const deadlineDate = new Date(deadline);
  const dateTimeDate = new Date(dateTime);

  if (isNaN(deadlineDate.getTime())) {
    throw new ValidationError('Invalid deadline date');
  }
  if (isNaN(dateTimeDate.getTime())) {
    throw new ValidationError('Invalid event date/time');
  }
  if (dateTimeDate <= new Date()) {
    throw new ValidationError('Event date & time must be in the future');
  }
  if (deadlineDate <= new Date()) {
    throw new ValidationError('Deadline must be in the future');
  }
  if (deadlineDate >= dateTimeDate) {
    throw new ValidationError('Deadline must be before the event date/time');
  }

  const existing = await Event.findOne({ where: { name } });
  if (existing) {
    throw new ValidationError('Event name must be unique');
  }

  const handler = await Employee.findOne({ where: { uuid: handlerUuid } });
  if (!handler) {
    throw new ClientError('Handler not found');
  }

  // Check handler does not already handle an open event
  const now = new Date();
  const handlerEvents = await Event.findAll({
    where: { handlerId: handler.id },
    include: [{ model: Registration, as: 'registrations', attributes: ['id'] }],
  });

  const hasOpenEvent = handlerEvents.some((e: any) => {
    const regCount: number = (e.registrations || []).length;
    return e.deadline > now && regCount < e.capacity;
  });

  if (hasOpenEvent) {
    throw new ValidationError('Handler already has an open event');
  }

  const address = await validateAndGetAddress(postalCode);

  const event = await Event.create({
    name,
    dateTime: dateTimeDate,
    address,
    postalCode,
    deadline: deadlineDate,
    capacity: Number(capacity),
    handlerId: handler.id,
  });

  logger.info(`Event created: ${event.uuid}`);
  return event;
}

export async function getPublicEvents() {
  const now = new Date();

  const events = await Event.findAll({
    include: [
      {
        model: Registration,
        as: 'registrations',
        attributes: ['id'],
      },
    ],
    order: [['name', 'ASC']],
  });

  return events
    .filter((event: any) => {
      const regCount: number = (event.registrations || []).length;
      return event.deadline > now && regCount < event.capacity;
    })
    .map((event: any) => ({
      uuid: event.uuid as string,
      name: event.name as string,
      dateTime: event.dateTime as Date,
      address: event.address as string,
      deadline: event.deadline as Date,
    }));
}

export async function getEventTrend(uuid: string) {
  const event = await Event.findOne({ where: { uuid } });
  if (!event) {
    throw new ClientError('Event not found');
  }

  const registrations = await Registration.findAll({
    where: { eventId: event.id },
    attributes: ['createdAt'],
    order: [['createdAt', 'ASC']],
  });

  const startDate = new Date(event.createdAt);
  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(event.deadline);
  endDate.setUTCHours(0, 0, 0, 0);

  const result: { date: string; registrationCount: number; newRegistrationCount: number }[] = [];
  let cumulativeCount = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const newRegs = registrations.filter((r) => {
      const d = new Date(r.createdAt as Date);
      return d.toISOString().split('T')[0] === dateStr;
    });
    cumulativeCount += newRegs.length;
    result.push({
      date: dateStr,
      registrationCount: cumulativeCount,
      newRegistrationCount: newRegs.length,
    });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
}

export async function getEmployees() {
  return Employee.findAll({ attributes: ['uuid', 'name'], order: [['name', 'ASC']] });
}
