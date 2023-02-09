import Bull from 'bull';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const CONCURRENCY = process.env.REDIS_CONCURRENCY || '2';

export const installation = new Bull('installation', REDIS_URL);

installation.process('installation', parseInt(CONCURRENCY), async (job, done) => {});
