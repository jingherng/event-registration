import { Router } from 'express';
import { listOpenEvents, register } from '../controllers/publicController';

const router = Router();

router.get('/events', listOpenEvents);
router.post('/register', register);

export default router;
