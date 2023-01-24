import { useState, useCallback } from 'react';
import { Button, Page, Stack, Text, TextField } from '@shopify/polaris';
import { FileDropZone } from '../components/parts/FileUpload';
import { NoteMinor } from '@shopify/polaris-icons';
import { TitleBar } from '@shopify/app-bridge-react';

import { useAuthenticatedFetch } from '../hooks';

interface Loading {
    nagagata4: boolean;
    nagagata3: boolean;
    letterpack: boolean;
}

export default function ManageCode() {
    const authenticatedFetch = useAuthenticatedFetch();
    const breadcrumbs = [{ content: '発送用封筒', url: '/settings' }];

    const [loading, setLoading] = useState<Loading>({
        nagagata4: false,
        nagagata3: false,
        letterpack: false,
    });

    const handleDropZoneDrop = async (file: File) => {
        setLoading({ ...loading, nagagata4: true });
        const fileData = new FormData();
        fileData.append('file', file);
        fileData.append('filename', file.name);
        fileData.append('type', file.type);
        fileData.append('size', String(file.size));
        const result = await authenticatedFetch('/api/fileupload', {
            method: 'POST',
            body: fileData,
        });
        console.log(result);
        setLoading({ ...loading, nagagata4: false });
    };
    const onFileRejected = (filename: string) => {
        console.log(filename);
    };
    const host = location.origin.replace(/^https/, 'wss');
    const conn = new WebSocket(host);

    conn.onopen = (Event) => {
        console.log(Event);
        console.log('接続成功');
    };
    conn.onmessage = function (msg) {
        console.log(msg);
    };
    const handleDelete = async () => {
        // const result = await authenticatedFetch('/websocket/test', {});
        // console.log(result);
        console.log('start');
    };
    const handleTest = () => {
        console.log(conn);
        conn.send('from client.');
    };

    return (
        <Page>
            <TitleBar title="設定" breadcrumbs={breadcrumbs} />
            <Stack alignment="center">
                <Stack.Item fill>
                    <Text variant="headingMd" as="h5">
                        長型4号 テンプレート
                    </Text>
                </Stack.Item>
                <Stack.Item fill>
                    <TextField
                        label=""
                        value={'test.json'}
                        onChange={() => {}}
                        autoComplete="off"
                        readOnly
                    />
                </Stack.Item>
                <Stack.Item>
                    <FileDropZone
                        mediaType="json"
                        loading={loading.nagagata4}
                        handleDropZoneDrop={handleDropZoneDrop}
                        onFileRejected={onFileRejected}
                    />
                </Stack.Item>
            </Stack>
            <Stack alignment="center">
                <Stack.Item fill>
                    <Text variant="headingMd" as="h5">
                        長型4号 テンプレート
                    </Text>
                </Stack.Item>
                <Stack.Item fill>
                    <TextField
                        label=""
                        value={'test.jpeg'}
                        onChange={() => {}}
                        autoComplete="off"
                        readOnly
                    />
                </Stack.Item>
                <Stack.Item>
                    <FileDropZone
                        mediaType="image"
                        loading={loading.nagagata3}
                        handleDropZoneDrop={handleDropZoneDrop}
                        onFileRejected={onFileRejected}
                    />
                </Stack.Item>
            </Stack>
            {/* <Button onClick={handleDelete}>削除</Button>
            <Button onClick={handleTest}>テスト</Button> */}
        </Page>
    );
}
