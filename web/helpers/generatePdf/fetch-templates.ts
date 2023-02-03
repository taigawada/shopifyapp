import fetch from 'node-fetch';

export const getLogoBase64 = async (url: string) => {
    const response = await fetch(url).catch((e) => Promise.reject(e));
    if (!response.ok) return Promise.reject();
    const buffer = await response.buffer().catch((e) => Promise.reject(e));
    return `data:image/png;base64,${buffer.toString('base64')}`;
};

export const getTemplateJson = async (url: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return Promise.reject();
        }
        return await response.json();
    } catch (e) {
        console.log(e);
        Promise.reject(e);
    }
};
