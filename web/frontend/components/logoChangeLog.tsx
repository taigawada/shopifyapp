import { useContext } from 'react';
import {
    IndexTable,
    useIndexResourceState,
    Text,
    Thumbnail,
    Spinner,
    Link,
    Badge,
    Page,
} from '@shopify/polaris';
import { Toasts } from './providers';
import { css } from '@emotion/react';
import { useAppQuery } from '../hooks';
import { format, isToday, isYesterday } from 'date-fns';

interface Log {
    [key: string]: string;
    graphql_id: string;
    alt: string;
    uploaded_at: string;
    url: string;
}

interface fileChangeLogModalProps {
    open: boolean;
    onClose: () => void;
}

export const LogoChangeLogModal = ({ open, onClose }: fileChangeLogModalProps) => {
    const toast = useContext(Toasts);
    const { data, isLoading } = useAppQuery<Log[]>('/api/logo/log');
    return <Page>{data ? <ChangeLogIndexTable logs={data} /> : <Spinner />}</Page>;
};

interface ChangeLogIndexTableProps {
    logs: Log[];
}

const ChangeLogIndexTable = ({ logs }: ChangeLogIndexTableProps) => {
    const resourceName = {
        singular: 'customer',
        plural: 'customers',
    };
    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(logs);
    const promotedBulkActions = [
        {
            content: '削除する',
            onAction: () => console.log('Todo: implement bulk edit'),
        },
    ];
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
