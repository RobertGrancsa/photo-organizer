import * as React from "react";
import { useEffect, useState } from "react";
import PhotoGrid from "@/components/photo/PhotoGrid";
import { useAppSelector } from "@/lib/hooks";
import { selectPhotos } from "@/contexts/slices/photosSlice";
import { Slider } from "@/components/ui/slider";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import TagFilters from "@/components/filters/TagFilters";

const PhotoArea: React.FC = () => {
    const photos = useAppSelector(selectPhotos);
    const { directory } = useParams<{ directory: string }>();
    const [gridSize, setGridSize] = useState<[number]>([4]);
    const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

    useEffect(() => {
        const savedGridSize = localStorage.getItem("photosGridSize");
        if (savedGridSize) {
            setGridSize(JSON.parse(savedGridSize));
        }
    }, [directory]);

    return (
        <>
            <div className="h-12 border-b flex justify-center items-center space-x-2 px-4">
                <Button variant="ghost" onClick={() => setFiltersOpen(!filtersOpen)}>
                    Filters
                </Button>
                <Slider
                    className="w-80"
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
            {filtersOpen && <TagFilters />}
            <PhotoGrid photos={photos} columnCount={gridSize[0]} />
        </>
    );
};

export default PhotoArea;
