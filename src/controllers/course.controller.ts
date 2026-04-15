import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createCourse = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, materialUrl } = req.body;
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        const course = await prisma.course.create({
            data: { title, description, materialUrl }
        });

        res.status(201).json(course);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getCourses = async (req: Request, res: Response) => {
    try {
        const courses = await prisma.course.findMany();
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getCourseById = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const course = await prisma.course.findUnique({ where: { id } });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        let canAccessMaterial = false;

        if (req.user?.role === 'ADMIN') {
            canAccessMaterial = true;
        } else if (req.user?.role === 'STUDENT') {
            const pretest = await prisma.test.findFirst({
                where: { courseId: id, type: 'PRETEST' }
            });

            if (pretest) {
                const pretestAttempt = await prisma.attempt.findFirst({
                    where: { userId: req.user.id, testId: pretest.id }
                });
                if (pretestAttempt) {
                    canAccessMaterial = true;
                }
            } else {
                canAccessMaterial = true;
            }
        }

        res.json({
            ...course,
            materialUrl: canAccessMaterial ? course.materialUrl : null,
            canAccessMaterial
        });

    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
