import * as React from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFaceClusters, getPhotosAtPath } from "@/lib/api";
import LoadingPage from "@/pages/LoadingPage";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Sidebar from "@/components/Sidebar";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { selectCurrentFolder, selectPreviewDir } from "@/contexts/slices/pathSlice";
import { selectSelectedTags, setFaceClusters, setPhotos } from "@/contexts/slices/photosSlice";
import { Outlet } from "react-router";
import useIsInitialized from "@/contexts/FoldersContext";

const HomePage = () => {
    useIsInitialized();

    const dispatch = useAppDispatch();
    const folder = useAppSelector(selectCurrentFolder);
    const previewPath = useAppSelector(selectPreviewDir);
    const selectedTags = useAppSelector(selectSelectedTags);
    const { data: loadedPhotos } = useQuery({
        queryKey: ["photos", folder.path, selectedTags],
        queryFn: () => getPhotosAtPath(folder.path, Array.from(selectedTags)),
        enabled: !!folder.id,
    });

    const { data: faceClusters, isFetched: isFacesFetched } = useQuery({
        queryKey: ["faces", folder.path],
        queryFn: () => getFaceClusters(folder.path),
        enabled: !!folder.id,
    });

    useEffect(() => {
        if (!loadedPhotos) {
            return;
        }

        dispatch(setPhotos(loadedPhotos));
    }, [loadedPhotos]);

    useEffect(() => {
        if (!isFacesFetched) {
            return;
        }

        dispatch(setFaceClusters(faceClusters));
    }, [faceClusters, isFacesFetched]);

    if (!previewPath) {
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
