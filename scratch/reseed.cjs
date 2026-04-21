const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Reset & Reseed Started ---');

  // 1. Cleanup assessment-related tables (Reverse Dependency Order)
  console.log('Cleaning up existing data...');
  await prisma.attemptAnswer.deleteMany({});
  await prisma.attempt.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.test.deleteMany({});
  await prisma.course.deleteMany({});
  console.log('Cleanup complete.');

  // 2. Identify Target Student
  const student = await prisma.user.findUnique({
    where: { email: 'test@student.com' }
  });

  if (!student) {
    console.error('CRITICAL ERROR: "test@student.com" not found. Please ensure users table contains this student.');
    process.exit(1);
  }
  console.log(`Targeting student: ${student.name} (${student.id})`);

  // 3. Create Course 1: React Mastery
  console.log('Seeding Course 1...');
  const course1 = await prisma.course.create({
    data: {
      title: 'React Mastery & Architecture',
      description: 'Master the fundamentals and advanced patterns of React.js including Hooks, Context, and Performance.',
      level: 'Intermediate',
      duration: '12 Hours',
      learningObjectives: JSON.stringify(['Understand JSX', 'Hook lifecycle', 'State management', 'Performance profiling'])
    }
  });

  const pretest1 = await prisma.test.create({
    data: {
      courseId: course1.id,
      type: 'PRETEST',
      Questions: {
        create: [
          {
            questionText: 'What is the primary role of JSX in React?',
            options: JSON.stringify(['To define styles', 'To write HTML-like syntax in JS', 'To manage network requests', 'To handle server logic']),
            correctAnswer: 'To write HTML-like syntax in JS'
          }
        ]
      }
    }
  });

  const exam1 = await prisma.test.create({
    data: {
      courseId: course1.id,
      type: 'EXAM',
      Questions: {
        create: [
          {
            questionText: 'Which hook should be used for side effects in a functional component?',
            options: JSON.stringify(['useState', 'useEffect', 'useContext', 'useMemo']),
            correctAnswer: 'useEffect'
          },
          {
            questionText: 'What does "lifting state up" mean?',
            options: JSON.stringify(['Moving state to a child', 'Moving state to the parent', 'Using Redux only', 'Deleting state']),
            correctAnswer: 'Moving state to the parent'
          },
          {
            questionText: 'How do you pass data from parent to child?',
            options: JSON.stringify(['Via state', 'Via props', 'Via events', 'Via global variables']),
            correctAnswer: 'Via props'
          }
        ]
      }
    }
  });

  // 4. Create Course 2: Backend with Node.js
  console.log('Seeding Course 2...');
  const course2 = await prisma.course.create({
    data: {
      title: 'Full-Stack Performance: Node.js',
      description: 'Deep dive into the Node.js event pool, streams, and cluster modules for scalable architecture.',
      level: 'Advanced',
      duration: '15 Hours',
      learningObjectives: JSON.stringify(['Event loop internals', 'Buffer & Streams', 'Clustering', 'Worker threads'])
    }
  });

  const pretest2 = await prisma.test.create({
    data: {
      courseId: course2.id,
      type: 'PRETEST',
      Questions: {
        create: [
          {
            questionText: 'Is Node.js single-threaded?',
            options: JSON.stringify(['Yes, completely', 'Yes, for JavaScript execution', 'No, not at all', 'Only on Linux']),
            correctAnswer: 'Yes, for JavaScript execution'
          }
        ]
      }
    }
  });

  // 5. Create Sample Attempts for verification
  console.log('Creating sample attempts for verification...');
  
  // Successful Pretest
  await prisma.attempt.create({
    data: {
      userId: student.id,
      testId: pretest1.id,
      courseId: course1.id,
      score: 100,
      attemptNumber: 1,
      type: 'PRETEST',
      Answers: {
        create: [
          {
            questionText: 'What is the primary role of JSX in React?',
            options: JSON.stringify(['To define styles', 'To write HTML-like syntax in JS', 'To manage network requests', 'To handle server logic']),
            selectedOption: 'To write HTML-like syntax in JS',
            correctOption: 'To write HTML-like syntax in JS',
            isCorrect: true
          }
        ]
      }
    }
  });

  // Failed Exam Attempt (v1)
  await prisma.attempt.create({
    data: {
      userId: student.id,
      testId: exam1.id,
      courseId: course1.id,
      score: 33, // 1 out of 3
      attemptNumber: 1,
      type: 'EXAM',
      Answers: {
        create: [
          {
            questionText: 'Which hook should be used for side effects in a functional component?',
            options: JSON.stringify(['useState', 'useEffect', 'useContext', 'useMemo']),
            selectedOption: 'useEffect',
            correctOption: 'useEffect',
            isCorrect: true
          },
          {
            questionText: 'What does "lifting state up" mean?',
            options: JSON.stringify(['Moving state to a child', 'Moving state to the parent', 'Using Redux only', 'Deleting state']),
            selectedOption: 'Moving state to a child',
            correctOption: 'Moving state to the parent',
            isCorrect: false
          },
          {
            questionText: 'How do you pass data from parent to child?',
            options: JSON.stringify(['Via state', 'Via props', 'Via events', 'Via global variables']),
            selectedOption: 'Via state',
            correctOption: 'Via props',
            isCorrect: false
          }
        ]
      }
    }
  });

  // Improved Exam Attempt (v2)
  await prisma.attempt.create({
    data: {
      userId: student.id,
      testId: exam1.id,
      courseId: course1.id,
      score: 100,
      attemptNumber: 2,
      type: 'EXAM',
      Answers: {
        create: [
          {
            questionText: 'Which hook should be used for side effects in a functional component?',
            options: JSON.stringify(['useState', 'useEffect', 'useContext', 'useMemo']),
            selectedOption: 'useEffect',
            correctOption: 'useEffect',
            isCorrect: true
          },
          {
            questionText: 'What does "lifting state up" mean?',
            options: JSON.stringify(['Moving state to a child', 'Moving state to the parent', 'Using Redux only', 'Deleting state']),
            selectedOption: 'Moving state to the parent',
            correctOption: 'Moving state to the parent',
            isCorrect: true
          },
          {
            questionText: 'How do you pass data from parent to child?',
            options: JSON.stringify(['Via state', 'Via props', 'Via events', 'Via global variables']),
            selectedOption: 'Via props',
            correctOption: 'Via props',
            isCorrect: true
          }
        ]
      }
    }
  });

  console.log('--- Database Reseed Complete ---');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
