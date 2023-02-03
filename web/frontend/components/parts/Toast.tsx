import { Toast as ShopifyToast, ToastProps as ShopifyToastProps } from '@shopify/polaris';

export interface ToastProps {
    content: ShopifyToastProps['content'];
    duration?: ShopifyToastProps['duration'];
    error: ShopifyToastProps['error'];
    action?: ShopifyToastProps['action'];
    id: any;
    onToastDismiss: (id: any) => void;
}

export const Toast = ({ content, error, action, duration, onToastDismiss, id }: ToastProps) => {
    return (
        <ShopifyToast
            content={content}
            error={error}
            action={action}
            duration={duration}
            onDismiss={() => onToastDismiss(id)}
        />
    );
};
