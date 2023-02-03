import { BrowserRouter, Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { NavigationMenu } from '@shopify/app-bridge-react';
import { createApp } from '@shopify/app-bridge';
import Routes from './Routes';

import {
    AppBridgeProvider,
    QueryProvider,
    PolarisProvider,
    UtilsProvider,
    ToastsProvider,
} from './components';
import { AppProvider, Frame } from '@shopify/polaris';
import translations from '@shopify/polaris/locales/ja.json';

const config = {
    apiKey: process.env.SHOPIFY_API_KEY!,
    host: new URLSearchParams(location.search).get('host')!,
    forceRedirect: true,
};
export const appBridge = createApp(config);

interface LinkComponent {
    children?: ReactNode;
    external?: boolean;
    url: string;
}

export default function App() {
    const LinkComponent = ({ children, url, external, ...rest }: LinkComponent) => {
        if (external) {
            return (
                <a href={url} target="_blank" {...rest}>
                    {children}
                </a>
            );
        } else {
            return (
                <Link to={url} {...rest}>
                    {children}
                </Link>
            );
        }
    };

    // Any .tsx or .jsx files in /pages will become a route
    // See documentation for <Routes /> for more info
    //@ts-ignore
    const pages = import.meta.globEager('./pages/**/!(*.test.[jt]sx)*.([jt]sx)');

    return (
        <PolarisProvider>
            <BrowserRouter>
                <AppProvider i18n={translations} linkComponent={LinkComponent}>
                    <AppBridgeProvider>
                        <QueryProvider>
                            <UtilsProvider>
                                <NavigationMenu
                                    navigationLinks={[
                                        {
                                            label: '封筒PDF印刷設定',
                                            destination: '/reference',
                                        },
                                    ]}
                                />
                                <Frame>
                                    <ToastsProvider>
                                        <Routes pages={pages} />
                                    </ToastsProvider>
                                </Frame>
                            </UtilsProvider>
                        </QueryProvider>
                    </AppBridgeProvider>
                </AppProvider>
            </BrowserRouter>
        </PolarisProvider>
    );
}
