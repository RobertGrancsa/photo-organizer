import * as React from "react";
import PhotoPreview from "@/components/photo/PhotoPreview";
import { Photo } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import PhotoDisplay from "@/components/photo/PhotoDisplay";
import PhotoGrid from "@/components/photo/PhotoGrid";

interface PhotoAreaProps {
    photos: Photo[];
}

const PhotoArea: React.FC<PhotoAreaProps> = ({ photos }) => {
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

    if (selectedPhoto) {
        return <PhotoDisplay photo={selectedPhoto} />;
    }

    return <PhotoGrid photos={photos} columnCount={4} />;
};

export default PhotoArea;
