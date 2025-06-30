import { Transition } from "framer-motion";

export const springIn = {
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1 },
    transition: {
        duration: 0.4,
        scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
    },
};

export const tapHover = {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.95 },
};

export const transitionImages: Transition = {
    duration: 0.4,
    ease: "easeInOut",
    scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
};
