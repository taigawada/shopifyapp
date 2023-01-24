import { Shopify } from '@shopify/shopify-api';
import type { Express } from 'express';
import e from 'express';
import prisma from '../prisma';

export const getSettings = async (app: Express, req: any, res: any) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, app.get('use-online-tokens'));
    if (!session) {
        res.status(400);
        return;
    }
    const settings = await prisma.generalSettings.findUnique({
        where: {
            shop: session.shop,
        },
    });
    if (!settings) {
        await prisma.generalSettings.create({
            data: {
                shop: session.shop,
            },
        });
    }
    const isSufficient = settings && Object.keys(settings).every((key) => settings[key]);
    const result = {
        data: settings,
        isSufficient: isSufficient,
    };
    res.status(200).send(result);
};
