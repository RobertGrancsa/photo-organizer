import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectPhotos, selectSelectedPhotoIndex, setSelectedPhoto } from "@/contexts/slices/photosSlice";
import { useParams, useNavigate } from "react-router";
import { getPhotoPath, getPreviewPath } from "@/lib/utils";
import { selectCurrentPath, selectPreviewDir } from "@/contexts/slices/pathSlice";
import useEmblaCarousel from "embla-carousel-react";
import { Maximize2, Minimize2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LAZY_RANGE = 3;
const THUMB_SIZE = 72; // Size of thumbnails in pixels

const PhotoCarousel: React.FC = () => {
    const photos = useSelector(selectPhotos);
    const selectedIndex = useSelector(selectSelectedPhotoIndex);
    const currentPath = useSelector(selectCurrentPath);
    const previewDir = useSelector(selectPreviewDir);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { directory } = useParams<{ directory: string; name: string }>();

    const [emblaRef, emblaApi] = useEmblaCarousel({ skipSnaps: false, loop: true });
    const [thumbRef, thumbApi] = useEmblaCarousel({
        containScroll: "keepSnaps",
        dragFree: true,
        axis: "x",
    });

    const ignoreSetPhoto = useRef(false);
    const [emblaIndex, setEmblaIndex] = useState(selectedIndex ?? 0);

    // Toggleable fullscreen
    const [isFullscreen, setIsFullscreen] = useState(false);
    const carouselWrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (typeof selectedIndex === "number") {
            setEmblaIndex(selectedIndex);
        }
    }, [selectedIndex]);

    useEffect(() => {
        if (!emblaApi || selectedIndex == null) return;

        ignoreSetPhoto.current = true;
        emblaApi.scrollTo(selectedIndex, false);

        setTimeout(() => (ignoreSetPhoto.current = false), 100);
    }, [emblaApi, selectedIndex]);

    const onSelect = useCallback(() => {
        if (!emblaApi || !thumbApi) return;
        const idx = emblaApi.selectedScrollSnap();
        setEmblaIndex(idx);
        thumbApi.scrollTo(idx);

        if (ignoreSetPhoto.current) return;

        if (photos[idx] && selectedIndex !== idx) {
            navigate(`/${directory}/${photos[idx].name}`, { replace: true });
            dispatch(setSelectedPhoto({ photo: photos[idx], index: idx }));
        }
    }, [emblaApi, photos, dispatch, selectedIndex, navigate, directory, thumbApi, setEmblaIndex]);

    useEffect(() => {
        if (!emblaApi) return;

        emblaApi.on("select", onSelect).on("reInit", onSelect);

        return () => emblaApi.off("select", onSelect) as never;
    }, [emblaApi, onSelect]);

    // Fullscreen API integration
    useEffect(() => {
        const el = carouselWrapperRef.current;
        if (isFullscreen) {
            if (el && document.fullscreenElement !== el) {
                el.requestFullscreen?.();
            }
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen?.();
            }
        }
    }, [isFullscreen]);

    // Sync UI state with actual fullscreen status (e.g. Esc or browser UI)
    useEffect(() => {
        function handleFSChange() {
            const el = carouselWrapperRef.current;
            if (document.fullscreenElement === el) {
                if (!isFullscreen) setIsFullscreen(true);
            } else {
                if (isFullscreen) setIsFullscreen(false);
            }
        }
        document.addEventListener("fullscreenchange", handleFSChange);
        return () => document.removeEventListener("fullscreenchange", handleFSChange);
    }, [isFullscreen]);

    useEffect(() => {
        if (!emblaApi) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
            if (e.key === "ArrowLeft") emblaApi.scrollPrev();
            else if (e.key === "ArrowRight") emblaApi.scrollNext();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [emblaApi, isFullscreen]);

    const isInLazyRange = (idx: number) => {
        if (!photos.length) return false;
        let left = (emblaIndex - LAZY_RANGE + photos.length) % photos.length;
        let right = (emblaIndex + LAZY_RANGE) % photos.length;
        if (left <= right) {
            return idx >= left && idx <= right;
        } else {
            return idx >= left || idx <= right;
        }
    };

    // Thumbnail click handler
    const handleThumbnailClick = (idx: number) => {
        emblaApi?.scrollTo(idx);
    };

    if (!photos.length || selectedIndex == null) return null;

    // Mode-dependent classes
    const containerClass = isFullscreen
        ? "fixed inset-0 z-40 flex flex-col items-center justify-center bg-black"
        : "flex flex-col items-center h-screen w-full";

    const carouselWrapperClass = isFullscreen
        ? "relative w-screen h-screen flex-1 flex items-center justify-center"
        : "relative h-full w-full aspect-[3/2] bg-black rounded-lg overflow-hidden shadow-lg flex items-center justify-center";

    const toggleBtnClass = isFullscreen ? "absolute top-6 right-6 z-50 flex items-center" : "absolute top-2 right-2 z-30 flex items-center";

    const infoContainerClass = isFullscreen
        ? "absolute top-8 left-0 right-0 flex flex-col items-center"
        : "mt-4 flex flex-col items-center text-align-left w-full absolute top-8 left-0 right-0";

    const thumbnailBarClass = isFullscreen
        ? "absolute bottom-4 left-0 right-0 flex justify-center pointer-events-auto z-50"
        : "mt-4 mb-2 flex justify-center w-full";

    const thumbnailScrollerClass =
        "flex gap-2 overflow-x-auto px-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent w-full";

    // Highlight selected thumbnail
    const thumbnailButtonClass = (idx: number) =>
        `border-2 rounded-md bg-black/80 overflow-hidden flex-shrink-0 w-[${THUMB_SIZE}px] h-[${THUMB_SIZE}px] transition-all duration-150
        ${
            selectedIndex === idx
                ? "border-indigo-500 ring-2 ring-indigo-400"
                : "border-transparent opacity-75 hover:opacity-100 hover:border-indigo-300"
        }`;

    // Framer Motion variants for button animations
    const buttonVariants = {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
        exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
        hover: { scale: 1.1 },
        tap: { scale: 0.93 },
    };

    return (
        <div className={containerClass}>
            <div ref={carouselWrapperRef} className={carouselWrapperClass}>
                {/* Fullscreen Toggle */}
                <AnimatePresence initial={false}>
                    <motion.button
                        className={`${toggleBtnClass} p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition`}
                        key={isFullscreen ? "minimize" : "maximize"}
                        aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        onClick={() => setIsFullscreen((f) => !f)}
                        variants={buttonVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        whileHover="hover"
                        whileTap="tap"
                    >
                        {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                    </motion.button>
                </AnimatePresence>
                <div ref={emblaRef} className="w-full h-full touch-none">
                    <div className="flex h-full">
                        {photos.map((photo, idx) => (
                            <div
                                key={photo.name}
                                className="flex-shrink-0 w-full h-full flex items-center justify-center transition-colors"
                                style={{
                                    backgroundColor: isInLazyRange(idx) ? "black" : "#222",
                                }}
                            >
                                {isInLazyRange(idx) ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <motion.img
                                            src={getPhotoPath(currentPath, photo.name)}
                                            alt={photo.name}
                                            className="max-w-full max-h-full object-contain mx-auto my-auto block select-none"
                                            draggable={false}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-1/2 h-1/2 rounded bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                                        Loading...
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {/* Left Arrow */}
                <AnimatePresence>
                    <motion.button
                        aria-label="Previous"
                        tabIndex={0}
                        onClick={() => emblaApi?.scrollPrev()}
                        className="absolute left-6 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full bg-black/70 text-white hover:bg-black/90 transition select-none"
                        key="prev-arrow"
                        variants={buttonVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </motion.button>
                </AnimatePresence>
                {/* Right Arrow */}
                <AnimatePresence>
                    <motion.button
                        aria-label="Next"
                        tabIndex={0}
                        onClick={() => emblaApi?.scrollNext()}
                        className="absolute right-6 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full bg-black/70 text-white hover:bg-black/90 transition select-none"
                        key="next-arrow"
                        variants={buttonVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </motion.button>
                </AnimatePresence>
                {/* Info */}
                <div className={infoContainerClass}>
                    <div className="text-base md:text-lg text-gray-200 text-left w-full px-12">
                        {selectedIndex + 1} / {photos.length}
                    </div>
                    <div className="mt-2 text-lg md:text-xl font-medium text-white line-clamp-1 text-left w-full px-12 selection:bg-indigo-900/80 selection:text-white">
                        {photos[selectedIndex]?.name}
                    </div>
                </div>
            </div>
            {/* Thumbnails Bar */}
            {!isFullscreen && (
                <div className={thumbnailBarClass}>
                    <div ref={thumbRef} className={`${thumbnailScrollerClass}`}>
                        {photos.map((photo, idx) => (
                            <button
                                type="button"
                                key={photo.name}
                                className={thumbnailButtonClass(idx)}
                                aria-label={`Select photo ${idx + 1}`}
                                onClick={() => handleThumbnailClick(idx)}
                            >
                                <img
                                    src={getPreviewPath(directory, photo.id, previewDir)}
                                    alt={photo.name}
                                    className={`object-cover w-full h-full select-none ${selectedIndex === idx ? "opacity-100" : "opacity-70"}`}
                                    draggable={false}
                                    style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoCarousel;
