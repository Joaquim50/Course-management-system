import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const [studentCount, courseCount, testCount, attemptCount, recentAttempts] = await Promise.all([
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.course.count(),
            prisma.test.count(),
            prisma.attempt.count(),
            prisma.attempt.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    User: { select: { name: true, email: true } },
                    Test: { 
                        include: { 
                            Course: { select: { title: true } } 
                        } 
                    }
                }
            })
        ]);

        const totalScore = await prisma.attempt.aggregate({
            _avg: { score: true }
        });

        res.json({
            stats: {
                students: studentCount,
                courses: courseCount,
                tests: testCount,
                attempts: attemptCount,
                averageScore: Math.round(totalScore._avg.score || 0)
            },
            recentResults: recentAttempts.map(att => ({
                id: att.id,
                student: att.User.name,
                course: att.Test.Course.title,
                type: att.type,
                score: att.score,
                date: att.createdAt
            }))
        });

    } catch (err) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard intelligence' });
    }
};
