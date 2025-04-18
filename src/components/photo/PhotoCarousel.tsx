import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectPhotos, selectSelectedPhotoIndex, setSelectedPhoto } from "@/contexts/slices/photosSlice";
import { useParams, useNavigate } from "react-router";
import { getPhotoPath } from "@/lib/utils";
import { selectCurrentPath } from "@/contexts/slices/pathSlice";
import useEmblaCarousel from "embla-carousel-react";
import { Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LAZY_RANGE = 3;

const PhotoCarousel: React.FC = () => {
    const photos = useSelector(selectPhotos);
    const selectedIndex = useSelector(selectSelectedPhotoIndex);
    const currentPath = useSelector(selectCurrentPath);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { directory, name } = useParams<{ directory?: string; name?: string }>();

    const [emblaRef, emblaApi] = useEmblaCarousel({ skipSnaps: false, loop: true });
    const ignoreSetPhoto = useRef(false);
    const [emblaIndex, setEmblaIndex] = useState(selectedIndex ?? 0);

    // Toggleable fullscreen
    const [isFullscreen, setIsFullscreen] = useState(false);
    const carouselWrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (typeof selectedIndex === "number") setEmblaIndex(selectedIndex);
    }, [selectedIndex]);

    useEffect(() => {
        if (!emblaApi || selectedIndex == null) return;
        ignoreSetPhoto.current = true;
        emblaApi.scrollTo(selectedIndex, false);
        setTimeout(() => (ignoreSetPhoto.current = false), 100);
    }, [emblaApi, selectedIndex]);

    useEffect(() => {
        if (!photos.length || typeof name !== "string") return;
        const idx = photos.findIndex((p: any) => p.name === name);
        if (idx !== -1) {
            dispatch(setSelectedPhoto({ photo: photos[idx], index: idx }));
        }
    }, [name, photos, dispatch]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        const idx = emblaApi.selectedScrollSnap();
        setEmblaIndex(idx);
        if (ignoreSetPhoto.current) return;
        if (photos[idx] && selectedIndex !== idx) {
            navigate(`/${directory}/${photos[idx].name}`, { replace: true });
            dispatch(setSelectedPhoto({ photo: photos[idx], index: idx }));
        }
    }, [emblaApi, photos, dispatch, selectedIndex, navigate, directory]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on("select", onSelect);
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
        ? "absolute bottom-8 left-0 right-0 flex flex-col items-center"
        : "mt-4 flex flex-col items-center w-full";

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
                        <span className="text-4xl">&#8249;</span>
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
                        <span className="text-4xl">&#8250;</span>
                    </motion.button>
                </AnimatePresence>
                {/* Info */}
                <div className={infoContainerClass}>
                    <div className="text-base md:text-lg text-gray-200">
                        {selectedIndex + 1} / {photos.length}
                    </div>
                    <div className="mt-2 text-lg md:text-xl font-medium text-center text-white line-clamp-1 max-w-xl selection:bg-indigo-900/80 selection:text-white">
                        {photos[selectedIndex]?.name}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoCarousel;
