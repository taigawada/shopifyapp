import { useRef, useEffect } from 'react';
import { Location } from 'react-router-dom';

export const usePreviousLocation = (location: Location) => {
    const prevLocRef = useRef(location);

    useEffect(() => {
        prevLocRef.current = location;
    }, [location]);

    return prevLocRef.current;
};
