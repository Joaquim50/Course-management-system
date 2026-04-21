import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const submitTest = async (req: AuthRequest, res: Response) => {
    try {
        const { testId, answers } = req.body;
        const userId = req.user!.id;

        const test = await prisma.test.findUnique({
            where: { id: testId },
            include: { Questions: true }
        });

        if (!test) return res.status(404).json({ error: 'Test not found.' });

        const count = await prisma.attempt.count({
            where: { userId, testId }
        });

        if (test.type === 'EXAM' && count >= 5) {
            return res.status(400).json({ error: 'Maximum attempts reached for this exam.' });
        }

        if (test.type === 'PRETEST' && count >= 1) {
            return res.status(400).json({ error: 'The pre-test is a one-time assessment and cannot be retaken.' });
        }

        let score = 0;
        const attemptAnswersData: any[] = [];

        // Iterate over ALL questions in the test to ensure unselected options are marked as wrong
        for (const question of test.Questions) {
            const studentAnswer = answers.find((a: any) => 
                (a.questionId && a.questionId === question.id) || 
                (a.questionText && a.questionText === question.questionText)
            );

            const selectedOption = studentAnswer ? String(studentAnswer.selectedOption || '') : '';
            const isCorrect = String(question.correctAnswer) === selectedOption && selectedOption !== '';
            
            if (isCorrect) score++;

            attemptAnswersData.push({
                questionText: question.questionText,
                options: question.options,
                selectedOption,
                correctOption: String(question.correctAnswer || ''),
                isCorrect
            });
        }

        const attempt = await prisma.attempt.create({
            data: {
                userId,
                testId,
                courseId: test.courseId,
                score: Math.round((score / (test.Questions.length || 1)) * 100),
                attemptNumber: count + 1,
                type: test.type,
                Answers: {
                    create: attemptAnswersData
                }
            },
            include: { Answers: true, Test: true }
        });

        res.status(201).json(attempt);
    } catch (err) {
        console.error('Submit Test Error:', err);
        res.status(500).json({ error: 'Failed to submit your test. Please try again.' });
    }
};

export const getAttemptsByCourse = async (req: AuthRequest, res: Response) => {
    try {
        const courseId = req.params.courseId as string;
        const attempts = await prisma.attempt.findMany({
            where: { userId: req.user!.id, courseId },
            orderBy: { attemptNumber: 'desc' },
            include: { Test: true, Answers: true }
        });
        res.json(attempts);
    } catch (err) {
        console.error('Get Attempts By Course Error:', err);
        res.status(500).json({ error: 'Failed to fetch your attempts for this course.' });
    }
};

export const getAttemptById = async (req: AuthRequest, res: Response) => {
    try {
        const attemptId = req.params.attemptId as string;
        const attempt = await prisma.attempt.findUnique({
            where: { id: attemptId },
            include: { Answers: true, Test: true }
        });

        if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });
        if (attempt.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'You do not have permission to view this attempt.' });
        }

        res.json(attempt);
    } catch (err) {
        console.error('Get Attempt By Id Error:', err);
        res.status(500).json({ error: 'Failed to load attempt details.' });
    }
};

export const getAllAttempts = async (req: AuthRequest, res: Response) => {
    try {
        const courseId = req.query.courseId as string;
        const search = req.query.search as string || '';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (courseId) {
            where.courseId = courseId;
        }

        if (search) {
            where.User = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            };
        }

        const [attempts, total] = await Promise.all([
            prisma.attempt.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { 
                    Test: { include: { Course: true } },
                    Answers: true,
                    User: {
                        select: { name: true, email: true }
                    }
                }
            }),
            prisma.attempt.count({ where })
        ]);

        // Legacy support: If no pagination requested, we could return just array, 
        // but for admin panel it's better to always have the structure if query params exist.
        // If someone calls /attempts/all without any params, we return the data as before for safety.
        if (!req.query.page && !req.query.limit && !req.query.courseId) {
            return res.json(attempts);
        }

        res.json({
            data: attempts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Get All Attempts Error:', err);
        res.status(500).json({ error: 'Failed to fetch all attempts. Please try again later.' });
    }
};

export const getMyAttempts = async (req: AuthRequest, res: Response) => {
    try {
        const attempts = await prisma.attempt.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' },
            include: { 
                Answers: true,
                Test: { include: { Course: true } }
            }
        });
        res.json(attempts);
    } catch (err) {
        console.error('Get My Attempts Error:', err);
        res.status(500).json({ error: 'Failed to fetch your attempt history.' });
    }
};

export const deleteAttempt = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;

        await prisma.attemptAnswer.deleteMany({ where: { attemptId: id } });
        await prisma.attempt.delete({ where: { id } });

        res.json({ message: 'Attempt record and answers deleted successfully.' });
    } catch (err) {
        console.error('Delete Attempt Error:', err);
        res.status(500).json({ error: 'Failed to delete attempt. Please try again.' });
    }
};
