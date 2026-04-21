import { Router } from 'express';
import { 
    createCourse, 
    getCourses, 
    getCourseById, 
    updateCourse, 
    deleteCourse,
    getMyEnrolledCourses 
} from '../controllers/course.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.get('/', getCourses);
router.get('/enrolled', authenticate, getMyEnrolledCourses);
router.get('/:id', getCourseById);

const courseUpload = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'material', maxCount: 1 }
]);

router.post('/', authenticate, requireAdmin, courseUpload, createCourse);
router.put('/:id', authenticate, requireAdmin, courseUpload, updateCourse);
router.delete('/:id', authenticate, requireAdmin, deleteCourse);

export default router;
