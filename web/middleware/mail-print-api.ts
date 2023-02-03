import type { Express } from 'express';
import { isEmpty } from 'lodash-es';
import type { Multer } from 'multer';
import { fetchOrders } from '../helpers/fetch-orders';
import { preview, generate, LogoTextData, Records, Templates } from '../helpers/generatePdf';
import { toQueryArray } from '../helpers/utilities';

export default function mailPrintApiEndpoints(app: Express, multer: Multer) {
    const isEnvelopeType = (
        value: unknown
    ): value is 'N4template' | 'N3template' | 'LPtemplate' => {
        const envelopeTypes = ['N4template', 'N3template', 'LPtemplate'];
        return typeof value === 'string' && envelopeTypes.includes(value);
    };
    app.post('/api/download', multer.none(), async (req, res) => {
        const envelopeType = req.query.envelopeType;
        if (!isEnvelopeType(envelopeType)) {
            return res.sendStatus(400);
        }
        let records: Records = [];
        try {
            records = JSON.parse(req.body.records);
        } catch (e) {
            res.status(400).send(e);
        }
        generate(app, req, res, records, envelopeType);
    });
    app.post('/api/preview', multer.none(), async (req, res) => {
        let templates: Templates | undefined;
        let fixed: LogoTextData | undefined;
        let logoBase64: string | undefined;
        let logoUrl: string | undefined;
        try {
            templates = JSON.parse(req.body.templates);
            fixed = JSON.parse(req.body.fixed);
            logoBase64 = req.body.logoBase64;
            logoUrl = req.body.logoUrl;
        } catch (e) {
            res.status(400).send(e);
            return;
        }
        if (!templates || isEmpty(templates) || !fixed || !logoUrl) {
            res.sendStatus(400);
            return;
        }
        preview(req, res, templates, fixed, logoBase64, logoUrl);
    });
    app.get('/api/orders', async (req, res) => {
        let ids = toQueryArray(req.query.ids);
        if (!ids) {
            res.sendStatus(400);
            return;
        }
        fetchOrders(app, req, res, ids);
    });
}
