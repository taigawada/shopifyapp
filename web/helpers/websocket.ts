import type { Application } from 'express-ws';

export const websocket = (app: Application) => {
    app.ws('/ws', (ws, req) => {
        ws.send('接続成功');
        console.log('接続成功');
        ws.on('message', (msg) => {
            ws.send(msg);
            console.log(msg);
        });
    });
};
