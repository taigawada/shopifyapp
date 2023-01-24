import type { Express } from 'express';
import { fetchOrders } from '../helpers/fetch-orders';
export default function mailPrintApiEndpoints(app: Express) {
    app.get('/api/orders', async (req, res) => {
        const ids = req.query.ids;
        if (Array.isArray(ids) && ids !== undefined) {
            fetchOrders(
                app,
                req,
                res,
                ids.map((id) => `gid://shopify/Order/${id}`)
            );
        } else {
            res.status(400);
        }
    });
}
