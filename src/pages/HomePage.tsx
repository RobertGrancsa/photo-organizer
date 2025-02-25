import { getFolders } from "@/lib/api";
import * as React from "react";
import { useContext } from "react";
import { ChosenDirectoryContext } from "@/contexts/ChosenDirectoryContext";

const HomePage = () => {
    const { currentDirectory, loadedPhotos } = useContext(
        ChosenDirectoryContext,
    );

    return (
        <>
            {loadedPhotos.map((path) => (
                <img
                    src={currentDirectory + "\\" + path}
                    alt={"Something"}></img>
            ))}
        </>
    );
};

export default HomePage;
