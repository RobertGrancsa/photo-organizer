import * as React from "react";
import {
    createContext,
    Dispatch,
    PropsWithChildren,
    SetStateAction,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { FoldersContext } from "@/contexts/FoldersContext";
import { getPhotosAtPath } from "@/lib/api";
import { useNavigate } from "react-router";

export interface Photo {
    id: string;
    path: string;
    name: string;
}

interface ChosenDirectoryContextType {
    currentDirectory: string;
    setCurrentDirectory: Dispatch<SetStateAction<string>>;
    loadedPhotos: Photo[];
    setLoadedPhotos: Dispatch<SetStateAction<Photo[]>>;
}

export const ChosenDirectoryContext = createContext<ChosenDirectoryContextType>(
    {
        currentDirectory: "",
        setCurrentDirectory: () => {},
        loadedPhotos: [],
        setLoadedPhotos: () => {},
    },
);

const ChosenDirectoryContextComponent: React.FC<PropsWithChildren> = ({
    children,
}) => {
    const [currentDirectory, setCurrentDirectory] = useState<string>("");
    const [loadedPhotos, setLoadedPhotos] = useState<Photo[]>([]);
    const { folders } = useContext(FoldersContext);
    const navigate = useNavigate();

    const value = useMemo(
        (): ChosenDirectoryContextType => ({
            currentDirectory,
            setCurrentDirectory,
            loadedPhotos,
            setLoadedPhotos,
        }),
        [currentDirectory, loadedPhotos],
    );

    useEffect(() => {
        if (!folders.length) {
            return;
        }

        getPhotosAtPath(folders[0].path).then((images) => {
            setLoadedPhotos(images);
            setCurrentDirectory(folders[0].path);
            navigate("/home");
        });
    }, [folders]);

    return (
        <ChosenDirectoryContext.Provider value={value}>
            {children}
        </ChosenDirectoryContext.Provider>
    );
};

export default ChosenDirectoryContextComponent;
