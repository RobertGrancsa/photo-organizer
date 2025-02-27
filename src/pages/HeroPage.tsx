import * as React from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Button } from "@/components/ui/button";
import { open } from "@tauri-apps/plugin-dialog";
import { motion } from "framer-motion";
import { springIn } from "@/lib/animations";
import { addFolder, getPhotosAtPath } from "@/lib/api";
import { useNavigate } from "react-router";
import { useCallback, useContext } from "react";
import { ChosenDirectoryContext } from "@/contexts/ChosenDirectoryContext";

const BackgroundBeamsDemo = () => {
    const navigate = useNavigate();
    const { setCurrentDirectory, setLoadedPhotos } = useContext(
        ChosenDirectoryContext,
    );

    const uploadFolder = useCallback(async () => {
        const dir = await open({ directory: true });
        console.log(dir);

        if (!dir) {
            return;
        }

        await addFolder(dir);
        const photos = await getPhotosAtPath(dir);

        setCurrentDirectory(dir);
        setLoadedPhotos(photos);

        navigate("/home");
    }, []);

    return (
        <div className="h-screen w-full bg-neutral-950 relative flex flex-col items-center justify-center antialiased">
            <motion.div
                {...springIn}
                className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
                <h1 className="relative z-10 text-lg md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600  text-center font-sans font-bold">
                    Start to import
                </h1>
                <p></p>
                <p className="text-neutral-500 max-w-lg mx-auto my-2 text-sm text-center relative z-10">
                    Start by importing a folder with photos. These will be
                    automatically imported into the app.
                </p>
                <Button
                    variant="outline"
                    className="relative z-10 mx-auto w-full"
                    onClick={uploadFolder}>
                    Select a folder
                </Button>
            </motion.div>
            <BackgroundBeams />
        </div>
    );
};

export default BackgroundBeamsDemo;
