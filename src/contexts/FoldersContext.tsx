import * as React from "react";
import {
    createContext,
    Dispatch,
    PropsWithChildren,
    SetStateAction,
    useEffect,
    useMemo,
    useState,
} from "react";
import { getFolders } from "@/lib/api";
import { useNavigate } from "react-router";

export type Folder = Record<string, string | string[]>;

interface FoldersContextType {
    folders: Folder;
    setFolders: Dispatch<SetStateAction<Folder>>;
}

export const FoldersContext = createContext<FoldersContextType>({
    folders: {},
    setFolders: () => {},
});

const FoldersContextComponent: React.FC<PropsWithChildren> = ({ children }) => {
    const [folders, setFolders] = useState<Folder>({});
    const navigate = useNavigate();

    const value = useMemo(
        (): FoldersContextType => ({
            folders,
            setFolders,
        }),
        [],
    );

    useEffect(() => {
        getFolders()
            .then(setFolders)
            .catch(() => navigate("/launch"));
    }, []);

    return (
        <FoldersContext.Provider value={value}>
            {children}
        </FoldersContext.Provider>
    );
};

export default FoldersContextComponent;
