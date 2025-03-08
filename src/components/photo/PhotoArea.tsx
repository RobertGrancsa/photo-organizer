import * as React from "react";
import PhotoGrid from "@/components/photo/PhotoGrid";
import { useAppSelector } from "@/lib/hooks";
import { selectPhotos } from "@/contexts/slices/photosSlice";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

interface PhotoAreaProps {}

const PhotoArea: React.FC<PhotoAreaProps> = ({}) => {
    const photos = useAppSelector(selectPhotos);
    const { directory } = useParams<{ directory: string }>();
    const [gridSize, setGridSize] = useState<[number]>([4]);

    useEffect(() => {
        const savedGridSize = localStorage.getItem("photosGridSize");
        if (savedGridSize) {
            console.log(savedGridSize);
            setGridSize(JSON.parse(savedGridSize));
        }
    }, [directory]);

    if (!photos) {
        return null;
    }

    console.log(gridSize, directory);

    return (
        <>
            <div className="h-8 border-b flex justify-center">
                <Slider
                    onValueCommit={(e) => {
                        setGridSize([e[0]]);
                        localStorage.setItem("photosGridSize", JSON.stringify(e));
                    }}
                    defaultValue={gridSize}
                    max={16}
                    step={1}
                    min={3}
                />
            </div>
            <PhotoGrid photos={photos} columnCount={gridSize[0]} />;
        </>
    );
};

export default PhotoArea;
