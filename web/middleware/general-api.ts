import type { Express } from 'express';
import type { Multer } from 'multer';
import { getReference, putReference, PutData } from '../helpers/references.js';
import { Templates } from '../helpers/generatePdf/index.js';
import { deleteFilelog, deleteFilelogUndo, getFilelog } from '../helpers/file-manage.js';
import { toQueryArray } from '../helpers/utilities.js';

export default function generalApiEndpoints(app: Express, multer: Multer) {
    app.get('/api/reference', async (req, res) => {
        getReference(app, req, res);
    });
    app.put('/api/reference', multer.single('logo'), async (req, res) => {
        const rawReferences = req.body.references;
        let putData: (PutData & Templates) | {} = {};
        const logo = req.file;
        try {
            putData = JSON.parse(rawReferences ? rawReferences : '{}');
        } catch (e) {
            console.log(e);
            res.sendStatus(400);
            return;
        }
        if (!putData) return res.sendStatus(400);
        putReference(app, req, res, putData, logo);
    });
    app.get('/api/logo/log', async (req, res) => {
        getFilelog(app, req, res);
    });
    app.delete('/api/logo/log', async (req, res) => {
        let ids = toQueryArray(req.query.graphqlId);
        if (!ids) {
            res.sendStatus(400);
            return;
        }
        deleteFilelog(req, res, ids);
    });
    app.put('/api/logo/log', async (req, res) => {
        let ids = toQueryArray(req.query.graphqlId);
        if (!ids) {
            res.sendStatus(400);
            return;
        }
        deleteFilelogUndo(req, res, ids);
    });
}
