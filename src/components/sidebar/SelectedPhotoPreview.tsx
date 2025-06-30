import * as React from "react";
import { useSelector } from "react-redux";
import { selectSelectedPhoto } from "@/contexts/slices/photosSlice";
import { selectPreviewDir } from "@/contexts/slices/pathSlice";
import { getPreviewPath } from "@/lib/utils";

const SelectedPhotoPreview: React.FC = () => {
    const selectedPhoto = useSelector(selectSelectedPhoto);
    const previewDir = useSelector(selectPreviewDir);

    if (!selectedPhoto) {
        return (
            <div className="p-3 border rounded-md mt-auto mb-2 mx-2 bg-muted/20">
                <div className="text-sm text-muted-foreground text-center">No photo selected</div>
            </div>
        );
    }

    const photoPath = getPreviewPath(selectedPhoto.path, selectedPhoto.id, previewDir);

    return (
        <div className="border rounded-md mt-auto mb-2 mx-2 bg-background">
            <h3 className="text-sm font-medium my-2 truncate mx-3" title={selectedPhoto.name}>
                {selectedPhoto.name}
            </h3>
            <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted p-2">
                <img src={photoPath} alt={selectedPhoto.name} className="object-contain w-full h-full" />
            </div>
        </div>
    );
};

export default SelectedPhotoPreview;
