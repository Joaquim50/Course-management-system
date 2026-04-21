import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createTest = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, type, questions } = req.body;
        if (!courseId || !type || !questions) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        // Enforce: max 1 Pretest + 1 Exam per course
        const existing = await prisma.test.findFirst({
            where: { courseId, type }
        });
        if (existing) {
            return res.status(409).json({
                error: `This course already has a ${type === 'PRETEST' ? 'Pretest' : 'Exam'}. Please edit or delete the existing one first.`
            });
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
        console.error('Create Test Error:', err);
        res.status(500).json({ error: 'Failed to create test. Please check your input and try again.' });
    }
};

export const getTestsByCourseId = async (req: AuthRequest, res: Response) => {
    try {
        const courseId = req.params.courseId as string;
        const isAdmin = req.user?.role === 'ADMIN';
        const tests = await prisma.test.findMany({
            where: { courseId },
            include: {
                Questions: {
                    select: {
                        id: true,
                        questionText: true,
                        options: true,
                        correctAnswer: isAdmin // Only include for admins
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
        console.error('Get Tests Error:', err);
        res.status(500).json({ error: 'Failed to fetch tests for this course. Please try again later.' });
    }
};
export const updateTest = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { type, questions } = req.body;

        const existing = await prisma.test.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Test not found' });

        // Atomic update: Delete old questions and create new ones
        const updated = await prisma.test.update({
            where: { id },
            data: {
                type: type || existing.type,
                Questions: {
                    deleteMany: {}, // Wipe existing questions
                    create: questions.map((q: any) => ({
                        questionText: q.questionText,
                        options: JSON.stringify(q.options),
                        correctAnswer: String(q.correctAnswer)
                    }))
                }
            },
            include: { Questions: true }
        });

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update test' });
    }
};

export const deleteTest = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;

        // Note: Prisma needs explicit cleanup if no cascade is in schema
        await prisma.attemptAnswer.deleteMany({
            where: { Attempt: { testId: id } }
        });
        await prisma.attempt.deleteMany({ where: { testId: id } });
        await prisma.question.deleteMany({ where: { testId: id } });
        await prisma.test.delete({ where: { id } });

        res.json({ message: 'Test and associated questions/attempts deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete test' });
    }
};
