import { css } from '@emotion/react';
import { DropZone as DZ, Button } from '@shopify/polaris';
import { useCallback, useState } from 'react';

export const LogoDropZone = ({
    onDropZoneDrop,
    onFileRejected,
}: {
    onDropZoneDrop: (acceptedFiles: File) => void;
    onFileRejected: (rejectedFile: File) => void;
}) => {
    const [fileDialogOpen, setFileDialogOpen] = useState(false);

    const toggleOpenFileDialog = useCallback(
        () => setFileDialogOpen((openFileDialog) => !openFileDialog),
        []
    );
    const handleDrop = useCallback(async ([dropFiles]: [File]) => {
        const image = new Image();
        image.src = URL.createObjectURL(dropFiles);
        image.onload = () => {
            if (image.naturalWidth !== image.naturalHeight) {
                if (image.naturalWidth >= 400) onFileRejected(dropFiles);
                return;
            }
            URL.revokeObjectURL(image.src);
            onDropZoneDrop(dropFiles);
        };
    }, []);
    return (
        <div css={css({ display: 'inline' })}>
            <Button onClick={toggleOpenFileDialog}>ロゴを選択</Button>
            <div css={css({ display: 'none' })}>
                <DZ
                    allowMultiple={false}
                    onDrop={handleDrop}
                    accept="image/png"
                    openFileDialog={fileDialogOpen}
                    onFileDialogClose={toggleOpenFileDialog}
                />
            </div>
        </div>
    );
};
