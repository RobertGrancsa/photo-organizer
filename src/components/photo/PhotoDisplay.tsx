import * as React from "react";
import { useEffect, useMemo } from "react";
import * as path from "path-browserify";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { selectCurrentPath } from "@/contexts/slices/pathSlice";
import { convertFileSrc } from "@tauri-apps/api/core";
import { selectPhotoWithNeighbours, setNextPhoto, setPreviousPhoto } from "@/contexts/slices/photosSlice";
import { useNavigate, useParams } from "react-router";
import { LayoutGroup, motion } from "framer-motion";
import { transitionImages } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";

interface PhotoDisplayProps {}

const getPhotoPath = (dirPath: string, photoName: string) => convertFileSrc(path.join(dirPath, photoName));

const PhotoDisplay: React.FC<PhotoDisplayProps> = ({}) => {
    const [api, setApi] = React.useState<CarouselApi>();
    const dirPath = useAppSelector(selectCurrentPath);
    const dispatch = useAppDispatch();
    const { name } = useParams<{ name: string }>();
    const photos = useAppSelector(selectPhotoWithNeighbours);

    useEffect(() => {
        if (!api) return;

        api.on("select", () => {
            console.log(api.selectedScrollSnap());
            if (api.selectedScrollSnap() === 0) {
                dispatch(setPreviousPhoto());
            } else {
                dispatch(setNextPhoto());
            }
        });
        api.on("settle", () => api.reInit({ startIndex: 1 }));
    }, [api]);

    const photoArray = useMemo(
        () =>
            photos.map(({ photo }) => ({
                id: photo.id,
                name: photo.name,
                path: getPhotoPath(dirPath, photo.name),
            })),
        [photos]
    );
    const navigate = useNavigate();

    return (
        <LayoutGroup>
            <Button onClick={() => navigate(-1)}>
                <XIcon />
                <span className="sr-only">Close</span>
            </Button>
            <Carousel
                setApi={setApi}
                className="w-full"
                opts={{
                    startIndex: 1,
                }}
            >
                <CarouselContent>
                    {photoArray.map((photo) => (
                        <CarouselItem key={photo.id}>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, transition: { duration: 0.3 } }}
                                exit={{ opacity: 0 }}
                                transition={transitionImages}
                                className="h-screen w-full flex flex-col justify-center items-center p-4"
                                layoutId={`card-${photo.id}`}
                            >
                                <motion.img className="h-screen w-3/4 object-cover" src={photo.path} alt={photo.name} />
                            </motion.div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </LayoutGroup>
    );
};

export default PhotoDisplay;
