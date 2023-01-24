export const getLogoBybase64 = async (url: string) => {
    const response = await fetch(url).catch(() => Promise.reject());
    if (!response.ok) {
        return Promise.reject();
    }
    const blob = await response.blob().catch(() => Promise.reject());
    const blobText = await blob.text().catch(() => Promise.reject());
    return `data:${blob.type};base64,${Buffer.from(blobText).toString('base64')}`;
};

export const getTemplateByJson = async (url: string) => {
    const response = await fetch(url).catch(() => Promise.reject());
    if (!response.ok) {
        return Promise.reject();
    }
    return response.json();
};
