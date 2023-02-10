import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '../hooks';
import LandingPage from './LandingPage';
import { Initialization } from '../components';

type JobStatus =
    | 'loading'
    | 'completed'
    | 'waiting'
    | 'active'
    | 'delayed'
    | 'failed'
    | 'paused'
    | 'stack';

interface InstalltionState {
    state: JobStatus;
}

export default () => {
    const auththenticateFetch = useAuthenticatedFetch();
    const [state, setState] = useState<InstalltionState>({ state: 'loading' });
    useEffect(() => {
        const timer = setInterval(async () => {
            const fetch = await auththenticateFetch('/api/installtionState');
            const fetchState = await fetch.json();
            if (fetchState.state === 'completed') clearInterval(timer);
            setState(fetchState);
        }, 1000);
    }, []);
    if (state.state === 'loading') {
        return <></>;
    } else if (state.state !== 'completed') {
        return <Initialization />;
    } else {
        return <LandingPage />;
    }
};
