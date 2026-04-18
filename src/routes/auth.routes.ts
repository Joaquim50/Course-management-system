import { Router } from 'express';
import { register, login, getStudents, updateStudent, deleteStudent } from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/students', authenticate, requireAdmin, getStudents);
router.put('/students/:id', authenticate, requireAdmin, updateStudent);
router.delete('/students/:id', authenticate, requireAdmin, deleteStudent);

export default router;
