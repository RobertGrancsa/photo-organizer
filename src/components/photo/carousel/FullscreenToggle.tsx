import * as React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { buttonVariants } from "./constants";
import { useNavigate } from "react-router";

interface FullscreenToggleProps {
    isFullscreen: boolean;
    onToggle: (fullscreen: boolean) => void;
}

const FullscreenToggle: React.FC<FullscreenToggleProps> = ({ isFullscreen, onToggle }) => {
    const toggleBtnClass = isFullscreen ? "absolute top-6 right-6 z-50 flex items-center" : "absolute top-2 right-2 z-30 flex items-center";
    const backBtnClass = isFullscreen ? "hidden" : "absolute top-2 left-2 z-30 flex items-center";
    const navigate = useNavigate();

    return (
        <>
            <motion.button
                className={`${toggleBtnClass} p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition`}
                key={isFullscreen ? "minimize" : "maximize"}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                onClick={() => onToggle(!isFullscreen)}
                variants={buttonVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                whileHover="hover"
                whileTap="tap"
            >
                {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
            </motion.button>
            <motion.button
                className={`${backBtnClass} p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition`}
                key={"back"}
                aria-label={"Go back"}
                variants={buttonVariants}
                onClick={() => navigate(-1)}
                initial="initial"
                animate="animate"
                exit="exit"
                whileHover="hover"
                whileTap="tap"
            >
                <ArrowLeft className="w-6 h-6" />
            </motion.button>
        </>
    );
};

export default FullscreenToggle;
