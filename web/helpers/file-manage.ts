import { Shopify } from '@shopify/shopify-api';
import type { Express, Request, Response } from 'express';
import { Graphql } from '../graphql-admin';
import FormData from 'form-data';
import fetch from 'node-fetch';

import prisma from '../prisma';

import { Session } from '@shopify/shopify-api/dist/auth/session';

export const logoUpload = async (session: Session, file: Express.Multer.File) => {
    const client = new Graphql(session).client;
    const stagedUploadsQueryResult = await client.stagedUploadsCreate({
        input: {
            filename: file.originalname,
            resource: 'IMAGE' as any,
            mimeType: file.mimetype,
            httpMethod: 'POST' as any,
        },
    });
    const target = stagedUploadsQueryResult.stagedUploadsCreate?.stagedTargets;
    if (!target) {
        return Promise.reject('failed to staged upload');
    }
    const params = target[0].parameters;
    const url = target[0].url;
    const resourceUrl = target[0].resourceUrl;

    const form = new FormData();
    params.forEach(({ name, value }) => form.append(name, value));
    form.append('file', file.buffer);
    const headers = { ...form.getHeaders() };
    if (url.includes('amazon')) {
        headers['Content-Length'] = file.size + 5000;
    }
    const [_, createdImage] = await Promise.all([
        fetch(url, {
            headers: headers,
            method: 'POST',
            body: form,
        }),
        client.imageCreate({
            files: {
                alt: file.originalname,
                contentType: 'IMAGE' as any,
                originalSource: resourceUrl,
            },
        }),
    ]).catch((e) => Promise.reject(e));
    const createFileQueryResult = createdImage.fileCreate?.files;
    if (!createFileQueryResult) {
        return Promise.reject('failed to upload file.');
    }
    let createdFile = createFileQueryResult[0];
    type FileStatus = 'UPLOADED' | 'READY' | 'PROCESSING' | 'FAILED';
    let fileStatus: FileStatus = createdFile.fileStatus;
    try {
        while (createdFile.fileStatus !== 'READY') {
            if (createdFile.__typename === 'MediaImage') {
                const getFileQuery = await client.getImageById({ id: createdFile.id });
                if (getFileQuery.node?.__typename === 'MediaImage') {
                    createdFile = getFileQuery.node;
                    fileStatus = getFileQuery.node.fileStatus;
                }
            }
            if (fileStatus === 'FAILED') {
                return Promise.reject('Upload status is failed.');
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } catch (e) {
        return Promise.reject('failed to wait for ready state.');
    }
    if (createdFile.__typename === 'MediaImage') {
        return createdFile;
    } else {
        return Promise.reject('upload failed');
    }
};

export const getFilelog = async (app: Express, req: Request, res: Response) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, app.get('use-online-tokens'));
    if (!session) return res.status(401);
    try {
        const result = await prisma.logoImageLogs.findMany({
            where: {
                AND: [
                    {
                        shop: session.shop,
                    },
                    {
                        is_deleted: false,
                    },
                ],
            },
            orderBy: {
                uploaded_at: 'desc',
            },
        });
        res.status(200).send(result);
    } catch (e) {
        res.status(400).send(e);
    }
};

export const deleteFilelog = async (req: Request, res: Response, fileIds: string[]) => {
    try {
        await prisma.$transaction(
            fileIds.map((graphqlId) =>
                prisma.logoImageLogs.update({
                    where: {
                        graphql_id: graphqlId,
                    },
                    data: {
                        is_deleted: true,
                    },
                })
            )
        );
    } catch (e) {
        console.log(e);
        res.sendStatus(400);
        return;
    }
    res.sendStatus(200);
};
export const deleteFilelogUndo = async (req: Request, res: Response, fileIds: string[]) => {
    try {
        await prisma.$transaction(
            fileIds.map((graphqlId) =>
                prisma.logoImageLogs.update({
                    where: {
                        graphql_id: graphqlId,
                    },
                    data: {
                        is_deleted: false,
                    },
                })
            )
        );
    } catch {
        res.sendStatus(400);
        return;
    }
    res.sendStatus(200);
};
