import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { useMemo } from 'react';
import { useQuery } from 'react-query';
import type { QueryKey, UseQueryOptions } from 'react-query';

/**
 * A hook for querying your custom app data.
 * @desc A thin wrapper around useAuthenticatedFetch and react-query's useQuery.
 *
 * @param {Object} options - The options for your query. Accepts 3 keys:
 *
 * 1. url: The URL to query. E.g: /api/widgets/1`
 * 2. fetchInit: The init options for fetch.  See: https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters
 * 3. reactQueryOptions: The options for `useQuery`. See: https://react-query.tanstack.com/reference/useQuery
 *
 * @returns Return value of useQuery.  See: https://react-query.tanstack.com/reference/useQuery.
 */
export const useAppQuery = <T>(
    url: RequestInfo,
    options: {
        fetchInit?: any;
        reactQueryOptions?: UseQueryOptions;
    } = {
        fetchInit: {},
        reactQueryOptions: {},
    }
) => {
    const authenticatedFetch = useAuthenticatedFetch();
    const fetch = useMemo(() => {
        return async () => {
            const response = await authenticatedFetch(url, options.fetchInit);
            return response.json();
        };
    }, [url, JSON.stringify(options.fetchInit)]);

    return useQuery<T>(url as QueryKey, fetch, {
        ...(options.reactQueryOptions as any),
        refetchOnWindowFocus: false,
    });
};
