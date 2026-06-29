import { Request, Response, NextFunction } from 'express';
import * as eventService from '../services/eventService';
import * as registrationService from '../services/registrationService';

export async function listOpenEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const events = await eventService.getPublicEvents();
    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { eventUuid, emailAddress } = req.body;
    const result = await registrationService.registerForEvent(eventUuid, emailAddress);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
