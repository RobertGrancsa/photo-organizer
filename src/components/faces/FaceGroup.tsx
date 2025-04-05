import * as React from "react";
import { useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { getFacePath } from "@/lib/utils";
import { selectCurrentFolder, selectPreviewDir } from "@/contexts/slices/pathSlice";
import { clsx } from "clsx";
import { motion } from "framer-motion";

interface FacesDisplayProps {
    faceIds: string[];
    partOfGroup?: boolean;
}

const FaceGroup: React.FC<FacesDisplayProps> = ({ faceIds, partOfGroup }) => {
    const directory = useAppSelector(selectCurrentFolder);
    const previewDir = useAppSelector(selectPreviewDir);
    const firstFace = faceIds[0];
    const [showMore, setShowMore] = useState<boolean>(false);

    return (
        <>
            <motion.div>
                <Card
                    className={clsx("overflow-hidden rounded-lg shadow-md border-none p-0 gap-0", {
                        "outline-2 outline-cyan-700 scale-90": showMore,
                        "cursor-pointer": faceIds.length > 1,
                        "outline-2 outline-cyan-700": partOfGroup,
                    })}
                    onClick={() => setShowMore((val) => !val && faceIds.length > 1)}
                >
                    <CardContent className="p-0 w-24 h-32 relative">
                        <img className="object-cover w-24 h-32" src={getFacePath(directory.id, firstFace, previewDir)} alt="faces" />
                        <div className="bg-accent rounded-3xl absolute top-2 right-2 w-4 text-center shadow">{faceIds.length}</div>
                    </CardContent>
                    {/*<CardFooter className="text-center font-medium items-center">*/}
                    {/*    <div className="text-center content-center items-center w-full">{faceIds.length}</div>*/}
                    {/*</CardFooter>*/}
                </Card>
            </motion.div>
            {showMore && faceIds.length > 1 && faceIds.map((faceId, i) => <FaceGroup key={i} faceIds={[faceId]} partOfGroup={true} />)}
        </>
    );
};

export default FaceGroup;
