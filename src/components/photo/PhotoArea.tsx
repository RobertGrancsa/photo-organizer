import * as React from "react";
import Photo from "@/components/photo/Photo";
import { Photo as PhotoType } from "@/types/photo";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PhotoAreaProps {
    photos: PhotoType[];
}

const PhotoArea: React.FC<PhotoAreaProps> = ({ photos }) => {
    return (
        <ScrollArea className="w-fit h-screen rounded-md border flex align-middle items-center justify-center">
            <div className="p-4 grid grid-cols-4 gap-4">
                {photos.map((photo) => (
                    <Photo key={photo.id} photo={photo} />
                ))}
            </div>
        </ScrollArea>
    );
};

export default PhotoArea;
