import { Shopify } from '@shopify/shopify-api';
import { templateUpload } from './helpers/file-manage.js';
import prisma from './prisma/index.js';

export const AppInstallations = {
    init: async (shopDomain: string) => {
        const shopSessions = await Shopify.Context.SESSION_STORAGE.findSessionsByShop!(shopDomain);
        if (!shopSessions.length || !shopSessions[0].accessToken) {
            console.warn('Failed to install.');
            return;
        }
        try {
            const current = await prisma.references.findUnique({
                where: {
                    shop: shopDomain,
                },
            });
            if (current) {
                return;
            }
            const templates = await templateUpload(shopDomain, shopSessions[0].accessToken);
            if (!templates.every((file) => (file.url ? true : false))) {
                throw Error('failed to upload templates.');
            }
            await prisma.references.create({
                data: {
                    shop: shopDomain,
                    N4template: templates[0].url,
                    N3template: templates[1].url,
                    LPtemplate: templates[2].url,
                },
            });
        } catch (e) {
            console.log(e);
            throw e;
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
        const shopSessions = await Shopify.Context.SESSION_STORAGE.findSessionsByShop!(shopDomain);
        if (shopSessions.length > 0) {
            await Shopify.Context.SESSION_STORAGE.deleteSessions!(
                shopSessions.map((session) => session.id)
            );
        }
    },
};
