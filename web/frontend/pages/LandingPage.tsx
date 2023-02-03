import {
    Button,
    Card,
    Page,
    Layout,
    TextContainer,
    Image,
    Stack,
    Text,
    Banner,
    Link,
} from '@shopify/polaris';
import { TitleBar, useAppBridge } from '@shopify/app-bridge-react';

import { useAppQuery } from '../hooks';

import { mailPrintImage } from '../assets';

import { Redirect } from '@shopify/app-bridge/actions';

import { References } from '@prisma/client';
import { useCallback } from 'react';

interface Settings {
    data: References;
    isSufficient: boolean;
}

export default function LandingPage() {
    const appBridge = useAppBridge();
    const redirect = Redirect.create(appBridge);

    const { data, isLoading } = useAppQuery<Settings>('/api/reference');
    return (
        <Page fullWidth>
            <TitleBar title="chocolatlumiere" />
            <Layout>
                <Layout.Section secondary>
                    <Card title="Tags" sectioned>
                        <p>Add tags to your order.</p>
                    </Card>
                </Layout.Section>
                <Layout.Section>
                    <Card
                        sectioned
                        primaryFooterAction={{
                            content: '注文管理',
                            onAction: () =>
                                redirect.dispatch(Redirect.Action.ADMIN_PATH, '/orders'),
                        }}
                        secondaryFooterActions={[
                            {
                                content: '設定',
                                url: '/reference',
                            },
                        ]}
                    >
                        {!isLoading && !data?.isSufficient ? (
                            <TextContainer>
                                <Banner title="印刷設定に不備があります。" status="critical">
                                    <p>
                                        設定が完了するまで、封筒の印刷はできません。
                                        <Link url="/reference">設定へ</Link>
                                    </p>
                                </Banner>
                            </TextContainer>
                        ) : (
                            <></>
                        )}
                        <Stack
                            wrap={false}
                            spacing="extraTight"
                            distribution="trailing"
                            alignment="center"
                        >
                            <Stack.Item fill>
                                <Text variant="headingLg" as="h6">
                                    封筒印刷
                                </Text>
                                <p>
                                    Your app is ready to explore! It contains everything you need to
                                    get started including the UI library and components.
                                </p>
                                <p>
                                    Ready to go? Start populating your app with some sample products
                                    to view and test in your store.{' '}
                                </p>
                            </Stack.Item>
                            <Stack.Item>
                                <div style={{ padding: '0 20px' }}>
                                    <Image
                                        source={mailPrintImage}
                                        alt="You can print envelopes with this app!"
                                        width={120}
                                    />
                                </div>
                            </Stack.Item>
                        </Stack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
