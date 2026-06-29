import { Router } from 'express';
import { listEvents, addEvent, getEventTrend, listEmployees } from '../controllers/adminController';

const router = Router();

router.get('/events', listEvents);
router.post('/events', addEvent);
router.post('/events/:uuid/trend', getEventTrend);
router.get('/employees', listEmployees);

export default router;
