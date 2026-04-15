import { Router } from 'express';
import { submitTest, getAttemptsByCourse, getAttemptById } from '../controllers/attempt.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/submit', authenticate, submitTest);
router.get('/course/:courseId', authenticate, getAttemptsByCourse);
router.get('/:attemptId', authenticate, getAttemptById);

export default router;
