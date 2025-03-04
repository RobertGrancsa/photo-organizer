import * as React from "react";
import { Photo } from "@/types";
import { useAppSelector } from "@/lib/hooks";
import { selectCurrentPath } from "@/contexts/slices/pathSlice";
import { convertFileSrc } from "@tauri-apps/api/core";

interface PhotoDisplayProps {
    photo: Photo;
}

const PhotoDisplay: React.FC<PhotoDisplayProps> = ({ photo }) => {
    const dirPath = useAppSelector(selectCurrentPath);
    const path = convertFileSrc(dirPath + "\\" + photo.name);

    return (
        <div className="h-full w-full">
            <img src={path} alt={photo.name} />
        </div>
    );
};

export default PhotoDisplay;
