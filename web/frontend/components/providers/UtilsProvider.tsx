import { createContext } from 'react';
import { Location, useLocation } from 'react-router-dom';
import { randomId, usePreviousLocation } from './utils';

type ContextType = {
    randomId: () => string;
    previousLocation: Location;
};
const Utils = createContext({} as ContextType);

const UtilsProvider = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
    const location = useLocation();
    const previousLocation = usePreviousLocation(location);
    return (
        <Utils.Provider
            value={{
                randomId,
                previousLocation,
            }}
        >
            {children}
        </Utils.Provider>
    );
};

export { Utils, UtilsProvider };
