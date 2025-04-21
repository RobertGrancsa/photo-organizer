import * as React from "react";
import { BackgroundColor } from "@/components/photo/carousel/hooks/useCarouselKeyNavigation";
import { clsx } from "clsx";

interface PhotoInfoProps {
    isFullscreen: boolean;
    currentIndex: number;
    totalCount: number;
    photoName: string;
    backgroundColor?: BackgroundColor;
}

const PhotoInfo: React.FC<PhotoInfoProps> = ({ isFullscreen, currentIndex, totalCount, photoName, backgroundColor }) => {
    const infoContainerClass = isFullscreen
        ? "absolute top-8 left-0 right-0 flex flex-col items-center"
        : "mt-4 flex flex-col items-center text-align-left w-full absolute top-8 left-0 right-0";
    const color = backgroundColor === "white" ? "text-black" : "text-gray-200";

    return (
        <div className={infoContainerClass}>
            <div className={clsx("text-base md:text-lg text-left w-full px-12", color)}>
                {currentIndex + 1} / {totalCount}
            </div>
            <div className={clsx("mt-2 text-lg md:text-xl font-medium line-clamp-1 text-left w-full px-12", color)}>{photoName}</div>
        </div>
    );
};

export default PhotoInfo;
