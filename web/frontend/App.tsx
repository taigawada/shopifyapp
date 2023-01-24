import { BrowserRouter } from 'react-router-dom';
import { NavigationMenu } from '@shopify/app-bridge-react';
import { createApp } from '@shopify/app-bridge';
import Routes from './Routes';

import { ContextsProvider } from './contexts';
import { AppBridgeProvider, QueryProvider, PolarisProvider } from './components';

const config = {
    apiKey: process.env.SHOPIFY_API_KEY!,
    host: new URLSearchParams(location.search).get('host')!,
    forceRedirect: true,
};
export const appBridge = createApp(config);

export default function App() {
    // Any .tsx or .jsx files in /pages will become a route
    // See documentation for <Routes /> for more info
    //@ts-ignore
    const pages = import.meta.globEager('./pages/**/!(*.test.[jt]sx)*.([jt]sx)');

    return (
        <PolarisProvider>
            <BrowserRouter>
                <AppBridgeProvider>
                    <QueryProvider>
                        <ContextsProvider>
                            <NavigationMenu
                                navigationLinks={[
                                    {
                                        label: '設定',
                                        destination: '/settings',
                                    },
                                ]}
                            />
                            <Routes pages={pages} />
                        </ContextsProvider>
                    </QueryProvider>
                </AppBridgeProvider>
            </BrowserRouter>
        </PolarisProvider>
    );
}
