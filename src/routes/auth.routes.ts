import { Router } from 'express';
import { register, login, getStudents } from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/students', authenticate, requireAdmin, getStudents);

export default router;
