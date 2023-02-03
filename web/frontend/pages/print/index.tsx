import { useCallback } from 'react';
import { Page, Card, EmptyState, Spinner, TextContainer, Text, Stack } from '@shopify/polaris';
import { TitleBar, useAppBridge } from '@shopify/app-bridge-react';

import { useLocation } from 'react-router-dom';
import { Redirect } from '@shopify/app-bridge/actions';
import { useAppQuery } from '../../hooks';

import { notFoundImage } from '../../assets';

import type { GetOrdersByIdsQuery } from '../../../graphql-admin/index';

import { DownloadPDF } from '../../components';

export interface GetOrders {
    accepted: GetOrdersByIdsQuery['nodes'];
    rejected: {
        name: string;
        invalidKeys: string[];
    }[];
}

export default function Print() {
    const breadcrumbs = [{ content: 'chocolat lumiere', url: '/' }];

    const serachParams = new URLSearchParams(useLocation().search);
    const selectedIds = serachParams.getAll('ids[]');
    const appBridge = useAppBridge();
    const redirect = Redirect.create(appBridge);

    const handlebackToOrders = useCallback(
        () => redirect.dispatch(Redirect.Action.ADMIN_PATH, '/orders'),
        []
    );
    const handleAppSettings = useCallback(
        () => redirect.dispatch(Redirect.Action.APP, '/reference'),
        []
    );
    if (!selectedIds.length) {
        return (
            <Page>
                <Card>
                    <Card.Section>
                        <EmptyState
                            heading="注文が選択されていません"
                            action={{
                                content: '注文管理へ戻る',
                                onAction: handlebackToOrders,
                            }}
                            secondaryAction={{
                                content: '設定',
                                onAction: handleAppSettings,
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
        const { data, isLoading } = useAppQuery<GetOrders>(requestURL);
        if (isLoading || !data) {
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
        return <DownloadPDF orderData={data} />;
    }
}
