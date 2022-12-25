export * from './generated/sdk';
import { Session } from '@shopify/shopify-api/dist/auth/session';
import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/sdk';

const ENDPOINT = (shop: string, apiVersion: string) =>
    `https://${shop}/admin/api/${apiVersion}/graphql.json`;

export class Graphql {
    session: Session;
    apiVersion: string;
    constructor(session: Session, apiVersion: string = '2022-10') {
        this.session = session;
        this.apiVersion = apiVersion;
    }
    get client() {
        return getSdk(
            new GraphQLClient(ENDPOINT(this.session.shop, this.apiVersion), {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': this.session.accessToken!,
                },
            })
        );
    }
}
