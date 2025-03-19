import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Folder, Photo } from "@/types";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { selectCurrentFolder, selectPreviewDir } from "@/contexts/slices/pathSlice";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { Card, CardContent } from "@/components/ui/card";
import * as path from "path-browserify";
import { useNavigate } from "react-router";
import { selectSelectedPhotoIndex, setSelectedPhoto } from "@/contexts/slices/photosSlice";
import { transitionImages } from "@/lib/animations";

interface PhotoProps {
    photo: Photo;
    index: number;
}

const cardVariants = {
    // initial: { opacity: 0, scale: 0.95 },
    // animate: { opacity: 1, scale: 1 },
    // exit: { opacity: 0, scale: 0.95 },
};

const getPreviewPath = (dirId: string, photoId: string, previewDir: string) =>
    convertFileSrc(path.join(previewDir, dirId, photoId) + ".preview.webp");

const PhotoPreview: React.FC<PhotoProps> = ({ photo, index }) => {
    const dir = useAppSelector(selectCurrentFolder);
    const previewDir = useAppSelector(selectPreviewDir);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const previewPath = getPreviewPath(dir.id, photo.id, previewDir);

    const [loaded, setLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Load the image once it's in view
                    const img = entry.target;
                    if (img instanceof HTMLImageElement) img.src = previewPath;
                    observer.unobserve(img);
                }
            });
        });
        if (imgRef.current) observer.observe(imgRef.current);
        return () => {
            if (imgRef.current) observer.unobserve(imgRef.current);
        };
    }, [previewPath]);

    const selectPhoto = useCallback(() => {
        dispatch(setSelectedPhoto({ photo, index }));
        navigate(encodeURI(photo.name));
    }, [photo, navigate, index]);

    return (
        <Card className="w-full h-full overflow-hidden rounded-lg shadow-md p-0 border-none" onClick={selectPhoto}>
            <CardContent className="p-0">
                <motion.img
                    className={clsx("w-full h-full aspect-3/2 object-cover scale-101", { hidden: false })}
                    ref={imgRef}
                    onLoad={() => setLoaded(true)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    src={previewPath}
                    alt={photo.name}
                />
                {/*{!loaded && <Skeleton className="h-[400px] w-[400px]" />}*/}
            </CardContent>
        </Card>
    );
};

export default React.memo(PhotoPreview);
