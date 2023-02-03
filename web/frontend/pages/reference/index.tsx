import { useContext } from 'react';
import { References, ReferencesSkeleton, Utils } from '../../components';
import type { ReferencesFetch } from '../../components';
import { useAppQuery } from '../../hooks';

export default function ReferencesPage() {
    const utils = useContext(Utils);
    const { data, isLoading } = useAppQuery<ReferencesFetch>('/api/reference');
    if (!isLoading) console.log(data);
    const breadcrumbs = [{ url: '/', content: 'chocolat lumière' }];
    return !data || isLoading ? (
        <ReferencesSkeleton breadcrumbs={breadcrumbs} />
    ) : (
        <References data={data} />
    );
}
