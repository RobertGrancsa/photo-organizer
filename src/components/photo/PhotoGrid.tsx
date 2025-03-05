import * as React from "react";
import { Photo } from "@/types";
import PhotoPreview from "@/components/photo/PhotoPreview";
import { useCallback, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import MeasureWrapper from "@/helpers/MeasureWrapper";

interface PhotoGridProps {
    photos: Photo[];
    columnCount: number;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, columnCount = 3 }) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const [rowHeights, setRowHeights] = useState<Record<number, number>>({});

    const rowCount = Math.ceil(photos.length / columnCount);

    // Create a callback to update a row's height
    const updateRowHeight = useCallback(
        (rowIndex: number, newHeight: number) => {
            setRowHeights((prev) => {
                if (newHeight === prev[rowIndex]) return prev;
                return { ...prev, [rowIndex]: newHeight };
            });
        },
        [rowHeights]
    );

    const calculateHeight = useCallback(() => {
        if (!parentRef.current) {
            return 280;
        }

        const width = parentRef.current.getBoundingClientRect().width;

        console.log(Math.floor((width / columnCount / 3) * 2));

        return Math.floor((width / columnCount / 3) * 2);
    }, [parentRef.current]);

    // Set up the virtualizer for rows using variable sizes
    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: calculateHeight,
        overscan: 5,
        useAnimationFrameWithResizeObserver: true,
        gap: 2,
    });

    return (
        <div
            ref={parentRef}
            style={{
                height: "100vh",
                overflow: "auto",
                position: "relative",
            }}
        >
            <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const rowIndex = virtualRow.index;
                    return (
                        <div
                            className="h-fit w-full"
                            key={rowIndex}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <MeasureWrapper onResize={(rect) => updateRowHeight(rowIndex, rect.height)}>
                                {Array.from({ length: columnCount }).map((_, columnIndex) => {
                                    const photoIndex = rowIndex * columnCount + columnIndex;
                                    const photo = photos[photoIndex];
                                    return photo ? <PhotoPreview key={photoIndex} photo={photo} /> : null;
                                })}
                            </MeasureWrapper>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PhotoGrid;
