import * as React from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPhotosAtPath } from "@/lib/api";
import LoadingPage from "@/pages/LoadingPage";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Sidebar from "@/components/Sidebar";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { selectCurrentFolder, selectPreviewDir } from "@/contexts/slices/pathSlice";
import { setPhotos } from "@/contexts/slices/photosSlice";
import { Outlet } from "react-router";
import useIsInitialized from "@/contexts/FoldersContext";

const HomePage = () => {
    useIsInitialized();

    const dispatch = useAppDispatch();
    const folder = useAppSelector(selectCurrentFolder);
    const previewPath = useAppSelector(selectPreviewDir);
    const { isFetched, data: loadedPhotos } = useQuery({
        queryKey: ["photos", folder.path],
        queryFn: () => getPhotosAtPath(folder.path),
        enabled: !!folder.id,
    });

    useEffect(() => {
        dispatch(setPhotos(loadedPhotos));
    }, [loadedPhotos]);

    if (!isFetched || !previewPath) {
        return <LoadingPage />;
    }

    return (
        <ResizablePanelGroup direction="horizontal" className="w-screen h-screen rounded-lg border md:min-w-[450px]">
            <ResizablePanel defaultSize={15} maxSize={40}>
                <Sidebar />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={85}>
                <Outlet />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
};

export default HomePage;
