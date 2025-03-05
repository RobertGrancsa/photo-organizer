import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Folder, Photo } from "@/types";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppSelector } from "@/lib/hooks";
import { selectCurrentFolder } from "@/contexts/slices/pathSlice";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface PhotoProps {
    photo: Photo;
    folder?: Folder;
}

const PhotoPreview: React.FC<PhotoProps> = ({ photo, folder }) => {
    const dir = useAppSelector(selectCurrentFolder);
    const path = convertFileSrc((folder ? folder[0].path : dir.path) + "\\" + photo.name);

    const ext = photo.name.split(".")[1];
    const previewPath = convertFileSrc(`C:\\Users\\robik\\Pictures\\${"photo-organizer"}\\${dir.id}\\${photo.id}.preview.avif`);

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
    }, [path]);

    return (
        <div className="p-2 flex-1 box-border">
            <Dialog>
                <DialogTrigger>
                    <Card className="overflow-hidden rounded-lg shadow-md p-0 border-none">
                        <CardContent className="p-0">
                            <motion.img
                                layout
                                className={clsx("w-auto h-full aspect-3/2 object-cover scale-101", { hidden: false })}
                                ref={imgRef}
                                onLoad={() => setLoaded(true)}
                                whileHover={{ scale: 1.1 }}
                                src={previewPath}
                                alt={photo.name}
                                layoutId="photo"
                                // loading="lazy"
                            />
                            {/*{!loaded && <Skeleton className="h-[400px] w-[400px]" />}*/}
                        </CardContent>
                    </Card>
                </DialogTrigger>
                <DialogContent className="flex justify-center items-center w-3/4">
                    <motion.img src={path} alt={photo.name} layoutId="photo" id="photo" />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PhotoPreview;
