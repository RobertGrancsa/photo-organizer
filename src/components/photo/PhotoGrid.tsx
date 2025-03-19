import * as React from "react";
import { UIEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { Photo } from "@/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LayoutGroup } from "framer-motion";
import { useAppSelector } from "@/lib/hooks";
import { selectCurrentPhoto } from "@/contexts/slices/photosSlice";
import PhotoWithHover from "@/components/photo/PhotoWithHover";

interface PhotoGridProps {
    photos: Photo[];
    columnCount: number;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, columnCount = 3 }) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const [initialOffset, setInitialOffset] = useState<number>(0);
    const selectedPhoto = useAppSelector(selectCurrentPhoto);

    useEffect(() => {
        const savedScrollOffset = sessionStorage.getItem("galleryScrollOffset");
        setInitialOffset(savedScrollOffset ? Number(savedScrollOffset) : 0);
    }, [selectedPhoto]);

    const rowCount = Math.ceil(photos?.length / columnCount);

    const calculateHeight = useCallback(() => {
        if (!parentRef.current) {
            return 280;
        }

        const width = parentRef.current.getBoundingClientRect().width;

        return Math.floor((width / columnCount / 3) * 2);
    }, [parentRef.current, columnCount]);

    console.log("setScroll", initialOffset);

    // Set up the virtualizer for rows using variable sizes
    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: calculateHeight,
        overscan: 5,
        useAnimationFrameWithResizeObserver: true,
        initialOffset,
        gap: 4,
    });

    // @ts-ignore
    const updateIfScrolling = (e: UIEventHandler<HTMLDivElement, UIEvent>) => {
        sessionStorage.setItem("galleryScrollOffset", e.currentTarget.scrollTop.toString());
    };

    if (!photos?.length) {
        return null;
    }

    return (
        <LayoutGroup>
            <div ref={parentRef} className="h-screen overflow-auto relative" onScroll={updateIfScrolling}>
                <div className="relative" style={{ height: rowVirtualizer.getTotalSize() }}>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const rowIndex = virtualRow.index;
                        return (
                            <div
                                className="h-fit w-full absolute top-0 left-0 flex"
                                key={rowIndex}
                                style={{
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                {Array.from({ length: columnCount }).map((_, columnIndex) => {
                                    const photoIndex = rowIndex * columnCount + columnIndex;
                                    const photo = photos[photoIndex];
                                    return photo ? <PhotoWithHover key={photoIndex} photo={photo} index={photoIndex} /> : null;
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </LayoutGroup>
    );
};

export default PhotoGrid;
