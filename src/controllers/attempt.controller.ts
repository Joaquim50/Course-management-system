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

        if (!test) return res.status(404).json({ error: 'Test not found' });

        if (test.type === 'EXAM') {
            const count = await prisma.attempt.count({
                where: { userId, testId }
            });
            if (count >= 5) {
                return res.status(400).json({ error: 'Maximum attempts reached for this exam' });
            }
        }

        let score = 0;
        const attemptAnswersData: any[] = [];

        for (const answer of answers) {
            const question = test.Questions.find(q => q.id === answer.questionId);
            if (question) {
                const isCorrect = question.correctAnswer === answer.selectedOption;
                if (isCorrect) score++;

                attemptAnswersData.push({
                    questionText: question.questionText,
                    options: question.options,
                    selectedOption: answer.selectedOption || '',
                    correctOption: question.correctAnswer,
                    isCorrect
                });
            }
        }

        const prevAttempts = await prisma.attempt.count({ where: { userId, testId } });

        const attempt = await prisma.attempt.create({
            data: {
                userId,
                testId,
                courseId: test.courseId,
                score,
                attemptNumber: prevAttempts + 1,
                type: test.type,
                Answers: {
                    create: attemptAnswersData
                }
            },
            include: { Answers: true, Test: true }
        });

        res.status(201).json(attempt);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAttemptsByCourse = async (req: AuthRequest, res: Response) => {
    try {
        const courseId = req.params.courseId as string;
        const attempts = await prisma.attempt.findMany({
            where: { userId: req.user!.id, courseId },
            orderBy: { attemptNumber: 'desc' },
            include: { Test: true }
        });
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAttemptById = async (req: AuthRequest, res: Response) => {
    try {
        const attemptId = req.params.attemptId as string;
        const attempt = await prisma.attempt.findUnique({
            where: { id: attemptId },
            include: { Answers: true, Test: true }
        });

        if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
        if (attempt.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json(attempt);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
