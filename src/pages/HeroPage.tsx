import * as React from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { motion } from "framer-motion";
import { springIn } from "@/lib/animations";
import ImportFolder from "@/components/folders/ImportFolder";

const BackgroundBeamsDemo = () => {
    return (
        <div className="h-screen w-full bg-neutral-950 relative flex flex-col items-center justify-center antialiased">
            <motion.div {...springIn} className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
                <h1 className="relative z-10 text-lg md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600  text-center font-sans font-bold">
                    Start to import
                </h1>
                <p></p>
                <p className="text-neutral-500 max-w-lg mx-auto my-2 text-sm text-center relative z-10">
                    Start by importing a folder with photos. These will be automatically imported into the app.
                </p>
                <ImportFolder text="Select a folder" variant="outline" className="relative z-10 mx-auto w-full" />
            </motion.div>
            <BackgroundBeams />
        </div>
    );
};

export default BackgroundBeamsDemo;
