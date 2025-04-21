import { useEffect, useRef, useState } from "react";

export const useFullscreen = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const elementRef = useRef<HTMLDivElement | null>(null);

    // Fullscreen API integration
    useEffect(() => {
        const el = elementRef.current;
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
            const el = elementRef.current;
            if (document.fullscreenElement === el) {
                if (!isFullscreen) setIsFullscreen(true);
            } else {
                if (isFullscreen) setIsFullscreen(false);
            }
        }
        document.addEventListener("fullscreenchange", handleFSChange);
        return () => document.removeEventListener("fullscreenchange", handleFSChange);
    }, [isFullscreen]);

    return {
        isFullscreen,
        setIsFullscreen,
        elementRef,
    };
};
