import * as React from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/lib/hooks";
import { selectFaces } from "@/contexts/slices/photosSlice";
import FaceGroup from "./FaceGroup";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

const FacesDisplay: React.FC = () => {
    const facesClusters = useAppSelector(selectFaces);
    // const dispatch = useAppDispatch();

    return (
        <ResizablePanelGroup direction="vertical" className="border w-fit absolute z-100">
            <ResizablePanel defaultSize={40} className="bg-white overflow-auto rounded-lg w-full">
                <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex p-4 w-full h-full bg-white">
                    <div className="bg-white flex items-center gap-2 w-full flex-wrap overflow-auto z-100">
                        {Object.entries(facesClusters).map(([dirId, faceClusters], i) =>
                            Object.entries(faceClusters).map(([, faceList]) => <FaceGroup key={i} faceIds={faceList} dirId={dirId} />)
                        )}
                    </div>
                </motion.div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel></ResizablePanel>
        </ResizablePanelGroup>
    );
};

export default FacesDisplay;
