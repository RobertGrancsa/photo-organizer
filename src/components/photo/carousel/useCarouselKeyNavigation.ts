import { useEffect } from "react";

export const useCarouselKeyNavigation = (emblaApi: any, isFullscreen: boolean, setIsFullscreen: (value: boolean) => void) => {
    useEffect(() => {
        if (!emblaApi) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.key === "Escape" || e.key === "f") && isFullscreen) setIsFullscreen(false);
            if (e.key === "f" && !isFullscreen) setIsFullscreen(true);
            if (e.key === "ArrowLeft") emblaApi.scrollPrev();
            else if (e.key === "ArrowRight") emblaApi.scrollNext();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [emblaApi, isFullscreen, setIsFullscreen]);
};
