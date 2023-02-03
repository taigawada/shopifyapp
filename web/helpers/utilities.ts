import { isArray, isString } from 'lodash-es';

export const toQueryArray = (value: any): string[] | undefined => {
    if (!value) {
        return;
    } else if (isArray(value)) {
        if (
            value.every((element) => {
                return typeof element === 'string';
            })
        ) {
            return value;
        }
    } else if (isString(value)) {
        return [value];
    } else {
        return;
    }
};
