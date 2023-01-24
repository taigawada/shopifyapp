import {
    Layout,
    Page,
    Card,
    EmptyState,
    Spinner,
    TextContainer,
    Text,
    Stack,
} from '@shopify/polaris';
import { TitleBar, useAppBridge } from '@shopify/app-bridge-react';

import { useLocation } from 'react-router-dom';
import { Redirect } from '@shopify/app-bridge/actions';
import { useAppQuery } from '../hooks';

import { notFoundImage } from '../assets';

import { GetOrdersByIdsQuery } from '../../graphql-admin/index';

import { MailPrintForm } from '../components/MailPrintForm';
import { useState } from 'react';
import { useCallback } from 'react';

export default function dawnload() {
    const breadcrumbs = [{ content: 'chocolat lumiere', url: '/' }];

    const serachParams = new URLSearchParams(useLocation().search);
    const selectedIds = serachParams.getAll('ids[]');
    const appBridge = useAppBridge();
    const redirect = Redirect.create(appBridge);

    const [errorExist, setErrorExist] = useState(false);
    const onErrorAppear = () => setErrorExist(true);
    const onErrorDisappear = () => setErrorExist(false);
    if (!selectedIds.length) {
        const handlebackToOrders = () => redirect.dispatch(Redirect.Action.ADMIN_PATH, '/orders');
        const handleAppSettings = () =>
            redirect.dispatch(Redirect.Action.APP, '/settings?section=mailprint');
        return (
            <Page>
                <Card>
                    <Card.Section>
                        <EmptyState
                            heading="注文が選択されていません"
                            action={{
                                content: '注文管理へ戻る',
                                onAction: () => handlebackToOrders(),
                            }}
                            secondaryAction={{
                                content: '設定',
                                onAction: () => handleAppSettings(),
                            }}
                            image={notFoundImage}
                        >
                            <p>注文管理へ戻り商品を選択してください。</p>
                        </EmptyState>
                    </Card.Section>
                </Card>
            </Page>
        );
    } else {
        const requestQuery = new URLSearchParams();
        selectedIds.map((id: string) => {
            requestQuery.append('ids', id);
        });
        const requestURL = `/api/orders?${requestQuery.toString()}`;
        const { data, isLoading } = useAppQuery<GetOrdersByIdsQuery>(requestURL);

        const defaultMessage = {
            productNameEmptyMessage: '品名の入力は必須です。',
        };

        if (isLoading) {
            return (
                <Page>
                    <TitleBar title="ダウンロード" breadcrumbs={breadcrumbs} />
                    <div style={{ height: '80vh', display: 'grid', placeContent: 'center' }}>
                        <Stack vertical alignment="center">
                            <Spinner />
                            <TextContainer>
                                <Text variant="headingMd" as="h6" alignment="center">
                                    注文情報を取得中...
                                </Text>
                            </TextContainer>
                        </Stack>
                    </div>
                </Page>
            );
        }
        // if (data?.nodes.every((order) => order?.__typename === 'Order' || order !== null)) {
        //     console.log(data?.nodes.map((order) => order?.__typename));
        //     return;
        // }
        return (
            <Page>
                <TitleBar
                    title="ダウンロード"
                    breadcrumbs={breadcrumbs}
                    primaryAction={{ content: 'ダウンロード', disabled: errorExist }}
                    secondaryActions={[{ content: '注文管理に戻る' }]}
                />
                <MailPrintForm
                    failedOrders={[]}
                    onErrorAppear={onErrorAppear}
                    onErrorDisappear={onErrorDisappear}
                />
            </Page>
        );
    }
}
