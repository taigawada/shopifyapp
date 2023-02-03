import { Shopify } from '@shopify/shopify-api';
import type { Express, Request, Response } from 'express';
import type { References } from '@prisma/client';
import prisma from '../prisma';
import { logoUpload } from './file-manage';
import { EnvelopeType, Templates } from './generatePdf';

export const getReference = async (app: Express, req: Request, res: Response) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, app.get('use-online-tokens'));
    if (!session) {
        res.status(401);
        return;
    }
    const references = await prisma.references.findUnique({
        where: {
            shop: session.shop,
        },
        select: {
            logo_text: true,
            logo_caption1: true,
            logo_caption2: true,
            logo_caption3: true,
            logo_image: {
                where: {
                    AND: [{ shop: session.shop }, { is_deleted: false }],
                },
                select: {
                    url: true,
                },
                orderBy: {
                    id: 'desc',
                },
                take: 1,
            },
            N4template: true,
            N3template: true,
            LPtemplate: true,
        },
    });
    if (!references) {
        await prisma.references.create({
            data: {
                shop: session.shop,
            },
        });
    }
    res.status(200).send(references);
};

export interface PutData extends Templates {
    logo_text: string;
    logo_caption1: string;
    logo_caption2: string;
    logo_caption3: string;
}
interface LogoImage {
    logo_image: {
        create: {
            graphql_id: string;
            url: string;
            alt: string;
            uploaded_at: string;
        };
    };
}

export const putReference = async (
    app: Express,
    req: Request,
    res: Response,
    putData: PutData | {},
    logo: Express.Multer.File | undefined
) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, app.get('use-online-tokens'));
    if (!session) return res.sendStatus(401);
    let logo_image: LogoImage | {} = {};
    if (logo) {
        try {
            const { id, image, alt, createdAt } = await logoUpload(session, logo);
            logo_image = {
                logo_image: {
                    create: {
                        shop: session.shop,
                        graphql_id: id,
                        url: image?.originalSrc,
                        alt: alt,
                        uploaded_at: createdAt,
                    },
                },
            };
        } catch (e) {
            res.status(400).send(e);
            return;
        }
    }
    try {
        await prisma.references.update({
            where: {
                shop: session.shop,
            },
            data: {
                ...putData,
                ...logo_image,
            },
        });
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
};

export const getPrintReferences = async (app: Express, req: Request, res: Response) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, app.get('use-online-tokens'));
    if (!session) return;
    const templates = await prisma.references.findUnique({
        where: {
            shop: session.shop,
        },
        select: {
            N4template: true,
            N3template: true,
            LPtemplate: true,
            logo_image: {
                where: {
                    AND: [{ shop: session.shop }, { is_deleted: false }],
                },
                select: {
                    url: true,
                },
                orderBy: [{ id: 'desc' }],
                take: 1,
            },
            logo_text: true,
            logo_caption1: true,
            logo_caption2: true,
            logo_caption3: true,
        },
    });
    return templates;
};

export const getTemplate = async (shop: string, envelopeType: EnvelopeType) => {
    const template = await prisma.references.findFirst({
        where: {
            shop: shop,
        },
        select: {
            [envelopeType]: true,
        },
    });
    if (!template) {
        return '';
    }
    return template;
};

export const getFixed = async (shop: string) => {
    const fixedData = await prisma.references.findUnique({
        where: {
            shop: shop,
        },
        select: {
            logo_text: true,
            logo_caption1: true,
            logo_caption2: true,
            logo_caption3: true,
            logo_image: {
                where: {
                    AND: [{ shop: shop }, { is_deleted: false }],
                },
                orderBy: {
                    id: 'desc',
                },
                take: 1,
            },
        },
    });
    if (fixedData === null) {
        Promise.reject();
    }
    return fixedData;
};
