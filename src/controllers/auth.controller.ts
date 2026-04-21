import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'STUDENT'
            }
        });

        res.status(201).json({ message: 'User registered successfully', userId: user.id });
    } catch (err) {
        console.error('Register Error:', err);
        res.status(500).json({ error: 'Registration failed. Please try again later.' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', { email });
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log('Login failed: User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        console.log('Password match:', isValid);
        if (!isValid) {
            console.log('Login failed: Password mismatch');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'supersecretlmsmvptoken',
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Login failed. Please try again later.' });
    }
};

export const getStudents = async (req: Request, res: Response) => {
    try {
        const search = (req.query.search as string) || '';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const where: any = {
            role: 'STUDENT'
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [students, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip: req.query.page ? skip : undefined,
                take: req.query.limit ? limit : undefined,
                select: { id: true, name: true, email: true, createdAt: true },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        // Legacy support: If no pagination requested, return just the array
        if (!req.query.page && !req.query.limit) {
            return res.json(students);
        }

        res.json({
            data: students,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Get Students Error:', err);
        res.status(500).json({ error: 'Failed to fetch students. Please try again later.' });
    }
};

export const updateStudent = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, email, password } = req.body;

        const data: any = {};
        if (name) data.name = name;
        if (email) {
            // Check if email is already taken by another user
            const existing = await prisma.user.findFirst({
                where: { 
                    email,
                    NOT: { id: id as string }
                }
            });
            if (existing) {
                return res.status(400).json({ error: 'Email already in use by another student.' });
            }
            data.email = email;
        }
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const updated = await prisma.user.update({
            where: { id: id as string },
            data,
            select: { id: true, name: true, email: true, role: true }
        });

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

export const deleteStudent = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                Attempts: { select: { id: true } }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'Student not found.' });
        }

        // Block deletion if student has test attempts
        if (user.Attempts.length > 0) {
            return res.status(409).json({
                error: `Cannot delete this student because they have ${user.Attempts.length} test attempt(s) on record. Please remove their attempts first.`
            });
        }

        await prisma.user.delete({ where: { id } });

        res.json({ message: 'Student deleted successfully.' });
    } catch (err) {
        console.error('Delete Student Error:', err);
        res.status(500).json({ error: 'Failed to delete student. Please try again.' });
    }
};
