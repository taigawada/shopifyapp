import { Page, Stack, Spinner, TextContainer, Text } from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';

export const Initialization = () => (
    <Page>
        <TitleBar title="chocolatlumière" />
        <div style={{ height: '80vh', display: 'grid', placeContent: 'center' }}>
            <Stack vertical alignment="center">
                <Spinner />
                <TextContainer>
                    <Text variant="headingMd" as="h6" alignment="center">
                        アプリケーションの初期化中...
                    </Text>
                </TextContainer>
            </Stack>
        </div>
    </Page>
);
