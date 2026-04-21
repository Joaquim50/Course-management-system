import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import fs from 'fs';
import path from 'path';

export const createCourse = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, learningObjectives, duration, level } = req.body;
        
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        let thumbnailUrl = '';
        if (files && files['thumbnail'] && files['thumbnail'][0]) {
            thumbnailUrl = `/uploads/${files['thumbnail'][0].filename}`;
        }

        let materialUrl = '';
        if (files && files['material'] && files['material'][0]) {
            materialUrl = `/uploads/${files['material'][0].filename}`;
        }

        const course = await prisma.course.create({
            data: { 
                title, 
                description, 
                thumbnailUrl,
                materialUrl,
                learningObjectives: typeof learningObjectives === 'object' ? JSON.stringify(learningObjectives) : (learningObjectives || '[]'),
                duration: duration || '',
                level: level || ''
            }
        });

        res.status(201).json(course);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getCourses = async (req: Request, res: Response) => {
    try {
        const search = (req.query.search as string) || '';
        
        const where = {
            OR: [
                { title: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } }
            ]
        };

        const courses = await prisma.course.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        
        res.json(courses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getMyEnrolledCourses = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const search = (req.query.search as string) || '';

        // Get unique course IDs from attempts
        const attempts = await prisma.attempt.findMany({
            where: { userId },
            distinct: ['courseId'],
            select: { courseId: true }
        });
        const enrolledIds = attempts.map(a => a.courseId);

        const where: any = {
            id: { in: enrolledIds },
            OR: [
                { title: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } }
            ]
        };

        const courses = await prisma.course.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json(courses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getCourseById = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const course = await prisma.course.findUnique({ 
            where: { id },
            include: {
                Tests: {
                    where: { type: 'PRETEST' },
                    include: {
                        Attempts: req.user ? {
                            where: { userId: req.user.id }
                        } : undefined
                    }
                }
            }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        let canAccessMaterial = false;

        if (req.user?.role === 'ADMIN') {
            canAccessMaterial = true;
        } else if (req.user?.role === 'STUDENT') {
            const pretest = course.Tests[0];
            if (pretest) {
                const pretestAttempt = (pretest as any).Attempts?.[0];
                if (pretestAttempt) {
                    canAccessMaterial = true;
                }
            } else {
                canAccessMaterial = true;
            }
        } else if (!req.user) {
            // Guest users can only see material if there is no pretest required
            canAccessMaterial = course.Tests.length === 0;
        }

        const { Tests, ...courseData } = course;

        res.json({
            ...courseData,
            canAccessMaterial
        });

    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { title, description, learningObjectives, duration, level } = req.body;

        const existing = await prisma.course.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Course not found' });

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        let thumbnailUrl = existing.thumbnailUrl;
        if (files && files['thumbnail'] && files['thumbnail'][0]) {
            // Delete old thumbnail
            if (existing.thumbnailUrl && existing.thumbnailUrl.startsWith('/uploads/')) {
                const oldPath = path.join(process.cwd(), existing.thumbnailUrl.replace(/^\//, ''));
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            thumbnailUrl = `/uploads/${files['thumbnail'][0].filename}`;
        }

        let materialUrl = existing.materialUrl;
        if (files && files['material'] && files['material'][0]) {
            // Delete old material
            if (existing.materialUrl && existing.materialUrl.startsWith('/uploads/')) {
                const oldPath = path.join(process.cwd(), existing.materialUrl.replace(/^\//, ''));
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            materialUrl = `/uploads/${files['material'][0].filename}`;
        }

        const updated = await prisma.course.update({
            where: { id: id as string },
            data: {
                title: title || existing.title,
                description: description || existing.description,
                thumbnailUrl,
                materialUrl,
                learningObjectives: learningObjectives !== undefined 
                    ? (typeof learningObjectives === 'object' ? JSON.stringify(learningObjectives) : learningObjectives) 
                    : existing.learningObjectives,
                duration: duration !== undefined ? duration : existing.duration,
                level: level !== undefined ? level : existing.level
            }
        });

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.course.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Course not found' });

        // Delete thumbnail
        if (existing.thumbnailUrl && existing.thumbnailUrl.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), existing.thumbnailUrl.replace(/^\//, ''));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        // Delete material
        if (existing.materialUrl && existing.materialUrl.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), existing.materialUrl.replace(/^\//, ''));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await prisma.course.delete({ where: { id: id as string } });

        res.json({ message: 'Course and materials deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
