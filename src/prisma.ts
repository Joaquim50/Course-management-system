import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Tune connection pool for serverless Postgres (Neon)
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,             // Efficient for serverless context
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);

// Initialize Prisma with query logging enabled for performance monitoring
const prisma = new PrismaClient({ 
  adapter,
  log: [
    { level: 'query', emit: 'event' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],
});

// Optional: Log slow queries (> 100ms) to identify bottlenecks
(prisma as any).$on('query', (e: any) => {
  if (e.duration > 100) {
    console.warn(`🐢 Slow Query (${e.duration}ms): ${e.query}`);
  }
});

export default prisma;
