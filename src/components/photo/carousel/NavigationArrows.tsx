import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "./constants";

interface NavigationArrowsProps {
    onPrev: () => void;
    onNext: () => void;
}

const NavigationArrows: React.FC<NavigationArrowsProps> = ({ onPrev, onNext }) => {
    return (
        <>
            <AnimatePresence>
                <motion.button
                    aria-label="Previous"
                    tabIndex={0}
                    onClick={onPrev}
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
            <AnimatePresence>
                <motion.button
                    aria-label="Next"
                    tabIndex={0}
                    onClick={onNext}
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
        </>
    );
};

export default NavigationArrows;
