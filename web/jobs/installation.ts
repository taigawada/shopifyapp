import Bull from 'bull';
import { AppInstallations } from '../app_installations.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const CONCURRENCY = process.env.REDIS_CONCURRENCY || '2';

export const installation = new Bull('installation', REDIS_URL);

installation.process('installation', parseInt(CONCURRENCY), async (job, done) => {
    try {
        console.log('initialization ' + job.data.shop);
        await AppInstallations.init(job.data.shop);
        done();
    } catch (e) {
        if (e instanceof Error) {
            console.log(e, e.message);
            done(e);
        }
    }
});
