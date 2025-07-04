import * as React from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import PhotoPreview from "@/components/photo/grid/PhotoPreview";
import { Photo } from "@/types";
import { clsx } from "clsx";
import { transitionImages } from "@/lib/animations";
import { motion } from "framer-motion";
import PhotoHoverCard from "./PhotoHoverCard";

interface PhotoWithHoverProps {
    photo: Photo;
    index: number;
}

const PhotoWithHover: React.FC<PhotoWithHoverProps> = ({ photo, index }) => {
    return (
        <HoverCard openDelay={1000}>
            <HoverCardTrigger asChild>
                <motion.div
                    className={clsx("w-full h-full p-2 flex-1 box-border")}
                    layoutId={`card-${photo.id}`}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={transitionImages}
                >
                    <PhotoPreview photo={photo} index={index} />
                </motion.div>
            </HoverCardTrigger>
            <HoverCardContent className="w-fit">
                <PhotoHoverCard photo={photo} />
            </HoverCardContent>
        </HoverCard>
    );
};

export default PhotoWithHover;
