import { Shopify } from '@shopify/shopify-api';
import prisma from './prisma';

export const AppInstallations = {
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

    // this is chocolatlumiere app original methods
    instllationInit: async (shopDomain: string) => {
        const isShopExist = await prisma.shopUser.findMany({
            where: {
                shop: shopDomain,
            },
        });
        if (!isShopExist) {
            await prisma.shopUser.create({
                data: {
                    shop: shopDomain,
                },
            });
        }
    },
};
