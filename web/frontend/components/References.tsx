import { useState, useCallback, useContext } from 'react';
import {
    Page,
    Stack,
    Text,
    TextField,
    Link,
    Icon,
    Layout,
    Card,
    FormLayout,
    Banner,
    PageActions,
    Thumbnail,
    Button,
} from '@shopify/polaris';
import { LogoDropZone } from '../components/parts';
import { CircleChevronRightMinor, ViewMajor, IconsMajor } from '@shopify/polaris-icons';
import { TitleBar } from '@shopify/app-bridge-react';
import { Toasts } from '../components/providers';
import { useAuthenticatedFetch } from '../hooks';
import { css } from '@emotion/react';
import {
    useForm,
    useField,
    notEmpty,
    getValues,
    submitSuccess,
    submitFail,
} from '@shopify/react-form';
import { Accordion } from '../components/parts/Accordion';

export interface ReferencesFetch {
    logo_caption1: string;
    logo_caption2: string;
    logo_caption3: string;
    logo_image: [{ url: string }];
    logo_text: string;
    N4template: string;
    N3template: string;
    LPtemplate: string;
}

export const References = ({ data }: { data: ReferencesFetch }) => {
    const toast = useContext(Toasts);
    const authenticatedFetch = useAuthenticatedFetch();
    const breadcrumbs = [{ content: 'トップページ', url: '/' }];

    const [editTemplate, setEditTemplate] = useState(false);
    const handleToggleEditTemplate = useCallback(() => setEditTemplate((prev) => !prev), []);

    const [logoImage, setLogoImage] = useState<File | null>(null);
    const handleDropZoneDrop = useCallback((file: File) => setLogoImage(file), []);
    const onFileRejected = useCallback((rejectedFile: File) => {
        toast.showToast(`ファイル(${rejectedFile.name})のサイズは無効です`, true);
    }, []);

    const { fields, dirty, submit, submitting, makeClean } = useForm({
        fields: {
            logo_text: useField({
                value: data?.logo_text,
                validates: [notEmpty('入力は必須です')],
            }),
            logo_caption1: useField({
                value: data?.logo_caption1,
                validates: [],
            }),
            logo_caption2: useField({
                value: data?.logo_caption2,
                validates: [],
            }),
            logo_caption3: useField({
                value: data?.logo_caption3,
                validates: [],
            }),
            N4template: useField({
                value: data.N4template,
                validates: [
                    (value: string) => {
                        try {
                            new URL(value);
                        } catch {
                            return '入力はURLである必要があります。';
                        }
                    },
                ],
            }),
            N3template: useField({
                value: data.N3template,
                validates: [
                    (value: string) => {
                        try {
                            new URL(value);
                        } catch {
                            return '入力はURLである必要があります。';
                        }
                    },
                ],
            }),
            LPtemplate: useField({
                value: data.LPtemplate,
                validates: [
                    (value: string) => {
                        try {
                            new URL(value);
                        } catch {
                            return '入力はURLである必要があります。';
                        }
                    },
                ],
            }),
        },
        onSubmit: async (fieldValues) => {
            const form = new FormData();
            if (logoImage) {
                form.append('logo', logoImage);
            }
            if (dirty) {
                form.append('references', JSON.stringify(fieldValues));
            }
            const response = await authenticatedFetch('/api/reference', {
                method: 'PUT',
                body: form,
            });
            if (response.status !== 200) {
                toast.showToast('設定を更新できませんでした', true);
                return submitFail([{ message: response.statusText }]);
            } else {
                toast.showToast('保存しました', false);
                makeClean();
                return submitSuccess();
            }
        },
    });

    const [previewLoading, setPreviewLoading] = useState(false);
    const handlePreviewPdf = async () => {
        setPreviewLoading(true);
        const form = new FormData();
        const { N4template, N3template, LPtemplate, ...rest } = getValues(fields);
        form.append(
            'templates',
            JSON.stringify({
                N4template: N4template,
                N3template: N3template,
                LPtemplate: LPtemplate,
            })
        );
        form.append('fixed', JSON.stringify(rest));
        if (logoImage) {
            const reader = new FileReader();
            reader.readAsDataURL(logoImage);
            let logoDataURLResolver: ((value: any) => void) | null = null;
            const loadDataURLAwait = new Promise<string | null>(
                (resolve) => (logoDataURLResolver = resolve)
            );
            reader.onload = () => {
                if (logoDataURLResolver) logoDataURLResolver(reader.result);
            };
            const logoDataURL = await loadDataURLAwait;
            if (logoDataURL) form.append('logoBase64', logoDataURL);
        }

        form.append('logoUrl', data.logo_image[0].url);
        const response = await authenticatedFetch('/api/preview', {
            method: 'POST',
            body: form,
        });
        if (response.status !== 200) {
            toast.showToast('プレビューできませんでした', true);
            setPreviewLoading(false);
            return;
        }
        const arrayBuffer = await response.arrayBuffer();
        const url = URL.createObjectURL(new Blob([arrayBuffer], { type: 'application/pdf' }));
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
        setPreviewLoading(false);
    };

    return (
        <Page
            title="印刷設定"
            secondaryActions={[
                {
                    content: 'PDFをプレビュー',
                    icon: ViewMajor,
                    loading: previewLoading,
                    onAction: handlePreviewPdf,
                },
            ]}
            primaryAction={{
                content: '保存',
                disabled: !(!!logoImage || dirty),
                loading: submitting,
                onAction: submit,
            }}
        >
            <TitleBar title="PDF印刷設定" breadcrumbs={breadcrumbs} />
            <Layout>
                <Layout.AnnotatedSection
                    id="text-settings"
                    title="ロゴ"
                    description={
                        <Text variant="bodyMd" as="p">
                            封筒に印刷されるロゴを設定します。
                        </Text>
                    }
                >
                    <Card sectioned>
                        <Stack alignment="center" distribution="equalSpacing">
                            {logoImage ? (
                                <Thumbnail
                                    size="small"
                                    alt={logoImage.name}
                                    source={window.URL.createObjectURL(logoImage)}
                                />
                            ) : (
                                <div
                                    css={css`
                                        display: flex;
                                        justify-content: center;
                                        align-content: center;
                                        background: var(--p-background);
                                        border-radius: var(--p-border-radius-1);
                                        width: 38px;
                                        height: 38px;
                                    `}
                                >
                                    <Icon source={IconsMajor} />
                                </div>
                            )}
                            <Stack.Item>
                                <Text variant="bodyMd" as="p">
                                    ロゴ{' '}
                                    <b>
                                        <span>
                                            {logoImage instanceof File ? `:${logoImage.name}` : ''}
                                        </span>
                                    </b>
                                </Text>
                                <Text variant="bodySm" as="p">
                                    画像は400px以上の正方形で、PNG形式である必要があります。
                                </Text>
                            </Stack.Item>
                            <LogoDropZone
                                onDropZoneDrop={handleDropZoneDrop}
                                onFileRejected={onFileRejected}
                            />
                        </Stack>
                        <Stack distribution="equalSpacing">
                            <Stack.Item />
                            <Link removeUnderline url="/reference/logs">
                                ファイルの変更履歴
                            </Link>
                        </Stack>
                    </Card>
                </Layout.AnnotatedSection>
                <Layout.AnnotatedSection
                    id="text-settings"
                    title="テキスト"
                    description={
                        <Text variant="bodyMd" as="p">
                            封筒に印刷されるテキストを設定します。
                        </Text>
                    }
                >
                    <Card sectioned>
                        <FormLayout>
                            <TextField
                                label="ロゴテキスト"
                                autoComplete="off"
                                {...fields.logo_text}
                            />
                            <TextField
                                label="キャプション1"
                                autoComplete="off"
                                {...fields.logo_caption1}
                            />
                            <TextField
                                label="キャプション2"
                                autoComplete="off"
                                {...fields.logo_caption2}
                            />
                            <TextField
                                label="キャプション3"
                                autoComplete="off"
                                {...fields.logo_caption3}
                            />
                        </FormLayout>
                    </Card>
                </Layout.AnnotatedSection>

                <Layout.Section secondary>
                    <div
                        onClick={handleToggleEditTemplate}
                        css={css({ display: 'inline', cursor: 'pointer' })}
                    >
                        <Stack alignment="center">
                            <div
                                css={{
                                    transform: `rotate(${editTemplate ? '90deg' : '0deg'})`,
                                    transition: 'transform 0.2s',
                                }}
                            >
                                <Icon source={CircleChevronRightMinor} color="subdued"></Icon>
                            </div>
                            <Text variant="headingMd" as="h5" color="subdued">
                                封筒テンプレートを変更する
                            </Text>
                        </Stack>
                    </div>
                </Layout.Section>

                <Accordion open={editTemplate}>
                    <Layout.Section>
                        <Banner></Banner>
                    </Layout.Section>
                    <Layout.AnnotatedSection
                        id="text-settings"
                        title="テンプレート"
                        description={
                            <Text variant="bodyMd" as="p">
                                封筒の印刷に使用するテンプレートを更新します。
                            </Text>
                        }
                    >
                        <Card sectioned>
                            <FormLayout>
                                <div>
                                    <TextField
                                        label="長型4号テンプレート"
                                        type="url"
                                        autoComplete="off"
                                        placeholder="https://cdn.shopify.com/"
                                        {...fields.N4template}
                                    />
                                    <Link monochrome>現在のテンプレートをダウンロード</Link>
                                </div>
                                <div>
                                    <TextField
                                        label="長型3号テンプレート"
                                        type="url"
                                        autoComplete="off"
                                        placeholder="https://cdn.shopify.com/"
                                        {...fields.N3template}
                                    />
                                    <Link monochrome>現在のテンプレートをダウンロード</Link>
                                </div>
                                <div>
                                    <TextField
                                        label="レターパックテンプレート"
                                        type="url"
                                        autoComplete="off"
                                        placeholder="https://cdn.shopify.com/"
                                        {...fields.LPtemplate}
                                    />
                                    <Link monochrome>現在のテンプレートをダウンロード</Link>
                                </div>
                            </FormLayout>
                        </Card>
                    </Layout.AnnotatedSection>
                </Accordion>
            </Layout>
            <PageActions
                primaryAction={{
                    content: '保存',
                    disabled: !(!!logoImage || dirty),
                    loading: submitting,
                    onAction: submit,
                }}
            />
            <div css={css({ height: '20vh' })} />
        </Page>
    );
};
