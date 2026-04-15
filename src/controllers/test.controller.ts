import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createTest = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, type, questions } = req.body;
        if (!courseId || !type || !questions) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const test = await prisma.test.create({
            data: {
                courseId,
                type,
                Questions: {
                    create: questions.map((q: any) => ({
                        questionText: q.questionText,
                        options: JSON.stringify(q.options),
                        correctAnswer: q.correctAnswer
                    }))
                }
            },
            include: { Questions: true }
        });

        res.status(201).json(test);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getTestsByCourseId = async (req: AuthRequest, res: Response) => {
    try {
        const courseId = req.params.courseId as string;
        const tests = await prisma.test.findMany({
            where: { courseId },
            include: {
                Questions: {
                    select: {
                        id: true,
                        questionText: true,
                        options: true
                    }
                }
            }
        });

        if (req.user?.role === 'STUDENT') {
            const pretest = tests.find(t => t.type === 'PRETEST');
            let canAccessExam = true;

            if (pretest) {
                const pretestAttempt = await prisma.attempt.findFirst({
                    where: { userId: req.user.id, testId: pretest.id }
                });
                if (!pretestAttempt) {
                    canAccessExam = false;
                }
            }

            const availableTests = tests.filter(t => {
                if (t.type === 'EXAM' && !canAccessExam) return false;
                return true;
            });

            return res.json(availableTests);
        }

        res.json(tests);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
