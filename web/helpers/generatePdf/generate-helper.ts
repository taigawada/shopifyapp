import type { Express, Request, Response } from 'express';
import { Shopify } from '@shopify/shopify-api';
import { getFixed, getTemplate } from '../references.js';
import { getTemplateJson, getLogoBase64 } from './fetch-templates.js';
import { generatePdf } from './generate-pdf.js';
import type { EnvelopeType, Records } from '.';
import PDFMerger from 'pdf-merger-js';
import defaultLogo from '../../assets/cl_logo.js';

export const generate = async (
    app: Express,
    req: any,
    res: any,
    records: Records,
    envelopeType: EnvelopeType,
    productName: string | undefined
) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, app.get('use-online-tokens'));
    if (!session) return res.sendStatus(400);
    try {
        const [url, references] = await Promise.all([
            getTemplate(session.shop, envelopeType),
            getFixed(session.shop),
        ]);
        if (!url[envelopeType] || !references) return res.sendStatus(400);
        const [template, logo] = await Promise.all([
            getTemplateJson(url[envelopeType]),
            references.logo_image.length
                ? getLogoBase64(references.logo_image[0].url)
                : defaultLogo,
        ]);
        const { logo_image, ...fixedData } = references;
        const fixed = {
            logo: logo,
            ...fixedData,
            productName: productName ? productName : '',
        };
        const fontSizeRatio = 1;
        const result = await generatePdf(template, records, fixed, fontSizeRatio);
        res.status(200).send(result);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
};
export interface Templates {
    N4template: string;
    N3template: string;
    LPtemplate: string;
}
export interface LogoTextData {
    logo_text: string;
    logo_caption1: string;
    logo_caption2: string;
    logo_caption3: string;
}
export const preview = async (
    req: Request,
    res: Response,
    templates: Templates,
    fixed: LogoTextData,
    logoBase64: string,
    logoUrl?: string
) => {
    let logo: string;
    if (logoUrl) {
        logo = await getLogoBase64(logoUrl).catch((e) => {
            res.status(400).send(e);
            return '';
        });
    } else {
        logo = logoBase64;
    }
    const sampleData = [
        {
            id: '',
            __typename: 'Order',
            name: '#0000',
            createdAt: '',
            shippingAddress: {
                zip: '123-3456',
                provinceCode: 'JP-13',
                city: '港区',
                address1: '1-2-3',
                address2: '',
                firstName: '花子',
                lastName: 'ショコラ',
            },
        },
    ];
    const merger = new PDFMerger();
    const pdfs = await Promise.all(
        ['N4template', 'N3template', 'LPtemplate'].map(async (envelopeType) => {
            const template = await getTemplateJson(templates[envelopeType]);
            try {
                const pdf = await generatePdf(
                    template,
                    sampleData,
                    { logo: logo, ...fixed, productName: '衣類' },
                    1
                );
                return pdf;
            } catch (e) {
                console.log(e);
                Promise.reject(e);
            }
        })
    ).catch((e) => {
        res.status(400).send(e);
        return;
    });
    if (pdfs && pdfs.every((pdf): pdf is Buffer => (pdf ? true : false))) {
        await Promise.all(pdfs.map(async (pdf) => await merger.add(pdf)));
        const result = await merger.saveAsBuffer();
        res.status(200).send(result);
        return;
    } else {
        res.sendStatus(400);
        return;
    }
};
