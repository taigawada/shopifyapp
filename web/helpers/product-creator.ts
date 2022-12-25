import { Shopify } from '@shopify/shopify-api';
import { Graphql } from '../graphql-admin';

const ADJECTIVES = [
    'autumn',
    'hidden',
    'bitter',
    'misty',
    'silent',
    'empty',
    'dry',
    'dark',
    'summer',
    'icy',
    'delicate',
    'quiet',
    'white',
    'cool',
    'spring',
    'winter',
    'patient',
    'twilight',
    'dawn',
    'crimson',
    'wispy',
    'weathered',
    'blue',
    'billowing',
    'broken',
    'cold',
    'damp',
    'falling',
    'frosty',
    'green',
    'long',
];

const NOUNS = [
    'waterfall',
    'river',
    'breeze',
    'moon',
    'rain',
    'wind',
    'sea',
    'morning',
    'snow',
    'lake',
    'sunset',
    'pine',
    'shadow',
    'leaf',
    'dawn',
    'glitter',
    'forest',
    'hill',
    'cloud',
    'meadow',
    'sun',
    'glade',
    'bird',
    'brook',
    'butterfly',
    'bush',
    'dew',
    'dust',
    'field',
    'fire',
    'flower',
];

export const DEFAULT_PRODUCTS_COUNT = 5;

export default async function productCreator(session, count = DEFAULT_PRODUCTS_COUNT) {
    const grqphql = new Graphql(session).client;
    try {
        for (let i = 0; i < count; i++) {
            await grqphql.populateProduct({
                input: {
                    title: randomTitle(),
                    variants: [
                        {
                            price: randomPrice(),
                        },
                    ],
                },
            });
        }
    } catch (error) {
        if (error instanceof Shopify.Errors.GraphqlQueryError) {
            throw new Error(`${error.message}\n${JSON.stringify(error.response, null, 2)}`);
        } else {
            throw error;
        }
    }
}

function randomTitle() {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    return `${adjective} ${noun}`;
}

function randomPrice() {
    return Math.round((Math.random() * 10 + Number.EPSILON) * 100) / 100;
}