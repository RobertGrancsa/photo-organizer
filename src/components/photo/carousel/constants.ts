// Constants for the photo carousel
export const LAZY_RANGE = 3;
export const THUMB_SIZE = 72; // Size of thumbnails in pixels

// Framer Motion variants for button animations
export const buttonVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
    hover: { scale: 1.1 },
    tap: { scale: 0.93 },
};
