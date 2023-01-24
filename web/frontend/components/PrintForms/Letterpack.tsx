import { useState, useCallback } from 'react';
import { TextField } from '@shopify/polaris';

export const useLetterpackForm = () => {
    const [productName, setProductName] = useState('衣類');
    const handleProductNameChange = useCallback((newValue: string) => setProductName(newValue), []);
    return { productName, handleProductNameChange };
};

export const Letterpack = ({
    productName,
    onProductNameChange,
    errorMessage,
}: {
    productName: string;
    onProductNameChange: (newValue: string) => void;
    errorMessage: string;
}) => {
    return (
        <TextField
            label="品名を入力してください"
            value={productName}
            onChange={onProductNameChange}
            autoComplete="off"
            error={errorMessage}
        />
    );
};
