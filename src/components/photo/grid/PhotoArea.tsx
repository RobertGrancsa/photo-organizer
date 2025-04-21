import * as React from "react";
import { useEffect, useState } from "react";
import PhotoGrid from "@/components/photo/grid/PhotoGrid";
import { useAppSelector } from "@/lib/hooks";
import { selectPhotos } from "@/contexts/slices/photosSlice";
import { Slider } from "@/components/ui/slider";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import TagFilters from "@/components/filters/TagFilters";
import FacesDisplay from "@/components/faces/FacesDisplay";

const PhotoArea: React.FC = () => {
    const photos = useAppSelector(selectPhotos);
    const { directory } = useParams<{ directory: string }>();
    const [gridSize, setGridSize] = useState<[number]>([4]);
    const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
    const [facesOpen, setFacesOpen] = useState<boolean>(false);

    useEffect(() => {
        const savedGridSize = localStorage.getItem("photosGridSize");
        if (savedGridSize) {
            setGridSize(JSON.parse(savedGridSize));
        }
    }, [directory]);

    // Listen for localStorage changes (from other tabs/windows)
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === "photosGridSize" && e.newValue) {
                setGridSize(JSON.parse(e.newValue));
            }
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, []);

    return (
        <>
            <div className="h-12 border-b flex justify-center items-center space-x-2 px-4">
                <Button variant="ghost" onClick={() => setFacesOpen(!facesOpen)}>
                    Faces
                </Button>
                <Button variant="ghost" onClick={() => setFiltersOpen(!filtersOpen)}>
                    Filters
                </Button>
                <Slider
                    className="w-80"
                    defaultValue={gridSize}
                    // Only commit updates gridSize state and localStorage
                    onValueCommit={(e) => {
                        setGridSize([e[0]]);
                        localStorage.setItem("photosGridSize", JSON.stringify([e[0]]));
                    }}
                    max={16}
                    step={1}
                    min={3}
                    key={gridSize[0]} // This ensures Slider resets if grid size changes externally
                />
            </div>
            {filtersOpen && <TagFilters />}
            {facesOpen && <FacesDisplay />}
            <PhotoGrid photos={photos} columnCount={gridSize[0]} />
        </>
    );
};

export default PhotoArea;
