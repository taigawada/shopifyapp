export * from './generated/sdk';

import type { Session } from '@shopify/shopify-api/dist/auth/session';
import { GraphQLClient } from 'graphql-request';
import { getSdk, Sdk } from './generated/sdk';

import * as dotenv from 'dotenv';
dotenv.config();

const ENDPOINT = (shop: string, apiVersion: string) =>
    `https://${shop}/admin/api/${apiVersion}/graphql.json`;

export class Graphql {
    client: Sdk;
    constructor(session: Session, apiVersion: string = process.env.API_VERSION!) {
        this.client = getSdk(
            new GraphQLClient(ENDPOINT(session.shop, apiVersion), {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': session.accessToken!,
                },
            })
        );
    }
}
