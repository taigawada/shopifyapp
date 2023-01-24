import { useState, useCallback, useEffect, useContext } from 'react';
import type { FunctionComponent, SVGProps } from 'react';
import { Text, Icon, Stack, Card, Banner, List, Box } from '@shopify/polaris';
import { EmailMajor, SoftPackMajor, PageDownMajor } from '@shopify/polaris-icons';
import { css } from '@emotion/react';
import { Accordion } from './parts/Accordion';

import { useLetterpackForm, Letterpack } from './PrintForms/Letterpack';
import { useValidation } from '../hooks/useValidation';
import { Context } from '../contexts';

export const MailPrintForm = ({
    failedOrders,
    onErrorAppear,
    onErrorDisappear,
}: {
    failedOrders: string[];
    onErrorAppear: () => void;
    onErrorDisappear: () => void;
}) => {
    const utils = useContext(Context);

    const [selected, setSelected] = useState(0);
    const handleChange = useCallback((value: number) => setSelected(value), []);
    const [hovered, setHovered] = useState<number | null>(0);
    const handleHoverIn = useCallback((value: number) => setHovered(value), []);
    const handleHoverOut = useCallback(() => setHovered(null), []);
    const [accordionAnimation, setAccordionAnimation] = useState(true);
    const handleAnimationStart = useCallback(() => setAccordionAnimation(false), []);
    const handleAnimationEnd = useCallback(() => setAccordionAnimation(true), []);

    useEffect(() => setAccordionAnimation(false), [selected]);

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
    const { productName, handleProductNameChange } = useLetterpackForm();

    const defaultMessage = {
        productNameEmptyMessage: '品名の入力は必須です。',
    };
    const { validations, handleSetValidation, handleRemoveValidation, isErrorExist } =
        useValidation(defaultMessage, onErrorAppear, onErrorDisappear);
    useEffect(() => {
        if (selected === 2) {
            if (!productName.length) {
                handleSetValidation('productNameEmptyMessage');
            } else {
                handleRemoveValidation('productNameEmptyMessage');
            }
        }
    }, [selected, productName]);
    return (
        <div css={css({ width: '90%', margin: '0 auto' })}>
            <Card
                primaryFooterAction={{ content: 'ダウンロード', disabled: isErrorExist }}
                secondaryFooterActions={[{ content: '注文管理に戻る' }]}
            >
                <Card.Section>
                    {failedOrders.length ? (
                        <Banner
                            title="処理されない注文"
                            status="warning"
                            action={{ content: '詳しく見る' }}
                        >
                            <p>
                                10件の注文が選択されましたが、2件の注文を正しく読み込めませんでした。
                            </p>
                            <List>
                                {failedOrders.map((orderId) => (
                                    <List.Item key={orderId}>{orderId}</List.Item>
                                ))}
                            </List>
                        </Banner>
                    ) : (
                        <Banner title="注文は正常に読み込まれました" status="info">
                            <p>10件の注文が選択され、すべて印刷されます</p>
                        </Banner>
                    )}
                </Card.Section>
                <p>{String(accordionAnimation)}</p>
                <div css={css({ width: '80%', margin: ' 1rem auto' })}>
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
                                    <Icon source={selectBox.source} color={selectBox.color}></Icon>
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
                        <div css={{ width: '80%', margin: '0 auto' }}>
                            {selected === 2 ? (
                                <Letterpack
                                    productName={productName}
                                    onProductNameChange={handleProductNameChange}
                                    errorMessage={validations.productNameEmptyMessage}
                                />
                            ) : (
                                ''
                            )}
                            <div css={css({ margin: 'var(--p-space-2)' })}>
                                <Text variant="bodyMd" as="h4" alignment="center">
                                    以下のファイル名で保存されます
                                </Text>
                            </div>
                            <div css={css({ margin: 'var(--p-space-2)' })}>
                                <Stack alignment="center" distribution="center">
                                    <Icon source={PageDownMajor} color="primary"></Icon>
                                    <Text as="h2" variant="bodyMd" fontWeight="medium">
                                        {'2023-1-10_#1101-#0123_nagagata4gou.pdf'}
                                    </Text>
                                </Stack>
                            </div>
                        </div>
                    </div>
                </Accordion>
            </Card>
        </div>
    );
};
