import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // Allow client development connections
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(morgan('dev'));

// Liveness probe
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'invisible-queue-server',
    time: new Date().toISOString()
  });
});

// Mount V1 API
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server (only when not running inside Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  Invisible Queue Server running on port ${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/health`);
    console.log(`  API Base:     http://localhost:${PORT}/api/v1`);
    console.log(`===============================================`);
  });
}

export default app;
