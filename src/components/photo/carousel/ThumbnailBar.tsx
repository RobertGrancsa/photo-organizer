import * as React from "react";
import { motion } from "framer-motion";
import { getPreviewPath } from "@/lib/utils";
import { THUMB_SIZE } from "./constants";
import { EmblaViewportRefType } from "embla-carousel-react";

interface Photo {
    id: string;
    name: string;
}

interface ThumbnailBarProps {
    thumbRef: EmblaViewportRefType;
    photos: Photo[];
    selectedIndex: number;
    directory: string;
    previewDir: string;
    onThumbnailClick: (idx: number) => void;
}

const ThumbnailBar: React.FC<ThumbnailBarProps> = ({ thumbRef, photos, selectedIndex, directory, previewDir, onThumbnailClick }) => {
    const thumbnailBarClass =
        "mt-2 mb-2 flex justify-center scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent absolute bottom-0 left-0 right-0 z-10 bg-white/10 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700";
    const thumbnailScrollerClass = "overflow-x-hidden px-4";

    // Highlight selected thumbnail
    const thumbnailButtonClass = (idx: number) =>
        `border-2 rounded-md bg-black/80 overflow-hidden flex-shrink-0 w-[${THUMB_SIZE}px] h-[${THUMB_SIZE}px] transition-all duration-150
        ${
            selectedIndex === idx
                ? "border-indigo-500 ring-2 ring-indigo-400"
                : "border-transparent opacity-75 hover:opacity-100 hover:border-indigo-300"
        }`;

    return (
        <div className={thumbnailBarClass}>
            <div ref={thumbRef} className={thumbnailScrollerClass}>
                <div className="flex flex-row gap-2">
                    {photos.map((photo, idx) => (
                        <button
                            type="button"
                            key={photo.name}
                            className={thumbnailButtonClass(idx)}
                            aria-label={`Select photo ${idx + 1}`}
                            onClick={() => onThumbnailClick(idx)}
                        >
                            <motion.img
                                src={getPreviewPath(directory, photo.id, previewDir)}
                                alt={photo.name}
                                whileHover={{ scale: 1.1 }}
                                loading="lazy"
                                className={`object-cover w-full h-full select-none ${selectedIndex === idx ? "opacity-100" : "opacity-70"}`}
                                style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ThumbnailBar;
