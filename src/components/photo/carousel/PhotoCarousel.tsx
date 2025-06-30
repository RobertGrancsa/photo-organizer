import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";

import { selectPhotos, selectSelectedPhotoIndex, setSelectedPhoto } from "@/contexts/slices/photosSlice";
import { selectCurrentPath, selectPreviewDir } from "@/contexts/slices/pathSlice";

import { LAZY_RANGE } from "./constants";
import { useFullscreen } from "./hooks/useFullscreen";
import { BackgroundColor, useCarouselKeyNavigation } from "./hooks/useCarouselKeyNavigation";
import FullscreenToggle from "./FullscreenToggle";
import CarouselSlides from "./CarouselSlides";
import NavigationArrows from "./NavigationArrows";
import PhotoInfo from "./PhotoInfo";
import ThumbnailBar from "./ThumbnailBar";
import { useQuery } from "@tanstack/react-query";
import { getFolders } from "@/lib/api";

const PhotoCarousel: React.FC = () => {
    // Redux state
    const photos = useSelector(selectPhotos);
    const selectedIndex = useSelector(selectSelectedPhotoIndex);
    const currentPath = useSelector(selectCurrentPath);
    const previewDir = useSelector(selectPreviewDir);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { directory } = useParams<{ directory: string; name: string }>();
    const { data: folderData } = useQuery({ queryKey: ["folders"], queryFn: getFolders });
    const currentDirId = folderData?.find((folder) => folder.path === currentPath)?.path;

    // Carousel setup
    const [emblaRef, emblaApi] = useEmblaCarousel({ skipSnaps: false, loop: true });
    const [thumbRef, thumbApi] = useEmblaCarousel({
        containScroll: "keepSnaps",
        dragFree: true,
        axis: "x",
    });

    // Local state
    const ignoreSetPhoto = useRef(false);
    const [emblaIndex, setEmblaIndex] = useState(selectedIndex ?? 0);

    // Custom hooks
    const { isFullscreen, setIsFullscreen, elementRef: carouselWrapperRef } = useFullscreen();
    const [backgroundColor, setBackgroundColor] = useState<BackgroundColor>("black");
    useCarouselKeyNavigation(emblaApi, isFullscreen, setIsFullscreen, backgroundColor, setBackgroundColor);

    // Update emblaIndex when selectedIndex changes
    useEffect(() => {
        if (typeof selectedIndex === "number") {
            setEmblaIndex(selectedIndex);
        }
    }, [selectedIndex]);

    // Scroll to selected photo when emblaApi or selectedIndex changes
    useEffect(() => {
        if (!emblaApi || selectedIndex == null) return;

        ignoreSetPhoto.current = true;
        emblaApi.scrollTo(selectedIndex, false);

        setTimeout(() => (ignoreSetPhoto.current = false), 100);
    }, [emblaApi, selectedIndex]);

    // Handle carousel selection
    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        const idx = emblaApi.selectedScrollSnap();
        setEmblaIndex(idx);
        thumbApi?.scrollTo(idx);

        if (ignoreSetPhoto.current) return;

        if (photos[idx] && selectedIndex !== idx) {
            navigate(`/${directory}/${photos[idx].name}`, { replace: true });
            dispatch(setSelectedPhoto({ photo: photos[idx], index: idx }));
        }
    }, [emblaApi, photos, dispatch, selectedIndex, navigate, directory, thumbApi]);

    // Setup Embla carousel events
    useEffect(() => {
        if (!emblaApi) return;

        emblaApi.on("select", onSelect).on("reInit", onSelect);
        return () => emblaApi.off("select", onSelect) as never;
    }, [emblaApi, onSelect]);

    // Determine if a photo index is within lazy loading range
    const isInLazyRange = useCallback(
        (idx: number) => {
            if (!photos.length) return false;
            let left = (emblaIndex - LAZY_RANGE + photos.length) % photos.length;
            let right = (emblaIndex + LAZY_RANGE) % photos.length;
            if (left <= right) {
                return idx >= left && idx <= right;
            } else {
                return idx >= left || idx <= right;
            }
        },
        [emblaIndex, photos.length]
    );

    // Thumbnail click handler
    const handleThumbnailClick = useCallback(
        (idx: number) => {
            emblaApi?.scrollTo(idx);
        },
        [emblaApi]
    );

    // Early return if no photos or selected index
    if (!photos.length || selectedIndex == null) return null;

    // Compute layout classes based on fullscreen state
    const containerClass = isFullscreen
        ? "fixed inset-0 z-40 flex flex-col items-center justify-center bg-black"
        : "flex flex-col items-center h-screen w-full";

    const carouselWrapperClass = isFullscreen
        ? "relative w-screen h-screen flex-1 flex items-center justify-center"
        : "relative h-full w-full aspect-[3/2] bg-black rounded-lg overflow-hidden shadow-lg flex items-center justify-center";

    return (
        <div className={containerClass}>
            <div ref={carouselWrapperRef} className={carouselWrapperClass}>
                {/* Fullscreen Toggle */}
                <AnimatePresence initial={false}>
                    <FullscreenToggle isFullscreen={isFullscreen} onToggle={setIsFullscreen} />
                </AnimatePresence>

                {/* Main Carousel */}
                <CarouselSlides
                    emblaRef={emblaRef}
                    photos={photos}
                    currentPath={currentDirId}
                    folderData={folderData}
                    isInLazyRange={isInLazyRange}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                    backgroundColor={backgroundColor}
                    onChangeBackground={setBackgroundColor}
                />

                {/* Navigation Arrows */}
                <NavigationArrows onPrev={() => emblaApi?.scrollPrev()} onNext={() => emblaApi?.scrollNext()} />

                {/* Photo Information */}
                <PhotoInfo
                    isFullscreen={isFullscreen}
                    currentIndex={selectedIndex}
                    totalCount={photos.length}
                    photoName={photos[selectedIndex]?.name || ""}
                    backgroundColor={backgroundColor}
                />
            </div>

            {/* Thumbnail Bar - only shown when not in fullscreen */}
            {!isFullscreen && (
                <ThumbnailBar
                    thumbRef={thumbRef}
                    photos={photos}
                    selectedIndex={selectedIndex}
                    previewDir={previewDir}
                    onThumbnailClick={handleThumbnailClick}
                />
            )}
        </div>
    );
};

export default PhotoCarousel;
