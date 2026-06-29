import express from 'express';
import cors from 'cors';
import adminRoutes from './routes/admin';
import publicRoutes from './routes/public';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

app.use(errorHandler);

export default app;
