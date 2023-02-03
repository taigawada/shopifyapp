import { defineConfig } from 'vite';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import react from '@vitejs/plugin-react';

if (
    process.env.npm_lifecycle_event === 'build' &&
    !process.env.CI &&
    !process.env.SHOPIFY_API_KEY
) {
    console.warn(
        '\nBuilding the frontend app without an API key. The frontend build will not run without an API key. Set the SHOPIFY_API_KEY environment variable when running the build command.\n'
    );
}

const proxyOptions = {
    target: `http://127.0.0.1:${process.env.BACKEND_PORT}`,
    changeOrigin: false,
    secure: true,
    ws: false,
};

const host = process.env.HOST ? process.env.HOST.replace(/https?:\/\//, '') : 'localhost';

let hmrConfig;
if (host === 'localhost') {
    hmrConfig = {
        protocol: 'ws',
        host: 'localhost',
        port: 64999,
        clientPort: 64999,
    };
} else {
    hmrConfig = {
        protocol: 'wss',
        host: host,
        port: parseInt(process.env.FRONTEND_PORT!),
        clientPort: 443,
    };
}
const PORT = parseInt(process.env.BACKEND_PORT! || process.env.PORT!, 10);

export default defineConfig({
    //@ts-ignore
    root: dirname(fileURLToPath(import.meta.url)),
    plugins: [
        react({
            jsxImportSource: '@emotion/react',
            babel: {
                plugins: ['@emotion/babel-plugin'],
            },
        }),
    ],
    define: {
        'process.env.SHOPIFY_API_KEY': JSON.stringify(process.env.SHOPIFY_API_KEY),
    },
    resolve: {
        preserveSymlinks: true,
    },
    server: {
        host: 'localhost',
        port: parseInt(process.env.FRONTEND_PORT!),
        hmr: hmrConfig,
        proxy: {
            '^/(\\?.*)?$': proxyOptions,
            '^/api(/|(\\?.*)?$)': proxyOptions,
            '^/ws/.*': {
                target: `ws://localhost:${PORT}`,
                ws: true,
            },
        },
    },
    esbuild: {
        logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },
});
