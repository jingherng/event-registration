import { Event, Registration } from '../models';
import { ValidationError, ClientError } from '../utils/errors';
import logger from '../utils/logger';

export async function registerForEvent(eventUuid: string, emailAddress: string) {
  if (!emailAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
    throw new ValidationError('Invalid email address');
  }

  if (!eventUuid) {
    throw new ValidationError('Event UUID is required');
  }

  const event = await Event.findOne({
    where: { uuid: eventUuid },
    include: [{ model: Registration, as: 'registrations', attributes: ['id'] }],
  });

  if (!event) {
    throw new ClientError('Event not found');
  }

  const now = new Date();
  const regCount: number = (event as any).registrations.length;

  if (event.deadline <= now) {
    throw new ClientError('Registration deadline has passed');
  }

  if (regCount >= event.capacity) {
    throw new ClientError('Event is at full capacity');
  }

  const existingReg = await Registration.findOne({
    where: { eventId: event.id, emailAddress },
  });
  if (existingReg) {
    throw new ClientError('This email address is already registered for this event');
  }

  // Generate 5-digit running registration number unique to event
  const lastReg = await Registration.findOne({
    where: { eventId: event.id },
    order: [['registrationNo', 'DESC']],
  });

  const nextNum = lastReg ? parseInt(lastReg.registrationNo, 10) + 1 : 1;
  const registrationNo = String(nextNum).padStart(5, '0');

  const registration = await Registration.create({
    eventId: event.id,
    emailAddress,
    registrationNo,
  });

  logger.info(`Registration created: ${registration.uuid} for event ${eventUuid}`);
  return { registrationNo: registration.registrationNo };
}
