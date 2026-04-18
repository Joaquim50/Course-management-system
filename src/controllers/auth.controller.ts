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
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'supersecretlmsmvptoken',
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getStudents = async (req: Request, res: Response) => {
    try {
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: { id: true, name: true, email: true, createdAt: true }
        });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateStudent = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, email, password } = req.body;

        const data: any = {};
        if (name) data.name = name;
        if (email) data.email = email;
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

        // Note: Prisma will handle deletion of attempts if configured in schema, 
        // or we do it manually if needed. In our current schema, Attempt has a relation.
        // We'll delete attempts first to be safe if no cascade is set.
        await prisma.attempt.deleteMany({ where: { userId: id as string } });
        await prisma.user.delete({ where: { id: id as string } });

        res.json({ message: 'User and all associated data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
