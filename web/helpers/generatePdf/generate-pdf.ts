import { promises as fs } from 'fs';
import { generate } from '@pdfme/generator';
import { createCanvas, registerFont } from 'canvas';

export type Records = {
    orderNumber: string;
    shippingName: string;
    shippingAddress1: string;
    shippingAddress2: string;
    shippingCity: string;
    shippingZip: string;
    shippingProvince: string;
}[];

interface FixedData {
    logo: string;
    logoText: string;
    logoCaption1: string;
    logoCaption2: string;
    logoCaption3: string;
}

const zipcodeToImage = async (zipcode: string, fontSizeRatio: number) => {
    registerFont('./Fonts/OCRB.ttf', { family: 'OCRB' });
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
        .readFile('./Fonts/GenShinGothic-Light.ttf')
        .catch(() => Promise.reject());
    const font = {
        'GenShinGothic-Light': {
            data: fontfile,
            fallback: true,
        },
    };
    const inputDatas = records.map(async (inputData) => ({
        orderNumber: inputData.orderNumber,
        zipcode: `〒${inputData.shippingZip.slice(0, 3)}-${inputData.shippingZip.slice(3)}`,
        zipcodeImage: await zipcodeToImage(inputData.shippingZip, fontSizeRatio),
        address1: `${inputData.shippingProvince} ${inputData.shippingCity} ${inputData.shippingAddress1}`,
        address2: inputData.shippingAddress2,
        name: `${inputData.shippingName} 様`,
        logo: fixedData.logo,
        logoText: fixedData.logoText,
        logoCaption1: fixedData.logoCaption1,
        logoCaption2: fixedData.logoCaption2,
        logoCaption3: fixedData.logoCaption3,
    }));
    const inputs = await Promise.all(inputDatas).catch(() => Promise.reject());
    const pdf = await generate({ template, inputs, options: { font: font } }).catch(() =>
        Promise.reject()
    );
    return pdf;
};
