import { Shopify } from '@shopify/shopify-api';
import type { Express } from 'express';
import { Graphql } from '../graphql-admin';
import FormData from 'form-data';
import fetch from 'node-fetch';

import type { ReadStream } from 'fs';

interface FileInfo {
    filename: string;
    type: string;
    size: string;
}

export const fileUpload = async (
    app: Express,
    req: any,
    res: any,
    file: ReadStream,
    info: FileInfo
) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, app.get('use-online-tokens'));
    if (!session) {
        res.status(400);
        return;
    }
    const client = new Graphql(session).client;
    const resourceName = info.type !== 'application/json' ? 'IMAGE' : 'FILE';
    const stagedUploadsQueryResult = await client.stagedUploadsCreate({
        input: {
            filename: info.filename,
            resource: resourceName as any,
            mimeType: info.type,
            httpMethod: 'POST' as any,
        },
    });

    const target = stagedUploadsQueryResult.stagedUploadsCreate?.stagedTargets;
    if (!target) {
        return res.status(400);
    }

    const params = target[0].parameters;
    const url = target[0].url;
    const resourceUrl = target[0].resourceUrl;

    const form = new FormData();
    params.forEach(({ name, value }) => {
        form.append(name, value);
    });
    form.append('file', file);
    const headers = {
        ...form.getHeaders(),
    };
    if (url.includes('amazon')) {
        headers['Content-Length'] = parseInt(info.size) + 5000;
    }
    const uploadResult = await Promise.all([
        fetch(url, {
            headers: headers,
            method: 'POST',
            body: form,
        }),
        client.fileCreate({
            files: {
                alt: info.filename,
                contentType: resourceName as any,
                originalSource: resourceUrl,
            },
        }),
    ]);
    const createFileQueryResult = uploadResult[1].fileCreate?.files;
    if (!createFileQueryResult) {
        return res.status(400);
    }
    const createdFile = createFileQueryResult[0];
    console.log(createdFile);
    if (createdFile.__typename === 'GenericFile' || createdFile.__typename === 'MediaImage') {
        const getFileQuery = await client.getFileUrl({ id: createdFile.id });
        console.log(getFileQuery);
        let fileUrl: string | null = null;
        if (getFileQuery.node?.__typename === 'GenericFile') {
            fileUrl = getFileQuery.node.url;
        } else if (getFileQuery.node?.__typename === 'MediaImage') {
            fileUrl = getFileQuery.node.image?.originalSrc;
        }
        console.log(fileUrl);
        const result = {
            id: createdFile.id,
            url: fileUrl,
            filename: createdFile.alt,
        };
        return res.status(200).send(result);
    }
    res.status(400);
};

export const fileDelete = async (app: Express, req: any, res: any, fileId: string) => {
    // 'gid://shopify/MediaImage/32573113434422'
    const session = await Shopify.Utils.loadCurrentSession(req, res, app.get('use-online-tokens'));
    if (!session) {
        res.status(400);
        return;
    }
    const client = new Graphql(session).client;
    const result = await client.getFileUrl({ id: 'gid://shopify/GenericFile/32575343100214' });
    console.log(result);
    // client.fileDelete({
    //     fileIds: ['gid://shopify/MediaImage/32573113434422'],
    // });
    res.status(200);
};
