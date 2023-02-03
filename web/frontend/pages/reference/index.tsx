import { References, ReferencesSkeleton } from '../../components';
import { useAppQuery } from '../../hooks';
import { Settings } from '../../pages/LandingPage';

export default function ReferencesPage() {
    const { data, isLoading } = useAppQuery<Settings>('/api/reference');
    const breadcrumbs = [{ url: '/', content: 'chocolat lumière' }];
    return !data || isLoading ? (
        <ReferencesSkeleton breadcrumbs={breadcrumbs} />
    ) : (
        <References data={data.data} />
    );
}
