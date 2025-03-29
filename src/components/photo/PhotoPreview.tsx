import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Photo } from "@/types";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { selectCurrentFolder, selectPreviewDir } from "@/contexts/slices/pathSlice";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router";
import { setSelectedPhoto } from "@/contexts/slices/photosSlice";
import { getPreviewPath } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface PhotoProps {
    photo: Photo;
    index: number;
}

const cardVariants = {
    // initial: { opacity: 0, scale: 0.95 },
    // animate: { opacity: 1, scale: 1 },
    // exit: { opacity: 0, scale: 0.95 },
};

const PhotoPreview: React.FC<PhotoProps> = ({ photo, index }) => {
    const dir = useAppSelector(selectCurrentFolder);
    const previewDir = useAppSelector(selectPreviewDir);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const previewPath = getPreviewPath(dir.id, photo.id, previewDir);

    const [error, setError] = useState<boolean>(false);
    const [loaded, setLoaded] = useState<boolean>(false);
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
                {!error && (
                    <motion.img
                        className={clsx("w-full h-full aspect-3/2 object-cover scale-101", { hidden: false })}
                        ref={imgRef}
                        onLoad={() => setLoaded(true)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        src={previewPath}
                        alt={photo.name}
                        onError={(err) => setError(true)}
                    />
                )}
                {!loaded && <Skeleton className="h-full aspect-3/2" />}
            </CardContent>
        </Card>
    );
};

export default React.memo(PhotoPreview);
