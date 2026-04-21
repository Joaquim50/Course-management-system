import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import compression from 'compression';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import courseRoutes from './routes/course.routes';
import testRoutes from './routes/test.routes';
import attemptRoutes from './routes/attempt.routes';
import dashboardRoutes from './routes/dashboard.routes';

dotenv.config();

const app = express();
app.use(cors());
app.use(compression()); // Compress all responses
app.use(morgan('dev')); // Log requests for performance monitoring
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/tests', testRoutes);
app.use('/attempts', attemptRoutes);
app.use('/dashboard', dashboardRoutes);

// Simple global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
