import { useState, useCallback, useEffect, useContext } from 'react';
import type { FunctionComponent, SVGProps } from 'react';
import {
    Text,
    Icon,
    Stack,
    Card,
    Banner,
    List,
    TextField,
    Page,
    Layout,
    FormLayout,
} from '@shopify/polaris';
import { EmailMajor, SoftPackMajor, PageDownMajor } from '@shopify/polaris-icons';
import { css } from '@emotion/react';
import { Accordion } from './parts/Accordion';
import { useField, notEmpty } from '@shopify/react-form';
import { Toasts, Utils } from './providers';
import { TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import type { GetOrders } from '../pages/print';
import { useAuthenticatedFetch } from '../hooks';
import { format } from 'date-fns';
import { useI18n } from '@shopify/react-i18n';

export const DownloadPDF = ({ orderData }: { orderData: GetOrders }) => {
    const jp = {
        InvalidKeys: {
            zip: '郵便番号',
            provinceCode: '都道府県',
            city: '市区町村',
            address1: '住所1',
            address2: '住所2',
            firstName: '名',
            lastName: '性',
        },
    };
    const [i18n] = useI18n({
        id: 'InvalidKeys',
        fallback: jp,
        translations: () => jp,
    });
    const appBridge = useAppBridge();
    const redirect = Redirect.create(appBridge);
    const handlebackToOrders = useCallback(
        () => redirect.dispatch(Redirect.Action.ADMIN_PATH, '/orders'),
        []
    );
    const utils = useContext(Utils);
    const toasts = useContext(Toasts);
    const authenticatedFetch = useAuthenticatedFetch();

    const breadcrumbs = [{ content: 'chocolat lumiere', url: '/' }];

    const [selected, setSelected] = useState(0);
    const handleChange = useCallback((value: number) => setSelected(value), []);
    const [hovered, setHovered] = useState<number | null>(0);
    const handleHoverIn = useCallback((value: number) => setHovered(value), []);
    const handleHoverOut = useCallback(() => setHovered(null), []);
    const [accordionAnimation, setAccordionAnimation] = useState(true);
    const handleAnimationEnd = useCallback(() => setAccordionAnimation(true), []);
    useEffect(() => setAccordionAnimation(false), [selected]);

    const productName = useField({
        value: '',
        validates: [notEmpty('必須項目です')],
    });
    const [isDownloading, setIsdownloading] = useState(false);
    const handleDownload = async () => {
        setIsdownloading(true);
        const requestQuery = new URLSearchParams();
        requestQuery.append('envelopeType', ['N4template', 'N3template', 'LPtemplate'][selected]);
        requestQuery.append('productName', productName.value);
        const requestURL = `/api/download?${requestQuery.toString()}`;
        const form = new FormData();
        form.append('records', JSON.stringify(orderData.accepted));
        const response = await authenticatedFetch(requestURL, {
            method: 'POST',
            body: form,
        });
        if (!response.ok) {
            setIsdownloading(false);
            toasts.showToast('ダウンロードに失敗しました', true);
            return;
        }
        const arrayBuffer = await response.arrayBuffer();
        const url = URL.createObjectURL(new Blob([arrayBuffer], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.target = '_blank';
        link.download = `${['長型4号', '長型3号', 'レターパック'][selected]} ${format(
            new Date(),
            'yyyy-MM-dd HH.mm.ss'
        )}.pdf`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setIsdownloading(false);
        toasts.showToast('ダウンロードが完了しました');
    };

    const selectBoxContentWrapper = css({
        textAlign: 'center',
        width: '100%',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
    });

    const selectContent: {
        content: string;
        source: FunctionComponent<SVGProps<SVGSVGElement>>;
        color: 'base' | 'subdued';
    }[] = [
        {
            content: '長型4号',
            source: EmailMajor,
            color: 'base',
        },
        {
            content: '長型3号',
            source: EmailMajor,
            color: 'subdued',
        },
        {
            content: 'レターパック',
            source: SoftPackMajor,
            color: 'base',
        },
    ];

    const selectBoxCss = (index: number) =>
        css({
            position: 'relative',
            width: '80%',
            paddingTop: '80%',
            margin: '0 auto',
            border:
                index === selected
                    ? 'dashed 1px var(--p-border-highlight)'
                    : 'dashed 1px var(--p-border)',
            borderRadius: 'var(--p-border-radius-1)',
            boxShadow: 'var(--p-shadow-button)',
            background:
                index === selected
                    ? 'var(--p-surface-highlight-subdued)'
                    : index === hovered
                    ? 'var(--p-background-hovered)'
                    : 'none',
            cursor: index === selected ? 'auto' : 'pointer',
        });
    const backgroundColor = 'var(--p-surface-subdued)';
    const arrowPadding = 15;
    const printSizeAccordionCss = css({
        position: 'relative',
        width: '100%',
        background: backgroundColor,
        padding: '1rem 0',
        marginTop: `${arrowPadding}px`,
        borderStyle: 'solid',
        borderColor: `var(--p-divider)`,
        borderWidth: `var(--p-border-width-1) 0 var(--p-border-width-1) 0`,
        '::before, ::after': accordionAnimation
            ? {
                  content: '""',
                  position: 'absolute',
                  left: `${(80 / 3 / 2) * (selected * 2 + 1) + 10}%`,
                  width: '0px',
                  height: '0px',
                  margin: 'auto',
                  borderStyle: 'solid',
                  transform: 'translateX(-50%)',
              }
            : {},
        '::before': accordionAnimation
            ? {
                  top: `-${arrowPadding + 1}px`,
                  borderColor: `transparent transparent var(--p-divider) transparent`,
                  borderWidth: `0 ${arrowPadding + 1}px ${arrowPadding + 1}px ${
                      arrowPadding + 1
                  }px`,
              }
            : {},
        '::after': accordionAnimation
            ? {
                  top: `-${arrowPadding}px`,
                  borderColor: `transparent transparent ${backgroundColor} transparent`,
                  borderWidth: `0 ${arrowPadding}px ${arrowPadding}px ${arrowPadding}px`,
              }
            : {},
    });
    return (
        <Page>
            <TitleBar
                title="ダウンロード"
                breadcrumbs={breadcrumbs}
                primaryAction={{
                    content: 'ダウンロード',
                    disabled:
                        (selected === 2 && !productName.value) || orderData.accepted.length < 1,
                    loading: isDownloading,
                    onAction: handleDownload,
                }}
                secondaryActions={[{ content: '注文管理に戻る', onAction: handlebackToOrders }]}
            />
            <div css={css({ width: '90%', margin: '0 auto' })}>
                <Card
                    primaryFooterAction={{
                        content: 'ダウンロード',
                        disabled:
                            (selected === 2 && !productName.value) || orderData.accepted.length < 1,
                        loading: isDownloading,
                        onAction: handleDownload,
                    }}
                    secondaryFooterActions={[
                        { content: '注文管理に戻る', onAction: handlebackToOrders },
                    ]}
                >
                    <Card.Section>
                        {orderData.rejected.length ? (
                            <Banner
                                title={`${
                                    orderData.accepted.length + orderData.rejected.length
                                }件の注文が選択されましたが、${
                                    orderData.rejected.length
                                }件の注文を正しく読み込めませんでした。`}
                                status="warning"
                            >
                                <List>
                                    {orderData.rejected.map((rejectedOrders) => (
                                        <List.Item key={rejectedOrders.name}>
                                            {rejectedOrders.name} (不足項目:{'  '}
                                            {rejectedOrders.invalidKeys
                                                .map((key) =>
                                                    i18n.translate(key, { scope: 'InvalidKeys' })
                                                )
                                                .join(', ')}
                                            )
                                        </List.Item>
                                    ))}
                                </List>
                            </Banner>
                        ) : (
                            <Banner title="注文は正常に読み込まれました" status="info">
                                <p>
                                    {orderData.accepted.length}
                                    件の注文が選択され、すべて印刷されます
                                </p>
                            </Banner>
                        )}
                    </Card.Section>
                    <div css={css({ width: '80%', margin: '0 auto' })}>
                        <Stack distribution="fillEvenly">
                            {selectContent.map((selectBox, index) => (
                                <div
                                    key={utils.randomId()}
                                    css={selectBoxCss(index)}
                                    onClick={() => handleChange(index)}
                                    onMouseEnter={() => handleHoverIn(index)}
                                    onMouseLeave={handleHoverOut}
                                >
                                    <div css={selectBoxContentWrapper}>
                                        <Icon
                                            source={selectBox.source}
                                            color={selectBox.color}
                                        ></Icon>
                                        <Text variant="bodyMd" as="h4">
                                            {selectBox.content}
                                        </Text>
                                    </div>
                                </div>
                            ))}
                        </Stack>
                    </div>
                    <Accordion
                        open={accordionAnimation}
                        arrowPadding={arrowPadding}
                        onAnimationEnded={handleAnimationEnd}
                    >
                        <div css={printSizeAccordionCss}>
                            <Stack vertical alignment="center">
                                <Stack alignment="center" distribution="center">
                                    <Icon source={PageDownMajor} color="primary"></Icon>
                                    <Text as="h2" variant="bodyMd" fontWeight="medium">
                                        {['長型4号', '長型3号', 'レターパック'][selected]}
                                        のPDFをダウンロードします。
                                    </Text>
                                </Stack>
                                <Text as="p" variant="bodyMd">
                                    10秒ほど時間がかかる場合があります
                                </Text>
                            </Stack>
                            {selected === 2 ? (
                                <Stack distribution="fill" alignment="center">
                                    <Stack.Item></Stack.Item>
                                    <TextField
                                        label="品名を入力してください"
                                        autoComplete="off"
                                        placeholder="衣類"
                                        {...productName}
                                    />
                                    <Stack.Item></Stack.Item>
                                </Stack>
                            ) : (
                                <></>
                            )}
                        </div>
                    </Accordion>
                </Card>
            </div>
        </Page>
    );
};
