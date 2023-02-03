import { css } from '@emotion/react';
import { memo } from 'react';
import { Divider, Icon, Stack, Text, Spinner } from '@shopify/polaris';
import {
    ImageMajor,
    PageUpMajor,
    CancelMajor,
    CircleTickMajor,
    CircleAlertMajor,
} from '@shopify/polaris-icons';
import { animated, useTransition } from '@react-spring/web';
import { Topics } from '../../type/Topics';

type TopicName = 'started' | 'fileStagedUpload' | 'commenceUploading' | 'result' | 'failed' | '';

export type Process = {
    type: Topics['fileInfo']['data']['fileType'];
    filename: string;
    mediaType: Topics['fileInfo']['data']['resourceName'];
    topic: TopicName;
    status: string;
    isCompleted: boolean;
    isFailed: boolean;
};

interface Props {
    open: boolean;
    processes: Process[];
    onClose: () => unknown;
}

export const FileProcessToast = ({ processes, open, onClose }: Props) => {
    const toastWrapperCss = css`
        background: var(--p-surface-dark);
        drop-shadow: var(--p-shadow-popover);
        border-radius: var(--p-border-radius-2);
        position: fixed;
        width: 300px;
        left: 3%;
        bottom: 5%;
        z-index: var(--p-z-10);
        padding: var(--p-space-4);
    `;
    const transitions = useTransition(open, {
        config: {
            duration: 300,
        },
        from: {
            transform: 'translateY(100%)',
        },
        enter: {
            transform: 'translateY(0%)',
        },
        leave: {
            transform: 'translateY(100%)',
        },
    });
    if (open)
        return transitions((style) => (
            <animated.div css={toastWrapperCss} style={style}>
                <Stack alignment="center" distribution="equalSpacing">
                    <Text variant="headingMd" as="p" color="text-inverse">
                        アップロード中...
                    </Text>
                    <div
                        onClick={onClose}
                        css={css`
                            cursor: pointer;
                        `}
                    >
                        <Icon source={CancelMajor} color="subdued" />
                    </div>
                </Stack>

                <Text variant="bodySm" as="p" color="subdued">
                    {processes.length}のファイルを処理中です
                </Text>
                {processes.map((data, index) => (
                    <ChildProcess key={index} data={data} />
                ))}
            </animated.div>
        ));
    else return <></>;
};

const prepareFunc = (prev: { data: Process }, next: { data: Process }) => {
    return JSON.stringify(prev.data) == JSON.stringify(next.data);
};

export const ChildProcess = memo(({ data }: { data: Process }) => {
    const StackItem = ({ data }: { data: Process }) => {
        if (data.isCompleted)
            return (
                <Stack alignment="center">
                    <Icon source={CircleTickMajor} color="subdued" />
                    <Text variant="bodyMd" as="p" color="text-inverse">
                        {data.filename}
                    </Text>
                    <Text variant="bodyMd" as="p" color="text-inverse">
                        アップロード済み
                    </Text>
                </Stack>
            );
        else if (data.isFailed)
            return (
                <Stack alignment="center">
                    <Icon source={CircleAlertMajor} color="subdued" />
                    <Text variant="bodyMd" as="p" color="text-inverse">
                        {data.filename}
                    </Text>
                    <Text variant="bodyMd" as="p" color="text-inverse">
                        アップロードに失敗しました
                    </Text>
                </Stack>
            );
        else if (data.mediaType === 'IMAGE')
            return (
                <>
                    <Stack alignment="center">
                        <Icon source={ImageMajor} color="subdued" />
                        <Stack.Item fill>
                            <Text variant="bodyMd" as="span" color="text-inverse">
                                {data.filename}
                            </Text>
                        </Stack.Item>

                        <div css={css({ width: 20, height: 20 })}>
                            <Spinner size="small" />
                        </div>
                    </Stack>
                    <Text variant="bodySm" as="span" color="subdued">
                        {(() => {
                            if (data.topic === 'fileStagedUpload') return 'ファイルを処理中...';
                            else if (data.topic === 'commenceUploading')
                                return 'ファイルをアップロード中...';
                        })()}
                    </Text>
                </>
            );
        else if (data.mediaType === 'FILE')
            return (
                <>
                    <Stack alignment="center">
                        <Icon source={PageUpMajor} color="subdued" />
                        <Stack.Item fill>
                            <Text variant="bodyMd" as="span" color="text-inverse">
                                {data.filename}
                            </Text>
                        </Stack.Item>
                        <div css={css({ width: 20, height: 20 })}>
                            <Spinner size="small" />
                        </div>
                    </Stack>
                    <Text variant="bodySm" as="span" color="subdued">
                        {(() => {
                            if (data.topic === 'fileStagedUpload') return '画像を処理中...';
                            else if (data.topic === 'commenceUploading')
                                return '画像をアップロード中...';
                        })()}
                    </Text>
                </>
            );
        else return <></>;
    };
    return (
        <div>
            <Divider borderStyle="divider-on-dark" />
            <div
                css={css`
                    padding: var(--p-space-3);
                    width: 80%;
                `}
            >
                <StackItem data={data} />
            </div>
        </div>
    );
}, prepareFunc);
