import type { Express } from 'express';
import { Shopify } from '@shopify/shopify-api';
import { getTemplateByJson, getLogoBybase64 } from './fetch-templates';
import { generatePdf, Records } from './generate-pdf';

export const fetchOrders = async (app: Express, req: any, res: any, records: Records) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, app.get('use-online-tokens'));
    if (!session) {
        res.status(400);
        return;
    }
    const templateUrl = '';
    const logoUrl = '';
    const ingredients = await Promise.all([
        getTemplateByJson(templateUrl),
        getLogoBybase64(logoUrl),
    ]);
    const FixedData = {
        logo: ingredients[1],
        logoText: '',
        logoCaption1: '',
        logoCaption2: '',
        logoCaption3: '',
    };
    const fontSizeRatio = 1;
    const result = generatePdf(ingredients[0], records, FixedData, fontSizeRatio);
    res.status(200).send(result);
};
