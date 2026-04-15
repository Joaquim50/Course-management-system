import { Router } from 'express';
import { createTest, getTestsByCourseId } from '../controllers/test.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:courseId', authenticate, getTestsByCourseId);
router.post('/', authenticate, requireAdmin, createTest);

export default router;
