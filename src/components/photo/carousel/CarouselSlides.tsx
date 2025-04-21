import * as React from "react";
import { motion } from "framer-motion";
import { getPhotoPath } from "@/lib/utils";
import { EmblaViewportRefType } from "embla-carousel-react";
import { clsx } from "clsx";
import { THUMB_SIZE } from "@/components/photo/carousel/constants";
import ImageContextMenu from "./context-menu/ImageContextMenu";
import { BackgroundColor } from "@/components/photo/carousel/hooks/useCarouselKeyNavigation";

interface Photo {
    id: string;
    name: string;
    path?: string;
}

interface CarouselSlidesProps {
    emblaRef: EmblaViewportRefType;
    photos: Photo[];
    currentPath: string;
    isInLazyRange: (idx: number) => boolean;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
    backgroundColor?: string;
    onChangeBackground?: (color: BackgroundColor) => void;
}

const CarouselSlides: React.FC<CarouselSlidesProps> = ({
    emblaRef,
    photos,
    currentPath,
    isInLazyRange,
    isFullscreen = false,
    onToggleFullscreen = () => {},
    backgroundColor = "black",
    onChangeBackground = () => {},
}) => {
    const getBackgroundColor = (isInRange: boolean) => {
        if (!isInRange) return undefined;

        switch (backgroundColor) {
            case "black":
                return "bg-black";
            case "gray":
                return "bg-gray-700";
            case "white":
                return "bg-white";
            default:
                return "bg-black";
        }
    };

    return (
        <ImageContextMenu
            onToggleFullscreen={onToggleFullscreen}
            isFullscreen={isFullscreen}
            onChangeBackground={onChangeBackground}
            backgroundColor={backgroundColor}
        >
            <div ref={emblaRef} className={`w-full h-full touch-none mb-[${THUMB_SIZE + 50}px]`}>
                <div className={`flex h-full`}>
                    {photos.map((photo, idx) => (
                        <div
                            key={photo.name}
                            className={clsx("flex-shrink-0 w-full h-full flex items-center justify-center transition-colors", {
                                [getBackgroundColor(isInLazyRange(idx)) || "bg-gray-800"]: isInLazyRange(idx),
                                "bg-gray-500": !isInLazyRange(idx),
                            })}
                            data-bg-color={isInLazyRange(idx) ? backgroundColor : undefined}
                        >
                            {isInLazyRange(idx) ? (
                                <div className="w-full h-full flex items-center justify-center p-4">
                                    <motion.img
                                        src={getPhotoPath(currentPath, photo.name)}
                                        alt={photo.name}
                                        className="max-w-full max-h-full object-contain mx-auto my-auto block select-none"
                                        draggable={false}
                                    />
                                </div>
                            ) : (
                                <div className="w-1/2 h-1/2 rounded bg-gray-700 flex items-center justify-center text-gray-500 text-xs">
                                    Loading...
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </ImageContextMenu>
    );
};

export default CarouselSlides;
