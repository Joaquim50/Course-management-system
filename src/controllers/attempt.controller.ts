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
                score: Math.round((score / (test.Questions.length || 1)) * 100), // Use test.Questions.length for accuracy
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
            include: { Test: true, Answers: true }
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
                Answers: true,
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
