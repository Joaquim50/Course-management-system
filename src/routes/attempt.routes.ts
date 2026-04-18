import { Router } from 'express';
import { submitTest, getAttemptsByCourse, getAttemptById, getAllAttempts } from '../controllers/attempt.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/submit', authenticate, submitTest);
router.get('/course/:courseId', authenticate, getAttemptsByCourse);
router.get('/all', authenticate, requireAdmin, getAllAttempts);
router.get('/:attemptId', authenticate, getAttemptById);

export default router;
