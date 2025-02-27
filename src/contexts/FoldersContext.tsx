import * as React from "react";
import { createContext, Dispatch, PropsWithChildren, SetStateAction, useEffect, useMemo, useState } from "react";
import { getFolders } from "@/lib/api";
import { useNavigate } from "react-router";
import { Folder } from "@/types/folder";

interface FoldersContextType {
    folders: Folder;
    setFolders: Dispatch<SetStateAction<Folder>>;
}

export const FoldersContext = createContext<FoldersContextType>({
    folders: [],
    setFolders: () => {},
});

const FoldersContextComponent: React.FC<PropsWithChildren> = ({ children }) => {
    const [folders, setFolders] = useState<Folder>([]);
    const navigate = useNavigate();

    const value = useMemo(
        (): FoldersContextType => ({
            folders,
            setFolders,
        }),
        [folders]
    );

    useEffect(() => {
        getFolders()
            .then((folders) => {
                if (!folders.length) {
                    navigate("/launch");
                }

                setFolders(folders);
            })
            .catch(() => navigate("/launch"));
    }, []);

    return <FoldersContext.Provider value={value}>{children}</FoldersContext.Provider>;
};

export default FoldersContextComponent;
