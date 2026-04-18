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

        const count = await prisma.attempt.count({
            where: { userId, testId }
        });

        if (test.type === 'EXAM' && count >= 5) {
            return res.status(400).json({ error: 'Maximum attempts reached for this exam' });
        }

        if (test.type === 'PRETEST' && count >= 1) {
            return res.status(400).json({ error: 'The pre-test is a one-time assessment and cannot be retaken.' });
        }

        let score = 0;
        const attemptAnswersData: any[] = [];

        for (const answer of answers) {
            // Attempt to find the question in the DB for verification/score accuracy
            const question = test.Questions.find(q => 
                (answer.questionId && q.id === answer.questionId) || 
                (answer.questionText && q.questionText === answer.questionText)
            );

            // Use DB data if found, otherwise trust payload for audit/standalone tests
            const correctAnswer = question ? question.correctAnswer : (answer.correctAnswer || answer.correctOption);
            const options = question ? question.options : (typeof answer.options === 'string' ? answer.options : JSON.stringify(answer.options || []));
            const questionText = question ? question.questionText : (answer.questionText || 'Unknown Question');

            const isCorrect = String(correctAnswer) === String(answer.selectedOption);
            if (isCorrect) score++;

            attemptAnswersData.push({
                questionText,
                options,
                selectedOption: String(answer.selectedOption || ''),
                correctOption: String(correctAnswer || ''),
                isCorrect
            });
        }

        const prevAttempts = await prisma.attempt.count({ where: { userId, testId } });

        const attempt = await prisma.attempt.create({
            data: {
                userId,
                testId,
                courseId: test.courseId,
                score: Math.round((score / (answers.length || 1)) * 100), // Store percentage score
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

export const getAllAttempts = async (req: AuthRequest, res: Response) => {
    try {
        const attempts = await prisma.attempt.findMany({
            orderBy: { createdAt: 'desc' },
            include: { 
                Test: { include: { Course: true } },
                User: {
                    select: { name: true, email: true }
                }
            }
        });
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
export const deleteAttempt = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;

        await prisma.attemptAnswer.deleteMany({ where: { attemptId: id } });
        await prisma.attempt.delete({ where: { id } });

        res.json({ message: 'Attempt record and answers deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete attempt' });
    }
};
