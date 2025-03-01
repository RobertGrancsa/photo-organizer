import * as React from "react";
import { Photo as PhotoType } from "@/types/photo";
import { Folder } from "@/types/folder";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppSelector } from "@/lib/hooks";
import { selectCurrentPath } from "@/contexts/slices/pathSlice";
import { motion } from "framer-motion";

interface PhotoProps {
    photo: PhotoType;
    folder?: Folder;
}

const Photo: React.FC<PhotoProps> = ({ photo, folder }) => {
    const dirPath = useAppSelector(selectCurrentPath);
    const path = convertFileSrc(folder ? folder[0].path : dirPath + "\\" + photo.name);

    return (
        <div className="aspect-square">
            <div className="w-fit h-fit overflow-hidden rounded-md">
                <motion.img whileHover={{ scale: 1.1 }} src={path} alt={photo.name} loading="lazy" />
            </div>
        </div>
    );
};

export default Photo;
