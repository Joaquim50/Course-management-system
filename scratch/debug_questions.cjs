const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.question.findMany({
    include: {
      Test: {
        include: {
          Course: true
        }
      }
    }
  });
  console.log('--- QUESTIONS IN DB ---');
  questions.forEach(q => {
    console.log(`Course: ${q.Test.Course.title}`);
    console.log(`Test: ${q.Test.type}`);
    console.log(`Q: ${q.questionText}`);
    console.log(`Options: ${q.options}`);
    console.log(`Correct: "${q.correctAnswer}"`);
    console.log('---');
  });
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
