import { Shopify } from '@shopify/shopify-api';
import type { Express } from 'express';
import { Graphql } from '../graphql-admin/index.js';
import { forEach, pullAllBy } from 'lodash-es';

export const fetchOrders = async (app: Express, req: any, res: any, ids: string[]) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, app.get('use-online-tokens'));
    if (!session) {
        res.status(400);
        return;
    }
    const client = new Graphql(session).client;
    const orders = await client.getOrdersByIds({
        input: ids.map((id) => `gid://shopify/Order/${id}`),
    });
    const invalidRecords: { name: string | null; invalidKeys: string[] }[] = [];
    const optionalAddressKey = ['company', 'address2'];
    orders.nodes.forEach((record) => {
        if (!record) invalidRecords.push({ name: null, invalidKeys: [] });
        else if (record.__typename === 'Order') {
            const keys: string[] = [];
            forEach(record, (value, key) => {
                if (key === 'shippingAddress' && value) {
                    forEach(value, (addressElement, addressKey) => {
                        if (!optionalAddressKey.includes(addressKey)) {
                            if (!addressElement) {
                                keys.push(addressKey);
                            }
                        }
                    });
                }
                if (!value) {
                    keys.push(key);
                }
            });
            if (keys.length) {
                invalidRecords.push({
                    name: record.name,
                    invalidKeys: keys,
                });
            }
        }
    });
    const result = {
        accepted: pullAllBy(orders.nodes, invalidRecords, 'name'),
        rejected: invalidRecords,
    };
    res.status(200).send(result);
};
