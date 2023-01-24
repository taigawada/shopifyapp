import yml from 'yaml';
import type { CodegenConfig } from '@graphql-codegen/cli';
import { writeFileSync } from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const config: CodegenConfig = {
    overwrite: true,
    schema: [
        {
            [`https://${process.env.SHOP}/admin/api/${process.env.API_VERSION}/graphql.json`]: {
                headers: {
                    'X-Shopify-Access-Token': process.env.ACCESS_TOKEN!,
                },
            },
        },
    ],
    documents: 'graphql-admin/documents/*.graphql',
    emitLegacyCommonJSImports: false,
    generates: {
        'graphql-admin/generated/sdk.ts': {
            plugins: [
                'fragment-matcher',
                'typescript',
                'typescript-operations',
                'typescript-graphql-request',
            ],
        },
    },
};

// save config as yml
writeFileSync('codegen.yml', yml.stringify(config));

export default config;
