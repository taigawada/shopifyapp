import { Shopify } from '@shopify/shopify-api';
import type { Express, Request, Response } from 'express';
import { Graphql } from '../graphql-admin/index.js';
import FormData from 'form-data';
import fetch from 'node-fetch';

import prisma from '../prisma/index.js';
import fs from 'fs/promises';
import { join } from 'path';
import { Session } from '@shopify/shopify-api/dist/auth/session';

import { FileStatus } from '../graphql-admin/index.js';

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
    interface CreatedFile {
        __typename: 'MediaImage';
        id: string;
        alt?: string | null | undefined;
        fileStatus: FileStatus;
        createdAt: any;
        image?:
            | {
                  __typename?: 'Image' | undefined;
                  originalSrc: any;
              }
            | null
            | undefined;
    }
    let createdFile: CreatedFile;
    if (createFileQueryResult[0] && createFileQueryResult[0].__typename === 'MediaImage') {
        createdFile = createFileQueryResult[0];
    } else {
        return Promise.reject();
    }
    try {
        while (createdFile.fileStatus !== 'READY') {
            if (createdFile.__typename === 'MediaImage') {
                const getFileQuery = await client.getImageById({ id: createdFile.id });
                if (getFileQuery.node?.__typename === 'MediaImage') {
                    createdFile = getFileQuery.node;
                }
            }
            if (createdFile.fileStatus === 'FAILED') {
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

export const templateUpload = async (shopDomain: string, accessToken: string) => {
    const client = new Graphql({ shop: shopDomain, accessToken: accessToken }).client;
    const filenames = ['N4template.json', 'N3template.json', 'LPtemplate.json'];
    const stagedUploadsQueryResult = await client.stagedUploadsCreate({
        input: filenames.map((filename) => ({
            filename: filename,
            resource: 'FILE' as any,
            mimeType: 'application/json',
            httpMethod: 'POST' as any,
        })),
    });
    const targets = stagedUploadsQueryResult.stagedUploadsCreate?.stagedTargets;
    if (!targets) {
        return Promise.reject('failed to staged upload');
    }
    try {
        await Promise.all(
            targets.map(async (target, index) => {
                const params = target.parameters;
                const url = target.url;
                const template = await fs.readFile(
                    join(process.cwd(), `assets/${filenames[index]}`)
                );
                const form = new FormData();
                params.forEach(({ name, value }) => form.append(name, value));
                form.append('file', template);
                const headers = { ...form.getHeaders() };
                if (url.includes('amazon')) {
                    headers['Content-Length'] = template.byteLength + 5000;
                }
                try {
                    const response = await fetch(url, {
                        headers: headers,
                        method: 'POST',
                        body: form,
                    });
                    if (response.ok) {
                        Promise.resolve();
                    } else {
                        Promise.reject(response.status);
                    }
                } catch (e) {
                    Promise.reject(e);
                }
            })
        );
    } catch (e) {
        return Promise.reject(e);
    }
    const createdFilesMutation = await client.imageCreate({
        files: targets.map((target, index) => ({
            alt: filenames[index],
            contentType: 'FILE' as any,
            originalSource: target.resourceUrl,
        })),
    });
    interface CreatedFile {
        __typename: 'GenericFile';
        id: string;
        alt?: string | null | undefined;
        fileStatus: FileStatus;
        createdAt: any;
        url?: string;
    }
    let createdFiles: CreatedFile[];
    if (
        createdFilesMutation.fileCreate?.files?.every((file): file is CreatedFile => {
            return file && file.__typename === 'GenericFile';
        })
    ) {
        createdFiles = createdFilesMutation.fileCreate?.files;
    } else {
        return Promise.reject('failed to upload file.');
    }

    try {
        while (!createdFiles.every((file) => file.fileStatus === 'READY')) {
            if (
                createdFiles.every((file): file is CreatedFile => file.__typename === 'GenericFile')
            ) {
                const getFilesQuery = await client.getFileByIds({
                    fileIds: createdFiles.map((file) => file.id),
                });
                if (
                    getFilesQuery.nodes.every(
                        (file): file is CreatedFile => !!file && file.__typename === 'GenericFile'
                    )
                ) {
                    createdFiles = getFilesQuery.nodes;
                }
            }
            if (createdFiles.some((file) => file.fileStatus === 'FAILED')) {
                return Promise.reject('Upload status is failed.');
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } catch (e) {
        return Promise.reject('failed to wait for ready state.');
    }
    return createdFiles;
};
