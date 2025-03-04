import * as React from "react";
import { Folder, Photo } from "@/types";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppSelector } from "@/lib/hooks";
import { selectCurrentPath } from "@/contexts/slices/pathSlice";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { springIn } from "@/lib/animations";
import { clsx } from "clsx";
import { Skeleton } from "@/components/ui/skeleton";

interface PhotoProps {
    photo: Photo;
    folder?: Folder;
}

const PhotoPreview: React.FC<PhotoProps> = ({ photo, folder }) => {
    const dirPath = useAppSelector(selectCurrentPath);
    const path = convertFileSrc((folder ? folder[0].path : dirPath) + "\\" + photo.name);

    const [loaded, setLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Load the image once it's in view
                    const img = entry.target;
                    if (img instanceof HTMLImageElement) img.src = path;
                    observer.unobserve(img);
                }
            });
        });
        if (imgRef.current) observer.observe(imgRef.current);
        return () => {
            if (imgRef.current) observer.unobserve(imgRef.current);
        };
    }, [path]);

    return (
        <div className=" p-2 flex-1 box-border">
            <div className="w-fit h-fit overflow-hidden rounded-md">
                <motion.img
                    className={clsx({ hidden: !loaded })}
                    ref={imgRef}
                    onLoad={() => setLoaded(true)}
                    whileHover={{ scale: 1.1 }}
                    src={path}
                    alt={photo.name}
                />
                {/*{!loaded && <Skeleton className="h-[400px] w-[400px]" />}*/}
            </div>
        </div>
    );
};

export default PhotoPreview;
