import { useEffect } from "react";

export type BackgroundColor = "black" | "gray" | "white";

export const useCarouselKeyNavigation = (
    emblaApi: any,
    isFullscreen: boolean,
    setIsFullscreen: (value: boolean) => void,
    backgroundColor?: BackgroundColor,
    setBackgroundColor?: (color: BackgroundColor) => void
) => {
    useEffect(() => {
        if (!emblaApi) return;

        const onKeyDown = (e: KeyboardEvent) => {
            // Ignore if focus is on input elements
            if (document.activeElement?.tagName.match(/input|textarea|select/i)) {
                return;
            }

            if ((e.key === "Escape" || e.key === "f") && isFullscreen) setIsFullscreen(false);
            if (e.key === "f" && !isFullscreen) setIsFullscreen(true);
            if (e.key === "ArrowLeft") emblaApi.scrollPrev();
            else if (e.key === "ArrowRight") emblaApi.scrollNext();

            // Handle background color cycling with 'c' key
            if (e.key.toLowerCase() === "c" && setBackgroundColor) {
                cycleBackgroundColor(backgroundColor, setBackgroundColor);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [emblaApi, isFullscreen, setIsFullscreen, backgroundColor, setBackgroundColor]);
};

// Helper function to cycle through background colors
const cycleBackgroundColor = (currentColor?: BackgroundColor, setBackgroundColor?: (color: BackgroundColor) => void) => {
    if (!setBackgroundColor) return;

    if (currentColor === "black") {
        setBackgroundColor("gray");
    } else if (currentColor === "gray") {
        setBackgroundColor("white");
    } else {
        setBackgroundColor("black");
    }
};
