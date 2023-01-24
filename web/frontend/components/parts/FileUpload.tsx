import { Stack, DropZone, Spinner } from '@shopify/polaris';
import { useCallback } from 'react';

export const FileDropZone = ({
    mediaType,
    loading,
    handleDropZoneDrop,
    onFileRejected,
}: {
    mediaType: 'image' | 'json';
    loading: boolean;
    handleDropZoneDrop: (acceptedFiles: File) => void;
    onFileRejected: (filename: string) => void;
}) => {
    const fileUpload = !loading && <DropZone.FileUpload />;
    const fileUploading = loading && (
        <Stack alignment="center" distribution="center">
            <Spinner size="small" />
        </Stack>
    );

    const validImageTypes = ['image/jpeg', 'image/png'];
    const handleDrop = useCallback((dropFiles: File[]) => {
        if (mediaType === 'image' && validImageTypes.includes(dropFiles[0].type)) {
            handleDropZoneDrop(dropFiles[0]);
        } else if (mediaType === 'json' && dropFiles[0].type === 'application/json') {
            handleDropZoneDrop(dropFiles[0]);
        } else {
            onFileRejected(dropFiles[0].name);
        }
    }, []);
    return (
        <div css={{ width: '50px', height: '50px' }}>
            <DropZone allowMultiple={false} onDrop={handleDrop}>
                {fileUpload}
                {fileUploading}
            </DropZone>
        </div>
    );
};
