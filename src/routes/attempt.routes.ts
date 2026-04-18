import { Router } from 'express';
import { submitTest, getAttemptsByCourse, getAttemptById, getAllAttempts, deleteAttempt } from '../controllers/attempt.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/submit', authenticate, submitTest);
router.get('/course/:courseId', authenticate, getAttemptsByCourse);
router.get('/all', authenticate, requireAdmin, getAllAttempts);
router.get('/:attemptId', authenticate, getAttemptById);
router.delete('/:id', authenticate, requireAdmin, deleteAttempt);

export default router;
