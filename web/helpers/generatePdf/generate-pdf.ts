import { promises as fs } from 'fs';
import module from 'module';
const require = module.createRequire(import.meta.url);
import type { GenerateProps } from '@pdfme/generator';
import { provinceCode } from './convert-province-code.js';

interface PdfMe {
    generate: (preps: GenerateProps) => Promise<Uint8Array>;
}
const { generate }: PdfMe = require('@pdfme/generator');

import { createCanvas, registerFont } from 'canvas';

export type Records = {
    id: string;
    __typename: string;
    name: string;
    createdAt: string;
    shippingAddress: {
        zip: string;
        provinceCode: string;
        city: string;
        address1: string;
        address2: string | null;
        firstName: string;
        lastName: string;
    };
}[];

export interface FixedData {
    logo: string;
    logo_text: string;
    logo_caption1: string;
    logo_caption2: string;
    logo_caption3: string;
    productName: string;
}

const zipcodeToImage = async (zipcode: string, fontSizeRatio: number) => {
    registerFont('helpers/generatePdf/Fonts/OCRB.ttf', { family: 'OCRB' });
    const size = {
        width: 20 * 10,
        height: 55 * 10,
    };
    const canvas = createCanvas(size.width, size.height);
    const ctx = canvas.getContext('2d');

    const fontSize = 60 * fontSizeRatio;
    ctx.font = `${fontSize}px OCRB`;
    ctx.rotate((90 * Math.PI) / 180);

    const y_offset = -20;
    const x_interval = 70;
    [...zipcode].map((number, index) => {
        ctx.fillText(number, index * x_interval, y_offset);
    });
    ctx.restore();
    return canvas.toDataURL();
};

export const generatePdf = async (
    template: any,
    records: Records,
    fixedData: FixedData,
    fontSizeRatio: number = 1
) => {
    const fontfile = await fs
        .readFile('helpers/generatePdf/Fonts/GenShinGothic-Light.ttf')
        .catch((e) => Promise.reject(e));
    const font = {
        'GenShinGothic-Light': {
            data: fontfile,
            fallback: true,
        },
    };
    const inputDatas = records.map(async (inputData) => ({
        orderNumber: inputData.name,
        zipcode: `〒${inputData.shippingAddress.zip}`,
        zipcodeImage: await zipcodeToImage(
            inputData.shippingAddress.zip.replace('-', ''),
            fontSizeRatio
        ),
        address1: `${provinceCode(inputData.shippingAddress.provinceCode)} ${
            inputData.shippingAddress.city
        } ${inputData.shippingAddress.address1}`,
        address2: inputData.shippingAddress.address2 ? inputData.shippingAddress.address2 : '',
        name: `${inputData.shippingAddress.lastName} ${inputData.shippingAddress.firstName} 様`,
        logo: fixedData.logo,
        logoText: fixedData.logo_text,
        logoCaption1: fixedData.logo_caption1,
        logoCaption2: fixedData.logo_caption2,
        logoCaption3: fixedData.logo_caption3,
        productName: fixedData.productName,
    }));
    const inputs = await Promise.all(inputDatas).catch((e) => Promise.reject(e));
    const pdf = await generate({ template, inputs, options: { font: font } }).catch((e) =>
        Promise.reject(e)
    );
    return Buffer.from(pdf);
};
