import type { Express } from 'express';
import { getSettings } from '../helpers/settings';
export default function generalApiEndpoints(app: Express) {
    app.get('/api/settings', async (req, res) => {
        getSettings(app, req, res);
    });
}
