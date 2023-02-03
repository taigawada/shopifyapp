import {
    SkeletonPage,
    SkeletonDisplayText,
    SkeletonBodyText,
    Layout,
    Card,
    TextContainer,
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
export const ReferencesSkeleton = ({
    breadcrumbs,
}: {
    breadcrumbs: { url: string; content: string }[];
}) => (
    <SkeletonPage primaryAction>
        <TitleBar title="PDF印刷設定" breadcrumbs={breadcrumbs} />
        <Layout>
            <Layout.AnnotatedSection
                id="text-settings"
                title={<SkeletonDisplayText size="small" />}
                description={<SkeletonBodyText lines={1} />}
            >
                <Card sectioned>
                    <TextContainer>
                        <SkeletonDisplayText size="small" />
                        <SkeletonBodyText lines={4} />
                    </TextContainer>
                </Card>
            </Layout.AnnotatedSection>
            <Layout.AnnotatedSection
                id="text-settings"
                title={<SkeletonDisplayText size="small" />}
                description={<SkeletonBodyText lines={1} />}
            >
                <Card sectioned>
                    <TextContainer>
                        <SkeletonDisplayText size="small" />
                        <SkeletonBodyText lines={4} />
                        <SkeletonDisplayText size="small" />
                        <SkeletonBodyText lines={4} />
                    </TextContainer>
                </Card>
            </Layout.AnnotatedSection>
        </Layout>
    </SkeletonPage>
);
