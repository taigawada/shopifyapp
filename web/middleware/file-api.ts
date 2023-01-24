import type { Express } from 'express';
import { fileUpload, fileDelete } from '../helpers/file-manage';
import expressWs from 'express-ws';

import fs from 'fs';

export default function fileApiEndpoints(app: Express) {
    app.post('/api/fileupload', async (req, res) => {
        //@ts-ignore
        const file: fs.ReadStream = req.files.file;
        await fileUpload(app, req, res, file, req.body);
        res.status(200);
    });
    app.get('/api/fileDelete', async (req, res) => {
        await fileDelete(app, req, res, '');
        res.status(200);
    });
}
