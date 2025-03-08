import * as React from "react";
import * as path from "path-browserify";
import { useAppSelector } from "@/lib/hooks";
import { selectCurrentPath } from "@/contexts/slices/pathSlice";
import { convertFileSrc } from "@tauri-apps/api/core";
import { selectCurrentPhoto } from "@/contexts/slices/photosSlice";
import { useNavigate, useParams } from "react-router";
import { LayoutGroup, motion } from "framer-motion";
import { transitionImages } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

interface PhotoDisplayProps {}

const PhotoDisplay: React.FC<PhotoDisplayProps> = ({}) => {
    const dirPath = useAppSelector(selectCurrentPath);
    const { name } = useParams<{ name: string }>();
    const { photo } = useAppSelector(selectCurrentPhoto);
    const pathName = convertFileSrc(path.join(dirPath, name));
    const navigate = useNavigate();

    return (
        <LayoutGroup>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.3 } }}
                exit={{ opacity: 0 }}
                transition={transitionImages}
                className="h-screen w-full flex flex-col justify-center p-4"
                layoutId={`card-${photo.id}`}
            >
                <Button onClick={() => navigate(-1)}>
                    <XIcon />
                    <span className="sr-only">Close</span>
                </Button>
                <motion.img className="h-full w-3/4" src={pathName} alt={photo.name} />
            </motion.div>
        </LayoutGroup>
    );
};

export default PhotoDisplay;
