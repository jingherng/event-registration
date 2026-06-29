import { Request, Response, NextFunction } from 'express';
import * as eventService from '../services/eventService';

export async function listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const search = req.query.search as string | undefined;
    const open = req.query.open === 'true' ? true : undefined;

    const result = await eventService.getAdminEvents({ page, search, open });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function addEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await eventService.createEvent(req.body);
    res.status(200).json(null);
  } catch (error) {
    next(error);
  }
}

export async function getEventTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { uuid } = req.params;
    const trend = await eventService.getEventTrend(uuid);
    res.status(200).json(trend);
  } catch (error) {
    next(error);
  }
}

export async function listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employees = await eventService.getEmployees();
    res.status(200).json(employees);
  } catch (error) {
    next(error);
  }
}
