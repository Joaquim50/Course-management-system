import { Router } from 'express';
import { createCourse, getCourses, getCourseById } from '../controllers/course.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getCourses);
router.get('/:id', authenticate, getCourseById);
router.post('/', authenticate, requireAdmin, createCourse);

export default router;
