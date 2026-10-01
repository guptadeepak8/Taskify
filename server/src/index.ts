import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import apiRouter from './route';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', apiRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${env.PORT}`);
  });
}

export default app;