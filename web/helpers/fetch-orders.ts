import { Shopify } from '@shopify/shopify-api';
import type { Express } from 'express';
import { Graphql } from '../graphql-admin';

export const fetchOrders = async (app: Express, req: any, res: any, ids: string[]) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, app.get('use-online-tokens'));
    if (!session) {
        res.status(400);
        return;
    }
    const client = new Graphql(session).client;
    const result = await client.getOrdersByIds({
        input: ids,
    });
    res.status(200).send(result);
};
