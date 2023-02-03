import { Shopify } from '@shopify/shopify-api';
import prisma from './prisma/index.js';

export const AppInstallations = {
    init: async (shop: string) => {
        try {
            await prisma.references.upsert({
                where: {
                    shop: shop,
                },
                update: {},
                create: {
                    shop: shop,
                    N4template: process.env.HOST + '/api/template/N4template',
                    N3template: process.env.HOST + '/api/template/N3template',
                    LPtemplate: process.env.HOST + '/api/template/LPtemplate',
                },
            });
        } catch (e) {
            if (e instanceof Error) {
                console.warn(e.message);
            }
        }
    },
    includes: async function (shopDomain: string) {
        const shopSessions = await Shopify.Context.SESSION_STORAGE.findSessionsByShop!(shopDomain);
        if (shopSessions.length > 0) {
            for (const session of shopSessions) {
                if (session.accessToken) return true;
            }
        }
        return false;
    },
    delete: async function (shopDomain: string) {
        console.log(shopDomain);
        const shopSessions = await Shopify.Context.SESSION_STORAGE.findSessionsByShop!(shopDomain);
        if (shopSessions.length > 0) {
            await Shopify.Context.SESSION_STORAGE.deleteSessions!(
                shopSessions.map((session) => session.id)
            );
        }
    },
};
