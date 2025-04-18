import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Photo } from "@/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LayoutGroup } from "framer-motion";
import PhotoWithHover from "@/components/photo/PhotoWithHover";
import { useParams } from "react-router";

interface PhotoGridProps {
    photos: Photo[];
    columnCount: number;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, columnCount = 3 }) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const { directory } = useParams<{ directory: string }>();
    const [sessionOffset, setSessionOffset] = useState<number>(0);

    const getScrollKey = React.useCallback(() => (directory ? `galleryScrollOffset_${directory}` : "galleryScrollOffset"), [directory]);

    // On mount or directory change, read scroll offset from session storage
    useEffect(() => {
        const rawOffset = sessionStorage.getItem(getScrollKey());
        const offset = rawOffset ? Number(rawOffset) : 0;
        setSessionOffset(offset);
    }, [directory, getScrollKey]);

    // For the virtualizer
    const rowCount = Math.ceil(photos?.length / columnCount);

    const calculateHeight = useCallback(() => {
        if (!parentRef.current) return 280;

        const width = parentRef.current.getBoundingClientRect().width;
        return Math.floor((width / columnCount / 3) * 2);
    }, [columnCount]);

    // NOTE: initialOffset will only be used on first mount per instance
    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: calculateHeight,
        overscan: 5,
        useAnimationFrameWithResizeObserver: true,
        initialOffset: sessionOffset,
        gap: 4,
    });

    // Restore DOM scrollTop on directory change
    useEffect(() => {
        if (!parentRef.current) return;
        const rawOffset = sessionStorage.getItem(getScrollKey());
        // Scroll DOM container directly
        parentRef.current.scrollTop = rawOffset ? Number(rawOffset) : 0;
    }, [directory, photos.length, getScrollKey]);

    // Re-measure on resize
    useEffect(() => {
        if (!parentRef.current) return;
        const handleResize = () => rowVirtualizer.measure();
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(parentRef.current);
        window.addEventListener("resize", handleResize);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", handleResize);
        };
    }, [rowVirtualizer]);

    // Save scroll position per directory to session storage
    const updateIfScrolling = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
        sessionStorage.setItem(getScrollKey(), e.currentTarget.scrollTop.toString());
    };

    if (!photos?.length) return null;

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
