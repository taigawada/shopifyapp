import { useEffect, useState } from 'react';

interface DefaultMessage {
    [key: string]: string;
}
/**
 * エラー -> string
 * 非エラー -> 空文字
 */
export const useValidation = <T extends DefaultMessage>(
    defaultMessage: T,
    onErrorSet?: (key: string) => void,
    onErrorRemove?: (key: string) => void,
    onErrorAppear?: () => void,
    onErrorDisappear?: () => void
) => {
    const [validations, setValidations] = useState(
        Object.keys(defaultMessage).reduce(
            (accumulator, key) => Object.assign(accumulator, { [key]: '' }),
            {} as DefaultMessage
        )
    );
    const handleSetValidation = (productNameEmptyMessage: string) => {
        setValidations((prevState) => ({
            ...prevState,
            [productNameEmptyMessage]: defaultMessage[productNameEmptyMessage],
        }));
        if (onErrorSet) onErrorSet(productNameEmptyMessage);
    };

    const handleRemoveValidation = (productNameEmptyMessage: string) => {
        setValidations((prevState) => ({
            ...prevState,
            [productNameEmptyMessage]: '',
        }));
        if (onErrorRemove) onErrorRemove(productNameEmptyMessage);
    };
    useEffect(() => {
        Object.keys(validations).map((key) => {
            setValidations((prevState) => ({
                ...prevState,
                [key]: '',
            }));
        });
    }, []);
    const isErrorExist = Object.keys(validations).every((key) => validations[key]);
    useEffect(() => {
        if (isErrorExist) {
            if (onErrorAppear) onErrorAppear();
        } else {
            if (onErrorDisappear) onErrorDisappear();
        }
    }, [isErrorExist]);
    return {
        validations,
        handleSetValidation,
        handleRemoveValidation,
        isErrorExist,
    };
};
