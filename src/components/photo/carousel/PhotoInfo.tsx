import * as React from "react";

interface PhotoInfoProps {
    isFullscreen: boolean;
    currentIndex: number;
    totalCount: number;
    photoName: string;
}

const PhotoInfo: React.FC<PhotoInfoProps> = ({ isFullscreen, currentIndex, totalCount, photoName }) => {
    const infoContainerClass = isFullscreen
        ? "absolute top-8 left-0 right-0 flex flex-col items-center"
        : "mt-4 flex flex-col items-center text-align-left w-full absolute top-8 left-0 right-0";

    return (
        <div className={infoContainerClass}>
            <div className="text-base md:text-lg text-gray-200 text-left w-full px-12">
                {currentIndex + 1} / {totalCount}
            </div>
            <div className="mt-2 text-lg md:text-xl font-medium text-white line-clamp-1 text-left w-full px-12 selection:bg-indigo-900/80 selection:text-white">
                {photoName}
            </div>
        </div>
    );
};

export default PhotoInfo;
