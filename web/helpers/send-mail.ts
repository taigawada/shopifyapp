import { createTransport, SendMailOptions } from 'nodemailer';
import fs from 'fs/promises';

const transporter = createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        clientId: process.env.GOOGLE_CLIENT_KEY!,
        clientSecret: process.env.GOOGLE_SECRET_KEY!,
        user: process.env.GOOGLE_MAILADDRESS!,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
        accessToken: process.env.GOOGLE_ACCESS_TOKEN!,
        expires: 1484314697598,
    },
});

export const sendDownloadMail = async (to: string, filename: string, url: string) => {
    try {
        const htmlBuffer = await fs.readFile('assets/download-message.html');
        const html = htmlBuffer
            .toString()
            .replace('{{filename}}', filename)
            .replace('{{download_url}}', url);
        await transporter.sendMail({
            from: process.env.GOOGLE_MAILADDRESS!,
            to: to,
            subject: 'ダウンロードの準備ができました',
            html: html,
        });
        return;
    } catch (e) {
        throw e;
    }
};
