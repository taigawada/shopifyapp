import { useCallback, useState } from 'react';
import { Toast } from '../parts/Toast';
import type { ToastProps } from '../parts/Toast';
import { createContext } from 'react';
import { randomId } from '../providers/utils';

interface ToastContent {
    id: string;
    message: string;
    isError: boolean;
    action?: ToastProps['action'];
}
type ContextType = {
    showToast: (message: string, isError?: boolean, action?: ToastContent['action']) => void;
    toastsList: ToastContent[];
};

export const Toasts = createContext({} as ContextType);

export const ToastsProvider = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
    const [toastsList, setToastsList] = useState<ToastContent[]>([]);
    const onToastDismiss = useCallback((id: any) => {
        setToastsList((prev) => {
            return prev.filter((toast) => toast.id !== id);
        });
    }, []);

    const showToast = (
        message: string,
        isError: boolean = false,
        action?: ToastContent['action']
    ) => {
        setToastsList((prev) => [
            ...prev,
            {
                id: randomId(),
                message: message,
                isError: isError,
                action: action,
            },
        ]);
    };

    const toastMarkup = toastsList.map((toastProps) => {
        return (
            <Toast
                key={toastProps.id}
                id={toastProps.id}
                content={toastProps.message}
                error={toastProps.isError}
                action={toastProps.action}
                onToastDismiss={onToastDismiss}
            />
        );
    });
    return (
        <Toasts.Provider
            value={{
                toastsList,
                showToast,
            }}
        >
            {toastMarkup}
            {children}
        </Toasts.Provider>
    );
};
