import {
    Card,
    Page,
    Layout,
    TextContainer,
    Image,
    Stack,
    Text,
    Banner,
    Link,
    List,
} from '@shopify/polaris';
import { TitleBar, useAppBridge } from '@shopify/app-bridge-react';

import { useAppQuery } from '../hooks';
import { mailPrintImage } from '../assets';
import { Redirect } from '@shopify/app-bridge/actions';
import { ReferencesFetch } from '../components';

export interface Settings {
    data: ReferencesFetch;
    isUrlAlive: boolean;
}

export default function LandingPage() {
    const appBridge = useAppBridge();
    const redirect = Redirect.create(appBridge);

    const { data, isLoading } = useAppQuery<Settings>('/api/reference');
    return (
        <Page fullWidth>
            <TitleBar title="chocolatlumière" />
            <Layout>
                <Layout.Section secondary>
                    <Card title="在庫管理" sectioned>
                        {[...Array(5).keys()].map((index) => (
                            <List key={String(index)}>サンプル{index}</List>
                        ))}
                    </Card>
                </Layout.Section>
                <Layout.Section>
                    <Card
                        sectioned
                        title="封筒印刷"
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
                        {!isLoading && !data?.isUrlAlive ? (
                            <TextContainer>
                                <Banner
                                    title="現在参照されているテンプレートが読み込めませんでした。"
                                    status="critical"
                                >
                                    <p>
                                        参照先のリンクが切れている可能性があります。設定を更新しない限り、PDFをダウンロードできません。
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
                                <Text variant="bodyMd" as="p">
                                    注文管理画面から注文を選択し、そのままPDFとしてダウンロードすることができます。
                                </Text>
                                <Text variant="bodyMd" as="p">
                                    また、PDFに埋め込まれるロゴやテキストの編集、PDF印刷に用いるテンプレートの変更が設定できます。
                                </Text>
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
