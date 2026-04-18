import { Router } from 'express';
import { createTest, getTestsByCourseId, updateTest, deleteTest } from '../controllers/test.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:courseId', authenticate, getTestsByCourseId);
router.post('/', authenticate, requireAdmin, createTest);
router.put('/:id', authenticate, requireAdmin, updateTest);
router.delete('/:id', authenticate, requireAdmin, deleteTest);

export default router;
