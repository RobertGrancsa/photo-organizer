import { getFolders } from "@/lib/api";
import * as React from "react";
import { useContext } from "react";
import { ChosenDirectoryContext } from "@/contexts/ChosenDirectoryContext";
import { convertFileSrc } from "@tauri-apps/api/core";

const HomePage = () => {
    const { currentDirectory, loadedPhotos } = useContext(
        ChosenDirectoryContext,
    );

    console.log(currentDirectory, loadedPhotos);
    return (
        <>
            {loadedPhotos.map((photo) => (
                <img
                    key={photo.id}
                    src={convertFileSrc(currentDirectory + "\\" + photo.name)}
                    alt={"Something"}></img>
            ))}
        </>
    );
};

export default HomePage;
