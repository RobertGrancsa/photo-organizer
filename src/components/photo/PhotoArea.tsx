import * as React from "react";
import Photo from "@/components/photo/Photo";
import { Photo as PhotoType } from "@/types/photo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface PhotoAreaProps {
    photos: PhotoType[];
}

const PhotoArea: React.FC<PhotoAreaProps> = ({ photos }) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: photos.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 30,
        overscan: 5,
    });

    return (
        <div ref={parentRef} className="w-full h-screen">
            <ScrollArea
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                }}
                className="w-full h-screen rounded-md border flex align-middle items-center justify-center"
            >
                <div className="p-4 grid grid-cols-4 gap-4">
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                        <Photo key={virtualItem.key} photo={photos[virtualItem.index]} />
                    ))}
                </div>
                {/*{photos.map((photo) => (*/}
                {/*    <Photo key={photo.id} photo={photo} />*/}
                {/*))}*/}
            </ScrollArea>
        </div>
    );
};

export default PhotoArea;
