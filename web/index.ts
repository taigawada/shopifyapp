import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import cookieParser from 'cookie-parser';
import formData from 'express-form-data';
import { Shopify, LATEST_API_VERSION } from '@shopify/shopify-api';

import applyAuthMiddleware from './middleware/auth.js';
import verifyRequest from './middleware/verify-request.js';
import { setupGDPRWebHooks } from './gdpr.js';
import productCreator from './helpers/product-creator';
import redirectToAuth from './helpers/redirect-to-auth.js';
import { BillingInterval } from './helpers/ensure-billing.js';

import { AppInstallations } from './app_installations.js';

import generalApiEndpoints from './middleware/general-api';
import fileApiEndpoints from './middleware/file-api';
import mailPrintApiEndpoints from './middleware/mail-print-api';

// import expressWs from 'express-ws';
// import { websocket } from './helpers/websocket';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const USE_ONLINE_TOKENS = false;

const PORT = parseInt(process.env.BACKEND_PORT! || process.env.PORT!, 10);

// TODO: There should be provided by env vars
const DEV_INDEX_PATH = `${process.cwd()}/frontend/`;
const PROD_INDEX_PATH = `${process.cwd()}/frontend/dist/`;

const DB_PATH = `${process.cwd()}/database.sqlite`;

// const url = `https://rasp-home.com/api/orders?ids=123&ids=5240175722806&ids=5240165957942`;
// const parameters = new URLSearchParams(url);
// console.log(parameters.getAll('ids'));

Shopify.Context.initialize({
    API_KEY: process.env.SHOPIFY_API_KEY!,
    API_SECRET_KEY: process.env.SHOPIFY_API_SECRET!,
    SCOPES: process.env.SCOPES!.split(','),
    HOST_NAME: process.env.HOST!.replace(/https?:\/\//, ''),
    HOST_SCHEME: process.env.HOST!.split('://')[0],
    API_VERSION: LATEST_API_VERSION,
    IS_EMBEDDED_APP: true,
    SESSION_STORAGE:
        process.env.NODE_ENV === 'production'
            ? new Shopify.Session.PostgreSQLSessionStorage(process.env.DATABASE_URL as any)
            : new Shopify.Session.SQLiteSessionStorage(DB_PATH),
    ...(process.env.SHOP_CUSTOM_DOMAIN && {
        CUSTOM_SHOP_DOMAINS: [process.env.SHOP_CUSTOM_DOMAIN],
    }),
});

// NOTE: If you choose to implement your own storage strategy using
// Shopify.Session.CustomSessionStorage, you MUST implement the optional
// findSessionsByShopCallback and deleteSessionsCallback methods.  These are
// required for the app_installations.js component in this template to
// work properly.

Shopify.Webhooks.Registry.addHandler('APP_UNINSTALLED', {
    path: '/api/webhooks',
    webhookHandler: async (_topic, shop, _body) => {
        await AppInstallations.delete(shop);
    },
});

// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const BILLING_SETTINGS = {
    required: false,
    // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
    // chargeName: "My Shopify One-Time Charge",
    // amount: 5.0,
    // currencyCode: "USD",
    // interval: BillingInterval.OneTime,
};

// This sets up the mandatory GDPR webhooks. You’ll need to fill in the endpoint
// in the “GDPR mandatory webhooks” section in the “App setup” tab, and customize
// the code when you store customer data.
//
// More details can be found on shopify.dev:
// https://shopify.dev/apps/webhooks/configuration/mandatory-webhooks
setupGDPRWebHooks('/api/webhooks');

// export for test use only
export async function createApp(
    root = process.cwd(),
    isProd = process.env.NODE_ENV === 'production',
    billingSettings = BILLING_SETTINGS
) {
    const app = express();

    app.set('use-online-tokens', USE_ONLINE_TOKENS);
    app.use(cookieParser(Shopify.Context.API_SECRET_KEY));
    app.use(formData.parse());
    app.use(formData.stream());

    applyAuthMiddleware(app, {
        billing: billingSettings,
    });

    // Do not call app.use(express.json()) before processing webhooks with
    // Shopify.Webhooks.Registry.process().
    // See https://github.com/Shopify/shopify-api-node/blob/main/docs/usage/webhooks.md#note-regarding-use-of-body-parsers
    // for more details.
    app.post('/api/webhooks', async (req, res) => {
        try {
            await Shopify.Webhooks.Registry.process(req, res);
            console.log(`Webhook processed, returned status code 200`);
        } catch (e) {
            if (e instanceof Error) {
                console.log(`Failed to process webhook: ${e.message}`);
                if (!res.headersSent) {
                    res.status(500).send(e.message);
                }
            }
        }
    });

    // All endpoints after this point will require an active session
    app.use(
        '/api/*',
        verifyRequest(app, {
            billing: billingSettings,
        })
    );

    generalApiEndpoints(app);
    mailPrintApiEndpoints(app);
    fileApiEndpoints(app);

    // const websocketApp = expressWs(app).app;
    // websocket(websocketApp);

    // const wss = new WebSocketServer({ noServer: true });
    // wss.on('connection', function connection(ws) {
    //     console.log(ws);
    //     ws.on('message', function message(data) {
    //         console.log(data);
    //     });
    // });

    app.get('/api/products/count', async (req, res) => {
        const session = await Shopify.Utils.loadCurrentSession(
            req,
            res,
            app.get('use-online-tokens')
        );
        const { Product } = await import(
            `@shopify/shopify-api/dist/rest-resources/${Shopify.Context.API_VERSION}/index.js`
        );

        const countData = await Product.count({ session });
        res.status(200).send(countData);
    });

    app.get('/api/products/create', async (req, res) => {
        const session = await Shopify.Utils.loadCurrentSession(
            req,
            res,
            app.get('use-online-tokens')
        );
        let status = 200;
        let error: null | string = null;

        try {
            await productCreator(session);
        } catch (e) {
            if (e instanceof Error) {
                console.log(`Failed to process products/create: ${e.message}`);
                status = 500;
                error = e.message;
            }
        }
        res.status(status).send({ success: status === 200, error });
    });

    // All endpoints after this point will have access to a request.body
    // attribute, as a result of the express.json() middleware
    app.use(express.json());

    app.use((req, res, next) => {
        const shop = Shopify.Utils.sanitizeShop(req.query.shop as string);
        if (Shopify.Context.IS_EMBEDDED_APP && shop) {
            res.setHeader(
                'Content-Security-Policy',
                `frame-ancestors https://${encodeURIComponent(shop)} https://admin.shopify.com;`
            );
        } else {
            res.setHeader('Content-Security-Policy', `frame-ancestors 'none';`);
        }
        next();
    });

    if (isProd) {
        const compression = await import('compression').then(({ default: fn }) => fn);
        const serveStatic = await import('serve-static').then(({ default: fn }) => fn);
        app.use(compression());
        app.use(serveStatic(PROD_INDEX_PATH, { index: false }));
    }

    app.use('/*', async (req, res, next) => {
        if (typeof req.query.shop !== 'string') {
            res.status(500);
            return res.send('No shop provided');
        }

        const shop = Shopify.Utils.sanitizeShop(req.query.shop);

        if (!shop) {
            return res.status(500);
        }
        let appInstalled = await AppInstallations.includes(shop);

        if (!appInstalled && !req.originalUrl.match(/^\/exitiframe/i)) {
            // if (shop) {
            //     AppInstallations.instllationInit(shop);
            // }
            return redirectToAuth(req, res, app);
        }

        if (Shopify.Context.IS_EMBEDDED_APP && req.query.embedded !== '1') {
            const embeddedUrl = Shopify.Utils.getEmbeddedAppUrl(req);

            return res.redirect(embeddedUrl + req.path);
        }

        const htmlFile = join(isProd ? PROD_INDEX_PATH : DEV_INDEX_PATH, 'index.html');

        return res.status(200).set('Content-Type', 'text/html').send(readFileSync(htmlFile));
    });

    return app;
}

createApp().then((app) => {
    const server = app.listen(PORT, () => {
        console.log(`Listening on ${PORT}`);
    });
    const wss = new WebSocketServer({ server });
    wss.on('connection', (ws) => {
        console.log('Client connected');
        ws.on('close', () => console.log('Client disconnected'));
    });
});