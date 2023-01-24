import { createContext, useState } from 'react';
import { randomId } from './randamId';

const Context = createContext({
    randomId: randomId,
});

const ContextsProvider = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
    return (
        <Context.Provider
            value={{
                randomId,
            }}
        >
            {children}
        </Context.Provider>
    );
};

export { Context, ContextsProvider };
