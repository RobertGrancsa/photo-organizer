import * as React from "react";
import {
    createContext,
    Dispatch,
    PropsWithChildren,
    SetStateAction,
    useMemo,
    useState,
} from "react";

interface ChosenDirectoryContextType {
    currentDirectory: string;
    setCurrentDirectory: Dispatch<SetStateAction<string>>;
    loadedPhotos: string[];
    setLoadedPhotos: Dispatch<SetStateAction<string[]>>;
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
    const [loadedPhotos, setLoadedPhotos] = useState<string[]>([]);

    const value = useMemo(
        (): ChosenDirectoryContextType => ({
            currentDirectory,
            setCurrentDirectory,
            loadedPhotos,
            setLoadedPhotos,
        }),
        [],
    );

    return (
        <ChosenDirectoryContext.Provider value={value}>
            {children}
        </ChosenDirectoryContext.Provider>
    );
};

export default ChosenDirectoryContextComponent;
