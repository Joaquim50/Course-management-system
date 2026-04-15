import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import courseRoutes from './routes/course.routes';
import testRoutes from './routes/test.routes';
import attemptRoutes from './routes/attempt.routes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/tests', testRoutes);
app.use('/attempts', attemptRoutes);

// Simple global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
