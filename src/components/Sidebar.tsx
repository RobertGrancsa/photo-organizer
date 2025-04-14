import * as React from "react";
import { useMemo, useState } from "react";
import { File, Folder, Tree, TreeViewElement } from "@/components/magicui/file-tree";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { selectCurrentFolder, setPath } from "@/contexts/slices/pathSlice";
import { useQuery } from "@tanstack/react-query";
import { getFolders } from "@/lib/api";
import { Folder as FolderType, Photo } from "@/types";
import ImportFolder from "@/components/folders/ImportFolder";
import { clearSelectedPhotos, clearSelectedTags } from "@/contexts/slices/photosSlice";
import { useNavigate } from "react-router";
import PreviewProgress from "@/components/notifications/PreviewNotifier";
import SidebarContextMenu from "@/components/menu/SidebarMenu";

const ELEMENTS = [
    {
        id: "1",
        isSelectable: true,
        name: "src",
        children: [
            {
                id: "2",
                isSelectable: true,
                name: "app",
                children: [
                    {
                        id: "3",
                        isSelectable: true,
                        name: "layout.tsx",
                    },
                    {
                        id: "4",
                        isSelectable: true,
                        name: "page.tsx",
                    },
                ],
            },
            {
                id: "5",
                isSelectable: true,
                name: "components",
                children: [
                    {
                        id: "6",
                        isSelectable: true,
                        name: "header.tsx",
                    },
                    {
                        id: "7",
                        isSelectable: true,
                        name: "footer.tsx",
                    },
                ],
            },
        ],
    },
];

const folderToTreeElement = (folder: FolderType): TreeViewElement => ({
    id: folder.id,
    name: folder.path,
    isSelectable: !folder.isImported,
    children: folder.children?.map(folderToTreeElement),
});

const Sidebar: React.FC = () => {
    const [activeTreeElement, setActiveTreeElement] = useState<FolderType | Photo | null>(null);
    const currentFolder = useAppSelector(selectCurrentFolder);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isLoading, data: folders } = useQuery({ queryKey: ["folders"], queryFn: getFolders });

    const elements = useMemo(() => folders?.map(folderToTreeElement), [folders]);

    const mapFolder = (items: (FolderType | Photo)[]) => {
        return items?.map((item) => {
            if ("name" in item) {
                return (
                    <File key={item.id} value={item.id}>
                        <p>{item.name}</p>
                    </File>
                );
            }

            return (
                <Folder
                    key={item.id}
                    element={item.path}
                    value={item.id}
                    onClick={() => {
                        dispatch(setPath(item));
                        dispatch(clearSelectedTags());
                        dispatch(clearSelectedPhotos());
                        navigate("/" + item.id);
                    }}
                    onContextMenu={() => {
                        setActiveTreeElement(item);
                    }}
                >
                    {mapFolder(item.children)}
                </Folder>
            );
        });
    };

    if (isLoading) {
        return null;
    }
    console.log(folders);

    return (
        <>
            <ImportFolder text="Import folder" variant="default" className="m-2" />
            <PreviewProgress />
            <SidebarContextMenu activeTreeElement={activeTreeElement}>
                <Tree className="overflow-hidden rounded-md bg-background p-2" initialSelectedId={currentFolder.id} elements={elements}>
                    {mapFolder(folders)}
                </Tree>
            </SidebarContextMenu>
        </>
    );
};

export default Sidebar;
