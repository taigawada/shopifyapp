import { useCallback, useContext } from 'react';
import {
    Card,
    IndexTable,
    useIndexResourceState,
    Text,
    Thumbnail,
    EmptySearchResult,
    Link,
    Badge,
    Page,
} from '@shopify/polaris';
import { useAuthenticatedFetch } from '../../hooks';
import { Toasts } from '../../components/providers';
import { useAppQuery } from '../../hooks';
import { format, isToday, isYesterday } from 'date-fns';
import { TitleBar } from '@shopify/app-bridge-react';

interface Log {
    [key: string]: string;
    graphql_id: string;
    alt: string;
    uploaded_at: string;
    url: string;
}

export default () => {
    const breadcrumbs = [{ content: 'PDF印刷設定', url: '/reference' }];
    const { data, isLoading, refetch, isRefetching } = useAppQuery<Log[]>('/api/logo/log');
    const handleRefetch = () => refetch();
    return (
        <Page>
            <TitleBar title="ファイル変更履歴" breadcrumbs={breadcrumbs} />
            <Card>
                <ChangeLogIndexTable
                    logs={data ? data : []}
                    loading={isLoading || isRefetching}
                    onRefetch={handleRefetch}
                />
            </Card>
        </Page>
    );
};

interface ChangeLogIndexTableProps {
    logs: Log[];
    loading: boolean;
    onRefetch: () => unknown;
}

const ChangeLogIndexTable = ({ logs, loading, onRefetch }: ChangeLogIndexTableProps) => {
    const toasts = useContext(Toasts);
    const authenticatedFetch = useAuthenticatedFetch();
    const resourceName = {
        singular: 'ファイル',
        plural: 'ファイル',
    };
    const { selectedResources, allResourcesSelected, handleSelectionChange, clearSelection } =
        useIndexResourceState(logs);

    const promotedBulkActions = [
        {
            content: '削除する',
            onAction: async () => {
                toasts.showToast('ファイルを削除しています...');
                const query = new URLSearchParams();
                selectedResources.forEach((value) => query.append('graphqlId', value));
                const response = await authenticatedFetch(`/api/logo/log?${query.toString()}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    toasts.showToast('削除に失敗しました', true);
                    return;
                }
                clearSelection();
                onRefetch();
                toasts.showToast('削除しました', false, {
                    content: '元に戻す',
                    onAction: async () => {
                        const undoResponse = await authenticatedFetch(
                            `/api/logo/log?${query.toString()}`,
                            {
                                method: 'PUT',
                            }
                        );
                        if (!undoResponse.ok) {
                            toasts.showToast('元に戻すことができませんでした', true);
                            return;
                        }
                        onRefetch();
                        toasts.showToast('削除を取り消しました');
                    },
                });
            },
        },
        {
            content: 'ダウンロード',
            onAction: async () => {
                const selected = logs.filter(
                    (log) => selectedResources.includes(log.graphql_id) && log.url
                );
                selected.reduce(
                    (promise, log) =>
                        promise.then(async () => {
                            const response = await fetch(log.url);
                            const blob = await response.blob();
                            const downloadUrl = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.target = '_blank';
                            link.download = log.alt;
                            link.href = downloadUrl;
                            link.click();
                            URL.revokeObjectURL(downloadUrl);
                        }),
                    Promise.resolve()
                );
            },
        },
    ];

    const emptyStateMarkup = (
        <EmptySearchResult
            title={'読み込み中'}
            description={'ファイルを読み込み中です'}
            withIllustration
        />
    );
    const rowMarkup = logs.map(({ graphql_id, alt, url, uploaded_at }, index) => (
        <IndexTable.Row
            id={graphql_id}
            key={graphql_id}
            selected={selectedResources.includes(graphql_id)}
            position={index}
        >
            <IndexTable.Cell>
                <Thumbnail source={url} alt={alt} />
            </IndexTable.Cell>
            <IndexTable.Cell>
                <Text variant="bodyMd" fontWeight="bold" as="span">
                    <Link url={url} external monochrome>
                        {alt}
                    </Link>
                </Text>
            </IndexTable.Cell>
            <IndexTable.Cell>{dateFormat(uploaded_at)}</IndexTable.Cell>
            <IndexTable.Cell>
                {index === 0 ? <Badge status="info">最新バージョン</Badge> : undefined}
            </IndexTable.Cell>
        </IndexTable.Row>
    ));
    return (
        <IndexTable
            resourceName={resourceName}
            itemCount={logs.length}
            promotedBulkActions={promotedBulkActions}
            selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
            onSelectionChange={handleSelectionChange}
            headings={[{ title: '' }, { title: 'ファイル名' }, { title: '追加日' }]}
            loading={loading}
            emptyState={emptyStateMarkup}
        >
            {rowMarkup}
        </IndexTable>
    );
};

const dateFormat = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
        return format(date, '今日のHH:mm');
    } else if (isYesterday(date)) {
        return format(date, '昨日のHH:mm');
    } else return format(new Date(date), 'yyyy年MM月dd日');
};
