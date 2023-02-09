import Bull from 'bull';
import { generate } from '../helpers/generatePdf/index.js';
import { S3Client, PutObjectCommandInput, PutObjectCommand } from '@aws-sdk/client-s3';
import { sendDownloadMail } from '../helpers/send-mail.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const CONCURRENCY = process.env.REDIS_CONCURRENCY || '2';

export const pdfGen = new Bull('pdfGen', REDIS_URL);

pdfGen.process('pdfGen', parseInt(CONCURRENCY), async (job, done) => {
    const envelopeDict = {
        N4template: '長型4号',
        N3template: '長型3号',
        LPtemplate: 'レターパック',
    };
    try {
        const pdf = await generate(
            job.data.session,
            job.data.records,
            job.data.envelopeType,
            job.data.productName
        );
        const R2Client = new S3Client({
            region: 'auto',
            endpoint: `https://${process.env.R2_ACCOUNT}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY!,
                secretAccessKey: process.env.R2_SECRET_KEY!,
            },
        });

        const filename = `${envelopeDict[job.data.envelopeType]}_${new Date().toISOString()}.pdf`;
        const uploadParams: PutObjectCommandInput = {
            Bucket: 'chocolatlumiere',
            Key: filename,
            ContentType: 'application/pdf',
            Body: pdf,
        };
        const uploadResponse = await R2Client.send(new PutObjectCommand(uploadParams));
        if (uploadResponse.$metadata.httpStatusCode !== 200) {
            throw Error('upload failed.');
        }
        await sendDownloadMail(
            job.data.contactEmail,
            filename,
            `https://pub-bfd7609f60da4674a30afbe99b3460a8.r2.dev/${uploadParams.Key}`
        ).catch((e) => {
            throw e;
        });
        done();
    } catch (e) {
        if (e instanceof Error) {
            console.error(e);
            done(e);
        }
    }
});
