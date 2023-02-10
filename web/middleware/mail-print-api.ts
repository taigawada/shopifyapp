import { Shopify } from '@shopify/shopify-api';
import type { Express } from 'express';
import { isEmpty } from 'lodash-es';
import type { Multer } from 'multer';
import { Graphql } from '../graphql-admin/index.js';
import { fetchOrders } from '../helpers/fetch-orders.js';
import { preview, LogoTextData, Records, Templates } from '../helpers/generatePdf/index.js';
import { toQueryArray } from '../helpers/utilities.js';
import { pdfGen } from '../jobs/pdf.js';

export default function mailPrintApiEndpoints(app: Express, multer: Multer) {
    const isEnvelopeType = (
        value: unknown
    ): value is 'N4template' | 'N3template' | 'LPtemplate' => {
        const envelopeTypes = ['N4template', 'N3template', 'LPtemplate'];
        return typeof value === 'string' && envelopeTypes.includes(value);
    };
    app.post('/api/download', multer.none(), async (req, res) => {
        const session = await Shopify.Utils.loadCurrentSession(
            req,
            res,
            app.get('use-online-tokens')
        );
        if (!session) return res.sendStatus(401);
        const envelopeType = req.query.envelopeType;
        const productName = toQueryArray(req.query.productName);
        if (!isEnvelopeType(envelopeType)) {
            return res.sendStatus(400);
        }
        if (envelopeType === 'LPtemplate' && !productName) {
            return res.sendStatus(400);
        }
        let records: Records = [];
        try {
            records = JSON.parse(req.body.records);
        } catch (e) {
            res.status(400).send(e);
        }
        const gqlClient = new Graphql(session).client;
        const store = await gqlClient.getStoreEmail();
        await pdfGen.add('pdfGen', {
            session: session,
            records: records,
            envelopeType: envelopeType,
            productName: productName ? productName[0] : '',
            contactEmail: store.shop.email,
        });
        res.status(200).send(store.shop.email);
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
        if (!templates || isEmpty(templates) || !fixed || !logoBase64) {
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
