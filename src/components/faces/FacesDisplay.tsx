import * as React from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/lib/hooks";
import { selectFaces } from "@/contexts/slices/photosSlice";
import FaceGroup from "./FaceGroup";

const FacesDisplay: React.FC = () => {
    const facesClusters = useAppSelector(selectFaces);
    // const dispatch = useAppDispatch();

    return (
        <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white absolute flex border-b p-4 h-100 z-100 overflow-hidden"
        >
            <div className="bg-white flex items-center gap-2 w-full flex-wrap h-100 overflow-auto z-100">
                {Object.values(facesClusters).map((faceList, i) => (
                    <FaceGroup key={i} faceIds={faceList} />
                ))}
            </div>
        </motion.div>
    );
};

export default FacesDisplay;
