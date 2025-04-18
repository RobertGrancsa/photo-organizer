import * as React from "react";
import { useMemo, useState } from "react";
import { FolderItemWithCount, Folder, Tree, TreeViewElement } from "@/components/magicui/file-tree";
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

/**
 * Given an array of path segments, collapse everything except
 * the first and last into a single "..." segment.
 *
 * e.g. ["a","b","c","d"] → ["a","...","d"]
 *      ["a","b"]           → ["a","b"]
 */
export const collapseMiddleSegments = (segments: string[]): string[] => {
    if (segments.length <= 2) {
        return segments;
    }
    return [segments[0], "...", segments[segments.length - 1]];
};

/**
 * Condenses a full path so it shows only the first and last segment,
 * preserving any drive/root prefix, and using the platform’s separator.
 */
export const ellipsisPath = (fullPath: string): string => {
    const isWindows = fullPath.includes("\\") && !fullPath.includes("/");
    const sep = isWindows ? "\\" : "/";

    // Extract and strip drive or root
    let prefix = "";
    let body = fullPath;

    const winMatch = fullPath.match(/^([A-Za-z]:\\)(.*)/);
    if (winMatch) {
        prefix = winMatch[1];
        body = winMatch[2];
    } else if (fullPath.startsWith("/")) {
        prefix = "/";
        body = fullPath.slice(1);
    }

    // Split into segments
    const parts = body.split(isWindows ? /\\+/ : /\/+/).filter(Boolean);

    // Collapse middle segments
    const collapsed = collapseMiddleSegments(parts);

    return prefix + collapsed.join(sep);
};

/**
 * Splits a full filesystem path into its “drive” prefix and the rest.
 *   • For "C:\Users\Alice", => { drive: "C:\\", rest: "Users\\Alice" }
 *   • For "/dev/sda/photos/2025", => { drive: "/dev/sda", rest: "/photos/2025" }
 *   • If no pattern matches, drive is "Other" and rest is the original path.
 */
const splitDriveAndRest = (path: string): { drive: string; rest: string } => {
    // Windows‑style: "C:\..."
    const windowsMatch = path.match(/^([A-Za-z]:\\)(.*)/);
    if (windowsMatch) {
        return {
            drive: windowsMatch[1], // e.g. "C:\"
            rest: windowsMatch[2] ?? "", // e.g. "Users\Alice"
        };
    }

    // Unix‑style: "/dev/sda/..."
    const unixMatch = path.match(/^(\/dev\/[^/]+)(\/?.*)/);
    if (unixMatch) {
        return {
            drive: unixMatch[1], // e.g. "/dev/sda"
            rest: unixMatch[2] || "", // e.g. "/photos/2025"
        };
    }

    // Fallback
    return { drive: "Other", rest: path };
};

interface GroupedFolderType extends FolderType {
    displayName: string;
    isDriveGroup?: boolean;
}

const groupFoldersByDrive = (folders: FolderType[]): GroupedFolderType[] => {
    const groups: Record<string, GroupedFolderType[]> = {};

    folders.forEach((folder) => {
        const { drive, rest } = splitDriveAndRest(folder.path);
        if (!groups[drive]) {
            groups[drive] = [];
        }
        groups[drive].push({ ...folder, displayName: ellipsisPath(rest) });
    });

    // Create a virtual folder node for each drive group.
    return Object.keys(groups).map((drive) => ({
        id: drive, // Using the drive prefix as the id
        path: drive, // Display the drive in the tree view
        displayName: drive, // Display the drive in the tree view
        isImported: false,
        isDriveGroup: true,
        children: groups[drive],
        photoCount: groups[drive].reduce((count, folder) => count + folder.photoCount, 0), // Sum of photo counts
    }));
};

const folderToTreeElement = (folder: GroupedFolderType): TreeViewElement => ({
    id: folder.id,
    name: folder.path,
    // You may decide that drive groups are not selectable,
    // while real folders follow the isImported check.
    isSelectable: !folder.isImported && !folder.isDriveGroup,
    children: folder.children ? folder.children.map(folderToTreeElement) : undefined,
});

const Sidebar: React.FC = () => {
    const [activeTreeElement, setActiveTreeElement] = useState<GroupedFolderType | null>(null);
    const currentFolder = useAppSelector(selectCurrentFolder);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isLoading, data: folders } = useQuery({ queryKey: ["folders"], queryFn: getFolders });

    const groupedFolders = useMemo(() => {
        if (!folders) return [];
        return groupFoldersByDrive(folders);
    }, [folders]);

    const elements = useMemo(() => groupedFolders.map(folderToTreeElement), [groupedFolders]);

    const mapFolder = (items: GroupedFolderType[]) => {
        return items?.map((item) => {
            // Determine if this folder node is actually a drive grouping node.
            const isDriveGroup = item.isDriveGroup;

            if (isDriveGroup) {
                return (
                    <Folder key={item.id} element={item.displayName} value={item.id} title={item.path}>
                        {item.children ? mapFolder(item.children as GroupedFolderType[]) : null}
                    </Folder>
                );
            }

            return (
                <FolderItemWithCount
                    key={item.id}
                    folderName={item.displayName}
                    count={item.photoCount}
                    value={item.id}
                    title={item.path}
                    onClick={() => {
                        // Only navigate if this is not a drive group.
                        dispatch(setPath(item));
                        dispatch(clearSelectedTags());
                        dispatch(clearSelectedPhotos());
                        navigate("/" + item.id);
                    }}
                    onContextMenu={(e) => {
                        // e.preventDefault(); // Prevent the default browser context menu.
                        // Only set active tree element for non-drive-group nodes.
                        setActiveTreeElement(item);
                    }}
                >
                    {item.children ? mapFolder(item.children as GroupedFolderType[]) : null}
                </FolderItemWithCount>
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
                <Tree
                    className="overflow-hidden rounded-md bg-background p-2"
                    initialSelectedId={groupedFolders[0].id}
                    initialExpandedItems={groupedFolders.map((v) => v.id)}
                    elements={elements}
                >
                    {mapFolder(groupedFolders)}
                </Tree>
            </SidebarContextMenu>
        </>
    );
};

export default Sidebar;
